from pydantic import BaseModel


class VerifyRequest(BaseModel):
    title: str
    state_code: str
    city: str
    periodicity: str


class VerifyResponse(BaseModel):
    status: str
    decision_basis: str
    severity: str | None
    verification_probability: float | None
    concept_density: float | None
    density_zone: str | None
    collision_index: float | None
    rule_violations: list
    similarity: dict | None
    explanation: str
