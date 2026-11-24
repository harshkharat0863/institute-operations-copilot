# Render Unified Deployment Guide

Institute Operations Copilot runs as a **single unified web service** on [Render](https://render.com). FastAPI serves both the REST API endpoints and the compiled React production application under one HTTPS domain.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │    Render Single Web Service           │
                      │  https://<service-name>.onrender.com   │
                      └──────────────────┬─────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
   ┌────────────────────────────────┐       ┌────────────────────────────────┐
   │        React Frontend          │       │        FastAPI Backend         │
   │  • /assets/* (immutable cache) │       │  • /health (checks Supabase)   │
   │  • index.html (no-cache)       │       │  • /students, /batches, etc.   │
   │  • Cold start banner (> 3s)    │       │  • /copilot/ask (AST pipeline) │
   └────────────────────────────────┘       └────────────────┬───────────────┘
                                                             │
                                                             ▼
                                            ┌────────────────────────────────┐
                                            │      Supabase PostgreSQL       │
                                            │  • 3NF relational schema       │
                                            │  • RLS enabled on all tables   │
                                            │  • Real views & aggregations   │
                                            └────────────────────────────────┘
```

---

## 1. Environment Variables in Render

In your **Render Dashboard** ➔ **Your Service** ➔ **Environment**:

| Key | Value / Source | Description |
|---|---|---|
| `PYTHON_VERSION` | `3.11.9` | Pinned Python runtime matching `.python-version` |
| `NODE_VERSION` | `20.12.0` | Node.js LTS for Vite production compilation |
| `SUPABASE_URL` | `https://<your-project-ref>.supabase.co` | Your Supabase project URL (Project Settings ➔ API) |
| `SUPABASE_SERVICE_ROLE_KEY` | `<your-service-role-key>` | Service role secret key (bypasses RLS for server) |
| `GEMINI_API_KEY` | `<your-gemini-api-key>` | Google AI Studio key for Copilot text-to-SQL |
| `GEMINI_FALLBACK_MODEL` | `gemini-1.5-flash` | *(Optional)* Resilient fallback model if primary Gemini model returns 503/429/timeout |
| `JWT_SECRET` | *(Render auto-generates)* | Set via `generateValue: true` in `render.yaml` |
| `ALLOWED_ORIGIN` | `https://<your-service-name>.onrender.com` | Live Render service origin for CORS guard |

> [!IMPORTANT]
> Never commit real Supabase keys or JWT secrets to Git. Set them exclusively in Render Environment settings.

---

## 2. Supabase Database Setup

Before deploying, apply the SQL scripts in your **Supabase Dashboard ➔ SQL Editor**:

1. **Schema (`supabase_schema.sql`)**:
   - Creates normalized 3NF tables: `courses`, `trainers`, `rooms`, `batches`, `students`, `emis`, `payments`, `attendance_records`, `action_items`, `timetable_sessions`, etc.
   - Creates database views: `student_fee_summary`, `student_attendance_30d`, `batch_summary`, `emi_due_this_week`, `trainer_utilization`, `trainer_safe_students`.
   - Enables Row Level Security (RLS) on every table.
   - Creates the restricted `run_readonly_query(sql text)` Postgres execution function with a 3-second statement timeout.

2. **Seed Data (`seed.sql`)**:
   - Populates 70+ realistic student rows with varied Indian names.
   - Uses relative date offsets (`CURRENT_DATE - INTERVAL '...'`) so attendance and fee due dates never look stale.

---

## 3. Deploy via Blueprint (`render.yaml`)

Your repository includes a root `render.yaml` blueprint:

```yaml
services:
  - type: web
    name: institute-operations-copilot
    runtime: python
    autoDeploy: true
    healthCheckPath: /health
    buildCommand: "npm ci && npm run build && pip install -r requirements.txt"
    startCommand: "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.9
      - key: NODE_VERSION
        value: 20.12.0
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: GEMINI_API_KEY
        sync: false
      - key: ALLOWED_ORIGIN
        sync: false
      - key: JWT_SECRET
        generateValue: true
```

### Steps to Deploy:
1. Push this repository to GitHub.
2. In **Render Dashboard**, click **New +** ➔ **Blueprint**.
3. Connect your repository. Render parses `render.yaml` automatically.
4. Fill in the prompted `sync: false` variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`).
5. Click **Apply**. Render will:
   - Run `npm ci && npm run build` (builds the React frontend into `dist/` in ~1 second).
   - Run `pip install -r requirements.txt` (installs pinned Python backend dependencies).
   - Start Uvicorn bound to `$PORT`.
   - Poll `/health` until Supabase connectivity returns 200.

---

## 4. Production Reliability Features

- **Fail-Fast Backend Startup**: If `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, or `JWT_SECRET` are missing, backend logs an explicit error block to stderr and stops immediately, preventing silent startup in broken states.
- **Deep `/health` Check**: The `/health` endpoint performs a query probe against Supabase. It returns `200 OK` when connected or `503 Service Unavailable` if database access fails.
- **Cold Start Handling**: If the Render free tier sleeps after 15 minutes of inactivity, any request taking longer than 3 seconds displays a non-intrusive banner: *"Waking up the server, this can take up to a minute"* with a live timer. Once awake, the app resumes instantly.
- **Optimal Caching**:
  - `/assets/*`: Served with `Cache-Control: public, max-age=31536000, immutable`.
  - `index.html`: Served with `Cache-Control: no-cache, no-store, must-revalidate` so updates are immediately visible to users.

---

## 5. Live URL Verification Checklist

1. **Health Check**:
   ```bash
   curl -i https://<your-service-name>.onrender.com/health
   ```
   *Expected Response:*
   ```json
   HTTP/2 200
   {
     "status": "ok",
     "service": "Institute Operations Copilot API",
     "database": {
       "connected": true,
       "detail": "connected"
     }
   }
   ```

2. **Frontend UI**:
   - Open `https://<your-service-name>.onrender.com` in a browser.
   - Verify the clean sign-in screen loads.
   - Sign in with any pre-seeded demo role (`Owner`, `Academic Counselor`, `Batch Trainer`, or `Accounts`).
   - Confirm Dashboard displays the 4 key numbers and the attendance chart backed by live Supabase views.
