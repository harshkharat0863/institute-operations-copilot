# Institute Operations Copilot (Full Stack)

Full-stack enterprise admin platform for coaching institutes with an AI Copilot, strict Role-Based Access Control (RBAC), multi-layer security guardrails, automated timetable constraint solving, human-in-the-loop WhatsApp outbox approvals, a live **FastAPI** backend, and **Supabase (PostgreSQL)** database support.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (React 19 + Vite)          │
│   - Tailwind CSS v4, Recharts, TanStack Table          │
│   - JWT RBAC (Owner, Counselor, Trainer, Accounts)     │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (port 8000)
┌───────────────────────────▼────────────────────────────┐
│                   Backend (FastAPI + Python)          │
│   - /auth, /students, /batches, /fees, /attendance     │
│   - /copilot/ask (SafeQuery AST & Guardrails)          │
│   - /timetable/generate & /replan                      │
│   - /redteam/run (10-Vector security suite)            │
└───────────────────────────┬────────────────────────────┘
                            │ PostgREST / Client
┌───────────────────────────▼────────────────────────────┐
│             Supabase Database (PostgreSQL)            │
│   - 12 Tables with Row-Level Security (RLS) policies   │
│   - Full schema & seed script in `supabase_schema.sql` │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Run the Backend API (FastAPI)

Make sure dependencies are installed:
```bash
pip install fastapi uvicorn pydantic python-dotenv "supabase>=2.0.0" PyJWT
```

Start the FastAPI server:
```bash
python -m uvicorn backend.main:app --port 8000 --reload
```
The interactive Swagger API documentation will be available at: **`http://localhost:8000/docs`**.

---

### 2. Connect Supabase Database

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Go to the **SQL Editor** tab in your Supabase project.
3. Open `supabase_schema.sql` from this repository, copy its contents, and run it. This creates:
   - All 12 operational tables (`users`, `courses`, `trainers`, `batches`, `students`, `emis`, `attendance_records`, `action_items`, `timetable_sessions`, `audit_logs`, `query_logs`, `rooms`)
   - Complete Row-Level Security (RLS) policies
   - Realistic seed data including the benchmark Java cohort, trainers, and timetable
4. In your `.env` file, paste your Supabase Project URL and Service Role Key:
   ```env
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```
   *Note: If no Supabase credentials are provided yet, the backend automatically operates in persistent high-fidelity mode so you can test immediately!*

---

### 3. Run the Frontend (React + Vite)

Install frontend dependencies:
```bash
npm install
```

Start the Vite dev server:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🛡️ Security & Role Personas

1. **Owner (`owner@institute.org`)**: Full visibility across students, fees, timetable solver, audit logs, and the 10-vector Red-Team security suite.
2. **Counselor (`counselor@institute.org`)**: Student onboarding, batches, attendance check-ins, and WhatsApp outbox reminders.
3. **Trainer (`trainer@institute.org`)**: Batches, schedule, attendance. **Strictly prohibited** from financial ledgers and unmasked student contacts.
4. **Accounts (`accounts@institute.org`)**: Fee management, EMI installment collections, and approvals queue.
