import os
import sys
from collections import Counter

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app.db.database import SessionLocal  # noqa: E402
from app.db.models import Title  # noqa: E402
from app.density.concept_config import SIMILARITY_THRESHOLD, TOP_K  # noqa: E402
from app.density.density_engine import compute_density_from_neighbors  # noqa: E402
from app.similarity.embedding import load_model  # noqa: E402
from app.similarity.faiss_index import (  # noqa: E402
    build_faiss_index,
    search_neighbors_by_title_id,
)


def recompute_density(batch_size: int = 250):
    model = load_model()
    if model is None:
        raise RuntimeError("Semantic model failed to load; cannot recompute density.")

    db = SessionLocal()
    try:
        if not build_faiss_index(db, model):
            raise RuntimeError("Failed to build FAISS index.")

        titles = db.query(Title).order_by(Title.id.asc()).all()
        total = len(titles)
        zone_counter = Counter()

        for idx, title in enumerate(titles, start=1):
            neighbors = search_neighbors_by_title_id(title.id, top_k=TOP_K + 1)
            density_info = compute_density_from_neighbors(
                neighbors=neighbors,
                threshold=SIMILARITY_THRESHOLD,
                denominator=TOP_K,
                exclude_title_id=title.id,
            )

            title.concept_density = density_info["concept_density"]
            title.neighbor_count = density_info["neighbor_count"]
            title.density_zone = density_info["density_zone"]
            zone_counter[title.density_zone] += 1

            if idx % batch_size == 0:
                db.commit()
                print(f"Processed {idx}/{total}")

        db.commit()
        print(f"Completed density recomputation for {total} titles.")
        print("Zone distribution:")
        for zone, count in sorted(zone_counter.items()):
            print(f"  {zone}: {count}")
    finally:
        db.close()


if __name__ == "__main__":
    recompute_density()

