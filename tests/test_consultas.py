"""Pruebas de las 10 consultas del script 03 y su consistencia matemática."""
from __future__ import annotations

import pytest

from app.database import fetch_all, fetch_one, run_script_query
from app.services.sql_scripts import cargar_consultas

CONSULTAS = cargar_consultas()
CORTE = [("SET @fecha_corte = %(c)s", {"c": "2026-11-18"})]


def q(n: int):
    return run_script_query(CONSULTAS[n]["sql"], CORTE)


def test_el_script_contiene_diez_consultas():
    assert sorted(CONSULTAS) == list(range(1, 11))


@pytest.mark.parametrize("n", range(1, 11))
def test_consulta_ejecuta_y_devuelve_filas(n):
    assert len(q(n)) > 0


def test_c1_suma_ciudades_igual_total(total_general):
    filas = q(1)
    assert abs(sum(f["ingresos_totales"] for f in filas) - total_general) < 0.01
    assert [f["ingresos_totales"] for f in filas] == sorted((f["ingresos_totales"] for f in filas), reverse=True)


def test_c2_top3_ordenado_con_posicion():
    filas = q(2)
    assert len(filas) == 3 and [f["posicion"] for f in filas] == [1, 2, 3]
    assert filas[0]["ingresos_generados"] >= filas[1]["ingresos_generados"] >= filas[2]["ingresos_generados"]
    todos = q(4)
    assert filas[0]["ingresos_generados"] == max(f["ingresos_totales"] for f in todos)


def test_c3_utilidad_igual_ingresos_menos_costos(total_general):
    filas = q(3)
    for f in filas:
        assert abs(f["utilidad"] - (f["ingresos_netos"] - f["costos"])) < 0.01
        assert abs(f["margen_porcentual"] - round(f["utilidad"] / f["ingresos_netos"] * 100, 2)) < 0.011
    assert abs(sum(f["ingresos_netos"] for f in filas) - total_general) < 0.01
    assert filas[0]["rank_utilidad"] == 1


def test_c4_transacciones_son_facturas_distintas():
    filas = q(4)
    assert sum(f["num_transacciones"] for f in filas) == fetch_one("SELECT COUNT(*) AS n FROM ventas")["n"]
    for f in filas:
        assert abs(f["promedio_por_venta"] - round(f["ingresos_totales"] / f["num_transacciones"], 2)) < 0.011


def test_c5_productos_sobre_promedio():
    filas = q(5)
    prom = fetch_one("SELECT AVG(t) AS p FROM (SELECT SUM(cantidad*(precio_unitario-descuento_unitario)) AS t "
                     "FROM detalle_ventas GROUP BY id_producto) x")["p"]
    assert all(f["ingreso_total"] > prom for f in filas)
    total_sobre = fetch_one("SELECT COUNT(*) AS n FROM (SELECT SUM(cantidad*(precio_unitario-descuento_unitario)) AS t "
                            "FROM detalle_ventas GROUP BY id_producto) x WHERE t > %(p)s", {"p": prom})["n"]
    assert len(filas) == total_sobre
    assert "SELECT AVG" in CONSULTAS[5]["sql"]


def test_c6_ciudades_sobre_promedio_por_ciudad():
    filas = q(6)
    ciudades = q(1)
    prom = sum(c["ingresos_totales"] for c in ciudades) / len(ciudades)
    esperadas = {c["ciudad"] for c in ciudades if c["ingresos_totales"] > prom}
    assert {f["ciudad"] for f in filas} == esperadas
    assert abs(filas[0]["promedio_nacional_por_ciudad"] - round(prom, 2)) < 0.011


def test_c7_clientes_mas_de_una_compra():
    filas = q(7)
    assert all(f["num_compras"] > 1 for f in filas)
    directos = fetch_all("SELECT c.nombre, COUNT(*) AS n FROM ventas v JOIN clientes c ON c.id_cliente = v.id_cliente "
                         "GROUP BY c.id_cliente, c.nombre HAVING COUNT(*) > 1")
    assert {(d["nombre"], d["n"]) for d in directos} == {(f["cliente"], f["num_compras"]) for f in filas}


def test_c8_mes_ganador_por_anio_y_mes():
    ganador = q(8)[0]
    serie = fetch_all("SELECT YEAR(v.fecha_venta) a, MONTH(v.fecha_venta) m, "
                      "SUM(d.cantidad*(d.precio_unitario-d.descuento_unitario)) i "
                      "FROM ventas v JOIN detalle_ventas d ON d.id_venta = v.id_venta GROUP BY a, m")
    mejor = max(serie, key=lambda r: r["i"])
    assert (ganador["anio"], ganador["mes"]) == (mejor["a"], mejor["m"])
    assert len(serie) == 22  # ene-2025 a oct-2026 sin mezclar años


def test_c9_participaciones_suman_cien():
    filas = q(9)
    assert abs(sum(f["participacion_porcentual"] for f in filas) - 100) <= 0.05
    assert "NULLIF" in CONSULTAS[9]["sql"]


def test_c10_segmentos_mutuamente_excluyentes_y_reglas():
    filas = q(10)
    clientes_con_compra = fetch_one("SELECT COUNT(DISTINCT id_cliente) AS n FROM ventas")["n"]
    assert len(filas) == clientes_con_compra == len({f["documento"] for f in filas})
    for f in filas:
        c1 = f["num_compras"] >= 3
        c2 = f["dias_desde_ultima_compra"] <= 180
        c3 = f["percentil_gasto"] >= 75
        esperado = {3: "Premium", 2: "Potencial premium"}.get(c1 + c2 + c3, "Regular")
        assert f["segmento"] == esperado, f
    segmentos = {f["segmento"] for f in filas}
    assert {"Premium", "Potencial premium", "Regular"} <= segmentos
