"""
Backend Database Client - Supabase with In-Memory / Local Cache Fallback
"""
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY", "")

_supabase_client = None

def get_supabase():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if SUPABASE_URL and SUPABASE_KEY and "your_supabase" not in SUPABASE_URL:
        try:
            from supabase import create_client, Client
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            print(f"[Supabase] Connected to live Supabase project at {SUPABASE_URL}")
            return _supabase_client
        except Exception as e:
            print(f"[Supabase] Warning: Could not connect to Supabase: {e}. Running local fallback mode.")
            return None
    return None
