"""Endpoints REST de DataCommerce Analytics."""
from __future__ import annotations

from datetime import date
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query

from ..config import settings
from ..database import ping, run_script_query
from ..filters import Filtros, obtener_filtros
from ..services import analytics_service as svc
from ..services.sql_scripts import cargar_consultas

router = APIRouter(prefix="/api")


@router.get("/health", tags=["Sistema"])
def health() -> dict[str, Any]:
    db_ok = ping()
    return {"status": "ok" if db_ok else "degradado", "database": "conectada" if db_ok else "sin conexión",
            "db_name": settings.db_name}


@router.get("/catalogos/filtros", tags=["Catálogos"])
def catalogos() -> dict[str, Any]:
    return svc.catalogos()


@router.get("/dashboard/kpis", tags=["Dashboard"])
def kpis(f: Filtros = Depends(obtener_filtros)) -> dict[str, Any]:
    return svc.kpis(f)


@router.get("/dashboard/ventas-mensuales", tags=["Dashboard"])
def ventas_mensuales(f: Filtros = Depends(obtener_filtros)) -> list[dict[str, Any]]:
    return svc.ventas_mensuales(f)


@router.get("/ciudades/rendimiento", tags=["Geografía"])
def ciudades(f: Filtros = Depends(obtener_filtros)) -> list[dict[str, Any]]:
    return svc.ciudades(f)


@router.get("/vendedores/ranking", tags=["Vendedores"])
def vendedores(f: Filtros = Depends(obtener_filtros)) -> list[dict[str, Any]]:
    return svc.vendedores(f)


@router.get("/categorias/rentabilidad", tags=["Productos"])
def categorias(f: Filtros = Depends(obtener_filtros)) -> list[dict[str, Any]]:
    return svc.categorias(f)


@router.get("/productos/ranking", tags=["Productos"])
def productos(f: Filtros = Depends(obtener_filtros),
              limite: Optional[int] = Query(None, ge=1, le=100)) -> list[dict[str, Any]]:
    return svc.productos(f, limite)


@router.get("/clientes/recurrentes", tags=["Clientes"])
def recurrentes(f: Filtros = Depends(obtener_filtros)) -> list[dict[str, Any]]:
    return svc.recurrentes(f)


@router.get("/clientes/premium", tags=["Clientes"])
def premium(f: Filtros = Depends(obtener_filtros),
            fecha_corte: Optional[date] = Query(None, description="Fecha de corte RFM (por defecto FECHA_CORTE)")
            ) -> dict[str, Any]:
    return svc.premium(f, fecha_corte)


@router.get("/analisis/ejecutivo", tags=["Inteligencia"])
def analisis(f: Filtros = Depends(obtener_filtros)) -> dict[str, Any]:
    return svc.analisis_ejecutivo(f)


@router.get("/consultas", tags=["Consultas SQL"])
def listar_consultas() -> list[dict[str, Any]]:
    return [{k: v for k, v in c.items() if k != "comentario"} for c in cargar_consultas().values()]


@router.get("/consultas/{numero}", tags=["Consultas SQL"])
def ejecutar_consulta(numero: int = Path(..., ge=1, le=10),
                      fecha_corte: Optional[date] = Query(None)) -> dict[str, Any]:
    """Ejecuta literalmente la consulta N del archivo 03_consultas_analiticas.sql
    (sin filtros del dashboard), igual que en MySQL Workbench."""
    consultas = cargar_consultas()
    if numero not in consultas:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    c = consultas[numero]
    corte = fecha_corte or settings.fecha_corte
    filas = run_script_query(c["sql"], [("SET @fecha_corte = %(corte)s", {"corte": corte.isoformat()})])
    return {**c, "fecha_corte": corte.isoformat(), "columnas": list(filas[0].keys()) if filas else [],
            "filas": filas}
