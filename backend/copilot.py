"""
Natural language text-to-SQL synthesis using Gemini (google-genai) and sqlglot.
Strict multi-tier security: Role-based Schema Scoping, sqlglot AST Validation, and read-only execution.
"""
import os
import re
import time
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from typing import Dict, Any, List, Set, Optional
import sqlglot
from sqlglot import exp
from dotenv import load_dotenv

from backend.db import get_supabase

load_dotenv()
logger = logging.getLogger("institute_ops.copilot")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL")

GEMINI_CALL_TIMEOUT_SECONDS = 20.0
GEMINI_TOTAL_TIMEOUT_BUDGET_SECONDS = 45.0

_gemini_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="gemini_copilot")

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
        "rooms", "attendance_records", "action_items", "timetable_sessions", "certificates", "emi_due_this_week"
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
- emi_due_this_week (emi_id, student_id, student_name, phone, batch_name, amount, installment_no, total_installments, due_date, status, days_overdue)
- batch_summary (id, name, course_id, course_name, trainer_id, trainer_name, room_id, room_name, mode, max_capacity, start_date, schedule, status, enrolled_count, active_students_count, seats_remaining, batch_attendance_rate)
- students (id, name, email, phone, batch_id, enrollment_date, status)
- batches (id, name, course_id, trainer_id, room_id, mode, max_capacity, start_date, schedule, status)
- courses (id, name, code, duration_weeks, fee, category)
- trainers (id, name, email, specialization, max_hours_per_week, status)
- rooms (id, name, capacity)
- attendance_records (id, student_id, batch_id, session_date, status, mode, duration_minutes)
- timetable_sessions (id, batch_id, trainer_id, room_id, weekday, start_time, end_time, mode, color_code)
- certificates (id, student_id, course_id, issue_date, certificate_number, status)
NOTE: You have access to emi_due_this_week for fee counselling. You do NOT have access to payments, emis, payment_reconciliations, student_fee_summary, or staff salary.
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
def _parse_role_table_columns() -> Dict[str, Dict[str, Set[str]]]:
    """Parse ROLE_SCHEMAS text to map role -> table_name -> set of allowed columns."""
    res: Dict[str, Dict[str, Set[str]]] = {}
    for r, text in ROLE_SCHEMAS.items():
        res[r] = {}
        for line in text.splitlines():
            m = re.match(r"^\s*-\s*(\w+)\s*\(([^)]+)\)", line)
            if m:
                t_name = m.group(1).lower().strip()
                cols = {c.strip().lower() for c in m.group(2).split(",") if c.strip()}
                res[r][t_name] = cols
    return res

ROLE_TABLE_COLUMNS: Dict[str, Dict[str, Set[str]]] = _parse_role_table_columns()


def strip_ansi(text: str) -> str:
    """Strips ANSI escape codes (e.g. \x1b[4m, [4m, \x1b[0m, [0m) from text."""
    clean = re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", "", text)
    clean = re.sub(r"\[[0-9]+m", "", clean)
    return clean.strip()


# -------------------------------------------------------------
# 2.1 SAVED QUERY FALLBACK DICTIONARY (Requirement 4)
# -------------------------------------------------------------
SAVED_QUERIES: Dict[str, Dict[str, Any]] = {
    "benchmark_java_attendance_emi": {
        "description": "Java batch students with 3+ missed classes and an EMI due this week",
        "sql": (
            "SELECT att.student_name, e.batch_name, e.phone, att.missed_classes_last_30d, "
            "e.amount AS emi_amount, e.due_date, att.attendance_rate "
            "FROM student_attendance_30d att "
            "JOIN emi_due_this_week e ON att.student_id = e.student_id "
            "WHERE e.batch_name ILIKE '%Java%' AND att.missed_classes_last_30d >= 3 "
            "LIMIT 200"
        ),
        "patterns": [
            r"java.*missed.*(3|three).*emi",
            r"java.*batch.*(missed|absent).*due.*week",
            r"students.*java.*(missed|attendance).*emi.*due",
            r"which students in the java batch have missed three or more classes and have an emi due this week",
        ],
    },
    "emis_due_this_week": {
        "description": "EMIs due this week",
        "sql": (
            "SELECT student_name, batch_name, phone, amount, installment_no, "
            "total_installments, due_date, status, days_overdue "
            "FROM emi_due_this_week "
            "WHERE due_date BETWEEN ((now() AT TIME ZONE 'Asia/Kolkata')::date) "
            "AND (((now() AT TIME ZONE 'Asia/Kolkata')::date) + 7) "
            "LIMIT 200"
        ),
        "patterns": [
            r"^emis?\s+due(\s+this\s+week)?$",
            r"upcoming\s+emis?",
            r"emis?\s+due\s+this\s+week",
            r"fees?\s+due\s+this\s+week",
            r"instal+ments?\s+due\s+this\s+week",
        ],
    },
    "overdue_instalments_java": {
        "description": "Overdue instalments for the Java batch",
        "sql": (
            "SELECT student_name, batch_name, phone, amount, installment_no, "
            "total_installments, due_date, days_overdue "
            "FROM emi_due_this_week "
            "WHERE batch_name ILIKE '%Java%' AND (days_overdue > 0 OR status ILIKE '%overdue%') "
            "LIMIT 200"
        ),
        "patterns": [
            r"overdue\s+(instal+ments?|emis?)\s+for\s+(the\s+)?java\s+batch",
            r"java\s+batch\s+overdue\s+(instal+ments?|emis?)",
            r"overdue.*java",
        ],
    },
    "students_missed_two_consecutive_payments": {
        "description": "Students who missed two consecutive payments",
        "sql": (
            "SELECT student_name, batch_name, phone, student_status, overdue_emis_count, total_overdue_amount "
            "FROM student_fee_summary "
            "WHERE overdue_emis_count >= 2 "
            "LIMIT 200"
        ),
        "patterns": [
            r"students?\s+(who\s+)?missed\s+(two|2)\s+(consecutive\s+)?payments?",
            r"students?\s+with\s+(two|2)\s+overdue\s+(payments?|emis?)",
            r"missed\s+(two|2)\s+consecutive\s+payments?",
            r"missed\s+two\s+payments",
        ],
    },
    "students_falling_behind_low_attendance": {
        "description": "Students falling behind with low attendance",
        "sql": (
            "SELECT student_name, attendance_rate, missed_classes_last_30d, "
            "total_sessions_30d, attended_sessions_30d "
            "FROM student_attendance_30d "
            "WHERE attendance_rate < 75.0 OR missed_classes_last_30d >= 3 "
            "ORDER BY attendance_rate ASC "
            "LIMIT 200"
        ),
        "patterns": [
            r"students?\s+falling\s+behind(\s+with\s+low\s+attendance)?",
            r"students?\s+with\s+low\s+attendance",
            r"low\s+attendance\s+students?",
            r"attendance\s+(below|less\s+than)\s+75",
            r"falling\s+behind.*attendance",
        ],
    },
    "todays_timetable": {
        "description": "Today's timetable",
        "sql": (
            "SELECT t.id, b.name AS batch_name, tr.name AS trainer_name, r.name AS room_name, "
            "t.weekday, t.start_time, t.end_time, t.mode "
            "FROM timetable_sessions t "
            "JOIN batches b ON t.batch_id = b.id "
            "JOIN trainers tr ON t.trainer_id = tr.id "
            "JOIN rooms r ON t.room_id = r.id "
            "WHERE t.weekday = TRIM(TO_CHAR((now() AT TIME ZONE 'Asia/Kolkata')::date, 'Day')) "
            "ORDER BY t.start_time ASC "
            "LIMIT 200"
        ),
        "patterns": [
            r"today'?s?\s+timetable",
            r"timetable\s+for\s+today",
            r"classes\s+today",
            r"sessions\s+today",
            r"schedule\s+for\s+today",
        ],
    },
}


def find_saved_query(question: str) -> Optional[str]:
    """Match natural language question to one of the 6 verified saved queries."""
    q_clean = strip_ansi(question).lower().strip()
    q_norm = re.sub(r"[^\w\s]", " ", q_clean)
    q_norm = re.sub(r"\s+", " ", q_norm).strip()

    for item in SAVED_QUERIES.values():
        for pat in item["patterns"]:
            if re.search(pat, q_norm, re.IGNORECASE) or re.search(pat, q_clean, re.IGNORECASE):
                return item["sql"]
    return None


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
    clean = strip_ansi(sql_query).strip()
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

    # Check that referenced columns exist in the table/view (Column check before execution)
    role_tables_schema = ROLE_TABLE_COLUMNS.get(role, {})
    alias_map: Dict[str, str] = {}
    for t in stmt.find_all(exp.Table):
        t_name = t.name.lower()
        t_alias = t.alias.lower() if t.alias else t_name
        alias_map[t_alias] = t_name

    for col in stmt.find_all(exp.Column):
        c_name = col.name.lower()
        if col.table:
            tbl_ref = col.table.lower()
            actual_table = alias_map.get(tbl_ref, tbl_ref)
            if actual_table in role_tables_schema:
                allowed_cols = role_tables_schema[actual_table]
                if c_name not in allowed_cols:
                    raise SecurityViolation(
                        f"Column '{c_name}' does not exist on table/view '{actual_table}'.",
                        layer="schema validator"
                    )
        elif len(found_tables) == 1:
            single_table = next(iter(found_tables))
            if single_table in role_tables_schema:
                allowed_cols = role_tables_schema[single_table]
                if c_name not in allowed_cols:
                    raise SecurityViolation(
                        f"Column '{c_name}' does not exist on table/view '{single_table}'.",
                        layer="schema validator"
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


def _call_gemini_model_with_retries(
    client: Any,
    model: str,
    system_instruction: str,
    question: str,
    deadline: float,
) -> str:
    """Attempt call with model; if 503, 429, or timeout, retry up to 3 times with waits 1s, 2s, 4s.
    Enforces a 20-second timeout per call and respects total 45-second deadline budget."""
    retry_delays = [1.0, 2.0, 4.0]
    max_attempts = 1 + len(retry_delays)  # 1 initial + 3 retries = 4 attempts
    last_exc = None

    for attempt in range(max_attempts):
        time_remaining = deadline - time.time()
        if time_remaining <= 0.5:
            logger.warning(
                f"Total copilot Gemini deadline reached before attempt {attempt + 1}/{max_attempts} for model '{model}'"
            )
            raise TimeoutError(f"Total time budget of {GEMINI_TOTAL_TIMEOUT_BUDGET_SECONDS}s exhausted")

        call_timeout = min(GEMINI_CALL_TIMEOUT_SECONDS, time_remaining)

        try:
            logger.info(
                f"Invoking Gemini model '{model}' (attempt {attempt + 1}/{max_attempts}, call timeout: {call_timeout:.1f}s)"
            )
            # Submit to thread executor so hung requests fail after call_timeout seconds
            future = _gemini_executor.submit(
                client.models.generate_content,
                model=model,
                contents=[system_instruction, f"User Question: {question}"],
            )
            gen_response = future.result(timeout=call_timeout)
            return gen_response.text.strip()
        except (TimeoutError, FutureTimeoutError) as te:
            last_exc = te
            logger.warning(
                f"Gemini model '{model}' call timed out after {call_timeout:.1f}s (attempt {attempt + 1}/{max_attempts})"
            )
            if attempt < len(retry_delays):
                delay = retry_delays[attempt]
                if time.time() + delay >= deadline - 0.5:
                    logger.warning("Remaining time budget insufficient for subsequent retry delay; terminating retries")
                    break
                logger.info(f"Retrying Gemini call in {delay}s...")
                time.sleep(delay)
            else:
                break
        except Exception as e:
            last_exc = e
            if attempt < len(retry_delays) and _is_retryable_gemini_error(e):
                delay = retry_delays[attempt]
                if time.time() + delay >= deadline - 0.5:
                    logger.warning("Remaining time budget insufficient for subsequent retry delay; terminating retries")
                    break
                logger.warning(
                    f"Gemini model '{model}' failed with retryable error (attempt {attempt + 1}/{max_attempts}): {e}. Retrying in {delay}s..."
                )
                time.sleep(delay)
            else:
                logger.warning(f"Gemini model '{model}' attempt {attempt + 1} failed: {e}")
                if not _is_retryable_gemini_error(e):
                    break

    raise last_exc


def _log_query_attempt(sb: Any, question: str, sql_text: str, role: str, status: str, blocked_reason: Optional[str], blocked_layer: Optional[str], row_count: int, duration_ms: int):
    """Helper to log an attempt to query_logs table."""
    if not sb:
        return
    try:
        import uuid
        sb.table("query_logs").insert({
            "id": str(uuid.uuid4()),
            "question": question,
            "sql": sql_text,
            "role": role,
            "status": status,
            "blocked_reason": blocked_reason,
            "blocked_layer": blocked_layer,
            "row_count": row_count,
            "duration_ms": duration_ms,
        }).execute()
    except Exception as log_err:
        logger.warning(f"[query_logs insert error]: {log_err}")


def repair_gemini_sql(
    api_key: str,
    role_schema: str,
    failed_sql: str,
    error_msg: str,
    deadline: float,
) -> str:
    """Send Gemini the failed SQL, exact error message, and role schema to request a corrected single SELECT."""
    repair_instruction = (
        "You are a PostgreSQL Text-to-SQL expert for an educational institute operations platform.\n"
        "Your previously generated SQL query failed with an error. Please fix the SQL query.\n\n"
        f"STRICT SCHEMA CONTEXT:\n{role_schema}\n\n"
        "RULES:\n"
        "1. Output ONLY the raw corrected SQL SELECT query. Do NOT include markdown code fences (```), commentary, or explanations.\n"
        "2. Only use columns listed for each view. student_attendance_30d has NO batch_name and NO phone. batch_name and phone are in emi_due_this_week; names are in students and batch_summary.\n"
        "3. Always append LIMIT 200.\n"
    )
    repair_prompt = (
        f"The previous SQL query failed:\n"
        f"FAILED SQL:\n{failed_sql}\n\n"
        f"ERROR MESSAGE:\n{error_msg}\n\n"
        f"Please provide the corrected single PostgreSQL SELECT query:"
    )

    from google import genai
    from google.genai import types

    try:
        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=int(GEMINI_CALL_TIMEOUT_SECONDS * 1000)),
        )
    except Exception:
        client = genai.Client(api_key=api_key)

    primary_model = os.getenv("GEMINI_MODEL", GEMINI_MODEL)
    fallback_model = os.getenv("GEMINI_FALLBACK_MODEL", GEMINI_FALLBACK_MODEL)

    try:
        return _call_gemini_model_with_retries(client, primary_model, repair_instruction, repair_prompt, deadline)
    except Exception as e:
        logger.error(f"Primary model repair failed: {e}")
        time_rem = deadline - time.time()
        if (
            fallback_model
            and fallback_model.strip()
            and fallback_model.strip() != primary_model
            and time_rem > 1.0
        ):
            return _call_gemini_model_with_retries(client, fallback_model.strip(), repair_instruction, repair_prompt, deadline)
        raise


def generate_gemini_sql(api_key: str, system_instruction: str, question: str) -> str:
    """Invoke Gemini model to generate SQL query with 20-second per-call timeout, retry, and fallback model resilience
    staying under total ~45-second deadline budget."""
    from google import genai
    from google.genai import types

    # Initialize client with 20-second default request timeout on HTTP layer
    try:
        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=int(GEMINI_CALL_TIMEOUT_SECONDS * 1000)),
        )
    except Exception:
        client = genai.Client(api_key=api_key)

    primary_model = os.getenv("GEMINI_MODEL", GEMINI_MODEL)
    fallback_model = os.getenv("GEMINI_FALLBACK_MODEL", GEMINI_FALLBACK_MODEL)

    start_time = time.time()
    deadline = start_time + GEMINI_TOTAL_TIMEOUT_BUDGET_SECONDS

    last_error = None
    # 1. Try primary model with up to 3 retries (waits: 1s, 2s, 4s)
    try:
        return _call_gemini_model_with_retries(client, primary_model, system_instruction, question, deadline)
    except Exception as e:
        last_error = e
        logger.error(f"Primary Gemini model '{primary_model}' exhausted retries or timed out: {e}")

    # 2. Try fallback model if configured, distinct, and remaining time budget allows
    time_remaining_for_fallback = deadline - time.time()
    if (
        fallback_model
        and fallback_model.strip()
        and fallback_model.strip() != primary_model
        and time_remaining_for_fallback > 1.0
    ):
        fallback_model = fallback_model.strip()
        logger.warning(
            f"Attempting fallback Gemini model '{fallback_model}' (budget remaining: {time_remaining_for_fallback:.1f}s)..."
        )
        try:
            return _call_gemini_model_with_retries(client, fallback_model, system_instruction, question, deadline)
        except Exception as e:
            last_error = e
            logger.error(f"Fallback Gemini model '{fallback_model}' exhausted retries or timed out: {e}")

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
        f"3. DATE RULES (mandatory):\n"
        f"   a. timetable_sessions.weekday is stored as plain text like 'Monday', 'Thursday' (no trailing spaces).\n"
        f"      Always compare it with: TRIM(TO_CHAR(<date_expr>, 'Day'))\n"
        f"      e.g. WHERE weekday = TRIM(TO_CHAR((now() AT TIME ZONE 'Asia/Kolkata')::date, 'Day'))\n"
        f"   b. Always use (now() AT TIME ZONE 'Asia/Kolkata')::date as 'today'.\n"
        f"      tomorrow = (now() AT TIME ZONE 'Asia/Kolkata')::date + 1\n"
        f"      Do NOT use CURRENT_DATE for timetable weekday comparisons.\n"
        f"4. If asking for students with attendance problems and dues, JOIN student_attendance_30d with emi_due_this_week.\n"
        f"   Only use columns listed for each view. student_attendance_30d has NO batch_name and NO phone. batch_name and phone are in emi_due_this_week; names are in students and batch_summary.\n"
        f"   Example for benchmark pattern (students with missed classes and EMI due):\n"
        f"   SELECT e.student_name, e.batch_name, a.missed_classes_last_30d, e.amount AS emi_amount, e.due_date\n"
        f"   FROM student_attendance_30d a\n"
        f"   JOIN emi_due_this_week e ON e.student_id = a.student_id\n"
        f"   WHERE e.batch_name ILIKE '%Java%' AND a.missed_classes_last_30d >= 3\n"
        f"   LIMIT 200\n"
        f"5. Always append LIMIT 200.\n"
        f"6. REFUSALS: If the question asks for data your role cannot access, reply with exactly:\n"
        f"   REFUSE: <short plain-English reason>\n"
        f"   Do NOT output SQL for forbidden data. Do NOT output any other text before REFUSE:."
    )

    deadline = start_time + GEMINI_TOTAL_TIMEOUT_BUDGET_SECONDS
    is_saved_query = False
    sb = get_supabase()

    try:
        raw_sql = generate_gemini_sql(api_key, system_instruction, question)
    except Exception as e:
        logger.error(f"[Gemini API Call Failed]: {e}")
        # --- SAVED QUERY FALLBACK ---
        fallback_sql = find_saved_query(question)
        if fallback_sql:
            logger.info(f"[Saved Query Fallback] Using pre-verified query for: {question[:80]}")
            raw_sql = fallback_sql
            is_saved_query = True
        else:
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

    # --- REFUSE DETECTION ---
    raw_sql_clean = strip_ansi(raw_sql)
    upper_sql = raw_sql_clean.lstrip().upper()
    if not (upper_sql.startswith("SELECT") or upper_sql.startswith("WITH")):
        # Treat anything that doesn't start with SELECT/WITH as a refusal
        refusal_text = raw_sql_clean.strip()
        reason_match = re.match(r"^REFUSE:\s*(.+)", refusal_text, re.IGNORECASE | re.DOTALL)
        if reason_match:
            reason = reason_match.group(1).strip().split("\n")[0]
        else:
            reason = refusal_text.split("\n")[0][:200]
        logger.info(f"[Copilot Refusal] role={role} reason={reason!r}")
        return {
            "status": "blocked",
            "answer": f"This question needs data your role cannot see: {reason}",
            "columns": [],
            "rows": [],
            "sql": "-- REFUSED BY MODEL: permission boundary",
            "blocked_layer": "role view",
            "blocked_reason": reason,
            "row_count": 0,
            "duration_ms": int((time.time() - start_time) * 1000),
            "tables_used": [],
            "can_draft_reminders": False,
        }

    # --- SELF-REPAIR LOOP (Up to 2 repairs within 45s deadline) ---
    max_repairs = 2
    current_sql = raw_sql_clean
    validated_sql = None
    query_rows = None
    last_error_msg = None
    repair_success = False

    for attempt in range(1 + max_repairs):
        # 1. Validate SQL (syntax, single statement, role tables, blocked columns, non-existent columns)
        try:
            validated_sql = validate_and_format_sql(current_sql, role)
        except SecurityViolation as sv:
            last_error_msg = sv.message
            logger.warning(f"[Attempt {attempt + 1}] Validation failed: {sv.message}")
            _log_query_attempt(
                sb=sb,
                question=question,
                sql_text=current_sql,
                role=role,
                status="REPAIR_ATTEMPT" if attempt < max_repairs else "VALIDATION_FAILED",
                blocked_reason=sv.message,
                blocked_layer=sv.layer,
                row_count=0,
                duration_ms=int((time.time() - start_time) * 1000),
            )
            # If forbidden role table or intentional refusal, do not repair if it's an unrepairable role violation
            # but column/table syntax errors are repairable
            if attempt < max_repairs and (deadline - time.time()) > 2.0 and not is_saved_query:
                try:
                    logger.info(f"Triggering Gemini repair attempt {attempt + 1}/{max_repairs} for validation error: {sv.message}")
                    repaired_sql = repair_gemini_sql(
                        api_key=api_key,
                        role_schema=role_schema,
                        failed_sql=current_sql,
                        error_msg=sv.message,
                        deadline=deadline,
                    )
                    current_sql = strip_ansi(repaired_sql)
                    continue
                except Exception as repair_exc:
                    logger.warning(f"Repair call failed: {repair_exc}")
                    break
            else:
                break

        # 2. If validation passed, execute query against database
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
            repair_success = True
            # Log success (or repaired success)
            _log_query_attempt(
                sb=sb,
                question=question,
                sql_text=validated_sql,
                role=role,
                status="SAVED_QUERY" if is_saved_query else ("REPAIRED" if attempt > 0 else "SUCCESS"),
                blocked_reason=None,
                blocked_layer=None,
                row_count=len(query_rows),
                duration_ms=int((time.time() - start_time) * 1000),
            )
            break
        except Exception as db_exc:
            last_error_msg = str(db_exc)
            logger.warning(f"[Attempt {attempt + 1}] DB execution failed: {db_exc}")
            _log_query_attempt(
                sb=sb,
                question=question,
                sql_text=validated_sql,
                role=role,
                status="REPAIR_ATTEMPT" if attempt < max_repairs else "EXECUTION_FAILED",
                blocked_reason=str(db_exc),
                blocked_layer="database",
                row_count=0,
                duration_ms=int((time.time() - start_time) * 1000),
            )
            if attempt < max_repairs and (deadline - time.time()) > 2.0 and not is_saved_query:
                try:
                    logger.info(f"Triggering Gemini repair attempt {attempt + 1}/{max_repairs} for DB error: {db_exc}")
                    repaired_sql = repair_gemini_sql(
                        api_key=api_key,
                        role_schema=role_schema,
                        failed_sql=validated_sql,
                        error_msg=str(db_exc),
                        deadline=deadline,
                    )
                    current_sql = strip_ansi(repaired_sql)
                    continue
                except Exception as repair_exc:
                    logger.warning(f"Repair call failed: {repair_exc}")
                    break
            else:
                break

    # If execution failed or validation failed after exhausting repairs
    if not repair_success:
        # Check if question matches saved query fallback (Item 4)
        saved_fallback = find_saved_query(question)
        if saved_fallback and not is_saved_query:
            logger.info(f"[Saved Query Fallback] Self-repairs exhausted. Using saved query for: {question[:80]}")
            try:
                validated_sql = validate_and_format_sql(saved_fallback, role)
                rpc_res = sb.rpc("run_readonly_query", {"sql_text": validated_sql}).execute()
                query_rows = rpc_res.data or []
                is_saved_query = True
                _log_query_attempt(
                    sb=sb,
                    question=question,
                    sql_text=validated_sql,
                    role=role,
                    status="SAVED_QUERY",
                    blocked_reason=None,
                    blocked_layer=None,
                    row_count=len(query_rows),
                    duration_ms=int((time.time() - start_time) * 1000),
                )
            except Exception as sf_err:
                logger.error(f"[Saved query execution after repairs failed]: {sf_err}")
                query_rows = None

        if query_rows is None:
            # Report failure cleanly
            return {
                "status": "error",
                "answer": f"Database execution error: {last_error_msg or 'Query execution failed after repairs'}",
                "columns": [],
                "rows": [],
                "sql": validated_sql or current_sql,
                "blocked_layer": "database",
                "blocked_reason": last_error_msg,
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

    if is_saved_query:
        saved_note = " AI service unavailable, showing a saved query."
    else:
        saved_note = ""

    if query_rows:
        answer = f"Found {len(query_rows)} matching records from live database.{withheld_note}{saved_note}"
    else:
        answer = f"No matching records found for this query in the database.{withheld_note}{saved_note}"

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
        "saved_query": is_saved_query,
    }
