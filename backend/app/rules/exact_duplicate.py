from sqlalchemy.orm import Session

from app.db.models import Title


def check_exact_duplicate(
    title_normalized: str,
    state_code: str,
    city: str,
    db: Session,
):
    exists = db.query(Title).filter(
        Title.title_normalized == title_normalized,
        Title.state_code == state_code,
        Title.city == city,
    ).first()

    if exists:
        return {
            "type": "EXACT_DUPLICATE",
            "message": "Title already exists in same state and city.",
        }

    return None

