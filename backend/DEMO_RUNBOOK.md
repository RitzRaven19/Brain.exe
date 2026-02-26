# Demo Runbook

## Start Backend

```powershell
cd C:\Users\likug\Desktop\XIMHACK\backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## Demo Order

1. `GET /system-metrics`
2. `POST /verify` with `case_1_exact_duplicate`
3. `POST /verify` with `case_2_brand_strictness`
4. `POST /verify` with `case_3_semantic_similarity`
5. `POST /verify` with `case_4_clean_low_risk`

Payloads are in [`demo_payloads.json`](./demo_payloads.json).

## Talking Points

- Deterministic regulatory rules run first.
- Hybrid AI similarity runs only when rule checks pass.
- Semantic search uses multilingual transformer embeddings + FAISS ANN.
- Brand clusters enforce stricter severity thresholds for dominant titles.
- Every decision includes structured explanation and audit logging.

