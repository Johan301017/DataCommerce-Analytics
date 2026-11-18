"""Pruebas de la API REST: endpoints, filtros y correspondencia con el SQL del script 03."""
from __future__ import annotations

import pytest

from app.database import fetch_one, run_script_query
from app.services.sql_scripts import cargar_consultas

CONSULTAS = cargar_consultas()
CORTE = [("SET @fecha_corte = %(c)s", {"c": "2026-11-18"})]

ENDPOINTS = [
    "/api/health", "/api/catalogos/filtros", "/api/dashboard/kpis", "/api/dashboard/ventas-mensuales",
    "/api/ciudades/rendimiento", "/api/vendedores/ranking", "/api/categorias/rentabilidad",
    "/api/productos/ranking", "/api/clientes/recurrentes", "/api/clientes/premium", "/api/analisis/ejecutivo",
    "/api/consultas", "/api/consultas/1",
]


@pytest.mark.parametrize("url", ENDPOINTS)
def test_endpoint_responde_200(client, url):
    r = client.get(url)
    assert r.status_code == 200, r.text


def test_health_reporta_mysql(client):
    assert client.get("/api/health").json()["database"] == "conectada"


def test_kpis_coinciden_con_sql(client, total_general):
    k = client.get("/api/dashboard/kpis").json()
    assert abs(k["ingresos_totales"] - total_general) < 0.01
    assert k["total_transacciones"] == fetch_one("SELECT COUNT(*) AS n FROM ventas")["n"]
    assert abs(k["utilidad_total"] - (k["ingresos_totales"] - k["costos_totales"])) < 0.01
    assert abs(k["ticket_promedio"] - round(k["ingresos_totales"] / k["total_transacciones"], 2)) < 0.011
    assert k["productos_vendidos_unidades"] == fetch_one("SELECT SUM(cantidad) AS n FROM detalle_ventas")["n"]
    assert k["crecimiento_periodo"] is not None


def test_ciudades_api_igual_consulta1(client):
    api = {c["ciudad"]: c for c in client.get("/api/ciudades/rendimiento").json()}
    sql = run_script_query(CONSULTAS[1]["sql"], CORTE)
    assert len(api) == len(sql)
    for f in sql:
        assert abs(api[f["ciudad"]]["ingresos"] - f["ingresos_totales"]) < 0.01
        assert api[f["ciudad"]]["num_ventas"] == f["num_ventas"]
    assert abs(sum(c["participacion"] for c in api.values()) - 100) <= 0.05


def test_vendedores_api_igual_consultas_2_y_4(client):
    api = client.get("/api/vendedores/ranking").json()
    top3 = run_script_query(CONSULTAS[2]["sql"], CORTE)
    assert [v["nombre"] for v in api[:3]] == [t["vendedor"] for t in top3]
    c4 = {f["vendedor"]: f for f in run_script_query(CONSULTAS[4]["sql"], CORTE)}
    for v in api:
        assert v["num_ventas"] == c4[v["nombre"]]["num_transacciones"]
        assert abs(v["ticket_promedio"] - c4[v["nombre"]]["promedio_por_venta"]) < 0.011


def test_categorias_api_igual_consultas_3_y_9(client):
    api = {c["categoria"]: c for c in client.get("/api/categorias/rentabilidad").json()}
    for f in run_script_query(CONSULTAS[3]["sql"], CORTE):
        a = api[f["categoria"]]
        assert abs(a["utilidad"] - f["utilidad"]) < 0.01 and abs(a["costos"] - f["costos"]) < 0.01
        assert a["rank_utilidad"] == f["rank_utilidad"] and a["rank_facturacion"] == f["rank_facturacion"]
    for f in run_script_query(CONSULTAS[9]["sql"], CORTE):
        assert abs(api[f["categoria"]]["participacion"] - f["participacion_porcentual"]) < 0.011


def test_productos_api_igual_consulta5(client):
    api = client.get("/api/productos/ranking").json()
    c5 = {f["sku"] for f in run_script_query(CONSULTAS[5]["sql"], CORTE)}
    assert {p["sku"] for p in api if p["supera_promedio"]} == c5


def test_recurrentes_api_igual_consulta7(client):
    api = {c["nombre"]: c for c in client.get("/api/clientes/recurrentes").json()}
    c7 = run_script_query(CONSULTAS[7]["sql"], CORTE)
    assert set(api) == {f["cliente"] for f in c7}
    for f in c7:
        assert api[f["cliente"]]["num_compras"] == f["num_compras"]
        assert api[f["cliente"]]["ultima_compra"] == f["ultima_compra"]


def test_mes_ganador_api_igual_consulta8(client):
    serie = client.get("/api/dashboard/ventas-mensuales").json()
    mejor = max(serie, key=lambda m: m["ingresos"])
    c8 = run_script_query(CONSULTAS[8]["sql"], CORTE)[0]
    assert (mejor["anio"], mejor["mes"]) == (c8["anio"], c8["mes"])
    assert abs(mejor["ingresos"] - c8["ingresos"]) < 0.01


def test_premium_api_igual_consulta10(client):
    api = {c["documento"]: c["segmento"] for c in client.get("/api/clientes/premium").json()["clientes"]}
    c10 = {f["documento"]: f["segmento"] for f in run_script_query(CONSULTAS[10]["sql"], CORTE)}
    assert api == c10


def test_endpoint_consulta_literal_igual_ejecucion_directa(client):
    for n in (1, 6, 10):
        r = client.get(f"/api/consultas/{n}").json()
        assert r["filas"] == run_script_query(CONSULTAS[n]["sql"], CORTE)


def test_filtro_por_ciudad(client):
    k = client.get("/api/dashboard/kpis", params={"ciudad_id": 1}).json()
    sql = fetch_one("SELECT SUM(d.cantidad*(d.precio_unitario-d.descuento_unitario)) t, COUNT(DISTINCT v.id_venta) n "
                    "FROM ventas v JOIN detalle_ventas d ON d.id_venta = v.id_venta WHERE v.id_ciudad = 1")
    assert abs(k["ingresos_totales"] - sql["t"]) < 0.01 and k["total_transacciones"] == sql["n"]
    ciudades = client.get("/api/ciudades/rendimiento", params={"ciudad_id": 1}).json()
    assert [c["id_ciudad"] for c in ciudades] == [1]


def test_filtro_por_vendedor_y_categoria(client):
    params = {"vendedor_id": 3, "categoria_id": 1}
    k = client.get("/api/dashboard/kpis", params=params).json()
    sql = fetch_one("SELECT SUM(d.cantidad*(d.precio_unitario-d.descuento_unitario)) t "
                    "FROM ventas v JOIN detalle_ventas d ON d.id_venta = v.id_venta "
                    "JOIN productos p ON p.id_producto = d.id_producto WHERE v.id_vendedor = 3 AND p.id_categoria = 1")
    assert abs(k["ingresos_totales"] - sql["t"]) < 0.01
    cats = client.get("/api/categorias/rentabilidad", params=params).json()
    assert [c["id_categoria"] for c in cats] == [1]


def test_filtro_por_fechas_consistente_entre_modulos(client):
    params = {"fecha_inicio": "2026-01-01", "fecha_fin": "2026-06-30"}
    k = client.get("/api/dashboard/kpis", params=params).json()
    ciudades = client.get("/api/ciudades/rendimiento", params=params).json()
    categorias = client.get("/api/categorias/rentabilidad", params=params).json()
    vendedores = client.get("/api/vendedores/ranking", params=params).json()
    mensual = client.get("/api/dashboard/ventas-mensuales", params=params).json()
    for suma in (sum(c["ingresos"] for c in ciudades), sum(c["ingresos_netos"] for c in categorias),
                 sum(v["ingresos"] for v in vendedores), sum(m["ingresos"] for m in mensual)):
        assert abs(suma - k["ingresos_totales"]) < 0.01
    assert all("2026-01" <= m["periodo"] <= "2026-06" for m in mensual)
    # 181 días (ene-jun 2026) -> ventana previa de 181 días: 2025-07-04 a 2025-12-31
    assert k["periodos"]["anterior"] == {"inicio": "2025-07-04", "fin": "2025-12-31"}


def test_periodo_sin_ventas(client):
    params = {"fecha_inicio": "2030-01-01", "fecha_fin": "2030-12-31"}
    k = client.get("/api/dashboard/kpis", params=params).json()
    assert k["ingresos_totales"] == 0 and k["total_transacciones"] == 0 and k["ticket_promedio"] == 0
    assert k["margen_utilidad"] is None
    assert client.get("/api/ciudades/rendimiento", params=params).json() == []
    assert client.get("/api/clientes/premium", params=params).json()["clientes"] == []
    assert client.get("/api/analisis/ejecutivo", params=params).json()["sin_datos"] is True


@pytest.mark.parametrize("params", [
    {"fecha_inicio": "2026-05-01", "fecha_fin": "2026-01-01"},
    {"fecha_inicio": "no-es-fecha"},
    {"ciudad_id": 0},
    {"vendedor_id": "abc"},
])
def test_validacion_de_parametros(client, params):
    assert client.get("/api/dashboard/kpis", params=params).status_code == 422


def test_inyeccion_sql_no_es_posible(client):
    r = client.get("/api/dashboard/kpis", params={"ciudad_id": "1 OR 1=1"})
    assert r.status_code == 422


def test_analisis_ejecutivo_coherente(client):
    a = client.get("/api/analisis/ejecutivo").json()
    ciudades = client.get("/api/ciudades/rendimiento").json()
    assert a["ciudad_lider"]["ciudad"] == ciudades[0]["ciudad"]
    assert a["categoria_mayor_utilidad"]["rank_utilidad"] == 1
    assert len(a["riesgos"]) == 6 and all(isinstance(r["detectado"], bool) for r in a["riesgos"])
    assert all(h["tipo"] == "observado" for h in a["hallazgos"])
    assert all(r.startswith("Interpretación") for r in a["recomendaciones"])
