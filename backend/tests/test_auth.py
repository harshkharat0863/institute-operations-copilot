"""
Backend authentication, RBAC, 503 DB failure handling, and routing security tests.
"""
import os
import time
import jwt
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-key-for-pytest-suite-2026-very-secure")

from backend.main import app, JWT_SECRET, JWT_ALGORITHM, _login_attempts
from backend.models import UserRole

# Standard demo users for testing
DEMO_PASSWORD_HASH = "$2b$12$DNOOHkoUunYI2h47v74bYeJUtXypfZ.nxEeAvQ6KZ72Q4x2wRDqdO"  # hash for 'password123'

TEST_USERS = [
    {
        "id": "usr_owner_1",
        "name": "Vikramaditya Mehta",
        "email": "owner@institute.org",
        "password_hash": DEMO_PASSWORD_HASH,
        "role": "owner",
    },
    {
        "id": "usr_counselor_1",
        "name": "Anjali Sharma",
        "email": "counselor@institute.org",
        "password_hash": DEMO_PASSWORD_HASH,
        "role": "counselor",
    },
    {
        "id": "usr_trainer_1",
        "name": "Priya Sundaram",
        "email": "priya.trainer@institute.org",
        "password_hash": DEMO_PASSWORD_HASH,
        "role": "trainer",
        "trainer_id": "tr_1",
    },
    {
        "id": "usr_accounts_1",
        "name": "Suresh Iyer",
        "email": "accounts@institute.org",
        "password_hash": DEMO_PASSWORD_HASH,
        "role": "accounts",
    },
]


class MockTableQuery:
    def __init__(self, rows):
        self.rows = rows

    def select(self, *args, **kwargs):
        return self

    def eq(self, col, val):
        matched = [r for r in self.rows if r.get(col) == val]
        return MockTableQuery(matched)

    def order(self, *args, **kwargs):
        return self

    def limit(self, *args, **kwargs):
        return self

    def insert(self, record):
        self.rows.append(record)
        return MockTableQuery([record])

    def update(self, updates):
        for r in self.rows:
            r.update(updates)
        return MockTableQuery(self.rows)

    def delete(self):
        return MockTableQuery([])

    def execute(self):
        class Res:
            def __init__(self, data):
                self.data = data
        return Res(self.rows)


class MockSupabaseClient:
    def __init__(self):
        self.tables = {
            "users": list(TEST_USERS),
            "students": [],
            "batches": [],
            "courses": [],
            "trainers": [],
            "emis": [],
            "payments": [],
            "attendance_records": [],
            "action_items": [],
            "timetable_sessions": [],
            "payment_reconciliations": [],
            "certificates": [],
            "class_recordings": [],
            "dropout_interventions": [],
            "audit_logs": [],
            "query_logs": [],
            "student_fee_summary": [],
            "student_attendance_30d": [],
            "batch_summary": [],
            "emi_due_this_week": [],
            "trainer_utilization": [],
            "trainer_safe_students": [],
        }

    def table(self, table_name: str):
        if table_name not in self.tables:
            self.tables[table_name] = []
        return MockTableQuery(self.tables[table_name])


@pytest.fixture(autouse=True)
def setup_test_env():
    """Reset in-memory login rate limiter before each test."""
    _login_attempts.clear()
    yield
    _login_attempts.clear()


@pytest.fixture
def mock_supabase():
    mock_sb = MockSupabaseClient()
    with patch("backend.repository.get_supabase", return_value=mock_sb):
        yield mock_sb


client = TestClient(app)


def test_supabase_unreachable_returns_503():
    with patch("backend.repository.get_supabase", return_value=None):
        resp = client.post("/auth/login", json={"email": "owner@institute.org", "password": "password123"})
        assert resp.status_code == 503
        assert "Database service unavailable" in resp.json()["detail"]


def test_login_success(mock_supabase):
    resp = client.post("/auth/login", json={"email": "owner@institute.org", "password": "password123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["role"] == "owner"
    assert "password_hash" not in data["user"]


def test_login_wrong_password(mock_supabase):
    resp = client.post("/auth/login", json={"email": "owner@institute.org", "password": "wrongpassword"})
    assert resp.status_code == 401
    assert "Invalid" in resp.json()["detail"]


def test_login_unknown_email_never_defaults_to_owner(mock_supabase):
    resp = client.post("/auth/login", json={"email": "attacker@evil.org", "password": "password123"})
    assert resp.status_code == 401


def test_no_token_request_returns_401():
    resp = client.get("/students")
    assert resp.status_code == 401

    resp_fees = client.get("/fees/emis")
    assert resp_fees.status_code == 401


def test_forged_token_returns_401():
    forged_payload = {
        "id": "usr_owner_1",
        "name": "Forged Owner",
        "email": "owner@institute.org",
        "role": "owner",
        "exp": int(time.time()) + 3600,
    }
    forged_token = jwt.encode(forged_payload, "wrong-secret-key-32-bytes-long-super-secret", algorithm=JWT_ALGORITHM)
    resp = client.get("/students", headers={"Authorization": f"Bearer {forged_token}"})
    assert resp.status_code == 401


def test_unsigned_token_rejected():
    header = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0"
    payload = "eyJpZCI6InVzcl9vd25lcl8xIiwibmFtZSI6IkZha2UiLCJyb2xlIjoib3duZXIifQ"
    unsigned_token = f"{header}.{payload}."
    resp = client.get("/students", headers={"Authorization": f"Bearer {unsigned_token}"})
    assert resp.status_code == 401


def test_expired_token_returns_401():
    expired_payload = {
        "id": "usr_owner_1",
        "name": "Vikramaditya Mehta",
        "email": "owner@institute.org",
        "role": "owner",
        "iat": int(time.time()) - 7200,
        "exp": int(time.time()) - 3600,
    }
    expired_token = jwt.encode(expired_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    resp = client.get("/students", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401
    assert "expired" in resp.json()["detail"].lower()


def test_trainer_blocked_from_fees(mock_supabase):
    # Log in as trainer
    login_resp = client.post(
        "/auth/login",
        json={"email": "priya.trainer@institute.org", "password": "password123"},
    )
    assert login_resp.status_code == 200
    trainer_token = login_resp.json()["token"]

    # Trainer attempts to access fees endpoint -> must return 403
    fees_resp = client.get("/fees/emis", headers={"Authorization": f"Bearer {trainer_token}"})
    assert fees_resp.status_code == 403
    assert "trainer" in fees_resp.json()["detail"].lower()

    # Trainer attempts to mark EMI paid -> must return 403
    pay_resp = client.post("/fees/emis/emi_java_1/pay", headers={"Authorization": f"Bearer {trainer_token}"})
    assert pay_resp.status_code == 403


def test_register_owner_blocked():
    resp = client.post(
        "/auth/register",
        json={
            "name": "Rogue Owner",
            "email": "rogue@institute.org",
            "password": "securepassword123",
            "role": "owner",
        },
    )
    assert resp.status_code == 403


def test_register_duplicate_email_blocked(mock_supabase):
    email = f"newstaff_{int(time.time())}@institute.org"
    payload = {
        "name": "New Counselor",
        "email": email,
        "password": "securepassword123",
        "role": "counselor",
    }
    first = client.post("/auth/register", json=payload)
    assert first.status_code == 200
    assert "password_hash" not in first.json()["user"]

    second = client.post("/auth/register", json=payload)
    assert second.status_code == 409


def test_login_rate_limiting(mock_supabase):
    for _ in range(10):
        resp = client.post("/auth/login", json={"email": "owner@institute.org", "password": "wrong"})
        assert resp.status_code == 401

    # 11th attempt within window must be rate-limited
    blocked = client.post("/auth/login", json={"email": "owner@institute.org", "password": "wrong"})
    assert blocked.status_code == 429


def test_unknown_api_route_returns_404_json():
    resp = client.get("/fees/nonexistent-endpoint")
    assert resp.status_code == 404
    assert resp.headers["content-type"].startswith("application/json")
    assert resp.json()["detail"] == "Not found"
