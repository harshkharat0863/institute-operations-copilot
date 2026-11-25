"""
Tests for Text-to-SQL pipeline, sqlglot AST validation, role scoping, and attack prevention.
"""
import os
import asyncio
import pytest
from unittest.mock import patch, MagicMock

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-key-for-pytest-suite-2026-very-secure")

from backend.copilot import (
    validate_and_format_sql, SecurityViolation, process_copilot_ask,
    strip_ansi, find_saved_query, ROLE_ALLOWED_TABLES,
)


# -------------------------------------------------------------
# 1. SQLGLOT AST VALIDATOR TESTS
# -------------------------------------------------------------
def test_valid_select_query_with_limit_enforced():
    sql = "SELECT s.student_name, s.batch_name FROM student_fee_summary s WHERE s.batch_name ILIKE '%Java%'"
    validated = validate_and_format_sql(sql, role="owner")
    assert "LIMIT 200" in validated
    assert "SELECT" in validated


def test_sqlglot_blocks_union_injection():
    sql = "SELECT name FROM students UNION SELECT password_hash FROM users"
    with pytest.raises(SecurityViolation) as exc:
        validate_and_format_sql(sql, role="owner")
    assert "UNION" in str(exc.value)
    assert exc.value.layer == "ast validator"


def test_sqlglot_blocks_select_into():
    sql = "SELECT name INTO temp_table FROM students"
    with pytest.raises(SecurityViolation) as exc:
        validate_and_format_sql(sql, role="owner")
    assert "SELECT INTO" in str(exc.value)


def test_sqlglot_blocks_ddl_and_multiple_statements():
    sql = "DROP TABLE students; SELECT 1;"
    with pytest.raises(SecurityViolation) as exc:
        validate_and_format_sql(sql, role="owner")
    assert exc.value.layer in ("ast validator", "ast parser")


def test_sqlglot_blocks_forbidden_functions():
    sql = "SELECT pg_sleep(10) FROM students"
    with pytest.raises(SecurityViolation) as exc:
        validate_and_format_sql(sql, role="owner")
    assert "pg_sleep" in str(exc.value)
    assert exc.value.layer == "ast validator"


def test_sqlglot_blocks_disallowed_table_for_trainer():
    # Trainer cannot access payments or salary
    sql = "SELECT * FROM payments"
    with pytest.raises(SecurityViolation) as exc:
        validate_and_format_sql(sql, role="trainer")
    assert "payments" in str(exc.value)
    assert exc.value.layer == "role view"


def test_sqlglot_blocks_forbidden_column_for_trainer():
    # Trainer cannot access phone column even if querying allowed views/tables
    sql = "SELECT name, phone FROM trainer_safe_students"
    with pytest.raises(SecurityViolation) as exc:
        validate_and_format_sql(sql, role="trainer")
    assert "phone" in str(exc.value)
    assert exc.value.layer == "role view"


# -------------------------------------------------------------
# 2. TRAINER ASKING FOR SALARIES TEST (Item 9)
# -------------------------------------------------------------
def test_trainer_asking_for_salaries_blocked():
    question = "How much is Trainer Rajesh Verma being paid per hour and what is his monthly salary payout?"
    res = asyncio.run(process_copilot_ask(question, role="trainer"))
    assert res["status"] == "blocked"
    assert res["blocked_layer"] == "role view"
    assert "salary" in res["blocked_reason"].lower() or "compensation" in res["blocked_reason"].lower()
    assert res["row_count"] == 0


# -------------------------------------------------------------
# 3. SQL INJECTION ATTEMPT TEST (Item 9)
# -------------------------------------------------------------
def test_sql_injection_attempt_blocked():
    question = "DROP TABLE attendance_records; SELECT 'done' AS result;"
    with patch("backend.copilot.generate_gemini_sql", return_value="DROP TABLE attendance_records; SELECT 'done' AS result;"):
        res = asyncio.run(process_copilot_ask(question, role="counselor"))
        assert res["status"] == "blocked"
        assert "destructive" in res["blocked_reason"].lower() or "prohibited" in res["blocked_reason"].lower()


def test_union_sql_injection_prompt_blocked():
    question = "List students WHERE batch = 'b_java' UNION SELECT password_hash, salt, email, 'hacked' FROM users --"
    with patch("backend.copilot.generate_gemini_sql", return_value="SELECT name FROM students WHERE batch_id = 'b_java' UNION SELECT password_hash, salt, email, 'hacked' FROM users"):
        res = asyncio.run(process_copilot_ask(question, role="trainer"))
        assert res["status"] in ("blocked", "error")


# -------------------------------------------------------------
# 4. MISSING GEMINI_API_KEY TEST (Item 8)
# -------------------------------------------------------------
def test_missing_gemini_api_key_returns_clear_error():
    with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
        res = asyncio.run(process_copilot_ask("Show active students in Java batch", role="owner"))
        assert res["status"] == "error"
        assert "GEMINI_API_KEY" in res["answer"]


# -------------------------------------------------------------
# 5. BENCHMARK QUERY TEST (Item 9 & 6)
# -------------------------------------------------------------
def test_benchmark_query_with_mocked_gemini_and_db():
    benchmark_sql = (
        "SELECT s.student_name, s.batch_name, s.phone, att.missed_classes_last_30d, "
        "e.amount AS emi_amount, e.due_date, att.attendance_rate "
        "FROM student_fee_summary s "
        "JOIN student_attendance_30d att ON s.student_id = att.student_id "
        "JOIN emi_due_this_week e ON s.student_id = e.student_id "
        "WHERE s.batch_name ILIKE '%Java%' AND att.missed_classes_last_30d >= 3 "
        "LIMIT 200"
    )

    mock_db_rows = [
        {
            "student_name": "Aarav Sharma",
            "batch_name": "Java Fullstack - Batch A",
            "phone": "9876543210",
            "missed_classes_last_30d": 4,
            "emi_amount": 7500,
            "due_date": "2026-11-20",
            "attendance_rate": 68.0,
        },
        {
            "student_name": "Sneha Patil",
            "batch_name": "Java Fullstack - Batch A",
            "phone": "9723456789",
            "missed_classes_last_30d": 5,
            "emi_amount": 7500,
            "due_date": "2026-11-19",
            "attendance_rate": 61.0,
        },
    ]

    mock_rpc_res = MagicMock()
    mock_rpc_res.data = mock_db_rows

    mock_sb = MagicMock()
    mock_sb.rpc.return_value.execute.return_value = mock_rpc_res

    with patch.dict(os.environ, {"GEMINI_API_KEY": "test-valid-gemini-key"}), \
         patch("backend.copilot.get_supabase", return_value=mock_sb), \
         patch("backend.copilot.generate_gemini_sql", return_value=benchmark_sql):

        question = (
            "Which students in the Java batch have missed three or more classes and have an EMI due this week? "
            "Draft WhatsApp reminders for them."
        )
        res = asyncio.run(process_copilot_ask(question, role="owner"))

        assert res["status"] == "ok"
        assert res["row_count"] == 2
        assert "Aarav Sharma" in str(res["rows"])
        assert "Sneha Patil" in str(res["rows"])
        assert res["can_draft_reminders"] is True
        assert len(res["generated_actions"]) == 2
        assert "Aarav Sharma" == res["generated_actions"][0]["student_name"]
        assert "7500" in res["generated_actions"][0]["message"]
        # Verified run_readonly_query was called
        assert mock_sb.rpc.call_args[0][0] == "run_readonly_query"
        executed_sql = mock_sb.rpc.call_args[0][1]["sql_text"]
        assert "student_fee_summary" in executed_sql
        assert "LIMIT 200" in executed_sql


# -------------------------------------------------------------
# 6. GEMINI RETRY & FALLBACK RESILIENCE TESTS
# -------------------------------------------------------------
def test_gemini_retry_on_503_success():
    """Mock a 503 error on initial call followed by a success on retry."""
    from backend.copilot import generate_gemini_sql

    mock_client = MagicMock()
    mock_success_response = MagicMock(text="SELECT student_name FROM students LIMIT 200")

    mock_client.models.generate_content.side_effect = [
        Exception("503 UNAVAILABLE: The model is overloaded. Please try again later."),
        mock_success_response,
    ]

    with patch("google.genai.Client", return_value=mock_client), \
         patch("time.sleep") as mock_sleep:
        sql = generate_gemini_sql(
            api_key="test-api-key",
            system_instruction="Generate SELECT",
            question="Show all students"
        )

        assert sql == "SELECT student_name FROM students LIMIT 200"
        assert mock_client.models.generate_content.call_count == 2
        mock_sleep.assert_called_once_with(1.0)


def test_gemini_fallback_model_invoked_when_primary_exhausted():
    """When primary model exhausts retries, fallback model is tried."""
    from backend.copilot import generate_gemini_sql

    mock_client = MagicMock()
    mock_fallback_response = MagicMock(text="SELECT batch_name FROM batches LIMIT 200")

    # Primary model fails 4 times (1 initial + 3 retries), fallback succeeds on first attempt
    mock_client.models.generate_content.side_effect = [
        Exception("503 UNAVAILABLE"),
        Exception("503 UNAVAILABLE"),
        Exception("503 UNAVAILABLE"),
        Exception("503 UNAVAILABLE"),
        mock_fallback_response,
    ]

    with patch.dict(os.environ, {"GEMINI_MODEL": "gemini-2.5-flash", "GEMINI_FALLBACK_MODEL": "gemini-1.5-flash"}), \
         patch("google.genai.Client", return_value=mock_client), \
         patch("time.sleep") as mock_sleep:

        sql = generate_gemini_sql(
            api_key="test-api-key",
            system_instruction="Generate SELECT",
            question="List batches"
        )

        assert sql == "SELECT batch_name FROM batches LIMIT 200"
        # 4 calls for primary + 1 call for fallback = 5 calls total
        assert mock_client.models.generate_content.call_count == 5
        # Delays for 3 primary retries: 1.0, 2.0, 4.0
        assert mock_sleep.call_count == 3
        mock_sleep.assert_any_call(1.0)
        mock_sleep.assert_any_call(2.0)
        mock_sleep.assert_any_call(4.0)


def test_gemini_all_retries_fail_returns_friendly_message():
    """When all retries fail, user receives friendly message without raw Google error text."""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("503 UNAVAILABLE: Backend server cluster failure")

    with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), \
         patch("google.genai.Client", return_value=mock_client), \
         patch("time.sleep"):

        res = asyncio.run(process_copilot_ask("Show all students", role="owner"))
        assert res["status"] == "error"
        assert res["answer"] == "The AI service is busy right now. Please try again in a moment."
        assert "Backend server cluster failure" not in res["answer"]


def test_gemini_hung_call_times_out_and_retries():
    """A hung Gemini call times out and moves to retry instead of waiting indefinitely."""
    import threading
    from backend.copilot import generate_gemini_sql

    mock_client = MagicMock()
    mock_success_response = MagicMock(text="SELECT student_name FROM students LIMIT 200")

    call_count = 0
    def mock_generate_content(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            # Block the worker thread for 0.5s so 0.05s call timeout triggers
            threading.Event().wait(0.5)
            return MagicMock(text="late response")
        return mock_success_response

    mock_client.models.generate_content.side_effect = mock_generate_content

    with patch("backend.copilot.GEMINI_CALL_TIMEOUT_SECONDS", 0.05), \
         patch("google.genai.Client", return_value=mock_client), \
         patch("time.sleep") as mock_sleep:

        sql = generate_gemini_sql(
            api_key="test-api-key",
            system_instruction="Generate SELECT",
            question="Show students"
        )

        assert sql == "SELECT student_name FROM students LIMIT 200"
        assert call_count == 2
        mock_sleep.assert_called_once_with(1.0)


def test_gemini_total_timeout_budget_enforced():
    """When the total 45-second deadline budget is exhausted, retries stop and friendly error is returned."""
    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = Exception("503 UNAVAILABLE")

    # Set total budget to 0.01 seconds so it immediately trips
    with patch("backend.copilot.GEMINI_TOTAL_TIMEOUT_BUDGET_SECONDS", 0.01), \
         patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), \
         patch("google.genai.Client", return_value=mock_client), \
         patch("time.sleep"):

        res = asyncio.run(process_copilot_ask("Show all students", role="owner"))
        assert res["status"] == "error"
        assert res["answer"] == "The AI service is busy right now. Please try again in a moment."


# -------------------------------------------------------------
# 7. COUNSELOR PERMISSIONS TESTS
# -------------------------------------------------------------
def test_counselor_can_access_emi_due_this_week():
    """Counselor role should be able to query emi_due_this_week (new permission)."""
    assert "emi_due_this_week" in ROLE_ALLOWED_TABLES["counselor"]


def test_counselor_blocked_from_payments():
    """Counselor must NOT access payments, emis, payment_reconciliations, or student_fee_summary."""
    for table in ("payments", "emis", "payment_reconciliations", "student_fee_summary"):
        assert table not in ROLE_ALLOWED_TABLES["counselor"], (
            f"Table '{table}' should be blocked for counselor"
        )


def test_counselor_can_validate_emi_due_this_week_sql():
    """SQL querying emi_due_this_week validates successfully for counselor role."""
    sql = (
        "SELECT student_name, batch_name, phone, amount, due_date, status "
        "FROM emi_due_this_week LIMIT 200"
    )
    validated = validate_and_format_sql(sql, role="counselor")
    assert "emi_due_this_week" in validated
    assert "LIMIT 200" in validated


def test_counselor_blocked_from_student_fee_summary():
    """Counselor cannot query student_fee_summary."""
    sql = "SELECT student_name, fee_pending FROM student_fee_summary LIMIT 200"
    with pytest.raises(SecurityViolation) as exc:
        validate_and_format_sql(sql, role="counselor")
    assert "student_fee_summary" in str(exc.value)
    assert exc.value.layer == "role view"


def test_benchmark_java_batch_works_as_counselor():
    """Benchmark question (Java batch, 3+ missed, EMI due this week) works for counselor."""
    benchmark_sql = (
        "SELECT att.student_name, e.batch_name, e.phone, att.missed_classes_last_30d, "
        "e.amount AS emi_amount, e.due_date, att.attendance_rate "
        "FROM student_attendance_30d att "
        "JOIN emi_due_this_week e ON att.student_id = e.student_id "
        "WHERE e.batch_name ILIKE '%Java%' AND att.missed_classes_last_30d >= 3 "
        "LIMIT 200"
    )
    mock_db_rows = [
        {
            "student_name": "Priya Mehta",
            "batch_name": "Java Fullstack - Batch B",
            "phone": "9812345678",
            "missed_classes_last_30d": 4,
            "emi_amount": 8000,
            "due_date": "2026-11-28",
            "attendance_rate": 65.0,
        }
    ]
    mock_rpc_res = MagicMock()
    mock_rpc_res.data = mock_db_rows
    mock_sb = MagicMock()
    mock_sb.rpc.return_value.execute.return_value = mock_rpc_res

    with patch.dict(os.environ, {"GEMINI_API_KEY": "test-valid-gemini-key"}), \
         patch("backend.copilot.get_supabase", return_value=mock_sb), \
         patch("backend.copilot.generate_gemini_sql", return_value=benchmark_sql):

        question = (
            "Which students in the Java batch have missed three or more classes "
            "and have an EMI due this week?"
        )
        res = asyncio.run(process_copilot_ask(question, role="counselor"))

        assert res["status"] == "ok"
        assert res["row_count"] == 1
        assert "Priya Mehta" in str(res["rows"])
        executed_sql = mock_sb.rpc.call_args[0][1]["sql_text"]
        assert "emi_due_this_week" in executed_sql
        assert "student_attendance_30d" in executed_sql
        assert "LIMIT 200" in executed_sql


# -------------------------------------------------------------
# 8. REFUSAL & ANSI STRIPPING TESTS
# -------------------------------------------------------------
def test_strip_ansi_clears_escape_codes():
    """strip_ansi should remove both \\x1b[Nm and bare [Nm sequences."""
    from backend.copilot import strip_ansi
    raw = "\x1b[4mREFUSE:\x1b[0m trainer cannot view salary"
    assert strip_ansi(raw) == "REFUSE: trainer cannot view salary"
    raw2 = "[4mREFUSE:[0m trainer cannot view salary"
    assert strip_ansi(raw2) == "REFUSE: trainer cannot view salary"


def test_model_refusal_returns_blocked_not_syntax_error():
    """When model outputs REFUSE: ..., status is 'blocked' with clean message, not 'ast parser'."""
    # Use a counselor role with a question that passes all pre-Gemini guardrails
    # but the mocked model refuses
    with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), \
         patch("backend.copilot.generate_gemini_sql",
               return_value="REFUSE: payment ledger data is restricted for counselor role"):

        res = asyncio.run(process_copilot_ask(
            "Show me detailed payment ledger for all students", role="counselor"
        ))
        assert res["status"] == "blocked"
        assert "payment ledger data is restricted" in res["answer"]
        assert res["blocked_layer"] == "role view"
        # Must NOT contain ast parser wording
        assert "ast parser" not in res["answer"].lower()
        assert "syntax" not in res["answer"].lower()


def test_model_refusal_with_ansi_stripped():
    """ANSI escape codes in model refusal text are stripped before showing to user."""
    ansi_refusal = "\x1b[4mREFUSE:\x1b[0m this data is off-limits for your role"

    with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), \
         patch("backend.copilot.generate_gemini_sql", return_value=ansi_refusal):

        res = asyncio.run(process_copilot_ask(
            "Show all salary payouts", role="counselor"
        ))
        assert res["status"] == "blocked"
        assert "\x1b" not in res["answer"]
        assert "[4m" not in res["answer"]
        assert "off-limits" in res["answer"]


def test_non_select_output_treated_as_refusal():
    """Any model output not starting with SELECT or WITH is treated as a refusal."""
    with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), \
         patch("backend.copilot.generate_gemini_sql",
               return_value="Sorry, I cannot provide that information."):

        res = asyncio.run(process_copilot_ask(
            "Show employee bank account numbers", role="counselor"
        ))
        assert res["status"] == "blocked"
        assert res["blocked_layer"] == "role view"
        assert "ast parser" not in res["answer"].lower()


# -------------------------------------------------------------
# 9. DATE RULES & TIMETABLE TESTS
# -------------------------------------------------------------
def test_timetable_weekday_uses_trim_to_char():
    """SQL for today's timetable must use TRIM(TO_CHAR(...)) not a bare weekday string."""
    timetable_sql = (
        "SELECT t.id, b.name AS batch_name, t.weekday, t.start_time, t.end_time "
        "FROM timetable_sessions t "
        "JOIN batches b ON t.batch_id = b.id "
        "WHERE t.weekday = TRIM(TO_CHAR((now() AT TIME ZONE 'Asia/Kolkata')::date, 'Day')) "
        "ORDER BY t.start_time ASC LIMIT 200"
    )
    validated = validate_and_format_sql(timetable_sql, role="counselor")
    assert "TRIM" in validated.upper()
    assert "TO_CHAR" in validated.upper()
    assert "Asia/Kolkata" in validated


def test_tomorrow_timetable_uses_trim_to_char():
    """SQL for tomorrow's timetable must use TRIM(TO_CHAR(... + 1, 'Day'))."""
    tomorrow_sql = (
        "SELECT t.id, b.name AS batch_name, t.weekday, t.start_time, t.end_time "
        "FROM timetable_sessions t "
        "JOIN batches b ON t.batch_id = b.id "
        "WHERE t.weekday = TRIM(TO_CHAR((now() AT TIME ZONE 'Asia/Kolkata')::date + 1, 'Day')) "
        "ORDER BY t.start_time ASC LIMIT 200"
    )
    validated = validate_and_format_sql(tomorrow_sql, role="trainer")
    assert "TRIM" in validated.upper()
    assert "TO_CHAR" in validated.upper()
    assert "+ 1" in validated or "+1" in validated


def test_tomorrow_question_produces_trim_to_char_via_saved_query():
    """The 'tomorrow timetable' question still produces valid SQL (not saved query, but validates rules)."""
    # This checks that the today timetable saved query contains TRIM(TO_CHAR(...))
    # and that the saved query passes validation for trainer role
    from backend.copilot import SAVED_QUERIES, validate_and_format_sql
    todays_sql = SAVED_QUERIES["todays_timetable"]["sql"]
    assert "TRIM(TO_CHAR" in todays_sql
    assert "Asia/Kolkata" in todays_sql
    validated = validate_and_format_sql(todays_sql, role="trainer")
    assert "TRIM" in validated.upper()


# -------------------------------------------------------------
# 10. SAVED QUERY FALLBACK TESTS
# -------------------------------------------------------------
def test_find_saved_query_benchmark_match():
    """The benchmark question matches the saved benchmark query."""
    sql = find_saved_query(
        "Which students in the Java batch have missed three or more classes and have an EMI due this week?"
    )
    assert sql is not None
    assert "student_attendance_30d" in sql
    assert "emi_due_this_week" in sql
    assert "Java" in sql
    assert "LIMIT 200" in sql


def test_find_saved_query_todays_timetable():
    """'today's timetable' matches saved query and uses TRIM(TO_CHAR(...))."""
    sql = find_saved_query("Show today's timetable")
    assert sql is not None
    assert "TRIM(TO_CHAR" in sql
    assert "Asia/Kolkata" in sql


def test_find_saved_query_low_attendance():
    """'students falling behind' matches attendance saved query."""
    sql = find_saved_query("Show students falling behind with low attendance")
    assert sql is not None
    assert "student_attendance_30d" in sql
    assert "attendance_rate" in sql


def test_find_saved_query_no_match():
    """Completely unrelated question returns None (no saved query)."""
    sql = find_saved_query("What is the weather in Mumbai today?")
    assert sql is None


def test_saved_query_fallback_used_when_gemini_fails():
    """When Gemini is unavailable, saved query fallback runs for a known question."""
    mock_db_rows = [
        {"student_name": "Riya Sharma", "batch_name": "Java", "phone": "9900001111",
         "missed_classes_last_30d": 4, "emi_amount": 7500, "due_date": "2026-11-25",
         "attendance_rate": 62.0}
    ]
    mock_rpc_res = MagicMock()
    mock_rpc_res.data = mock_db_rows
    mock_sb = MagicMock()
    mock_sb.rpc.return_value.execute.return_value = mock_rpc_res

    with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), \
         patch("backend.copilot.generate_gemini_sql",
               side_effect=RuntimeError("The AI service is busy right now. Please try again in a moment.")), \
         patch("backend.copilot.get_supabase", return_value=mock_sb):

        question = "Which students in the Java batch have missed three or more classes and have an EMI due this week?"
        res = asyncio.run(process_copilot_ask(question, role="counselor"))

        assert res["status"] == "ok"
        assert "saved query" in res["answer"].lower()
        assert res["row_count"] == 1
        assert mock_sb.rpc.called


def test_saved_query_fallback_not_used_for_unknown_questions():
    """When Gemini fails for a question with no saved query, return friendly error."""
    with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), \
         patch("backend.copilot.generate_gemini_sql",
               side_effect=RuntimeError("The AI service is busy right now. Please try again in a moment.")):

        res = asyncio.run(process_copilot_ask(
            "Show me students who have never attended a session at all", role="owner"
        ))
        assert res["status"] == "error"
        assert "busy" in res["answer"].lower()


def test_saved_queries_all_pass_validation():
    """All 6 saved queries must pass sqlglot validation for at least one appropriate role."""
    from backend.copilot import SAVED_QUERIES, validate_and_format_sql
    # Map each query key to a role that should be allowed to run it
    role_map = {
        "benchmark_java_attendance_emi": "counselor",
        "emis_due_this_week": "counselor",
        "overdue_instalments_java": "counselor",
        "students_missed_two_consecutive_payments": "owner",
        "students_falling_behind_low_attendance": "counselor",
        "todays_timetable": "trainer",
    }
    for key, role in role_map.items():
        sql = SAVED_QUERIES[key]["sql"]
        validated = validate_and_format_sql(sql, role=role)
        assert "SELECT" in validated, f"Saved query '{key}' did not produce valid SELECT"
        assert "LIMIT 200" in validated, f"Saved query '{key}' missing LIMIT 200"