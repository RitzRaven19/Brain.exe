# Backend System Guide

## 1) What This Backend Does

This backend is a regulatory title-validation engine with:

- deterministic rule checks
- hybrid similarity scoring (lexical + phonetic + semantic)
- brand-cluster-aware severity thresholds
- explainable output
- audit logging

Public API endpoints:

- `GET /health`
- `GET /system-metrics`
- `GET /suggest`
- `POST /verify`

---

## 2) Folder Structure

```text
backend/
  .env
  requirements.txt
  demo_payloads.json
  DEMO_RUNBOOK.md
  model_cache/                       # sentence-transformers local cache
  docs/
    README.md
    SYSTEM_GUIDE.md
    DENSITY_SETUP.md
  app/
    __init__.py
    main.py
    dependencies.py
    brand/
      __init__.py
      cluster_detector.py
    db/
      __init__.py
      base.py
      database.py
      models.py
    density/
      __init__.py
      concept_config.py
      density_engine.py
    explain/
      __init__.py
      generator.py
    ingestion/
      __init__.py
      normalizer.py
      phonetic.py
    rules/
      __init__.py
      engine.py
      exact_duplicate.py
      periodicity.py
      combination.py
      disallowed.py
      prefix_suffix.py
    schemas/
      __init__.py
      verify.py
    similarity/
      __init__.py
      funnel.py
      lexical.py
      phonetic.py
      embedding.py
      faiss_index.py
      aggregator.py
```

---

## 3) Top-Level Backend Files

### `backend/.env`

Environment variables (mainly `DATABASE_URL`).

### `backend/requirements.txt`

Runtime dependencies:

- API/framework: `fastapi`, `uvicorn`, `pydantic`
- DB: `sqlalchemy`, `psycopg2-binary`, `python-dotenv`
- matching/scoring: `jellyfish`, `rapidfuzz`
- semantic layer: `sentence-transformers`, `faiss-cpu`, `torch`

### `backend/demo_payloads.json`

Prepared payloads for 4 demo scenarios.

### `backend/DEMO_RUNBOOK.md`

Demo sequence and talking points.

### `backend/model_cache/`

Downloaded transformer model cache used by semantic layer.

---

## 4) App Layer (File-by-File)

## `app/main.py`

Main FastAPI application.

Responsibilities:

- startup initialization:
  - load semantic model
  - detect brand clusters
  - build FAISS index
- expose public endpoints:
  - `/health`
  - `/system-metrics`
  - `/verify`
- orchestrate full verification flow:
  - rules -> similarity -> density/collision -> explanation -> audit log

Internal helper functions:

- `_build_similarity(...)`: runs candidate funnel + semantic candidate scoring + aggregator
- `_build_similarity(...)`: runs candidate funnel + semantic scoring + density/collision calculations
- `_log_similarity_audit(...)`: writes result to `similarity_audit`

## `app/dependencies.py`

DB session dependency for FastAPI (`get_db()`).

## `app/db/base.py`

SQLAlchemy `Base` declaration.

## `app/db/database.py`

Creates SQLAlchemy engine/session from `DATABASE_URL`.

## `app/db/models.py`

ORM models:

- `Title`: ingested registration titles
- `Application`: submission tracking table
- `SimilarityAudit`: per-verification similarity audit entries

Density columns:

- `titles`: `concept_density`, `neighbor_count`, `density_zone`
- `applications`: `concept_density`, `collision_index`, `density_zone`

## `app/schemas/verify.py`

Pydantic request/response models:

- `VerifyRequest`
- `VerifyResponse`

## `app/brand/cluster_detector.py`

Brand cluster detection:

- `BRAND_THRESHOLD = 5`
- `get_brand_clusters(db)` returns `{title_normalized: count}` for dominant titles.

## `app/ingestion/normalizer.py`

Text normalization utility:

- unicode normalize (NFKC)
- lowercase
- punctuation removal
- whitespace collapse

## `app/ingestion/phonetic.py`

Phonetic signature utility:

- preferred: `jellyfish.metaphone`
- fallback: internal `soundex` implementation

## `app/rules/exact_duplicate.py`

Rule: exact duplicate in same context:

- `(title_normalized, state_code, city)` exists -> violation.

## `app/rules/periodicity.py`

Rule: periodicity injection:

- removes periodicity token from title
- if remaining title matches existing title in same state -> violation.

## `app/rules/combination.py`

Rule: title combination:

- checks whether submitted title contains 2+ existing full titles (same state scope).

## `app/rules/disallowed.py`

Rule: disallowed terms:

- checks restricted phrases in normalized title.

## `app/rules/prefix_suffix.py`

Rule: disallowed prefix/suffix resemblance:

- strips configured disallowed prefix/suffix tokens
- if the stripped title resembles an existing state-level title closely, returns a violation.

## `app/rules/engine.py`

Rule orchestration:

- runs exact duplicate, disallowed, periodicity injection, prefix/suffix resemblance, combination
- returns:
  - `has_violation`
  - `violations`

## `app/explain/generator.py`

Deterministic explanation generator:

- rejection explanation from rule violation
- review explanation from similarity score breakdown

## `app/density/concept_config.py`

Central constants:

- `TOP_K`
- `SIMILARITY_THRESHOLD`
- density/scoring weights
- density zone cutoffs

## `app/density/density_engine.py`

Density logic:

- computes concept density from semantic neighbors
- counts neighbors above similarity threshold
- classifies zone: `SPARSE | MODERATE | DENSE | SATURATED`

## `app/similarity/funnel.py`

Candidate selection:

- normalize title/state
- compute phonetic code
- state-scoped query
- phonetic-first match
- fallback to state pool
- hard cap: `CANDIDATE_LIMIT = 200`

## `app/similarity/lexical.py`

Lexical score:

- preferred: `rapidfuzz.token_set_ratio`
- fallback: `difflib.SequenceMatcher` token-set style score

## `app/similarity/phonetic.py`

Phonetic score:

- `100` if phonetic code matches
- else `0`

## `app/similarity/embedding.py`

Semantic model loader:

- model: `paraphrase-multilingual-MiniLM-L12-v2`
- cache directory: `./model_cache`
- `load_model()` and `get_model()`

## `app/similarity/faiss_index.py`

Semantic ANN infrastructure:

- `build_faiss_index(db, model)` builds normalized vector index
- `score_candidates(...)` maps semantic scores to current candidates
- `search_neighbors_by_text(...)` for top-k semantic neighborhood
- `search_neighbors_by_title_id(...)` for offline density recomputation
- `get_index()` for metrics
- `semantic_status()` readiness/error info

## `app/similarity/aggregator.py`

Final scoring and severity:

- combines semantic/lexical/phonetic
- brand-aware severity thresholds
- outputs:
  - `best_match`
  - `scores` (`semantic`, `lexical`, `phonetic`, `final`)
  - `severity`
  - `verification_probability`
  - `is_brand_cluster`

---

## 5) Endpoint Documentation

## `GET /health`

Purpose:

- basic liveness check

Response:

```json
{"status":"backend running"}
```

## `GET /system-metrics`

Purpose:

- quick system capability snapshot for monitoring/demo

Response fields:

- `total_titles`: count in `titles`
- `brand_clusters`: detected dominant title count
- `brand_threshold`: threshold used for cluster creation
- `semantic_enabled`: FAISS+semantic readiness
- `faiss_index_size`: vectors in FAISS index
- `rules_enabled`: number of deterministic rules active
- `similarity_layers`: number of scoring layers active
- `model`: semantic model name
- `average_density`: average precomputed title density
- `dense_title_count`: number of `DENSE` titles
- `saturated_title_count`: number of `SATURATED` titles

Example:

```json
{
  "total_titles": 8219,
  "brand_clusters": 66,
  "brand_threshold": 5,
  "semantic_enabled": true,
  "faiss_index_size": 8219,
  "rules_enabled": 5,
  "similarity_layers": 3,
  "model": "paraphrase-multilingual-MiniLM-L12-v2",
  "average_density": 0.41,
  "dense_title_count": 1280,
  "saturated_title_count": 214
}
```

## `GET /suggest?q=...`

Purpose:

- lightweight prefix narrowing for title suggestions
- helps users avoid obvious duplicate attempts early

Behavior:

- query is normalized using the same normalization logic as verification
- if normalized query length is `< 2`, returns empty list
- prefix match only: `title_normalized LIKE '<query>%'`
- hard result cap: `10`

Response:

```json
{
  "query": "mor",
  "results": [
    {"id": 7438, "title": "MORADABAD TIMES"},
    {"id": 1798, "title": "MORBI TIMES"}
  ]
}
```

## `POST /verify`

Purpose:

- perform full regulatory validation for one submission

Request body:

```json
{
  "title": "Today Time",
  "state_code": "AND",
  "city": "port blair",
  "periodicity": "D"
}
```

Response fields:

- `status`: `REJECTED` or `REVIEW`
- `decision_basis`: `DETERMINISTIC_RULE` or `AI_SIMILARITY_ENGINE`
- `severity`: `SEVERE/HIGH/MODERATE/LOW` or `null` for hard rule rejection
- `verification_probability`: 0-100 or `null`
- `concept_density`: 0.0-1.0 or `null`
- `density_zone`: `SPARSE/MODERATE/DENSE/SATURATED` or `null`
- `collision_index`: 0.0-1.0 or `null`
- `rule_violations`: list of rule violations
- `similarity`: object or `null`
  - `best_match`
  - `scores` (`semantic`, `lexical`, `phonetic`, `final`)
  - `is_brand_cluster`
- `explanation`: human-readable explanation

Reject example:

```json
{
  "status": "REJECTED",
  "decision_basis": "DETERMINISTIC_RULE",
  "severity": null,
  "verification_probability": null,
  "concept_density": null,
  "density_zone": null,
  "collision_index": null,
  "rule_violations": [
    {"type":"EXACT_DUPLICATE","message":"Title already exists in same state and city."}
  ],
  "similarity": null,
  "explanation": "The submitted title was rejected due to regulatory rule violation: EXACT_DUPLICATE. Details: Title already exists in same state and city."
}
```

Review example:

```json
{
  "status": "REVIEW",
  "decision_basis": "AI_SIMILARITY_ENGINE",
  "severity": "SEVERE",
  "verification_probability": 7.53,
  "concept_density": 0.72,
  "density_zone": "DENSE",
  "collision_index": 0.84,
  "rule_violations": [],
  "similarity": {
    "best_match": "TODAY TIMES",
    "scores": {
      "semantic": 86.97,
      "lexical": 95.24,
      "phonetic": 100.0,
      "final": 92.47
    },
    "is_brand_cluster": false
  },
  "explanation": "The submitted title shows SEVERE similarity to 'TODAY TIMES' ..."
}
```

---

## 6) End-to-End Runtime Flow

1. API starts (`startup_event`):
   - load transformer model
   - detect brand clusters from DB
   - build FAISS index
2. `/verify` request received:
   - reject if same normalized title already exists as a pending application in same state
   - create current submission row in `applications` as pending
   - run deterministic rules
   - if violation -> return `REJECTED` and mark application rejected
   - else run candidate funnel (state + phonetic strategy)
   - compute semantic scores + top-k semantic neighborhood via FAISS
   - compute final hybrid score in aggregator
   - compute concept density and collision index
   - generate explanation
   - write to `similarity_audit`
   - update application with final score/probability/severity + density/collision
   - return structured `REVIEW` response

---

## 7) Important Design Principles

- Rules are authoritative for hard blocks.
- Similarity is advisory/risk scoring for review decisions.
- LLM does not decide; explanation layer is deterministic.
- Brand clusters tighten severity thresholds for dominant titles.
- Semantic layer is optional at runtime (metrics expose enabled/disabled state).
