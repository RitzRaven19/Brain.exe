from sqlalchemy.orm import Session

from app.db.models import Title
from app.ingestion.normalizer import normalize_text


def check_combination_rule(
    title: str,
    state_code: str,
    db: Session,
):
    title_normalized = normalize_text(title)
    state_normalized = normalize_text(state_code).upper()

    existing_titles = db.query(Title.title_normalized).filter(
        Title.state_code == state_normalized
    ).all()

    matches = []
    seen = set()

    for (existing_title,) in existing_titles:
        if not existing_title:
            continue
        if len(existing_title) < 5:
            continue
        if existing_title in title_normalized and existing_title not in seen:
            matches.append(existing_title)
            seen.add(existing_title)

    if len(matches) >= 2:
        return {
            "type": "COMBINATION_RULE",
            "message": f"Title combines multiple existing titles: {matches[:3]}",
        }

    return None
