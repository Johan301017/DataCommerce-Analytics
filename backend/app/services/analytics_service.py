"""Lógica de negocio: KPIs derivados, periodos comparables, hallazgos y riesgos.

Todos los números provienen de MySQL a través del repositorio. Aquí solo se
calculan razones (porcentajes, promedios) y reglas explícitas de interpretación.
"""
from __future__ import annotations

import statistics
from datetime import date, timedelta
from typing import Any, Optional

from ..config import settings
from ..filters import Filtros
from ..repositories import analytics_repository as repo

MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

# Umbrales explícitos para declarar un riesgo (documentados en analisis_comercial.md)
UMBRAL_TOP3_VENDEDORES = 50.0      # % de ingresos en los 3 mayores vendedores
UMBRAL_CIUDAD_LIDER = 35.0         # % de ingresos en una sola ciudad
UMBRAL_CATEGORIA_LIDER = 40.0      # % de ingresos en una sola categoría
UMBRAL_MARGEN_BAJO = 15.0          # margen % de un producto considerado bajo
UMBRAL_CV_MENSUAL = 0.35           # coeficiente de variación de ingresos mensuales
UMBRAL_RECOMPRA = 50.0             # % de clientes con más de una compra


def _pct(parte: float, total: float) -> Optional[float]:
    return round(parte / total * 100, 2) if total else None


def _div(a: float, b: float) -> float:
    return round(a / b, 2) if b else 0.0


def _restar_un_anio(d: date) -> date:
    try:
        return d.replace(year=d.year - 1)
    except ValueError:  # 29 de febrero
        return d.replace(year=d.year - 1, day=28)


def periodos_comparables(f: Filtros) -> dict[str, Any]:
    """Determina el periodo actual y el periodo anterior comparable.

    * Con filtro de fechas: el periodo anterior es la ventana inmediatamente
      previa de igual número de días.
    * Sin filtro de fechas: año corrido (1 de enero hasta la última fecha con
      ventas) frente al mismo intervalo del año anterior.
    """
    rango = repo.rango_fechas()
    if not rango.get("maxima"):
        return {"actual": None, "anterior": None, "comparable": False, "historico_incompleto": False, "criterio": "sin datos"}
    minima = date.fromisoformat(rango["minima"])
    maxima = date.fromisoformat(rango["maxima"])
    if f.tiene_fechas:
        inicio = f.fecha_inicio or minima
        fin = f.fecha_fin or maxima
        dias = (fin - inicio).days + 1
        ant_fin = inicio - timedelta(days=1)
        ant_inicio = ant_fin - timedelta(days=dias - 1)
        criterio = f"ventana previa de {dias} días"
    else:
        fin = maxima
        inicio = date(fin.year, 1, 1)
        ant_inicio, ant_fin = _restar_un_anio(inicio), _restar_un_anio(fin)
        criterio = "año corrido vs. mismo periodo del año anterior"
    comparable = ant_inicio >= minima
    return {
        "actual": {"inicio": inicio.isoformat(), "fin": fin.isoformat()},
        "anterior": {"inicio": ant_inicio.isoformat(), "fin": ant_fin.isoformat()},
        "comparable": comparable,
        "historico_incompleto": not comparable,
        "minima_disponible": minima.isoformat(),
        "criterio": criterio if comparable else f"{criterio} (histórico previo insuficiente)",
    }


def _crecimiento(actual: float, anterior: float) -> Optional[float]:
    return round((actual - anterior) / anterior * 100, 2) if anterior else None


def kpis(f: Filtros) -> dict[str, Any]:
    t = repo.totales(f)
    periodos = periodos_comparables(f)
    crecimiento = None
    ingresos_actual = ingresos_anterior = None
    if periodos["actual"] and periodos.get("comparable", True):
        pa, pp = periodos["actual"], periodos["anterior"]
        ingresos_actual = repo.totales(f.con_periodo(date.fromisoformat(pa["inicio"]), date.fromisoformat(pa["fin"])))["ingresos"]
        ingresos_anterior = repo.totales(f.con_periodo(date.fromisoformat(pp["inicio"]), date.fromisoformat(pp["fin"])))["ingresos"]
        crecimiento = _crecimiento(ingresos_actual, ingresos_anterior)
    return {
        "ingresos_totales": t["ingresos"],
        "costos_totales": t["costos"],
        "utilidad_total": t["utilidad"],
        "margen_utilidad": _pct(t["utilidad"], t["ingresos"]),
        "total_transacciones": t["transacciones"],
        "ticket_promedio": _div(t["ingresos"], t["transacciones"]),
        "total_clientes": t["clientes"],
        "productos_vendidos_unidades": t["unidades"],
        "crecimiento_periodo": crecimiento,
        "ingresos_periodo_actual": ingresos_actual,
        "ingresos_periodo_anterior": ingresos_anterior,
        "periodos": periodos,
    }


def ventas_mensuales(f: Filtros) -> list[dict[str, Any]]:
    filas = repo.ventas_mensuales(f)
    for r in filas:
        r["periodo"] = f"{r['anio']}-{r['mes']:02d}"
        r["etiqueta"] = f"{MESES[r['mes']]} {r['anio']}"
        r["margen"] = _pct(r["utilidad"], r["ingresos"])
    return filas


def ciudades(f: Filtros) -> list[dict[str, Any]]:
    filas = repo.rendimiento_ciudades(f)
    total = sum(r["ingresos"] for r in filas)
    for i, r in enumerate(filas, start=1):
        r["posicion"] = i
        r["participacion"] = _pct(r["ingresos"], total)
        r["ticket_promedio"] = _div(r["ingresos"], r["num_ventas"])
        r["margen"] = _pct(r["utilidad"], r["ingresos"])
    return filas


def vendedores(f: Filtros) -> list[dict[str, Any]]:
    filas = repo.ranking_vendedores(f)
    total = sum(r["ingresos"] for r in filas)
    for i, r in enumerate(filas, start=1):
        r["posicion"] = i
        r["participacion"] = _pct(r["ingresos"], total)
        r["ticket_promedio"] = _div(r["ingresos"], r["num_ventas"])
        r["margen"] = _pct(r["utilidad"], r["ingresos"])
    return filas


def categorias(f: Filtros) -> list[dict[str, Any]]:
    filas = repo.rentabilidad_categorias(f)
    total = sum(r["ingresos_netos"] for r in filas)
    por_ingreso = sorted(filas, key=lambda r: r["ingresos_netos"], reverse=True)
    rank_fact = {r["id_categoria"]: i for i, r in enumerate(por_ingreso, start=1)}
    for i, r in enumerate(filas, start=1):
        r["rank_utilidad"] = i
        r["rank_facturacion"] = rank_fact[r["id_categoria"]]
        r["margen"] = _pct(r["utilidad"], r["ingresos_netos"])
        r["participacion"] = _pct(r["ingresos_netos"], total)
    return filas


def productos(f: Filtros, limite: Optional[int] = None) -> list[dict[str, Any]]:
    filas = repo.ranking_productos(f)
    total = sum(r["ingresos"] for r in filas)
    promedio = total / len(filas) if filas else 0
    for i, r in enumerate(filas, start=1):
        r["posicion"] = i
        r["margen"] = _pct(r["utilidad"], r["ingresos"])
        r["participacion"] = _pct(r["ingresos"], total)
        r["precio_promedio"] = _div(r["ingresos"], r["unidades"])
        r["supera_promedio"] = r["ingresos"] > promedio
    return filas[:limite] if limite else filas


def recurrentes(f: Filtros) -> list[dict[str, Any]]:
    filas = repo.clientes_recurrentes(f)
    for r in filas:
        r["ticket_promedio"] = _div(r["ingresos"], r["num_compras"])
    return filas


def premium(f: Filtros, fecha_corte: Optional[date] = None) -> dict[str, Any]:
    corte = fecha_corte or settings.fecha_corte
    filas = repo.segmentacion_rfm(f, corte)
    for r in filas:
        for k in ("cumple_frecuencia", "cumple_recencia", "cumple_monetario"):
            r[k] = bool(r[k])
    resumen: dict[str, dict[str, Any]] = {}
    for seg in ("Premium", "Potencial premium", "Regular"):
        grupo = [r for r in filas if r["segmento"] == seg]
        ingresos = sum(r["ingresos"] for r in grupo)
        compras = sum(r["num_compras"] for r in grupo)
        resumen[seg] = {
            "segmento": seg,
            "clientes": len(grupo),
            "ingresos": round(ingresos, 2),
            "ticket_promedio": _div(ingresos, compras),
        }
    total_ing = sum(v["ingresos"] for v in resumen.values())
    for v in resumen.values():
        v["participacion_ingresos"] = _pct(v["ingresos"], total_ing)
    registrados = repo.total_clientes_registrados()
    return {
        "fecha_corte": corte.isoformat(),
        "clientes_registrados": registrados,
        "clientes_con_compras": len(filas),
        "criterios": {
            "frecuencia_minima": 3,
            "recencia_maxima_dias": 180,
            "percentil_monetario_minimo": 75,
            "regla": "Premium = cumple 3 criterios; Potencial premium = cumple exactamente 2; Regular = 0 o 1",
        },
        "resumen": list(resumen.values()),
        "clientes": filas,
    }


def catalogos() -> dict[str, Any]:
    datos = repo.catalogos()
    datos["rango_fechas"] = repo.rango_fechas()
    return datos


# ---------------------------------------------------------------------------
# Módulo F: inteligencia comercial
# ---------------------------------------------------------------------------
def _hhi(participaciones: list[float]) -> float:
    """Índice Herfindahl-Hirschman (0-10.000)."""
    return round(sum((p or 0) ** 2 for p in participaciones), 1)


def _es_num(valor: float | None, dec: int = 2) -> str:
    if valor is None:
        return "N/D"
    s = f"{valor:,.{dec}f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def _es_cop(valor: float | None) -> str:
    if valor is None:
        return "N/D"
    return f"$ {round(valor):,}".replace(",", ".") + " COP"


def analisis_ejecutivo(f: Filtros) -> dict[str, Any]:
    k = kpis(f)
    if not k["total_transacciones"]:
        return {"sin_datos": True, "kpis": k, "hallazgos": [], "riesgos": [], "recomendaciones": []}

    lista_ciudades = ciudades(f)
    lista_vendedores = vendedores(f)
    lista_categorias = categorias(f)
    lista_productos = productos(f)
    mensual = ventas_mensuales(f)
    segmentacion = premium(f)

    # Crecimiento por ciudad en periodos comparables
    per = k["periodos"]
    crec_ciudades: list[dict[str, Any]] = []
    if per["actual"] and per.get("comparable", True):
        act = {r["ciudad"]: r for r in repo.rendimiento_ciudades(
            f.con_periodo(date.fromisoformat(per["actual"]["inicio"]), date.fromisoformat(per["actual"]["fin"])))}
        ant = {r["ciudad"]: r for r in repo.rendimiento_ciudades(
            f.con_periodo(date.fromisoformat(per["anterior"]["inicio"]), date.fromisoformat(per["anterior"]["fin"])))}
        for nombre in sorted(set(act) | set(ant)):
            ia = act.get(nombre, {}).get("ingresos", 0.0)
            ip = ant.get(nombre, {}).get("ingresos", 0.0)
            crec_ciudades.append({"ciudad": nombre, "ingresos_actual": ia, "ingresos_anterior": ip,
                                  "crecimiento": _crecimiento(ia, ip)})
        crec_ciudades.sort(key=lambda r: (r["crecimiento"] is None, -(r["crecimiento"] or 0)))

    ciudad_lider = lista_ciudades[0]
    vendedor_lider = lista_vendedores[0]
    vend_ticket = max(lista_vendedores, key=lambda r: r["ticket_promedio"])
    vend_margen = max(lista_vendedores, key=lambda r: r["margen"] or 0)
    cat_utilidad = lista_categorias[0]
    cat_facturacion = min(lista_categorias, key=lambda r: r["rank_facturacion"])
    cat_margen = max(lista_categorias, key=lambda r: r["margen"] or 0)
    top_ingreso = lista_productos[:3]
    top_unidades = sorted(lista_productos, key=lambda r: r["unidades"], reverse=True)[:3]
    crec_valida = [c for c in crec_ciudades if c["crecimiento"] is not None]
    ciudad_crec = crec_valida[0] if crec_valida else None

    total = k["ingresos_totales"]
    top3_vend = sum(r["ingresos"] for r in lista_vendedores[:3])
    part_top3_vend = _pct(top3_vend, total) or 0
    part_ciudad = ciudad_lider["participacion"] or 0
    part_categoria = max(r["participacion"] or 0 for r in lista_categorias)
    margen_bajo = [p for p in lista_productos if (p["margen"] or 0) < UMBRAL_MARGEN_BAJO]
    valores_mes = [m["ingresos"] for m in mensual]
    cv = (statistics.pstdev(valores_mes) / statistics.mean(valores_mes)) if len(valores_mes) > 1 else 0
    clientes_con_compra = len(segmentacion["clientes"])
    recurrentes_n = sum(1 for c in segmentacion["clientes"] if c["num_compras"] > 1)
    tasa_recompra = _pct(recurrentes_n, clientes_con_compra) or 0
    mes_max = max(mensual, key=lambda m: m["ingresos"])
    mes_min = min(mensual, key=lambda m: m["ingresos"])

    hallazgos = [
        {"titulo": "Ciudad con mayores ingresos", "valor": ciudad_lider["ciudad"],
         "detalle": f"{_es_num(ciudad_lider['participacion'])} % de los ingresos; {ciudad_lider['num_ventas']} ventas; "
                    f"ticket promedio {_es_cop(ciudad_lider['ticket_promedio'])}", "tipo": "observado"},
        {"titulo": "Ciudad con mayor crecimiento observado",
         "valor": ciudad_crec["ciudad"] if ciudad_crec else "No calculable",
         "detalle": (f"{_es_num(ciudad_crec['crecimiento'])} % ({per['criterio']})" if ciudad_crec
                     else "No hay periodo anterior comparable con ventas"), "tipo": "observado"},
        {"titulo": "Vendedor con mayor facturación", "valor": vendedor_lider["nombre"],
         "detalle": f"{_es_num(vendedor_lider['participacion'])} % de los ingresos en {vendedor_lider['num_ventas']} ventas",
         "tipo": "observado"},
        {"titulo": "Vendedor con mayor ticket promedio", "valor": vend_ticket["nombre"],
         "detalle": f"Ticket promedio {_es_cop(vend_ticket['ticket_promedio'])} en {vend_ticket['num_ventas']} ventas",
         "tipo": "observado"},
        {"titulo": "Categoría con mayor utilidad", "valor": cat_utilidad["categoria"],
         "detalle": f"Utilidad {_es_cop(cat_utilidad['utilidad'])}; margen {_es_num(cat_utilidad['margen'])} %",
         "tipo": "observado"},
        {"titulo": "Categoría con mayor facturación", "valor": cat_facturacion["categoria"],
         "detalle": f"{_es_num(cat_facturacion['participacion'])} % de los ingresos; margen {_es_num(cat_facturacion['margen'])} %",
         "tipo": "observado"},
        {"titulo": "Categoría con mayor margen", "valor": cat_margen["categoria"],
         "detalle": f"Margen {_es_num(cat_margen['margen'])} % con {_es_num(cat_margen['participacion'])} % de participación",
         "tipo": "observado"},
        {"titulo": "Producto con mayores ingresos", "valor": top_ingreso[0]["nombre"],
         "detalle": f"{_es_num(top_ingreso[0]['participacion'])} % de los ingresos; {int(round(top_ingreso[0]['unidades']))} unidades",
         "tipo": "observado"},
        {"titulo": "Producto más vendido en unidades", "valor": top_unidades[0]["nombre"],
         "detalle": f"{int(round(top_unidades[0]['unidades']))} unidades vendidas", "tipo": "observado"},
        {"titulo": "Mes con mayores ingresos", "valor": mes_max["etiqueta"],
         "detalle": f"{_es_cop(mes_max['ingresos'])} en {mes_max['num_ventas']} transacciones", "tipo": "observado"},
    ]

    riesgos = [
        {"riesgo": "Dependencia de pocos vendedores", "metrica": "Participación de los 3 mayores vendedores",
         "valor": part_top3_vend, "umbral": UMBRAL_TOP3_VENDEDORES, "unidad": "%",
         "detectado": part_top3_vend > UMBRAL_TOP3_VENDEDORES,
         "evidencia": ", ".join(v["nombre"] for v in lista_vendedores[:3])},
        {"riesgo": "Concentración de ingresos en una ciudad", "metrica": f"Participación de {ciudad_lider['ciudad']}",
         "valor": part_ciudad, "umbral": UMBRAL_CIUDAD_LIDER, "unidad": "%",
         "detectado": part_ciudad > UMBRAL_CIUDAD_LIDER,
         "evidencia": f"HHI ciudades = {_es_num(_hhi([c['participacion'] for c in lista_ciudades]), 1)}"},
        {"riesgo": "Dependencia de una categoría", "metrica": f"Participación de {cat_facturacion['categoria']}",
         "valor": part_categoria, "umbral": UMBRAL_CATEGORIA_LIDER, "unidad": "%",
         "detectado": part_categoria > UMBRAL_CATEGORIA_LIDER,
         "evidencia": f"HHI categorías = {_es_num(_hhi([c['participacion'] for c in lista_categorias]), 1)}"},
        {"riesgo": "Productos con bajo margen", "metrica": f"Productos con margen < {_es_num(UMBRAL_MARGEN_BAJO, 0)} %",
         "valor": len(margen_bajo), "umbral": 0, "unidad": "productos",
         "detectado": len(margen_bajo) > 0,
         "evidencia": "; ".join(f"{p['nombre']} ({_es_num(p['margen'])} %, {_es_num(p['participacion'])} % de ingresos)"
                                for p in margen_bajo) or "Ninguno"},
        {"riesgo": "Variabilidad temporal de ventas", "metrica": "Coeficiente de variación mensual",
         "valor": round(cv, 3), "umbral": UMBRAL_CV_MENSUAL, "unidad": "",
         "detectado": cv > UMBRAL_CV_MENSUAL,
         "evidencia": f"Mes máximo {mes_max['etiqueta']} ({_es_cop(mes_max['ingresos'])}); "
                      f"mes mínimo {mes_min['etiqueta']} ({_es_cop(mes_min['ingresos'])})"},
        {"riesgo": "Baja frecuencia de recompra", "metrica": "Clientes con más de una compra",
         "valor": tasa_recompra, "umbral": UMBRAL_RECOMPRA, "unidad": "%",
         "detectado": tasa_recompra < UMBRAL_RECOMPRA,
         "evidencia": f"{recurrentes_n} de {clientes_con_compra} clientes compraron más de una vez"},
    ]

    recomendaciones = []
    if ciudad_crec and ciudad_crec["ciudad"] != ciudad_lider["ciudad"]:
        recomendaciones.append(
            f"Interpretación: {ciudad_crec['ciudad']} crece más rápido que la ciudad líder; "
            f"puede priorizarse para ampliar cobertura comercial (requiere validar con datos de mercado).")
    if (cat_margen["margen"] or 0) > (k["margen_utilidad"] or 0):
        recomendaciones.append(
            f"Interpretación: {cat_margen['categoria']} tiene un margen ({_es_num(cat_margen['margen'])} %) superior al "
            f"promedio ({_es_num(k['margen_utilidad'])} %) con baja participación; aumentar su mezcla de ventas mejoraría la utilidad.")
    if margen_bajo:
        recomendaciones.append(
            "Interpretación: revisar precios, costos o descuentos de los productos con margen bajo antes de promocionarlos.")
    if part_top3_vend > UMBRAL_TOP3_VENDEDORES:
        recomendaciones.append(
            "Interpretación: la facturación depende de pocos vendedores; conviene documentar sus prácticas y "
            "acompañar a los vendedores de menor rendimiento.")
    premium_n = next(s["clientes"] for s in segmentacion["resumen"] if s["segmento"] == "Premium")
    potencial_n = next(s["clientes"] for s in segmentacion["resumen"] if s["segmento"] == "Potencial premium")
    recomendaciones.append(
        f"Interpretación: existen {premium_n} clientes Premium y {potencial_n} Potencial premium; un programa de "
        f"fidelización enfocado en ellos protege la base de ingresos recurrentes.")

    return {
        "sin_datos": False,
        "kpis": k,
        "ciudad_lider": ciudad_lider,
        "ciudad_mayor_crecimiento": ciudad_crec,
        "crecimiento_ciudades": crec_ciudades,
        "vendedor_lider": vendedor_lider,
        "vendedor_mayor_ticket": vend_ticket,
        "vendedor_mayor_margen": vend_margen,
        "categoria_mayor_utilidad": cat_utilidad,
        "categoria_mayor_facturacion": cat_facturacion,
        "categoria_mayor_margen": cat_margen,
        "productos_destacados": {"por_ingresos": top_ingreso, "por_unidades": top_unidades},
        "concentracion": {
            "top3_vendedores_pct": part_top3_vend,
            "ciudad_lider_pct": part_ciudad,
            "categoria_lider_pct": part_categoria,
            "hhi_ciudades": _hhi([c["participacion"] for c in lista_ciudades]),
            "hhi_categorias": _hhi([c["participacion"] for c in lista_categorias]),
            "hhi_vendedores": _hhi([v["participacion"] for v in lista_vendedores]),
            "coeficiente_variacion_mensual": round(cv, 3),
            "tasa_recompra_pct": tasa_recompra,
        },
        "hallazgos": hallazgos,
        "riesgos": riesgos,
        "recomendaciones": recomendaciones,
    }
