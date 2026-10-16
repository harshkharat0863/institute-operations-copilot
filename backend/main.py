"""
Institute Operations Copilot - FastAPI Backend
Provides all REST endpoints with JWT role authentication and Supabase database binding.
"""
import os
import time
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Header, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt
from dotenv import load_dotenv

from backend.models import (
    User, StudentCreate, BatchCreate, CheckInRequest, OnlineJoinRequest,
    DraftRemindersRequest, BulkApproveRequest, ReplanRequest,
    IssueCertificateRequest, DropoutInterventionRequest
)
from backend.repository import repo, DEMO_USERS
from backend.copilot import process_copilot_ask
from backend.redteam import get_red_team_results

load_dotenv()

app = FastAPI(
    title="Institute Operations Copilot API",
    description="Full-stack FastAPI backend powered by Supabase with RBAC & SafeQuery AST.",
    version="1.0.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-institute-copilot-key-2026")
JWT_ALGORITHM = "HS256"

# -------------------------------------------------------------
# AUTH & DEPENDENCIES
# -------------------------------------------------------------
class LoginRequest(BaseModel):
    email: str

def create_jwt_token(user: dict) -> str:
    payload = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "trainer_id": user.get("trainer_id"),
        "exp": int(time.time()) + (24 * 3600)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        # For seamless dev/demo convenience, default to owner if no header is supplied
        return DEMO_USERS["owner"]
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        # Fallback to local decoded token if unsigned or mock token
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            return unverified
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid session or token expired")

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
async def login(req: LoginRequest):
    normalized = req.email.lower().strip()
    user = DEMO_USERS["owner"]
    if "counselor" in normalized:
        user = DEMO_USERS["counselor"]
    elif "trainer" in normalized:
        user = DEMO_USERS["trainer"]
    elif "accounts" in normalized:
        user = DEMO_USERS["accounts"]

    token = create_jwt_token(user)
    return {"token": token, "user": user}

# -------------------------------------------------------------
# 2. STUDENTS CRUD
# -------------------------------------------------------------
@app.get("/students")
async def get_students(
    batch_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
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
    res = process_copilot_ask(req.question, role)
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
    return get_red_team_results()

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

# Health check
@app.get("/health")
async def health():
    return {"status": "ok", "service": "Institute Operations Copilot API"}

# -------------------------------------------------------------
# 12. SERVE COMPILED VITE FRONTEND (SINGLE UNIFIED DEPLOYMENT)
# -------------------------------------------------------------
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

dist_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
if os.path.exists(dist_path):
    assets_path = os.path.join(dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        file_path = os.path.join(dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))

