"""Repositorio analítico: SQL parametrizado equivalente a database/03_consultas_analiticas.sql,
extendido con los filtros globales del dashboard.

Definiciones (idénticas a las del script 03):
  ingreso_neto = cantidad * (precio_unitario - descuento_unitario)
  costo        = cantidad * costo_unitario
  utilidad     = ingreso_neto - costo
  transacción  = factura distinta (COUNT(DISTINCT v.id_venta))
"""
from __future__ import annotations

from datetime import date
from typing import Any

from ..database import fetch_all, fetch_one
from ..filters import Filtros

INGRESO = "dv.cantidad * (dv.precio_unitario - dv.descuento_unitario)"
COSTO = "dv.cantidad * dv.costo_unitario"
UTILIDAD = "dv.cantidad * (dv.precio_unitario - dv.descuento_unitario - dv.costo_unitario)"

BASE_FROM = """
FROM ventas v
INNER JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
INNER JOIN productos p       ON p.id_producto = dv.id_producto
"""


def totales(f: Filtros) -> dict[str, Any]:
    where, params = f.where()
    sql = f"""
        SELECT
            COALESCE(SUM({INGRESO}), 0)   AS ingresos,
            COALESCE(SUM({COSTO}), 0)     AS costos,
            COALESCE(SUM({UTILIDAD}), 0)  AS utilidad,
            COUNT(DISTINCT v.id_venta)    AS transacciones,
            COUNT(DISTINCT v.id_cliente)  AS clientes,
            COALESCE(SUM(dv.cantidad), 0) AS unidades
        {BASE_FROM}
        {where}
    """
    return fetch_one(sql, params)


def rango_fechas() -> dict[str, Any]:
    return fetch_one("SELECT MIN(fecha_venta) AS minima, MAX(fecha_venta) AS maxima FROM ventas")


def ventas_mensuales(f: Filtros) -> list[dict[str, Any]]:
    where, params = f.where()
    sql = f"""
        SELECT
            YEAR(v.fecha_venta)           AS anio,
            MONTH(v.fecha_venta)          AS mes,
            COUNT(DISTINCT v.id_venta)    AS num_ventas,
            SUM({INGRESO})                AS ingresos,
            SUM({COSTO})                  AS costos,
            SUM({UTILIDAD})               AS utilidad,
            SUM(dv.cantidad)              AS unidades
        {BASE_FROM}
        {where}
        GROUP BY YEAR(v.fecha_venta), MONTH(v.fecha_venta)
        ORDER BY anio, mes
    """
    return fetch_all(sql, params)


def rendimiento_ciudades(f: Filtros) -> list[dict[str, Any]]:
    where, params = f.where()
    sql = f"""
        SELECT
            c.id_ciudad, c.nombre AS ciudad, c.departamento, c.latitud, c.longitud,
            COUNT(DISTINCT v.id_venta)   AS num_ventas,
            COUNT(DISTINCT v.id_cliente) AS num_clientes,
            SUM(dv.cantidad)             AS unidades,
            SUM({INGRESO})               AS ingresos,
            SUM({COSTO})                 AS costos,
            SUM({UTILIDAD})              AS utilidad
        {BASE_FROM}
        INNER JOIN ciudades c ON c.id_ciudad = v.id_ciudad
        {where}
        GROUP BY c.id_ciudad, c.nombre, c.departamento, c.latitud, c.longitud
        ORDER BY ingresos DESC
    """
    return fetch_all(sql, params)


def ranking_vendedores(f: Filtros) -> list[dict[str, Any]]:
    where, params = f.where()
    sql = f"""
        SELECT
            ve.id_vendedor, ve.nombre, ci.nombre AS ciudad_asignada, ve.fecha_contratacion,
            COUNT(DISTINCT v.id_venta)   AS num_ventas,
            COUNT(DISTINCT v.id_cliente) AS num_clientes,
            SUM(dv.cantidad)             AS unidades,
            SUM({INGRESO})               AS ingresos,
            SUM({COSTO})                 AS costos,
            SUM({UTILIDAD})              AS utilidad
        {BASE_FROM}
        INNER JOIN vendedores ve ON ve.id_vendedor = v.id_vendedor
        INNER JOIN ciudades ci   ON ci.id_ciudad = ve.id_ciudad_asignada
        {where}
        GROUP BY ve.id_vendedor, ve.nombre, ci.nombre, ve.fecha_contratacion
        ORDER BY ingresos DESC
    """
    return fetch_all(sql, params)


def rentabilidad_categorias(f: Filtros) -> list[dict[str, Any]]:
    where, params = f.where()
    sql = f"""
        SELECT
            cat.id_categoria, cat.nombre AS categoria,
            COUNT(DISTINCT v.id_venta) AS num_ventas,
            SUM(dv.cantidad)           AS unidades,
            SUM({INGRESO})             AS ingresos_netos,
            SUM({COSTO})               AS costos,
            SUM({UTILIDAD})            AS utilidad
        {BASE_FROM}
        INNER JOIN categorias cat ON cat.id_categoria = p.id_categoria
        {where}
        GROUP BY cat.id_categoria, cat.nombre
        ORDER BY utilidad DESC
    """
    return fetch_all(sql, params)


def ranking_productos(f: Filtros) -> list[dict[str, Any]]:
    where, params = f.where()
    sql = f"""
        SELECT
            p.id_producto, p.codigo_sku AS sku, p.nombre, cat.nombre AS categoria, p.activo,
            p.precio_lista,
            COUNT(DISTINCT v.id_venta) AS num_ventas,
            SUM(dv.cantidad)           AS unidades,
            SUM({INGRESO})             AS ingresos,
            SUM({COSTO})               AS costos,
            SUM({UTILIDAD})            AS utilidad
        {BASE_FROM}
        INNER JOIN categorias cat ON cat.id_categoria = p.id_categoria
        {where}
        GROUP BY p.id_producto, p.codigo_sku, p.nombre, cat.nombre, p.activo, p.precio_lista
        ORDER BY ingresos DESC
    """
    return fetch_all(sql, params)


def clientes_recurrentes(f: Filtros) -> list[dict[str, Any]]:
    where, params = f.where()
    sql = f"""
        SELECT
            cl.id_cliente, cl.nombre, ci.nombre AS ciudad,
            COUNT(DISTINCT v.id_venta) AS num_compras,
            SUM({INGRESO})             AS ingresos,
            MIN(v.fecha_venta)         AS primera_compra,
            MAX(v.fecha_venta)         AS ultima_compra
        {BASE_FROM}
        INNER JOIN clientes cl ON cl.id_cliente = v.id_cliente
        INNER JOIN ciudades ci ON ci.id_ciudad = cl.id_ciudad
        {where}
        GROUP BY cl.id_cliente, cl.nombre, ci.nombre
        HAVING COUNT(DISTINCT v.id_venta) > 1
        ORDER BY num_compras DESC, ingresos DESC
    """
    return fetch_all(sql, params)


def segmentacion_rfm(f: Filtros, fecha_corte: date) -> list[dict[str, Any]]:
    """Consulta 10 (RFM) parametrizada con filtros y fecha de corte."""
    where, params = f.where()
    extra = "v.fecha_venta <= %(fecha_corte)s"
    where = f"{where} AND {extra}" if where else f"WHERE {extra}"
    params = {**params, "fecha_corte": fecha_corte}
    sql = f"""
        WITH compras_cliente AS (
            SELECT
                v.id_cliente,
                COUNT(DISTINCT v.id_venta) AS frecuencia,
                SUM({INGRESO})             AS monetario,
                MAX(v.fecha_venta)         AS ultima_compra
            {BASE_FROM}
            {where}
            GROUP BY v.id_cliente
        ),
        rfm AS (
            SELECT cc.*,
                   DATEDIFF(%(fecha_corte)s, cc.ultima_compra)  AS recencia_dias,
                   PERCENT_RANK() OVER (ORDER BY cc.monetario)  AS percentil_gasto
            FROM compras_cliente cc
        ),
        puntaje AS (
            SELECT r.*,
                   (r.frecuencia >= 3) + (r.recencia_dias <= 180) + (r.percentil_gasto >= 0.75)
                       AS criterios_cumplidos
            FROM rfm r
        )
        SELECT
            cl.id_cliente, cl.documento, cl.nombre, ci.nombre AS ciudad,
            pu.frecuencia                          AS num_compras,
            pu.monetario                           AS ingresos,
            ROUND(pu.monetario / pu.frecuencia, 2) AS ticket_promedio,
            pu.ultima_compra,
            pu.recencia_dias                       AS dias_desde_ultima,
            ROUND(pu.percentil_gasto * 100, 1)     AS percentil_gasto,
            (pu.frecuencia >= 3)                   AS cumple_frecuencia,
            (pu.recencia_dias <= 180)              AS cumple_recencia,
            (pu.percentil_gasto >= 0.75)           AS cumple_monetario,
            pu.criterios_cumplidos,
            CASE pu.criterios_cumplidos
                WHEN 3 THEN 'Premium'
                WHEN 2 THEN 'Potencial premium'
                ELSE 'Regular'
            END AS segmento
        FROM puntaje pu
        INNER JOIN clientes cl ON cl.id_cliente = pu.id_cliente
        INNER JOIN ciudades ci ON ci.id_ciudad = cl.id_ciudad
        ORDER BY pu.criterios_cumplidos DESC, pu.monetario DESC
    """
    return fetch_all(sql, params)


def total_clientes_registrados() -> int:
    return int(fetch_one("SELECT COUNT(*) AS n FROM clientes")["n"])


def catalogos() -> dict[str, list[dict[str, Any]]]:
    return {
        "ciudades": fetch_all("SELECT id_ciudad AS id, nombre FROM ciudades ORDER BY nombre"),
        "vendedores": fetch_all("SELECT id_vendedor AS id, nombre FROM vendedores ORDER BY nombre"),
        "categorias": fetch_all("SELECT id_categoria AS id, nombre FROM categorias ORDER BY nombre"),
    }
