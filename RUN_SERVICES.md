# Run Services Guide (Database, Backend, Frontend)

This guide explains how to run each service independently in your current project.

Project root:

```text
C:\Users\likug\Desktop\XIMHACK
```

---

## Single Command (Recommended)

From project root:

```powershell
.\run_all.ps1
```

Or:

```powershell
.\run_all.cmd
```

What it does:

- checks PostgreSQL availability on `127.0.0.1:5432` (tries to start PostgreSQL service if needed)
- starts backend in a new PowerShell window (`uvicorn ... --reload`)
- starts frontend in a new PowerShell window (`npm run dev`)

Stop both services launched by script:

```powershell
.\run_all.ps1 -Stop
```

---

## 1) Start Database (PostgreSQL)

### 1.1 Ensure PostgreSQL service is running

Open PowerShell as Administrator:

```powershell
Get-Service *postgres*
Start-Service postgresql-x64-18
```

If your service name differs, use the exact name returned by `Get-Service`.

### 1.2 Verify DB connectivity

```powershell
$env:PGPASSWORD="11111111"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d prgi_db -c "SELECT 1;"
```

Expected output includes one row with value `1`.

### 1.3 (Only when needed) Apply density migration

From project root:

```powershell
$env:PGPASSWORD="11111111"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d prgi_db -f backend/scripts/sql/add_density_columns.sql
```

---

## 2) Start Backend (FastAPI)

### 2.1 Go to backend and activate venv

```powershell
cd C:\Users\likug\Desktop\XIMHACK\backend
..\.venv\Scripts\Activate.ps1
```

If activation path fails, use:

```powershell
cd C:\Users\likug\Desktop\XIMHACK
.venv\Scripts\Activate.ps1
cd backend
```

### 2.2 Install dependencies (if not already installed)

```powershell
pip install -r requirements.txt
```

### 2.3 Ensure backend env file exists

`backend/.env` should contain:

```env
DATABASE_URL=postgresql://postgres:11111111@localhost:5432/prgi_db
```

### 2.4 Run backend server

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2.5 Verify backend health

Open another PowerShell:

```powershell
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/system-metrics
```

---

## 3) Start Frontend

Current repo state: `frontend/` is empty right now.

You have two paths:

### 3.1 If frontend already exists later

```powershell
cd C:\Users\likug\Desktop\XIMHACK\frontend
npm install
npm run dev
```

Then open the URL shown in terminal (usually `http://127.0.0.1:5173`).

### 3.2 If you want to bootstrap frontend now (Vite + React)

From project root:

```powershell
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev
```

---

## 4) Recommended 3-Terminal Workflow

Use separate terminals:

1. Terminal A: PostgreSQL (verify running / run psql commands)
2. Terminal B: Backend (`uvicorn ...`)
3. Terminal C: Frontend (`npm run dev`)

---

## 5) Stop Services

### Stop backend/frontend

Press `Ctrl + C` in their running terminals.

### Stop PostgreSQL service (optional)

```powershell
Stop-Service postgresql-x64-18
```
