import faiss
import numpy as np

from app.db.models import Title
from app.ingestion.normalizer import normalize_text

_index = None
_title_ids = []
_id_to_row = {}
_ready = False
_error = None


def build_faiss_index(db, model):
    global _index, _title_ids, _id_to_row, _ready, _error

    if model is None:
        _ready = False
        _error = "Semantic model unavailable."
        return False

    try:
        titles = db.query(Title).all()
        texts = [normalize_text(t.title_original or "") for t in titles]
        _title_ids = [t.id for t in titles]
        _id_to_row = {title_id: idx for idx, title_id in enumerate(_title_ids)}

        if not texts:
            _ready = False
            _error = "No titles available for semantic index."
            return False

        embeddings = model.encode(texts, show_progress_bar=True)

        dim = embeddings.shape[1]
        _index = faiss.IndexFlatIP(dim)

        embeddings = np.array(embeddings).astype("float32")
        faiss.normalize_L2(embeddings)

        _index.add(embeddings)
        _ready = True
        _error = None
        print(f"FAISS index built with {len(texts)} vectors.")
        return True
    except Exception as exc:  # noqa: BLE001
        _ready = False
        _error = str(exc)
        return False


def get_index():
    return _index


def get_title_ids():
    return _title_ids


def semantic_status():
    return {"ready": _ready, "size": len(_title_ids), "error": _error}


def search_neighbors_by_text(new_title: str, model, top_k: int):
    if model is None or _index is None or not _title_ids:
        return []

    query = np.array(model.encode([normalize_text(new_title)]), dtype="float32")
    faiss.normalize_L2(query)
    limit = min(max(int(top_k), 1), len(_title_ids))
    scores, ids = _index.search(query, limit)
    return _format_neighbors(scores[0], ids[0])


def search_neighbors_by_title_id(title_id: int, top_k: int):
    if _index is None or not _title_ids:
        return []
    row_idx = _id_to_row.get(title_id)
    if row_idx is None:
        return []

    vector = np.array([_index.reconstruct(row_idx)], dtype="float32")
    faiss.normalize_L2(vector)
    limit = min(max(int(top_k), 1), len(_title_ids))
    scores, ids = _index.search(vector, limit)
    return _format_neighbors(scores[0], ids[0])


def score_candidates(new_title: str, candidates, model, top_k: int = 200):
    if model is None or _index is None or not candidates:
        return {}

    neighbors = search_neighbors_by_text(new_title, model, top_k=top_k)
    candidate_ids = {c.id for c in candidates}
    result: dict[int, float] = {}
    for neighbor in neighbors:
        title_id = neighbor["title_id"]
        if title_id in candidate_ids:
            result[title_id] = neighbor["score"]
    return result


def _format_neighbors(scores, ids):
    neighbors = []
    for score, row_idx in zip(scores, ids):
        if row_idx < 0:
            continue
        title_id = _title_ids[row_idx]
        neighbors.append(
            {
                "title_id": title_id,
                "score": max(0.0, min(100.0, float(score) * 100.0)),
            }
        )
    return neighbors
