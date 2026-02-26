from app.density.concept_config import DENSITY_ZONES, SIMILARITY_THRESHOLD, TOP_K


def classify_density_zone(density: float) -> str:
    if density < DENSITY_ZONES["SPARSE"]:
        return "SPARSE"
    if density < DENSITY_ZONES["MODERATE"]:
        return "MODERATE"
    if density < DENSITY_ZONES["DENSE"]:
        return "DENSE"
    return "SATURATED"


def compute_density_from_neighbors(
    neighbors: list[dict],
    threshold: float = SIMILARITY_THRESHOLD,
    denominator: int = TOP_K,
    exclude_title_id: int | None = None,
) -> dict:
    filtered = [
        n
        for n in neighbors
        if n.get("title_id") is not None and n.get("title_id") != exclude_title_id
    ]
    high_similarity_count = 0
    for neighbor in filtered:
        score_pct = float(neighbor.get("score", 0.0))
        if (score_pct / 100.0) >= threshold:
            high_similarity_count += 1

    safe_denominator = max(int(denominator), 1)
    density = min(1.0, high_similarity_count / safe_denominator)
    return {
        "concept_density": density,
        "neighbor_count": high_similarity_count,
        "density_zone": classify_density_zone(density),
    }

