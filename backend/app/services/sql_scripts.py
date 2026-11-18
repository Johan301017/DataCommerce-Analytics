"""Lectura de las consultas literales de database/03_consultas_analiticas.sql.

Permite ejecutar desde la API exactamente el mismo SQL que se ejecuta en
MySQL Workbench (módulo "Consultas SQL" del dashboard y pruebas automáticas).
"""
from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

from ..config import settings

ARCHIVO = "03_consultas_analiticas.sql"
_MARCADOR = re.compile(r"^-- @consulta:(\d+)\s*$", re.MULTILINE)


@lru_cache(maxsize=1)
def cargar_consultas(ruta: str | None = None) -> dict[int, dict[str, str]]:
    texto = Path(ruta or settings.sql_dir / ARCHIVO).read_text(encoding="utf-8")
    partes = _MARCADOR.split(texto)
    consultas: dict[int, dict[str, str]] = {}
    # partes = [preambulo, n1, cuerpo1, n2, cuerpo2, ...]
    for i in range(1, len(partes), 2):
        numero = int(partes[i])
        cuerpo = partes[i + 1].strip()
        lineas = cuerpo.splitlines()
        comentarios = [l[2:].strip() for l in lineas if l.startswith("--") and not set(l[2:].strip()) <= {"="}]
        sql = "\n".join(l for l in lineas if not l.startswith("--")).strip().rstrip(";").strip()
        titulo = comentarios[0] if comentarios else f"Consulta {numero}"
        descripcion = " ".join(comentarios[1:])
        consultas[numero] = {"numero": numero, "titulo": titulo, "descripcion": descripcion,
                             "sql": sql, "comentario": "\n".join(comentarios)}
    return consultas
