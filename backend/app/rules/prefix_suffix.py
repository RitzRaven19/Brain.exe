from sqlalchemy.orm import Session

from app.db.models import Title
from app.ingestion.normalizer import normalize_text

DISALLOWED_PREFIXES = {"the", "india", "bharat"}
DISALLOWED_SUFFIXES = {"news", "samachar", "times"}


def check_prefix_suffix_resemblance(title: str, state_code: str, db: Session):
    normalized = normalize_text(title)
    tokens = [t for t in normalized.split() if t]
    if len(tokens) < 2:
        return None

    stripped = tokens[:]
    changed = False

    if stripped and stripped[0] in DISALLOWED_PREFIXES:
        stripped = stripped[1:]
        changed = True

    if stripped and stripped[-1] in DISALLOWED_SUFFIXES:
        stripped = stripped[:-1]
        changed = True

    if not changed or not stripped:
        return None

    stripped_title = " ".join(stripped)
    state_norm = normalize_text(state_code).upper()

    exists = db.query(Title.id).filter(
        Title.title_normalized == stripped_title,
        Title.state_code == state_norm,
    ).first()

    if exists:
        return {
            "type": "PREFIX_SUFFIX_RESEMBLANCE",
            "message": "Title uses disallowed prefix/suffix pattern that closely resembles an existing title.",
        }

    return None

