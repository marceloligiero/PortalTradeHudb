"""Compatibility shim so tests that import `app.main` find the FastAPI `app`.
This module re-exports the application defined in the project root `main.py`.
"""
from __future__ import annotations

from main import app  # re-export

__all__ = ["app"]
