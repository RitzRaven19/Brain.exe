# Density Setup Guide

Run these steps once to enable concept density end-to-end.

## 1) Apply DB Columns

From `backend/`:

```powershell
psql -U postgres -d prgi_db -f scripts/sql/add_density_columns.sql
```

This adds:

- `titles.concept_density`
- `titles.neighbor_count`
- `titles.density_zone`
- `applications.concept_density`
- `applications.collision_index`
- `applications.density_zone`

## 2) Recompute Density for Existing Titles

From project root:

```powershell
.\.venv\Scripts\python.exe backend\scripts\recompute_density.py
```

The script:

- loads semantic model
- rebuilds FAISS index
- computes top-k neighborhood density for each title
- writes density fields back to `titles`
- prints zone distribution summary

## 3) Verify Runtime Output

Start API and call `POST /verify`.

Response now includes:

- `concept_density`
- `density_zone`
- `collision_index`

Call `GET /system-metrics` to view:

- `average_density`
- `dense_title_count`
- `saturated_title_count`

