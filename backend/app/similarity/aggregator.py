from app.similarity.lexical import compute_lexical_similarity
from app.similarity.phonetic import compute_phonetic_similarity


def classify_severity(final_score: float, is_brand: bool) -> str:
    severe, high, moderate = (80, 65, 50) if is_brand else (90, 75, 55)
    if final_score >= severe:
        return "SEVERE"
    if final_score >= high:
        return "HIGH"
    if final_score >= moderate:
        return "MODERATE"
    return "LOW"


def compute_best_match(
    new_title: str,
    candidates,
    semantic_scores: dict[int, float] | None = None,
    brand_clusters: dict[str, int] | None = None,
):
    best_score = 0.0
    best_match = None
    best_match_normalized = None
    best_breakdown = None
    semantic_scores = semantic_scores or {}
    brand_clusters = brand_clusters or {}

    for candidate in candidates:
        lexical_score = compute_lexical_similarity(new_title, candidate.title_original)
        phonetic_score = compute_phonetic_similarity(new_title, candidate.phonetic_code)

        semantic_score = semantic_scores.get(candidate.id)
        if semantic_score is None:
            final_score = 0.7 * lexical_score + 0.3 * phonetic_score
            semantic_value = 0.0
        else:
            final_score = 0.45 * semantic_score + 0.35 * lexical_score + 0.20 * phonetic_score
            semantic_value = semantic_score

        if final_score > best_score:
            best_score = final_score
            best_match = candidate.title_original
            best_match_normalized = candidate.title_normalized
            best_breakdown = {
                "semantic": semantic_value,
                "lexical": lexical_score,
                "phonetic": phonetic_score,
                "final": final_score,
            }

    is_brand = bool(best_match_normalized and best_match_normalized in brand_clusters)
    severity = classify_severity(best_score, is_brand)
    verification_probability = max(0.0, 100.0 - best_score)

    return {
        "best_match": best_match,
        "scores": best_breakdown,
        "severity": severity,
        "verification_probability": verification_probability,
        "is_brand_cluster": is_brand,
    }
