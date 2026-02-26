from app.ingestion.normalizer import normalize_text

# Keep this list intentionally small for now; easy to extend from config later.
DISALLOWED_TERMS = {
    "government of india",
    "govt of india",
    "official gazette",
    "supreme court",
    "president of india",
}


def check_disallowed_words(title: str):
    normalized = normalize_text(title)
    violations = []
    for term in DISALLOWED_TERMS:
        if term in normalized:
            violations.append(
                {
                    "type": "DISALLOWED_WORD",
                    "message": f"Title contains restricted term: '{term}'.",
                }
            )
    return violations

