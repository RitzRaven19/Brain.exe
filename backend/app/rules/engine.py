from sqlalchemy.orm import Session

from app.ingestion.normalizer import normalize_text
from app.rules.combination import check_combination_rule
from app.rules.disallowed import check_disallowed_words
from app.rules.exact_duplicate import check_exact_duplicate
from app.rules.periodicity import check_periodicity_injection
from app.rules.prefix_suffix import check_prefix_suffix_resemblance


def run_rules(title: str, state_code: str, city: str, periodicity: str, db: Session):
    title_normalized = normalize_text(title)
    state_normalized = normalize_text(state_code).upper()
    city_normalized = normalize_text(city)
    violations = []

    duplicate_violation = check_exact_duplicate(title_normalized, state_normalized, city_normalized, db)
    if duplicate_violation:
        violations.append(duplicate_violation)

    violations.extend(check_disallowed_words(title))

    periodicity_violation = check_periodicity_injection(title=title, periodicity=periodicity, state_code=state_code, db=db)
    if periodicity_violation:
        violations.append(periodicity_violation)

    prefix_suffix_violation = check_prefix_suffix_resemblance(title=title, state_code=state_code, db=db)
    if prefix_suffix_violation:
        violations.append(prefix_suffix_violation)

    combination_violation = check_combination_rule(title=title, state_code=state_code, db=db)
    if combination_violation:
        violations.append(combination_violation)

    return {"has_violation": bool(violations), "violations": violations}
