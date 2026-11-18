"""Filtros globales del dashboard y construcción segura de la cláusula WHERE."""
from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import date
from typing import Any, Optional

from fastapi import HTTPException, Query


@dataclass(frozen=True)
class Filtros:
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    ciudad_id: Optional[int] = None
    vendedor_id: Optional[int] = None
    categoria_id: Optional[int] = None

    @property
    def tiene_fechas(self) -> bool:
        return self.fecha_inicio is not None or self.fecha_fin is not None

    def con_periodo(self, inicio: Optional[date], fin: Optional[date]) -> "Filtros":
        return replace(self, fecha_inicio=inicio, fecha_fin=fin)

    def where(self) -> tuple[str, dict[str, Any]]:
        """Devuelve (cláusula WHERE, parámetros). Alias esperados:
        v = ventas, dv = detalle_ventas, p = productos."""
        condiciones: list[str] = []
        params: dict[str, Any] = {}
        if self.fecha_inicio is not None:
            condiciones.append("v.fecha_venta >= %(fecha_inicio)s")
            params["fecha_inicio"] = self.fecha_inicio
        if self.fecha_fin is not None:
            condiciones.append("v.fecha_venta <= %(fecha_fin)s")
            params["fecha_fin"] = self.fecha_fin
        if self.ciudad_id is not None:
            condiciones.append("v.id_ciudad = %(ciudad_id)s")
            params["ciudad_id"] = self.ciudad_id
        if self.vendedor_id is not None:
            condiciones.append("v.id_vendedor = %(vendedor_id)s")
            params["vendedor_id"] = self.vendedor_id
        if self.categoria_id is not None:
            condiciones.append("p.id_categoria = %(categoria_id)s")
            params["categoria_id"] = self.categoria_id
        clausula = ("WHERE " + " AND ".join(condiciones)) if condiciones else ""
        return clausula, params


def obtener_filtros(
    fecha_inicio: Optional[date] = Query(None, description="Fecha inicial (AAAA-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Fecha final (AAAA-MM-DD)"),
    ciudad_id: Optional[int] = Query(None, ge=1, description="Ciudad donde ocurrió la venta"),
    vendedor_id: Optional[int] = Query(None, ge=1),
    categoria_id: Optional[int] = Query(None, ge=1),
) -> Filtros:
    if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
        raise HTTPException(status_code=422, detail="fecha_inicio no puede ser posterior a fecha_fin")
    return Filtros(fecha_inicio, fecha_fin, ciudad_id, vendedor_id, categoria_id)
