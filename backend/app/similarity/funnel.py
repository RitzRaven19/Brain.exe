from sqlalchemy.orm import Session

from app.db.models import Title
from app.ingestion.normalizer import normalize_text
from app.ingestion.phonetic import compute_phonetic

CANDIDATE_LIMIT = 200


def get_candidate_titles(
    title: str,
    state_code: str,
    db: Session,
):
    title_normalized = normalize_text(title)
    state_normalized = normalize_text(state_code).upper()
    phonetic_code = compute_phonetic(title_normalized)

    query = db.query(Title).filter(Title.state_code == state_normalized)

    phonetic_matches = query.filter(Title.phonetic_code == phonetic_code).limit(CANDIDATE_LIMIT).all()
    if phonetic_matches:
        return phonetic_matches

    return query.limit(CANDIDATE_LIMIT).all()

