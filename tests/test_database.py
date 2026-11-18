"""Pruebas del esquema, restricciones e integridad de datos (MySQL real)."""
from __future__ import annotations

import pymysql
import pytest

from app.database import fetch_all, fetch_one

TABLAS = ["ciudades", "clientes", "vendedores", "categorias", "productos", "ventas", "detalle_ventas"]


def test_existen_las_siete_tablas():
    filas = fetch_all(
        "SELECT TABLE_NAME AS t FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'")
    assert sorted(f["t"] for f in filas) == sorted(TABLAS)


def test_claves_primarias_auto_increment():
    filas = fetch_all(
        "SELECT TABLE_NAME AS t, COLUMN_NAME AS c, EXTRA AS e, COLUMN_KEY AS k FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_KEY = 'PRI'")
    por_tabla = {f["t"]: f for f in filas}
    assert set(por_tabla) == set(TABLAS)
    assert all("auto_increment" in f["e"] for f in filas)


def test_claves_foraneas_y_on_delete_restrict():
    filas = fetch_all(
        "SELECT TABLE_NAME AS t, CONSTRAINT_NAME AS n, DELETE_RULE AS d, REFERENCED_TABLE_NAME AS r "
        "FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()")
    assert len(filas) == 8
    assert all(f["d"] == "RESTRICT" for f in filas), "Ninguna FK debe eliminar en cascada"
    pares = {(f["t"], f["r"]) for f in filas}
    assert ("detalle_ventas", "ventas") in pares and ("detalle_ventas", "productos") in pares
    assert ("ventas", "ciudades") in pares and ("ventas", "clientes") in pares and ("ventas", "vendedores") in pares


def test_restricciones_unique_y_check_declaradas():
    tipos = fetch_all(
        "SELECT CONSTRAINT_TYPE AS tipo, COUNT(*) AS n FROM information_schema.TABLE_CONSTRAINTS "
        "WHERE TABLE_SCHEMA = DATABASE() GROUP BY CONSTRAINT_TYPE")
    conteo = {f["tipo"]: f["n"] for f in tipos}
    assert conteo.get("UNIQUE", 0) >= 7
    assert conteo.get("CHECK", 0) >= 7


def test_volumen_minimo_de_datos():
    n = {t: fetch_one(f"SELECT COUNT(*) AS n FROM {t}")["n"] for t in TABLAS}
    assert n["ciudades"] == 8 and n["categorias"] == 5
    assert n["clientes"] >= 30 and n["vendedores"] >= 10 and n["productos"] >= 30
    assert n["ventas"] >= 150 and n["detalle_ventas"] >= 300
    assert sum(n.values()) >= 20


def test_sin_huerfanos_y_toda_venta_con_detalle():
    huerfanos = fetch_one(
        "SELECT (SELECT COUNT(*) FROM detalle_ventas d LEFT JOIN ventas v ON v.id_venta = d.id_venta WHERE v.id_venta IS NULL)"
        " + (SELECT COUNT(*) FROM ventas v LEFT JOIN clientes c ON c.id_cliente = v.id_cliente WHERE c.id_cliente IS NULL)"
        " + (SELECT COUNT(*) FROM ventas v LEFT JOIN vendedores s ON s.id_vendedor = v.id_vendedor WHERE s.id_vendedor IS NULL)"
        " AS n")["n"]
    sin_detalle = fetch_one(
        "SELECT COUNT(*) AS n FROM ventas v LEFT JOIN detalle_ventas d ON d.id_venta = v.id_venta WHERE d.id_detalle IS NULL")["n"]
    assert huerfanos == 0 and sin_detalle == 0


def test_rango_fechas_y_coherencia_temporal():
    r = fetch_one("SELECT MIN(fecha_venta) AS a, MAX(fecha_venta) AS b FROM ventas")
    assert r["a"] >= "2025-01-01" and r["b"] <= "2026-10-31"
    incoherentes = fetch_one(
        "SELECT COUNT(*) AS n FROM ventas v JOIN clientes c ON c.id_cliente = v.id_cliente "
        "JOIN vendedores s ON s.id_vendedor = v.id_vendedor "
        "WHERE v.fecha_venta < c.fecha_registro OR v.fecha_venta < s.fecha_contratacion")["n"]
    assert incoherentes == 0


def test_hay_ventas_en_ciudad_distinta_a_la_residencia():
    """Justifica almacenar la ciudad de la venta en la tabla ventas."""
    n = fetch_one("SELECT COUNT(*) AS n FROM ventas v JOIN clientes c ON c.id_cliente = v.id_cliente "
                  "WHERE v.id_ciudad <> c.id_ciudad")["n"]
    assert n > 0


def test_precios_historicos_difieren_del_catalogo():
    n = fetch_one("SELECT COUNT(*) AS n FROM detalle_ventas d JOIN productos p ON p.id_producto = d.id_producto "
                  "WHERE d.precio_unitario <> p.precio_lista")["n"]
    assert n > 0


@pytest.mark.parametrize("sql, descripcion", [
    ("INSERT INTO ciudades (id_ciudad, nombre, departamento, latitud, longitud) VALUES (1, 'X', 'X', 0, 0)", "PK duplicada"),
    ("INSERT INTO ciudades (nombre, departamento, latitud, longitud) VALUES ('Bogotá', 'X', 0, 0)", "UNIQUE ciudad"),
    ("INSERT INTO productos (codigo_sku, nombre, id_categoria, precio_lista) VALUES ('TEC-001', 'X', 1, 10)", "UNIQUE sku"),
    ("INSERT INTO clientes (documento, nombre, correo, id_ciudad, fecha_registro) VALUES ('1', NULL, 'z@z.co', 1, '2026-01-01')", "NOT NULL nombre"),
    ("INSERT INTO ventas (numero_factura, id_cliente, id_vendedor, id_ciudad, fecha_venta) VALUES ('T-1', 99999, 1, 1, '2026-01-01')", "FK cliente"),
    ("INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, costo_unitario) VALUES (1, 30, 0, 100, 50)", "CHECK cantidad"),
    ("INSERT INTO productos (codigo_sku, nombre, id_categoria, precio_lista) VALUES ('NEG-1', 'X', 1, -1)", "CHECK precio"),
    ("INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, costo_unitario, descuento_unitario) VALUES (1, 30, 1, 100, 50, 150)", "CHECK descuento < precio"),
    ("DELETE FROM ciudades WHERE id_ciudad = 1", "RESTRICT ciudad con ventas"),
    ("DELETE FROM ventas WHERE id_venta = 1", "RESTRICT venta con detalle"),
    ("DELETE FROM productos WHERE id_producto = 1", "RESTRICT producto vendido"),
])
def test_restriccion_rechaza_operacion_invalida(conn_tx, sql, descripcion):
    with pytest.raises(pymysql.MySQLError):
        with conn_tx.cursor() as cur:
            cur.execute(sql)


def test_insercion_relacionada_valida(conn_tx):
    """Una venta nueva con dos productos se inserta correctamente (luego ROLLBACK)."""
    with conn_tx.cursor() as cur:
        cur.execute("INSERT INTO ventas (numero_factura, id_cliente, id_vendedor, id_ciudad, fecha_venta) "
                    "VALUES ('FE-PRUEBA-1', 1, 1, 1, '2026-10-31')")
        venta = cur.lastrowid
        cur.execute("INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, costo_unitario, descuento_unitario) "
                    "VALUES (%s, 3, 2, 320000, 224000, 0), (%s, 4, 1, 185000, 122000, 9300)", (venta, venta))
        cur.execute("SELECT COUNT(*) AS n FROM detalle_ventas WHERE id_venta = %s", (venta,))
        assert cur.fetchone()["n"] == 2
