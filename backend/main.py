"""
Institute Operations Copilot - FastAPI Backend
Provides all REST endpoints with JWT role authentication and Supabase database binding.
"""
import os
import time
import pathlib
from collections import defaultdict
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import jwt
import bcrypt
from dotenv import load_dotenv

from backend.models import (
    User, RegisterRequest, StudentCreate, BatchCreate, CheckInRequest, OnlineJoinRequest,
    DraftRemindersRequest, BulkApproveRequest, ReplanRequest,
    IssueCertificateRequest, DropoutInterventionRequest, LoginRequest,
)
from backend.repository import repo
from backend.copilot import process_copilot_ask
from backend.redteam import get_red_team_results

import sys
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("institute_ops")

# --------------- CONFIGURATION & STARTUP VALIDATION ---------------

is_test_env = bool(os.getenv("TESTING") or os.getenv("PYTEST_CURRENT_TEST"))
REQUIRED_ENV_VARS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"]
missing_vars = [
    var for var in REQUIRED_ENV_VARS
    if not os.getenv(var) or "your_supabase" in os.getenv(var, "") or "your_service_role" in os.getenv(var, "")
]

if missing_vars and not is_test_env:
    border = "=" * 70
    msg = (
        f"\n{border}\n"
        f"CRITICAL STARTUP ERROR: Missing required environment variable(s):\n"
        + "".join(f"  ❌ {var}\n" for var in missing_vars)
        + f"\nPlease configure these in your Render Dashboard (Environment settings) or .env file.\n"
        f"{border}\n"
    )
    sys.stderr.write(msg)
    logger.critical(msg)
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing_vars)}")

if not os.getenv("GEMINI_API_KEY") and not is_test_env:
    logger.warning("⚠️  GEMINI_API_KEY is not set. Copilot natural language SQL queries will report API key missing.")

JWT_SECRET = os.getenv("JWT_SECRET", "test-secret-key-for-test-suite" if is_test_env else "")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required. Set it before starting the server.")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_SECONDS = 24 * 3600  # 24 hours

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGIN", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]

app = FastAPI(
    title="Institute Operations Copilot API",
    description="FastAPI backend for Institute Operations Copilot.",
    version="1.0.0",
)

# --------------- CORS (tightened) ---------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------- RATE LIMITING (in-memory) ---------------

_login_attempts: dict[str, list[float]] = defaultdict(list)
LOGIN_RATE_WINDOW = 60  # seconds
LOGIN_RATE_MAX = 10  # max attempts per window per IP

def _check_rate_limit(client_ip: str) -> None:
    """Raise 429 if more than LOGIN_RATE_MAX login attempts within LOGIN_RATE_WINDOW."""
    now = time.time()
    attempts = _login_attempts[client_ip]
    # Prune old entries
    _login_attempts[client_ip] = [t for t in attempts if now - t < LOGIN_RATE_WINDOW]
    if len(_login_attempts[client_ip]) >= LOGIN_RATE_MAX:
        raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
    _login_attempts[client_ip].append(now)

# --------------- AUTH HELPERS ---------------

def create_jwt_token(user: dict) -> str:
    payload = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "trainer_id": user.get("trainer_id"),
        "iat": int(time.time()),
        "exp": int(time.time()) + JWT_EXPIRY_SECONDS,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Extract and verify JWT from the Authorization header. No fallbacks."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_roles(*allowed_roles: str):
    def role_checker(user: dict = Depends(get_current_user)):
        user_role = user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(status_code=403, detail=f"Forbidden for role '{user_role}'")
        return user
    return role_checker


# -------------------------------------------------------------
# 1. AUTHENTICATION
# -------------------------------------------------------------
@app.post("/auth/login")
async def login(req: LoginRequest, request: Request):
    _check_rate_limit(request.client.host if request.client else "unknown")

    normalized = req.email.lower().strip()
    user = await repo.find_user_by_email(normalized)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Verify password
    stored_hash = user.get("password_hash", "")
    if not stored_hash or not bcrypt.checkpw(
        req.password.encode("utf-8"), stored_hash.encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Sanitize user dict for token (exclude password_hash)
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    token = create_jwt_token(safe_user)
    return {"token": token, "user": safe_user}


@app.post("/auth/register")
async def register(req: RegisterRequest):
    # Block self-registration as owner
    if req.role == "owner":
        raise HTTPException(status_code=403, detail="Owner accounts cannot be self-registered")

    try:
        user = await repo.register_user(
            name=req.name,
            email=req.email,
            password=req.password,
            role=req.role,
            specialization=req.specialization,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    token = create_jwt_token(user)
    return {"token": token, "user": user}


# -------------------------------------------------------------
# 2. STUDENTS CRUD
# -------------------------------------------------------------
@app.get("/students")
async def get_students(
    batch_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    # Role-based redaction (Requirement 3: trainer-safe view without phone and fees)
    if user.get("role") == "trainer":
        return await repo.get_trainer_safe_students(user.get("trainer_id"))
    return await repo.get_students(batch_id, status)


@app.post("/students")
async def add_student(data: StudentCreate, user: dict = Depends(require_roles("owner", "counselor"))):
    return await repo.add_student(data)


@app.patch("/students/{student_id}")
async def update_student(student_id: str, updates: dict, user: dict = Depends(require_roles("owner", "counselor"))):
    return await repo.update_student(student_id, updates)


@app.delete("/students/{student_id}")
async def delete_student(student_id: str, user: dict = Depends(require_roles("owner", "counselor"))):
    return await repo.delete_student(student_id)


# -------------------------------------------------------------
# 3. BATCHES
# -------------------------------------------------------------
@app.get("/batches")
async def get_batches(user: dict = Depends(get_current_user)):
    return await repo.get_batches()


@app.post("/batches")
async def add_batch(data: BatchCreate, user: dict = Depends(require_roles("owner"))):
    return await repo.add_batch(data)


# -------------------------------------------------------------
# 4. COURSES & TRAINERS
# -------------------------------------------------------------
@app.get("/courses")
async def get_courses(user: dict = Depends(get_current_user)):
    return await repo.get_courses()


@app.get("/trainers")
async def get_trainers(user: dict = Depends(get_current_user)):
    return await repo.get_trainers()


# -------------------------------------------------------------
# 5. FEES & EMIS (Accounts and Owner only)
# -------------------------------------------------------------
@app.get("/fees/emis")
async def get_emis(status: Optional[str] = Query(None), user: dict = Depends(require_roles("owner", "accounts"))):
    return await repo.get_emis(status)


@app.post("/fees/emis/{emi_id}/pay")
async def mark_emi_paid(emi_id: str, user: dict = Depends(require_roles("owner", "accounts"))):
    return await repo.mark_emi_paid(emi_id)


# -------------------------------------------------------------
# 6. ATTENDANCE (Classroom & Online)
# -------------------------------------------------------------
@app.get("/attendance")
async def get_attendance(type: Optional[str] = Query(None), user: dict = Depends(get_current_user)):
    return await repo.get_attendance(type)


@app.post("/attendance/checkin")
async def checkin(req: CheckInRequest, user: dict = Depends(get_current_user)):
    return await repo.checkin(req.student_id, req.batch_id, req.status)


@app.post("/attendance/online-join")
async def online_join(req: OnlineJoinRequest, user: dict = Depends(get_current_user)):
    return await repo.online_join(req.student_id, req.batch_id, req.duration_minutes)


# -------------------------------------------------------------
# 7. COPILOT ASK
# -------------------------------------------------------------
class CopilotRequest(BaseModel):
    question: str


@app.post("/copilot/ask")
async def copilot_ask(req: CopilotRequest, user: dict = Depends(get_current_user)):
    role = user.get("role", "counselor")
    res = await process_copilot_ask(req.question, role)
    return res


# -------------------------------------------------------------
# 8. APPROVALS & ACTIONS
# -------------------------------------------------------------
@app.get("/actions")
async def get_actions(status: Optional[str] = Query(None), user: dict = Depends(get_current_user)):
    return await repo.get_actions(status)


@app.post("/actions/{action_id}/approve")
async def approve_action(action_id: str, user: dict = Depends(require_roles("owner", "accounts", "counselor"))):
    approver = user.get("name", "Staff Approver")
    return await repo.approve_action(action_id, approver)


@app.post("/actions/{action_id}/reject")
async def reject_action(action_id: str, user: dict = Depends(require_roles("owner", "accounts", "counselor"))):
    rejector = user.get("name", "Staff Member")
    return await repo.reject_action(action_id, rejector)


class UpdateActionMessageRequest(BaseModel):
    message: str


@app.patch("/actions/{action_id}")
async def update_action(action_id: str, req: UpdateActionMessageRequest, user: dict = Depends(get_current_user)):
    return await repo.update_action(action_id, req.message)


@app.post("/actions/bulk-approve")
async def bulk_approve(req: BulkApproveRequest, user: dict = Depends(require_roles("owner", "accounts", "counselor"))):
    approver = user.get("name", "Staff Approver")
    return await repo.bulk_approve(req.ids, approver)


@app.post("/actions/draft-reminders")
async def draft_reminders(req: DraftRemindersRequest, user: dict = Depends(get_current_user)):
    drafts_dict = [d.dict() for d in req.drafts]
    return await repo.draft_reminders(drafts_dict, req.requester)


# -------------------------------------------------------------
# 9. TIMETABLE
# -------------------------------------------------------------
@app.post("/timetable/generate")
async def get_timetable(user: dict = Depends(get_current_user)):
    return await repo.get_timetable()


@app.post("/timetable/replan")
async def replan_timetable(req: ReplanRequest, user: dict = Depends(require_roles("owner", "counselor", "trainer"))):
    return await repo.replan_timetable(req.event, req.details)


# -------------------------------------------------------------
# 10. AUDIT & QUERY LOGS (Owner Only)
# -------------------------------------------------------------
@app.get("/audit")
async def get_audit(user: dict = Depends(require_roles("owner"))):
    return await repo.get_audit()


@app.get("/query-log")
async def get_query_log(user: dict = Depends(require_roles("owner"))):
    return await repo.get_query_logs()


# -------------------------------------------------------------
# 11. RED TEAM TEST SUITE (Owner Only)
# -------------------------------------------------------------
@app.post("/redteam/run")
async def run_red_team(user: dict = Depends(require_roles("owner"))):
    return await get_red_team_results()


# -------------------------------------------------------------
# 12. FEE RECONCILIATION & RECOGNITION (Accounts & Owner)
# -------------------------------------------------------------
@app.get("/fees/reconciliations")
async def get_reconciliations(user: dict = Depends(require_roles("owner", "accounts"))):
    return await repo.get_reconciliations()


@app.post("/fees/reconciliations/{rec_id}/settle")
async def settle_reconciliation(rec_id: str, user: dict = Depends(require_roles("owner", "accounts"))):
    return await repo.reconcile_payment(rec_id)


# -------------------------------------------------------------
# 13. CERTIFICATIONS
# -------------------------------------------------------------
@app.get("/certifications")
async def get_certifications(user: dict = Depends(get_current_user)):
    return await repo.get_certificates()


@app.post("/certifications/issue")
async def issue_certification(req: IssueCertificateRequest, user: dict = Depends(require_roles("owner", "counselor"))):
    return await repo.issue_certificate(req.student_id, req.course_id)


# -------------------------------------------------------------
# 14. CLASS RECORDINGS
# -------------------------------------------------------------
@app.get("/recordings")
async def get_recordings(user: dict = Depends(get_current_user)):
    return await repo.get_recordings()


# -------------------------------------------------------------
# 15. DROPOUT RISK RADAR
# -------------------------------------------------------------
@app.get("/students/dropout-risk")
async def get_dropout_risk(user: dict = Depends(require_roles("owner", "counselor"))):
    return await repo.get_dropout_risk()


@app.post("/students/dropout-risk/{student_id}/intervene")
async def intervene_dropout_risk(student_id: str, req: DropoutInterventionRequest, user: dict = Depends(require_roles("owner", "counselor"))):
    return await repo.intervene_dropout_risk(student_id, req.action_type)


# -------------------------------------------------------------
# 16. THE HIDDEN STUDENT FAILURE CHAIN
# -------------------------------------------------------------
from backend.models import FailureChainInterventionRequest

@app.get("/students/failure-chains")
async def get_failure_chains(user: dict = Depends(require_roles("owner", "counselor", "trainer", "accounts"))):
    return await repo.get_failure_chains()


@app.post("/students/failure-chains/{chain_id}/plan")
async def update_failure_chain_plan(chain_id: str, req: FailureChainInterventionRequest, user: dict = Depends(require_roles("owner", "counselor"))):
    return await repo.update_failure_chain_plan(chain_id, req.plan_status, req.notes)


# -------------------------------------------------------------
# 17. DASHBOARD ANALYTICS
# -------------------------------------------------------------
@app.get("/dashboard/analytics")
async def get_dashboard_analytics(user: dict = Depends(get_current_user)):
    return await repo.get_dashboard_analytics()


# Health check - verifies service liveness and live Supabase connection
@app.get("/health")
async def health():
    db_ok = False
    db_detail = "connected"
    try:
        from backend.db import get_supabase
        sb = get_supabase()
        if sb:
            # Quick lightweight query probe against Supabase
            sb.table("users").select("id").limit(1).execute()
            db_ok = True
        else:
            db_detail = "Supabase client unconfigured or unreachable"
    except Exception as e:
        db_detail = f"Database probe failed: {str(e)}"

    status_str = "ok" if db_ok else "degraded"
    status_code = 200 if db_ok else 503

    return JSONResponse(
        status_code=status_code,
        content={
            "status": status_str,
            "service": "Institute Operations Copilot API",
            "database": {
                "connected": db_ok,
                "detail": db_detail,
            },
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
    )


# -------------------------------------------------------------
# SERVE COMPILED VITE FRONTEND (SINGLE UNIFIED DEPLOYMENT)
# -------------------------------------------------------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


class ImmutableStaticFiles(StaticFiles):
    """Serve static assets with long-term immutable caching headers."""
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


# Known API path prefixes — requests that start with these should NOT fall through to SPA
API_PREFIXES = (
    "/api/", "/auth/", "/students", "/batches", "/courses", "/trainers",
    "/fees/", "/attendance", "/copilot/", "/actions", "/timetable/",
    "/audit", "/query-log", "/redteam/", "/certifications", "/recordings",
    "/dashboard", "/health", "/docs", "/openapi.json",
)

dist_path = (pathlib.Path(__file__).resolve().parent.parent / "dist").resolve()
if dist_path.exists():
    assets_path = dist_path / "assets"
    if assets_path.exists():
        app.mount("/assets", ImmutableStaticFiles(directory=str(assets_path)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # API-prefixed paths that weren't matched above should return 404 JSON
        check_path = f"/{full_path}"
        if any(check_path.startswith(prefix) for prefix in API_PREFIXES):
            return JSONResponse(status_code=404, content={"detail": "Not found"})

        # Path-traversal protection: resolve and verify strictly inside dist/
        requested = (dist_path / full_path).resolve()
        if not requested.is_relative_to(dist_path):
            return JSONResponse(status_code=400, content={"detail": "Invalid path"})

        # Serve the requested file if it exists
        if requested.is_file():
            headers = {}
            if requested.name == "index.html":
                headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            return FileResponse(str(requested), headers=headers)

        # SPA fallback: serve index.html with no-cache headers for client-side routing
        return FileResponse(
            str(dist_path / "index.html"),
            headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
        )
