-- ============================================================================
-- DataCommerce Analytics S.A.S.
-- Script 03: Consultas analíticas obligatorias (9) + segmentación premium (10)
-- Motor: MySQL 8.0  |  Moneda: COP  |  Ejecutar después de 01 y 02.
--
-- Definiciones usadas en TODAS las consultas (a nivel de línea de detalle):
--   ingreso_neto = cantidad * (precio_unitario - descuento_unitario)
--   costo        = cantidad * costo_unitario
--   utilidad     = ingreso_neto - costo
--   margen %     = utilidad / ingreso_neto * 100
-- Una "transacción" o "compra" es una factura distinta (COUNT(DISTINCT id_venta)),
-- nunca una línea de detalle.
--
-- Cada consulta inicia con un marcador "-- @consulta:N". Los marcadores son
-- usados por las pruebas automáticas (tests/) para ejecutar exactamente este
-- SQL y compararlo con los resultados de la API del dashboard.
-- En MySQL Workbench puede ejecutar cada consulta con Ctrl+Enter ubicando el
-- cursor dentro de ella, o el script completo con Ctrl+Shift+Enter.
-- ============================================================================

USE datacommerce_analytics;

-- Fecha de corte para la segmentación premium (modificable).
SET @fecha_corte = '2026-11-18';

-- @consulta:1
-- ============================================================================
-- Consulta 1: Total vendido por ciudad
-- Ciudad donde OCURRIÓ la venta (ventas.id_ciudad), no la de residencia
-- del cliente. Técnicas: INNER JOIN, SUM, COUNT DISTINCT, GROUP BY, ORDER BY.
-- ============================================================================
SELECT
    c.nombre                                                         AS ciudad,
    c.departamento                                                   AS departamento,
    COUNT(DISTINCT v.id_venta)                                       AS num_ventas,
    SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS ingresos_totales
FROM ciudades c
INNER JOIN ventas v          ON v.id_ciudad = c.id_ciudad
INNER JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
GROUP BY c.id_ciudad, c.nombre, c.departamento
ORDER BY ingresos_totales DESC;

-- @consulta:2
-- ============================================================================
-- Consulta 2: Top 3 vendedores con mayores ingresos
-- La posición se calcula con ROW_NUMBER() sobre el ingreso agregado.
-- Técnicas: JOIN, SUM, COUNT DISTINCT, GROUP BY, ORDER BY, LIMIT.
-- ============================================================================
SELECT
    ROW_NUMBER() OVER (
        ORDER BY SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario)) DESC
    )                                                                AS posicion,
    ve.nombre                                                        AS vendedor,
    COUNT(DISTINCT v.id_venta)                                       AS num_ventas,
    SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS ingresos_generados
FROM vendedores ve
INNER JOIN ventas v          ON v.id_vendedor = ve.id_vendedor
INNER JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
GROUP BY ve.id_vendedor, ve.nombre
ORDER BY ingresos_generados DESC, num_ventas DESC, ve.id_vendedor ASC
LIMIT 3;

-- @consulta:3
-- ============================================================================
-- Consulta 3: Categoría más rentable
-- Muestra ingresos netos, costos, utilidad y margen de cada categoría,
-- ordenadas por utilidad absoluta. Las columnas rank_utilidad y
-- rank_facturacion permiten diferenciar la categoría con MAYOR UTILIDAD
-- de la categoría con MAYOR FACTURACIÓN (pueden no coincidir).
-- Técnicas: JOIN, SUM, GROUP BY, NULLIF, funciones de ventana RANK().
-- ============================================================================
SELECT
    t.categoria,
    t.ingresos_netos,
    t.costos,
    t.utilidad,
    ROUND(t.utilidad / NULLIF(t.ingresos_netos, 0) * 100, 2)        AS margen_porcentual,
    RANK() OVER (ORDER BY t.utilidad DESC)                           AS rank_utilidad,
    RANK() OVER (ORDER BY t.ingresos_netos DESC)                     AS rank_facturacion
FROM (
    SELECT
        cat.nombre                                                       AS categoria,
        SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS ingresos_netos,
        SUM(dv.cantidad * dv.costo_unitario)                             AS costos,
        SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario - dv.costo_unitario)) AS utilidad
    FROM categorias cat
    INNER JOIN productos p       ON p.id_categoria = cat.id_categoria
    INNER JOIN detalle_ventas dv ON dv.id_producto = p.id_producto
    GROUP BY cat.id_categoria, cat.nombre
) AS t
ORDER BY t.utilidad DESC;

-- @consulta:4
-- ============================================================================
-- Consulta 4: Promedio de ventas por vendedor
-- Valor promedio por venta = ingresos / número de facturas distintas.
-- Se usa COUNT(DISTINCT v.id_venta) para que una factura con varias líneas
-- de detalle cuente como UNA sola transacción.
-- Técnicas: JOIN, COUNT DISTINCT, SUM, GROUP BY, NULLIF.
-- ============================================================================
SELECT
    ve.nombre                                                        AS vendedor,
    ci.nombre                                                        AS ciudad_asignada,
    COUNT(DISTINCT v.id_venta)                                       AS num_transacciones,
    SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS ingresos_totales,
    ROUND(SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))
          / NULLIF(COUNT(DISTINCT v.id_venta), 0), 2)                AS promedio_por_venta
FROM vendedores ve
INNER JOIN ciudades ci       ON ci.id_ciudad = ve.id_ciudad_asignada
INNER JOIN ventas v          ON v.id_vendedor = ve.id_vendedor
INNER JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
GROUP BY ve.id_vendedor, ve.nombre, ci.nombre
ORDER BY promedio_por_venta DESC;

-- @consulta:5
-- ============================================================================
-- Consulta 5: Productos cuyo valor total vendido supera el promedio general
-- "Promedio general" = promedio del ingreso ACUMULADO por producto, calculado
-- solo sobre los productos que registran ventas (subconsulta derivada).
-- Técnicas: SUBCONSULTA en HAVING con tabla derivada, AVG, SUM, GROUP BY.
-- ============================================================================
SELECT
    p.codigo_sku                                                     AS sku,
    p.nombre                                                         AS producto,
    cat.nombre                                                       AS categoria,
    SUM(dv.cantidad)                                                 AS unidades_vendidas,
    SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS ingreso_total,
    (SELECT ROUND(AVG(x.ingreso_producto), 2)
       FROM (SELECT SUM(d2.cantidad * (d2.precio_unitario - d2.descuento_unitario)) AS ingreso_producto
               FROM detalle_ventas d2
              GROUP BY d2.id_producto) AS x)                         AS promedio_por_producto
FROM productos p
INNER JOIN categorias cat    ON cat.id_categoria = p.id_categoria
INNER JOIN detalle_ventas dv ON dv.id_producto = p.id_producto
GROUP BY p.id_producto, p.codigo_sku, p.nombre, cat.nombre
HAVING ingreso_total > (
    SELECT AVG(x.ingreso_producto)
    FROM (
        SELECT SUM(d2.cantidad * (d2.precio_unitario - d2.descuento_unitario)) AS ingreso_producto
        FROM detalle_ventas d2
        GROUP BY d2.id_producto
    ) AS x
)
ORDER BY ingreso_total DESC;

-- @consulta:6
-- ============================================================================
-- Consulta 6: Ciudades con ventas superiores al promedio nacional
-- "Promedio nacional" = promedio de los INGRESOS TOTALES POR CIUDAD
-- (suma por ciudad y luego promedio entre ciudades). NO es el promedio por
-- factura. Técnicas: subconsultas anidadas, SUM, AVG, GROUP BY, HAVING.
-- ============================================================================
SELECT
    c.nombre                                                         AS ciudad,
    COUNT(DISTINCT v.id_venta)                                       AS num_ventas,
    SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS ingresos_ciudad,
    (SELECT ROUND(AVG(z.ingresos), 2)
       FROM (SELECT SUM(d2.cantidad * (d2.precio_unitario - d2.descuento_unitario)) AS ingresos
               FROM ventas v2
               INNER JOIN detalle_ventas d2 ON d2.id_venta = v2.id_venta
              GROUP BY v2.id_ciudad) AS z)                            AS promedio_nacional_por_ciudad
FROM ciudades c
INNER JOIN ventas v          ON v.id_ciudad = c.id_ciudad
INNER JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
GROUP BY c.id_ciudad, c.nombre
HAVING ingresos_ciudad > (
    SELECT AVG(z.ingresos)
    FROM (
        SELECT SUM(d2.cantidad * (d2.precio_unitario - d2.descuento_unitario)) AS ingresos
        FROM ventas v2
        INNER JOIN detalle_ventas d2 ON d2.id_venta = v2.id_venta
        GROUP BY v2.id_ciudad
    ) AS z
)
ORDER BY ingresos_ciudad DESC;

-- @consulta:7
-- ============================================================================
-- Consulta 7: Clientes que han comprado más de una vez
-- Compras = facturas distintas. Técnicas: JOIN, COUNT DISTINCT, GROUP BY,
-- HAVING, MAX (última compra).
-- ============================================================================
SELECT
    cl.nombre                                                        AS cliente,
    ci.nombre                                                        AS ciudad_residencia,
    COUNT(DISTINCT v.id_venta)                                       AS num_compras,
    SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS ingresos_generados,
    MAX(v.fecha_venta)                                               AS ultima_compra
FROM clientes cl
INNER JOIN ciudades ci       ON ci.id_ciudad = cl.id_ciudad
INNER JOIN ventas v          ON v.id_cliente = cl.id_cliente
INNER JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
GROUP BY cl.id_cliente, cl.nombre, ci.nombre
HAVING COUNT(DISTINCT v.id_venta) > 1
ORDER BY num_compras DESC, ingresos_generados DESC;

-- @consulta:8
-- ============================================================================
-- Consulta 8: Mes con mayores ingresos
-- Agrupa por AÑO y MES (no mezcla octubre 2025 con octubre 2026).
-- Técnicas: YEAR(), MONTH(), DATE_FORMAT(), SUM, COUNT DISTINCT, LIMIT.
-- Para ver la serie completa, elimine la cláusula LIMIT 1.
-- ============================================================================
SELECT
    YEAR(v.fecha_venta)                                              AS anio,
    MONTH(v.fecha_venta)                                             AS mes,
    DATE_FORMAT(MIN(v.fecha_venta), '%Y-%m')                         AS periodo,
    COUNT(DISTINCT v.id_venta)                                       AS num_transacciones,
    SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS ingresos
FROM ventas v
INNER JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
GROUP BY YEAR(v.fecha_venta), MONTH(v.fecha_venta)
ORDER BY ingresos DESC, anio DESC, mes DESC
LIMIT 1;

-- @consulta:9
-- ============================================================================
-- Consulta 9: Participación porcentual de cada categoría en las ventas totales
-- participación = ingresos de la categoría / ingresos totales * 100.
-- NULLIF evita división por cero si no existieran ventas.
-- Técnicas: subconsulta escalar, SUM, GROUP BY, NULLIF, ROUND.
-- ============================================================================
SELECT
    cat.nombre                                                       AS categoria,
    SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS ingresos_categoria,
    ROUND(
        SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario)) * 100
        / NULLIF((SELECT SUM(d2.cantidad * (d2.precio_unitario - d2.descuento_unitario))
                    FROM detalle_ventas d2), 0)
    , 2)                                                             AS participacion_porcentual
FROM categorias cat
INNER JOIN productos p       ON p.id_categoria = cat.id_categoria
INNER JOIN detalle_ventas dv ON dv.id_producto = p.id_producto
GROUP BY cat.id_categoria, cat.nombre
ORDER BY participacion_porcentual DESC;

-- @consulta:10
-- ============================================================================
-- Consulta 10: Clientes potencialmente premium (metodología inspirada en RFM)
--
-- Variables (calculadas sobre facturas distintas, a la fecha @fecha_corte):
--   R (recencia)   = DATEDIFF(@fecha_corte, última compra) en días.
--   F (frecuencia) = número de facturas distintas.
--   M (monetario)  = ingresos netos acumulados del cliente.
--
-- Criterios (cada uno vale 1 punto):
--   C1 Frecuencia : F >= 3 compras.
--   C2 Recencia   : R <= 180 días.
--   C3 Monetario  : cliente en el 25 % superior de gasto, es decir
--                   PERCENT_RANK() OVER (ORDER BY M) >= 0.75.
--                   PERCENT_RANK = (posición - 1) / (n - 1), con n = clientes
--                   con compras; 0 = menor gasto, 1 = mayor gasto.
--
-- Segmentos (mutuamente excluyentes, según puntaje = C1 + C2 + C3):
--   Premium            : puntaje = 3 (cumple los tres criterios).
--   Potencial premium  : puntaje = 2 (cumple exactamente dos criterios).
--   Regular            : puntaje <= 1.
-- Técnicas: CTE (WITH), DATEDIFF, PERCENT_RANK(), CASE, COUNT DISTINCT.
-- ============================================================================
WITH compras_cliente AS (
    SELECT
        v.id_cliente,
        COUNT(DISTINCT v.id_venta)                                       AS frecuencia,
        SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS monetario,
        MAX(v.fecha_venta)                                               AS ultima_compra
    FROM ventas v
    INNER JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
    WHERE v.fecha_venta <= @fecha_corte
    GROUP BY v.id_cliente
),
rfm AS (
    SELECT
        cc.*,
        DATEDIFF(@fecha_corte, cc.ultima_compra)                         AS recencia_dias,
        PERCENT_RANK() OVER (ORDER BY cc.monetario)                      AS percentil_gasto
    FROM compras_cliente cc
),
puntaje AS (
    SELECT
        r.*,
        (r.frecuencia >= 3) + (r.recencia_dias <= 180) + (r.percentil_gasto >= 0.75) AS criterios_cumplidos
    FROM rfm r
)
SELECT
    cl.documento                                                     AS documento,
    cl.nombre                                                        AS cliente,
    ci.nombre                                                        AS ciudad,
    pu.frecuencia                                                    AS num_compras,
    pu.monetario                                                     AS ingresos_acumulados,
    ROUND(pu.monetario / NULLIF(pu.frecuencia, 0), 2)                AS ticket_promedio,
    pu.ultima_compra                                                 AS ultima_compra,
    pu.recencia_dias                                                 AS dias_desde_ultima_compra,
    ROUND(pu.percentil_gasto * 100, 1)                               AS percentil_gasto,
    pu.criterios_cumplidos                                           AS criterios_cumplidos,
    CASE pu.criterios_cumplidos
        WHEN 3 THEN 'Premium'
        WHEN 2 THEN 'Potencial premium'
        ELSE 'Regular'
    END                                                              AS segmento
FROM puntaje pu
INNER JOIN clientes cl ON cl.id_cliente = pu.id_cliente
INNER JOIN ciudades ci ON ci.id_ciudad = cl.id_ciudad
ORDER BY pu.criterios_cumplidos DESC, pu.monetario DESC;
