"""Capa de acceso a datos: conexión a MySQL mediante PyMySQL.

Todas las consultas se ejecutan con parámetros (%(nombre)s); los valores
proporcionados por el usuario nunca se concatenan dentro del SQL.
"""
from __future__ import annotations

from contextlib import contextmanager
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Iterator

import pymysql
from pymysql.cursors import DictCursor

from .config import settings


class DatabaseError(RuntimeError):
    """Error de comunicación con la base de datos."""


@contextmanager
def get_connection() -> Iterator[pymysql.connections.Connection]:
    try:
        conn = pymysql.connect(
            host=settings.db_host,
            port=settings.db_port,
            user=settings.db_user,
            password=settings.db_password,
            database=settings.db_name,
            charset="utf8mb4",
            cursorclass=DictCursor,
            connect_timeout=5,
            autocommit=True,
        )
    except pymysql.MySQLError as exc:  # pragma: no cover - depende del entorno
        raise DatabaseError(f"No fue posible conectar a MySQL: {exc}") from exc
    try:
        yield conn
    finally:
        conn.close()


def _normalizar(valor: Any) -> Any:
    if isinstance(valor, Decimal):
        return float(valor)
    if isinstance(valor, (date, datetime)):
        return valor.isoformat()
    return valor


def _normalizar_fila(fila: dict[str, Any]) -> dict[str, Any]:
    return {k: _normalizar(v) for k, v in fila.items()}


def fetch_all(sql: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    try:
        with get_connection() as conn, conn.cursor() as cur:
            cur.execute(sql, params or {})
            return [_normalizar_fila(f) for f in cur.fetchall()]
    except pymysql.MySQLError as exc:
        raise DatabaseError(f"Error ejecutando consulta: {exc}") from exc


def fetch_one(sql: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    filas = fetch_all(sql, params)
    return filas[0] if filas else {}


def run_script_query(sql: str, preambulo: list[tuple[str, dict[str, Any]]] | None = None) -> list[dict[str, Any]]:
    """Ejecuta una consulta literal del archivo 03 (sin parámetros) en una sesión
    que primero ejecuta sentencias de preparación (p. ej. SET @fecha_corte)."""
    try:
        with get_connection() as conn, conn.cursor() as cur:
            for sentencia, params in preambulo or []:
                cur.execute(sentencia, params)
            cur.execute(sql)  # sin argumentos: los '%' del SQL se respetan literalmente
            return [_normalizar_fila(f) for f in cur.fetchall()]
    except pymysql.MySQLError as exc:
        raise DatabaseError(f"Error ejecutando consulta: {exc}") from exc


def ping() -> bool:
    try:
        fetch_one("SELECT 1 AS ok")
        return True
    except DatabaseError:
        return False
