# Frontend Integration Guide

## API Base URL

Local:

```text
http://127.0.0.1:8000
```

## Exact JSON Samples (Use These Directly)

Use the files in `backend/docs/api_samples/` as canonical UI payloads:

- `dashboard_states.json` (single all-in-one file)
- `verify.rejected_*.response.json` (all deterministic rejection factors)
- `verify.review_*.response.json` (all AI similarity severities)
- `health.response.json`
- `system-metrics.response.json`
- `suggest.response.json`

---

## 1) Health Check

Endpoint:

- `GET /health`

Use:

- verify backend is up before calling other APIs.

Example:

```javascript
const res = await fetch("http://127.0.0.1:8000/health");
const data = await res.json();
// { status: "backend running" }
```

---

## 2) System Metrics

Endpoint:

- `GET /system-metrics`

Use:

- show engine capabilities in admin/demo UI.

Example:

```javascript
const res = await fetch("http://127.0.0.1:8000/system-metrics");
const metrics = await res.json();
```

Metrics include:

- `average_density`
- `dense_title_count`
- `saturated_title_count`

---

## 3) Suggest (Prefix Narrowing)

Endpoint:

- `GET /suggest?q=<text>`

Behavior:

- minimum normalized length: 2
- returns max 10 results

Example:

```javascript
async function fetchSuggestions(query) {
  if (!query || query.trim().length < 2) return [];
  const url = `http://127.0.0.1:8000/suggest?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}
```

Response shape:

```json
{
  "query": "tod",
  "results": [
    { "id": 5, "title": "TODAY TIMES" }
  ]
}
```

---

## 4) Verify (Core Decision API)

Endpoint:

- `POST /verify`

Request body:

```json
{
  "title": "Today Time",
  "state_code": "AND",
  "city": "port blair",
  "periodicity": "D"
}
```

Fetch example:

```javascript
async function verifyTitle(payload) {
  const res = await fetch("http://127.0.0.1:8000/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}
```

Response shape:

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
  "explanation": "..."
}
```

---

## `decision_basis` Meaning

- `DETERMINISTIC_RULE`:
  - request was blocked by rule engine (or duplicate pending application check)
  - similarity engine not used for decision
- `AI_SIMILARITY_ENGINE`:
  - no hard rule block
  - hybrid similarity (semantic + lexical + phonetic) produced risk result

---

## UI Mapping Rules

## If `status === "REJECTED"`

Show:

- red status badge: `REJECTED`
- basis badge: `decision_basis`
- rule violations list from `rule_violations`
- explanation text

Hide:

- similarity score bars/charts

## If `status === "REVIEW"`

Show:

- status badge: `REVIEW`
- basis badge: `decision_basis`
- severity badge (`SEVERE/HIGH/MODERATE/LOW`)
- probability as percent: `verification_probability`
- concept ecosystem density: `concept_density` (0.0 - 1.0)
- density zone badge: `density_zone` (`SPARSE|MODERATE|DENSE|SATURATED`)
- collision index: `collision_index` (0.0 - 1.0)
- best match title
- score bars:
  - semantic
  - lexical
  - phonetic
  - final
- brand indicator if `similarity.is_brand_cluster === true`
- explanation text

---

## Suggested Badge Colors

- `SEVERE`: red
- `HIGH`: orange
- `MODERATE`: yellow
- `LOW`: green

---

## Minimal Form Fields

Frontend should collect:

- `title` (required)
- `state_code` (required)
- `city` (required)
- `periodicity` (required)

---

## Optional UX Flow

1. User types title.
2. Call `/suggest` after 2+ characters.
3. Show suggestion dropdown.
4. On submit, call `/verify`.
5. Render result block by `status`.

Note:

- The backend also tracks applications.
- If a same normalized title is already pending in the same state, `/verify` returns `REJECTED` with `DUPLICATE_PENDING_APPLICATION`.
