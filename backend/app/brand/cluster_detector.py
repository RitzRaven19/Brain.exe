from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Title

BRAND_THRESHOLD = 5


def get_brand_clusters(db: Session):
    results = db.query(
        Title.title_normalized,
        func.count(Title.id).label("count"),
    ).group_by(Title.title_normalized).all()

    clusters = {
        title: int(count)
        for title, count in results
        if title and count >= BRAND_THRESHOLD
    }

    return clusters

