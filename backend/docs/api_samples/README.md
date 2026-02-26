# API Sample JSON Files

These JSON files are canonical frontend samples for dashboard rendering.

Use them to build UI states for:

- health
- system metrics
- suggest dropdown
- verify rejected (rule-based)
- verify rejected (duplicate pending application)
- verify review (severe/high/moderate/low)
- verify review (brand-cluster strict severe)
- verify rejected (all deterministic rule factors)

Note:

- numeric values (scores/probabilities/counts) are runtime-dependent
- structure and keys are stable
- `decision_basis` controls whether result is rule-driven or AI-driven
- density fields are included in `/verify` and `/system-metrics`:
  - `concept_density`
  - `density_zone`
  - `collision_index`

Main bundle:

- `dashboard_states.json` (all key states in one file for frontend mapping)
