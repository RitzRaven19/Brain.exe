from app.ingestion.phonetic import compute_phonetic


def compute_phonetic_similarity(
    new_title: str,
    candidate_phonetic: str,
) -> float:
    new_phonetic = compute_phonetic(new_title)

    if not new_phonetic or not candidate_phonetic:
        return 0.0

    if new_phonetic == candidate_phonetic:
        return 100.0

    return 0.0

