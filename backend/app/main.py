import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.brand.cluster_detector import BRAND_THRESHOLD, get_brand_clusters
from app.db.database import SessionLocal
from app.db.models import Application, SimilarityAudit, Title
from app.density.concept_config import DENSITY_WEIGHTS, TOP_K
from app.density.density_engine import compute_density_from_neighbors
from app.dependencies import get_db
from app.explain.generator import generate_explanation
from app.ingestion.normalizer import normalize_text
from app.rules.engine import run_rules
from app.schemas.verify import VerifyRequest, VerifyResponse
from app.similarity.aggregator import compute_best_match
from app.similarity.embedding import MODEL_NAME, get_model, load_model
from app.similarity.faiss_index import (
    build_faiss_index,
    get_index,
    search_neighbors_by_text,
    semantic_status as get_semantic_status,
)
from app.similarity.funnel import get_candidate_titles

app = FastAPI()
brand_clusters = {}

raw_origins = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:8080,http://127.0.0.1:8080")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    global brand_clusters

    print("Loading semantic model...")
    model = load_model()

    db = SessionLocal()
    try:
        brand_clusters = get_brand_clusters(db)
        print(f"Brand clusters detected: {len(brand_clusters)}")

        if model is None:
            print("Semantic model not available. Running without semantic layer.")
            return

        print("Building FAISS index...")
        build_faiss_index(db, model)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "backend running"}


@app.get("/system-metrics")
def system_metrics(db: Session = Depends(get_db)):
    total_titles = db.query(Title).count()
    index = get_index()
    faiss_size = index.ntotal if index else 0
    average_density = db.query(func.avg(Title.concept_density)).scalar() or 0.0
    dense_title_count = db.query(Title.id).filter(Title.density_zone == "DENSE").count()
    saturated_title_count = db.query(Title.id).filter(Title.density_zone == "SATURATED").count()

    return {
        "total_titles": total_titles,
        "brand_clusters": len(brand_clusters),
        "brand_threshold": BRAND_THRESHOLD,
        "semantic_enabled": bool(index is not None and get_semantic_status().get("ready")),
        "faiss_index_size": faiss_size,
        "rules_enabled": 5,
        "similarity_layers": 3,
        "model": MODEL_NAME,
        "average_density": float(average_density),
        "dense_title_count": dense_title_count,
        "saturated_title_count": saturated_title_count,
    }


@app.get("/suggest")
def suggest(q: str, db: Session = Depends(get_db)):
    query = normalize_text(q)
    if len(query) < 2:
        return {"query": q, "results": []}

    rows = (
        db.query(
            Title.title_normalized,
            func.min(Title.id).label("id"),
            func.min(Title.title_original).label("title"),
        )
        .filter(Title.title_normalized.like(f"{query}%"))
        .group_by(Title.title_normalized)
        .order_by(Title.title_normalized.asc())
        .limit(10)
        .all()
    )

    results = [{"id": row.id, "title": row.title} for row in rows]
    return {"query": q, "results": results}


@app.post("/verify", response_model=VerifyResponse)
def verify(
    request: VerifyRequest,
    db: Session = Depends(get_db),
):
    title_norm = normalize_text(request.title)
    state_norm = normalize_text(request.state_code).upper()

    pending_exists = db.query(Application.id).filter(
        Application.title_normalized == title_norm,
        Application.state_code == state_norm,
        Application.status == "pending",
    ).first()
    if pending_exists:
        violations = [
            {
                "type": "DUPLICATE_PENDING_APPLICATION",
                "message": "A similar pending application already exists for this state.",
            }
        ]
        return {
            "status": "REJECTED",
            "decision_basis": "DETERMINISTIC_RULE",
            "severity": None,
            "verification_probability": None,
            "concept_density": None,
            "density_zone": None,
            "collision_index": None,
            "rule_violations": violations,
            "similarity": None,
            "explanation": generate_explanation(violations, None),
        }

    application = Application(
        title_submitted=request.title,
        title_normalized=title_norm,
        state_code=state_norm,
        status="pending",
    )
    db.add(application)
    db.flush()

    rule_result = run_rules(request.title, request.state_code, request.city, request.periodicity, db)

    if rule_result["has_violation"]:
        application.status = "rejected"
        application.decision_reason = "; ".join(v.get("type", "") for v in rule_result["violations"])
        db.commit()
        explanation = generate_explanation(rule_result["violations"], None)
        return {
            "status": "REJECTED",
            "decision_basis": "DETERMINISTIC_RULE",
            "severity": None,
            "verification_probability": None,
            "concept_density": None,
            "density_zone": None,
            "collision_index": None,
            "rule_violations": rule_result["violations"],
            "similarity": None,
            "explanation": explanation,
        }

    similarity_result, density_info, collision_index = _build_similarity(request.title, request.state_code, db)

    scores = similarity_result.get("scores")
    if similarity_result.get("best_match") and scores:
        _log_similarity_audit(db, request.title, similarity_result)
        application.max_similarity = scores["final"]
        application.probability = similarity_result.get("verification_probability")
        application.decision_reason = similarity_result.get("severity")
        application.concept_density = density_info["concept_density"]
        application.collision_index = collision_index
        application.density_zone = density_info["density_zone"]
    db.commit()

    explanation = generate_explanation([], similarity_result)
    similarity_payload = {
        "best_match": similarity_result.get("best_match"),
        "scores": similarity_result.get("scores"),
        "is_brand_cluster": similarity_result.get("is_brand_cluster"),
    }
    return {
        "status": "REVIEW",
        "decision_basis": "AI_SIMILARITY_ENGINE",
        "severity": similarity_result.get("severity"),
        "verification_probability": similarity_result.get("verification_probability"),
        "concept_density": density_info["concept_density"],
        "density_zone": density_info["density_zone"],
        "collision_index": collision_index,
        "rule_violations": [],
        "similarity": similarity_payload,
        "explanation": explanation,
    }


def _build_similarity(title: str, state_code: str, db: Session) -> tuple[dict, dict, float]:
    candidates = get_candidate_titles(title, state_code, db)
    neighbors = search_neighbors_by_text(title, get_model(), top_k=TOP_K)
    candidate_ids = {candidate.id for candidate in candidates}
    semantic_scores = {
        neighbor["title_id"]: neighbor["score"]
        for neighbor in neighbors
        if neighbor["title_id"] in candidate_ids
    }
    similarity_result = compute_best_match(
        title,
        candidates,
        semantic_scores=semantic_scores,
        brand_clusters=brand_clusters,
    )
    density_info = compute_density_from_neighbors(neighbors, denominator=TOP_K)
    highest_similarity = (similarity_result.get("scores") or {}).get("final", 0.0) / 100.0
    collision_index = (
        DENSITY_WEIGHTS["similarity_weight"] * highest_similarity
        + DENSITY_WEIGHTS["density_weight"] * density_info["concept_density"]
    )
    return similarity_result, density_info, collision_index


def _log_similarity_audit(db: Session, submitted_title: str, similarity_result: dict) -> None:
    scores = similarity_result["scores"]
    db.add(
        SimilarityAudit(
            submitted_title=submitted_title,
            conflict_title=similarity_result["best_match"],
            lexical_score=scores["lexical"],
            phonetic_score=scores["phonetic"],
            semantic_score=scores.get("semantic", 0.0),
            final_score=scores["final"],
            decision=similarity_result["severity"],
        )
    )
    db.commit()
