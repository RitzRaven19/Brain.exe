from sqlalchemy.orm import Session

from app.db.models import Title
from app.ingestion.normalizer import normalize_text


def check_periodicity_injection(
    title: str,
    periodicity: str,
    state_code: str,
    db: Session,
):
    if not periodicity:
        return None

    title_normalized = normalize_text(title)
    periodicity_normalized = normalize_text(periodicity)
    if not periodicity_normalized:
        return None

    tokens = [t for t in title_normalized.split() if t]
    modified_tokens = [t for t in tokens if t != periodicity_normalized]
    modified_title = " ".join(modified_tokens).strip()

    # If periodicity term wasn't present or nothing remains, skip this rule.
    if not modified_title or modified_title == title_normalized:
        return None

    exists = db.query(Title).filter(
        Title.title_normalized == modified_title,
        Title.state_code == normalize_text(state_code).upper(),
    ).first()

    if exists:
        return {
            "type": "PERIODICITY_INJECTION",
            "message": "Title differs only by periodicity addition.",
        }

    return None
