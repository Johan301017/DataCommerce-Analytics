"""Configuración de la aplicación leída desde variables de entorno (.env).

Las credenciales de MySQL NUNCA se escriben en el código: se leen de
variables de entorno o de un archivo .env (raíz del proyecto o carpeta backend).
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent

# Prioridad: variables ya definidas > backend/.env > .env de la raíz
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(PROJECT_DIR / ".env")


def _lista(valor: str) -> list[str]:
    return [v.strip() for v in valor.split(",") if v.strip()]


@dataclass(frozen=True)
class Settings:
    db_host: str = field(default_factory=lambda: os.getenv("DB_HOST", "localhost"))
    db_port: int = field(default_factory=lambda: int(os.getenv("DB_PORT", "3306")))
    db_user: str = field(default_factory=lambda: os.getenv("DB_USER", "root"))
    db_password: str = field(default_factory=lambda: os.getenv("DB_PASSWORD", ""))
    db_name: str = field(default_factory=lambda: os.getenv("DB_NAME", "datacommerce_analytics"))
    fecha_corte: date = field(
        default_factory=lambda: date.fromisoformat(os.getenv("FECHA_CORTE", "2026-11-18"))
    )
    sql_dir: Path = field(
        default_factory=lambda: Path(os.getenv("SQL_DIR", str(PROJECT_DIR / "database")))
    )
    cors_origins: list[str] = field(
        default_factory=lambda: _lista(
            os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173")
        )
    )


settings = Settings()
