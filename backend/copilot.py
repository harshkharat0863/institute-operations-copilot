"""
Natural language text-to-SQL synthesis using Gemini (google-genai) and sqlglot.
Strict multi-tier security: Role-based Schema Scoping, sqlglot AST Validation, and read-only execution.
"""
import os
import re
import time
import logging
from typing import Dict, Any, List, Set, Optional
import sqlglot
from sqlglot import exp
from dotenv import load_dotenv

from backend.db import get_supabase

load_dotenv()
logger = logging.getLogger("institute_ops.copilot")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL")

# -------------------------------------------------------------
# 1. ROLE-BASED SCHEMA WHITELISTS (Item 1 & 2)
# -------------------------------------------------------------
ROLE_ALLOWED_TABLES: Dict[str, Set[str]] = {
    "owner": {
        "student_fee_summary", "student_attendance_30d", "batch_summary", "emi_due_this_week", "trainer_utilization",
        "trainer_safe_students", "students", "batches", "courses", "trainers", "rooms", "emis", "payments",
        "attendance_records", "action_items", "timetable_sessions", "payment_reconciliations", "certificates", "class_recordings"
    },
    "counselor": {
        "student_attendance_30d", "batch_summary", "students", "batches", "courses", "trainers",
        "rooms", "attendance_records", "action_items", "timetable_sessions", "certificates"
    },
    "trainer": {
        "trainer_safe_students", "batch_summary", "courses", "trainers", "rooms", "timetable_sessions", "class_recordings", "batches"
    },
    "accounts": {
        "student_fee_summary", "emi_due_this_week", "emis", "payments", "payment_reconciliations",
        "courses", "batch_summary", "action_items"
    }
}

ROLE_BLOCKED_COLUMNS: Dict[str, Set[str]] = {
    "trainer": {
        "fee", "fee_paid", "fee_pending", "total_fee", "amount", "salary", "payout",
        "phone", "phone_raw", "bank_account", "password_hash"
    },
    "counselor": {
        "salary", "payout", "hourly_rate", "password_hash"
    },
    "accounts": {
        "password_hash"
    },
    "owner": {
        "password_hash"
    }
}

ROLE_SCHEMAS: Dict[str, str] = {
    "owner": """
Available Tables & Analytical Views:
- student_fee_summary (student_id, student_name, email, phone, student_status, batch_id, batch_name, course_id, course_name, total_fee, fee_paid, fee_pending, overdue_emis_count, total_overdue_amount)
- student_attendance_30d (student_id, student_name, batch_id, total_sessions_30d, attended_sessions_30d, missed_classes_last_30d, attendance_rate_30d, attendance_rate)
- batch_summary (id, name, course_id, course_name, trainer_id, trainer_name, room_id, room_name, mode, max_capacity, start_date, schedule, status, enrolled_count, active_students_count, seats_remaining, batch_attendance_rate)
- emi_due_this_week (emi_id, student_id, student_name, phone, batch_name, amount, installment_no, total_installments, due_date, status, days_overdue)
- trainer_utilization (id, name, email, specialization, max_hours_per_week, status, active_batches_count, allocated_hours, utilization_pct)
- students (id, name, email, phone, batch_id, enrollment_date, status)
- batches (id, name, course_id, trainer_id, room_id, mode, max_capacity, start_date, schedule, status)
- courses (id, name, code, duration_weeks, fee, category)
- trainers (id, name, email, specialization, max_hours_per_week, status)
- rooms (id, name, capacity)
- emis (id, student_id, amount, installment_no, total_installments, due_date, status, paid_date)
- payments (id, student_id, emi_id, amount, paid_on, method, transaction_ref, notes)
- attendance_records (id, student_id, batch_id, session_date, status, mode, duration_minutes)
- timetable_sessions (id, batch_id, trainer_id, room_id, weekday, start_time, end_time, mode, color_code)
""",
    "counselor": """
Available Tables & Analytical Views:
- student_attendance_30d (student_id, student_name, batch_id, total_sessions_30d, attended_sessions_30d, missed_classes_last_30d, attendance_rate_30d, attendance_rate)
- batch_summary (id, name, course_id, course_name, trainer_id, trainer_name, room_id, room_name, mode, max_capacity, start_date, schedule, status, enrolled_count, active_students_count, seats_remaining, batch_attendance_rate)
- students (id, name, email, phone, batch_id, enrollment_date, status)
- batches (id, name, course_id, trainer_id, room_id, mode, max_capacity, start_date, schedule, status)
- courses (id, name, code, duration_weeks, fee, category)
- trainers (id, name, email, specialization, max_hours_per_week, status)
- attendance_records (id, student_id, batch_id, session_date, status, mode, duration_minutes)
- timetable_sessions (id, batch_id, trainer_id, room_id, weekday, start_time, end_time, mode, color_code)
NOTE: You do NOT have access to payments, salary, or financial ledgers.
""",
    "trainer": """
Available Tables & Analytical Views:
- trainer_safe_students (student_id, name, batch_id, batch_name, course_name, enrollment_date, status, attendance_rate, missed_classes_last_30d)
- batch_summary (id, name, course_id, course_name, trainer_id, trainer_name, room_id, room_name, mode, max_capacity, start_date, schedule, status, enrolled_count, active_students_count, seats_remaining, batch_attendance_rate)
- courses (id, name, code, duration_weeks, category)
- trainers (id, name, email, specialization, max_hours_per_week, status)
- timetable_sessions (id, batch_id, trainer_id, room_id, weekday, start_time, end_time, mode, color_code)
- class_recordings (id, batch_id, topic, recording_date, duration_minutes, source, video_url, thumbnail_url, views_count)
NOTE: You do NOT have access to student fees, EMI installments, phone numbers, or staff salary.
""",
    "accounts": """
Available Tables & Analytical Views:
- student_fee_summary (student_id, student_name, email, phone, student_status, batch_id, batch_name, course_id, course_name, total_fee, fee_paid, fee_pending, overdue_emis_count, total_overdue_amount)
- emi_due_this_week (emi_id, student_id, student_name, phone, batch_name, amount, installment_no, total_installments, due_date, status, days_overdue)
- emis (id, student_id, amount, installment_no, total_installments, due_date, status, paid_date)
- payments (id, student_id, emi_id, amount, paid_on, method, transaction_ref, notes)
- payment_reconciliations (id, emi_id, utr_number, amount, payment_date, status, payer_name, receipt_url)
- courses (id, name, code, duration_weeks, fee, category)
- batch_summary (id, name, course_id, course_name, trainer_id, trainer_name, room_id, room_name, mode, max_capacity, start_date, schedule, status, enrolled_count, active_students_count, seats_remaining, batch_attendance_rate)
NOTE: Detailed class recordings and technical logs are restricted.
"""
}

# -------------------------------------------------------------
# 2. SQLGLOT AST VALIDATOR (Item 2)
# -------------------------------------------------------------
class SecurityViolation(Exception):
    def __init__(self, message: str, layer: str = "ast validator"):
        super().__init__(message)
        self.message = message
        self.layer = layer


def validate_and_format_sql(sql_query: str, role: str) -> str:
    """
    Validates the generated SQL using sqlglot:
    1. Single statement only
    2. Must be a SELECT expression
    3. Whitelist of allowed tables for role
    4. Prohibits UNION, INTO, and write functions
    5. Checks against blocked columns
    6. Enforces LIMIT <= 200
    """
    clean = sql_query.strip()
    # Strip markdown code blocks if present
    if clean.startswith("```"):
        clean = re.sub(r"^```(?:sql)?", "", clean, flags=re.IGNORECASE).strip()
        if clean.endswith("```"):
            clean = clean[:-3].strip()

    try:
        parsed_list = sqlglot.parse(clean, read="postgres")
    except Exception as e:
        raise SecurityViolation(f"SQL syntax could not be parsed: {str(e)}", layer="ast parser")

    if not parsed_list or len(parsed_list) != 1:
        raise SecurityViolation("Rejected: Query must contain exactly one single SQL statement.", layer="ast validator")

    stmt = parsed_list[0]

    # Prohibit UNION (either root node or nested)
    if isinstance(stmt, exp.Union) or stmt.find(exp.Union):
        raise SecurityViolation("Rejected: Compound queries (UNION) are prohibited.", layer="ast validator")

    if not isinstance(stmt, exp.Select):
        raise SecurityViolation("Rejected: Only SELECT queries are permitted.", layer="ast validator")

    # Prohibit SELECT ... INTO
    if stmt.find(exp.Into):
        raise SecurityViolation("Rejected: SELECT INTO operations are prohibited.", layer="ast validator")

    # Prohibit dangerous / write functions
    FORBIDDEN_FUNCS = {
        "pg_sleep", "pg_write_file", "pg_read_file", "dblink",
        "pg_terminate_backend", "pg_cancel_backend", "set_config"
    }
    for func in stmt.find_all(exp.Anonymous, exp.Func):
        if func.name.lower() in FORBIDDEN_FUNCS:
            raise SecurityViolation(f"Rejected: Call to restricted function '{func.name}' is prohibited.", layer="ast validator")

    # Check tables against role whitelist
    allowed_tables = ROLE_ALLOWED_TABLES.get(role, set())
    found_tables = set()
    for t in stmt.find_all(exp.Table):
        t_name = t.name.lower()
        found_tables.add(t_name)
        if t_name not in allowed_tables:
            raise SecurityViolation(
                f"Role '{role}' is not permitted to query table/view '{t_name}'.",
                layer="role view"
            )

    # Check columns against role blocked list
    blocked_cols = ROLE_BLOCKED_COLUMNS.get(role, set())
    for col in stmt.find_all(exp.Column):
        c_name = col.name.lower()
        if c_name in blocked_cols:
            raise SecurityViolation(
                f"Role '{role}' is prohibited from accessing column '{c_name}'.",
                layer="role view"
            )

    # Force LIMIT <= 200
    limit_exp = stmt.args.get("limit")
    if not limit_exp:
        stmt = stmt.limit(200)
    else:
        try:
            val = int(limit_exp.expression.this)
            if val > 200 or val <= 0:
                stmt = stmt.limit(200)
        except Exception:
            stmt = stmt.limit(200)

    return stmt.sql(dialect="postgres")


# -------------------------------------------------------------
# 3. TEXT-TO-SQL PIPELINE WITH GEMINI (Items 1, 3, 4, 5, 6, 8)
# -------------------------------------------------------------
def _is_retryable_gemini_error(exc: Exception) -> bool:
    """Check if exception is a 503 UNAVAILABLE, 429, or timeout error."""
    for attr in ("code", "status_code", "http_status"):
        val = getattr(exc, attr, None)
        if isinstance(val, int) and val in (503, 429):
            return True
        if isinstance(val, str) and val in ("503", "429"):
            return True

    exc_name = exc.__class__.__name__.lower()
    if "timeout" in exc_name or isinstance(exc, TimeoutError):
        return True

    msg = str(exc).upper()
    retry_keywords = ["503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED", "TIMEOUT", "TIMED OUT", "DEADLINE EXCEEDED"]
    if any(k in msg for k in retry_keywords):
        return True

    return False


def _call_gemini_model_with_retries(client: Any, model: str, system_instruction: str, question: str) -> str:
    """Attempt call with model; if 503, 429, or timeout, retry up to 3 times with waits 1s, 2s, 4s."""
    retry_delays = [1.0, 2.0, 4.0]
    max_attempts = 1 + len(retry_delays)  # 1 initial + 3 retries = 4 attempts
    last_exc = None

    for attempt in range(max_attempts):
        try:
            logger.info(f"Invoking Gemini model '{model}' (attempt {attempt + 1}/{max_attempts})")
            gen_response = client.models.generate_content(
                model=model,
                contents=[system_instruction, f"User Question: {question}"],
            )
            return gen_response.text.strip()
        except Exception as e:
            last_exc = e
            if attempt < len(retry_delays) and _is_retryable_gemini_error(e):
                delay = retry_delays[attempt]
                logger.warning(
                    f"Gemini model '{model}' failed with retryable error (attempt {attempt + 1}/{max_attempts}): {e}. Retrying in {delay}s..."
                )
                time.sleep(delay)
            else:
                logger.warning(f"Gemini model '{model}' attempt {attempt + 1} failed: {e}")
                if not _is_retryable_gemini_error(e):
                    break

    raise last_exc


def generate_gemini_sql(api_key: str, system_instruction: str, question: str) -> str:
    """Invoke Gemini model to generate SQL query with retry and fallback model resilience."""
    from google import genai
    client = genai.Client(api_key=api_key)

    primary_model = os.getenv("GEMINI_MODEL", GEMINI_MODEL)
    fallback_model = os.getenv("GEMINI_FALLBACK_MODEL", GEMINI_FALLBACK_MODEL)

    last_error = None
    # 1. Try primary model with up to 3 retries (waits: 1s, 2s, 4s)
    try:
        return _call_gemini_model_with_retries(client, primary_model, system_instruction, question)
    except Exception as e:
        last_error = e
        logger.error(f"Primary Gemini model '{primary_model}' exhausted retries: {e}")

    # 2. Try fallback model if configured and distinct, with same retry rules
    if fallback_model and fallback_model.strip() and fallback_model.strip() != primary_model:
        fallback_model = fallback_model.strip()
        logger.warning(f"Attempting fallback Gemini model '{fallback_model}'...")
        try:
            return _call_gemini_model_with_retries(client, fallback_model, system_instruction, question)
        except Exception as e:
            last_error = e
            logger.error(f"Fallback Gemini model '{fallback_model}' exhausted retries: {e}")

    # 3. Log details to server log and return friendly message
    logger.error(f"All Gemini models and retries exhausted. Raw error details: {last_error}", exc_info=True)
    raise RuntimeError("The AI service is busy right now. Please try again in a moment.")


async def process_copilot_ask(question: str, role: str) -> Dict[str, Any]:
    start_time = time.time()
    q_lower = question.lower().strip()

    # --- INPUT GUARDRAILS ---
    # Detect destructive keywords
    if re.search(r"\b(drop|alter|delete|update|insert|truncate|grant|revoke)\b", q_lower):
        return {
            "status": "blocked",
            "answer": "Destructive or data-modifying queries are prohibited.",
            "columns": [],
            "rows": [],
            "sql": "-- QUERY INTERCEPTED BY NATURAL LANGUAGE INPUT GUARDRAIL",
            "blocked_layer": "input guardrail",
            "blocked_reason": "Destructive SQL operation detected.",
            "row_count": 0,
            "duration_ms": int((time.time() - start_time) * 1000),
            "tables_used": [],
            "can_draft_reminders": False,
        }

    # Detect trainer requesting salary or compensation
    if role == "trainer" and any(k in q_lower for k in ["salary", "payout", "hourly_rate", "compensation", "paid per hour"]):
        return {
            "status": "blocked",
            "answer": "You don't have permission to view faculty compensation or salary records.",
            "columns": [],
            "rows": [],
            "sql": "-- QUERY INTERCEPTED: HR/Payroll Boundary Guardrail",
            "blocked_layer": "role view",
            "blocked_reason": "Role 'trainer' is prohibited from accessing staff compensation and salary details.",
            "row_count": 0,
            "duration_ms": int((time.time() - start_time) * 1000),
            "tables_used": ["trainers.salary (BLOCKED)"],
            "can_draft_reminders": False,
        }

    # Detect trainer requesting financial dues exclusively
    is_finance = any(k in q_lower for k in ["fee", "fees", "emi", "dues", "payment", "revenue", "collected"])
    is_attendance = any(k in q_lower for k in ["attendance", "absent", "missed", "present", "class", "classes"])

    if role == "trainer" and is_finance and not is_attendance:
        return {
            "status": "blocked",
            "answer": "You don't have permission to access fee information. You can view attendance and academic progress for your assigned cohorts.",
            "columns": [],
            "rows": [],
            "sql": "-- QUERY INTERCEPTED: RestrictTrainerFinancialScope",
            "blocked_layer": "role view",
            "blocked_reason": "Role 'trainer' does not have access to fee, payment, or financial records.",
            "row_count": 0,
            "duration_ms": int((time.time() - start_time) * 1000),
            "tables_used": ["emis (BLOCKED)"],
            "can_draft_reminders": False,
        }

    # --- GEMINI CLIENT SETUP (Item 8) ---
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key in ("MY_GEMINI_API_KEY", ""):
        return {
            "status": "error",
            "answer": "GEMINI_API_KEY environment variable is not configured. Text-to-SQL Copilot requires a valid Gemini API key.",
            "columns": [],
            "rows": [],
            "sql": "-- GEMINI_API_KEY is missing from environment",
            "blocked_layer": "api_key",
            "blocked_reason": "GEMINI_API_KEY environment variable is not configured.",
            "row_count": 0,
            "duration_ms": int((time.time() - start_time) * 1000),
            "tables_used": [],
            "can_draft_reminders": False,
        }

    # Prepare role-scoped schema
    role_schema = ROLE_SCHEMAS.get(role, ROLE_SCHEMAS["counselor"])

    system_instruction = (
        f"You are a PostgreSQL Text-to-SQL expert for an educational institute operations platform.\n"
        f"Translate the user's natural language question into a single read-only PostgreSQL SELECT statement.\n\n"
        f"USER ROLE: {role}\n"
        f"STRICT SCHEMA CONTEXT (You can ONLY query tables/views listed here):\n"
        f"{role_schema}\n\n"
        f"RULES:\n"
        f"1. Output ONLY the raw SQL SELECT query. Do NOT include markdown code fences (```), commentary, or explanations.\n"
        f"2. Use ILIKE for string filters (e.g. batch_name ILIKE '%Java%').\n"
        f"3. Use CURRENT_DATE for date relative offsets (e.g. due_date BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE + INTERVAL '7 days').\n"
        f"4. If asking for students with attendance problems and dues, JOIN student_fee_summary with student_attendance_30d and/or emi_due_this_week.\n"
        f"5. Always append LIMIT 200."
    )

    try:
        raw_sql = generate_gemini_sql(api_key, system_instruction, question)
    except Exception as e:
        logger.error(f"[Gemini API Call Failed]: {e}")
        return {
            "status": "error",
            "answer": "The AI service is busy right now. Please try again in a moment.",
            "columns": [],
            "rows": [],
            "sql": "-- Error communicating with Gemini API",
            "blocked_layer": "llm",
            "blocked_reason": "The AI service is busy right now. Please try again in a moment.",
            "row_count": 0,
            "duration_ms": int((time.time() - start_time) * 1000),
            "tables_used": [],
            "can_draft_reminders": False,
        }

    # --- SQLGLOT AST VALIDATION (Item 2) ---
    try:
        validated_sql = validate_and_format_sql(raw_sql, role)
    except SecurityViolation as sv:
        return {
            "status": "blocked",
            "answer": f"Query blocked by {sv.layer}: {sv.message}",
            "columns": [],
            "rows": [],
            "sql": f"-- BLOCKED: {raw_sql}",
            "blocked_layer": sv.layer,
            "blocked_reason": sv.message,
            "row_count": 0,
            "duration_ms": int((time.time() - start_time) * 1000),
            "tables_used": [],
            "can_draft_reminders": False,
        }

    # --- EXECUTE VIA RUN_READONLY_QUERY POSTGRES RPC (Item 3) ---
    sb = get_supabase()
    if not sb:
        return {
            "status": "error",
            "answer": "Database service unavailable. Please configure Supabase credentials.",
            "columns": [],
            "rows": [],
            "sql": validated_sql,
            "blocked_layer": "database",
            "blocked_reason": "Database connection unavailable.",
            "row_count": 0,
            "duration_ms": int((time.time() - start_time) * 1000),
            "tables_used": [],
            "can_draft_reminders": False,
        }

    try:
        rpc_res = sb.rpc("run_readonly_query", {"sql_text": validated_sql}).execute()
        query_rows = rpc_res.data or []
    except Exception as e:
        logger.error(f"[run_readonly_query Execution Error]: {e}")
        return {
            "status": "error",
            "answer": f"Database execution error: {str(e)}",
            "columns": [],
            "rows": [],
            "sql": validated_sql,
            "blocked_layer": "database",
            "blocked_reason": str(e),
            "row_count": 0,
            "duration_ms": int((time.time() - start_time) * 1000),
            "tables_used": [],
            "can_draft_reminders": False,
        }

    # --- FORMAT RESULTS & PLAIN-ENGLISH ANSWER (Item 4 & 5) ---
    columns = list(query_rows[0].keys()) if query_rows else []
    table_rows = [[r.get(c) for c in columns] for r in query_rows]
    duration_ms = int((time.time() - start_time) * 1000)

    # Check if partial redaction applied for trainer
    withheld_note = ""
    status = "ok"
    if role == "trainer" and is_finance:
        withheld_note = " Fee and financial columns were redacted per role permissions."
        status = "partial"

    if query_rows:
        answer = f"Found {len(query_rows)} matching records from live database.{withheld_note}"
    else:
        answer = f"No matching records found for this query in the database.{withheld_note}"

    # --- DRAFT WHATSAPP REMINDERS ACTION (Item 6) ---
    can_draft = False
    generated_actions = []

    # Check if query returned actionable student data (e.g. benchmark query)
    if query_rows and any(k in columns for k in ["student_name", "name"]):
        can_draft = True
        for r in query_rows:
            s_name = r.get("student_name") or r.get("name") or "Student"
            phone = r.get("phone") or r.get("phone_masked") or "98******10"
            amount = r.get("emi_amount") or r.get("amount") or r.get("fee_pending") or 7500
            due_date = r.get("due_date") or time.strftime("%Y-%m-%d")
            missed = r.get("missed_classes_last_30d") or r.get("missed_classes")

            parts = [f"Hi {s_name},"]
            if missed:
                parts.append(f"we noticed you have missed {missed} sessions recently.")
            if amount:
                parts.append(f"Your fee installment of ₹{int(float(amount))} is due on {due_date}.")
            parts.append("Please connect with your mentor to clear dues and retain uninterrupted lab access.")

            generated_actions.append({
                "student_name": s_name,
                "phone_masked": str(phone)[:2] + "******" + str(phone)[-2:] if len(str(phone)) >= 4 else "98******10",
                "message": " ".join(parts),
                "due_date": str(due_date),
            })

        # If user explicitly asked to draft reminders, stage them in action_items automatically
        if "draft" in q_lower or "whatsapp" in q_lower or "reminder" in q_lower:
            try:
                from backend.repository import repo
                await repo.draft_reminders(generated_actions, requester=f"{role.capitalize()} Copilot (Generated)")
                answer += f" Staged {len(generated_actions)} WhatsApp reminders in the Approvals Queue."
            except Exception as e:
                logger.warning(f"[Draft reminders automatic staging error]: {e}")

    return {
        "status": status,
        "answer": answer,
        "columns": columns,
        "rows": table_rows,
        "sql": validated_sql,
        "row_count": len(query_rows),
        "duration_ms": duration_ms,
        "tables_used": list(ROLE_ALLOWED_TABLES.get(role, [])),
        "can_draft_reminders": can_draft,
        "generated_actions": generated_actions if can_draft else None,
        "blocked_layer": "role view" if status == "partial" else None,
        "blocked_reason": "Financial scope restricted" if status == "partial" else None,
    }
