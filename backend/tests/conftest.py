import os
import pytest

os.environ["TESTING"] = "1"
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-key-for-pytest-suite-2026-very-secure")
