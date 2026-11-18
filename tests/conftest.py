"""Configuración común de pruebas.

Las pruebas se ejecutan contra la base de datos MySQL REAL configurada en .env
(no se usan datos simulados). Ejecutar desde la raíz del proyecto:

    backend\\.venv\\Scripts\\python -m pytest tests -v
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.config import settings  # noqa: E402
from app.database import DatabaseError, fetch_all, fetch_one, get_connection  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _requiere_mysql():
    try:
        fetch_one("SELECT 1 AS ok")
    except DatabaseError as exc:
        pytest.exit(f"MySQL no disponible ({exc}). Configure .env y ejecute 01_esquema.sql y 02_datos.sql.", returncode=2)


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)


@pytest.fixture
def conn_tx():
    """Conexión en transacción explícita que siempre termina en ROLLBACK."""
    with get_connection() as conn:
        conn.autocommit(False)
        conn.begin()
        try:
            yield conn
        finally:
            conn.rollback()


@pytest.fixture(scope="session")
def total_general() -> float:
    return float(fetch_one(
        "SELECT SUM(cantidad * (precio_unitario - descuento_unitario)) AS t FROM detalle_ventas")["t"])


__all__ = ["settings", "fetch_all", "fetch_one"]
