from sqlalchemy import TIMESTAMP, Column, Float, Integer, String, Text
from sqlalchemy.sql import func

from app.db.base import Base


class Title(Base):
    __tablename__ = "titles"

    id = Column(Integer, primary_key=True, index=True)
    title_original = Column(Text, nullable=False)
    title_normalized = Column(Text, nullable=False, index=True)
    hindi_title = Column(Text)
    state_code = Column(String(10), index=True)
    city = Column(Text)
    owner_name = Column(Text)
    periodicity = Column(String(10))
    phonetic_code = Column(Text, index=True)
    concept_density = Column(Float)
    neighbor_count = Column(Integer)
    density_zone = Column(String(20))
    created_at = Column(TIMESTAMP, server_default=func.now())


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    title_submitted = Column(Text, nullable=False)
    title_normalized = Column(Text, nullable=False, index=True)
    state_code = Column(String(10))
    status = Column(String(20), default="pending")
    max_similarity = Column(Float)
    probability = Column(Float)
    concept_density = Column(Float)
    collision_index = Column(Float)
    density_zone = Column(String(20))
    decision_reason = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())


class SimilarityAudit(Base):
    __tablename__ = "similarity_audit"

    id = Column(Integer, primary_key=True, index=True)
    submitted_title = Column(Text)
    conflict_title = Column(Text)
    lexical_score = Column(Float)
    phonetic_score = Column(Float)
    semantic_score = Column(Float)
    final_score = Column(Float)
    decision = Column(String(20))
    created_at = Column(TIMESTAMP, server_default=func.now())
