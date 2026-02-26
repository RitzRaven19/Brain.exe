from difflib import SequenceMatcher

try:
    from rapidfuzz import fuzz
except ModuleNotFoundError:
    fuzz = None

from app.ingestion.normalizer import normalize_text


def compute_lexical_similarity(
    new_title: str,
    candidate_title: str,
) -> float:
    new_norm = normalize_text(new_title)
    candidate_norm = normalize_text(candidate_title)

    if fuzz is not None:
        score = fuzz.token_set_ratio(new_norm, candidate_norm)
        return float(score)

    # Fallback token-set similarity if rapidfuzz is unavailable.
    a_tokens = set(new_norm.split())
    b_tokens = set(candidate_norm.split())
    a = " ".join(sorted(a_tokens))
    b = " ".join(sorted(b_tokens))
    return float(100.0 * SequenceMatcher(None, a, b).ratio())
