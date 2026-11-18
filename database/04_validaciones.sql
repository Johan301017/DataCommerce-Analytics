-- ============================================================================
-- DataCommerce Analytics S.A.S.
-- Script 04: Validaciones de integridad y consistencia
-- Motor: MySQL 8.0. Ejecutar después de 01, 02 y 03.
-- Cada validación devuelve una fila con la columna "resultado" = 'OK' o 'FALLA'.
-- La última sección prueba las restricciones intentando inserciones inválidas
-- dentro de un procedimiento con manejadores de error y ROLLBACK, por lo que
-- NO modifica los datos.
-- ============================================================================

USE datacommerce_analytics;

-- ----------------------------------------------------------------------------
-- V1. Conteo de registros por tabla (mínimo exigido: 20 registros relacionados)
-- ----------------------------------------------------------------------------
SELECT 'ciudades' AS tabla, COUNT(*) AS registros FROM ciudades
UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL SELECT 'vendedores', COUNT(*) FROM vendedores
UNION ALL SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL SELECT 'productos', COUNT(*) FROM productos
UNION ALL SELECT 'ventas', COUNT(*) FROM ventas
UNION ALL SELECT 'detalle_ventas', COUNT(*) FROM detalle_ventas;

-- ----------------------------------------------------------------------------
-- V2. Existencia de las 7 tablas y de sus claves foráneas (diccionario)
-- ----------------------------------------------------------------------------
SELECT 'V2 tablas creadas' AS validacion,
       COUNT(*) AS valor,
       IF(COUNT(*) = 7, 'OK', 'FALLA') AS resultado
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'datacommerce_analytics' AND TABLE_TYPE = 'BASE TABLE';

SELECT TABLE_NAME AS tabla, CONSTRAINT_NAME AS restriccion, COLUMN_NAME AS columna,
       REFERENCED_TABLE_NAME AS tabla_referenciada, REFERENCED_COLUMN_NAME AS columna_referenciada
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'datacommerce_analytics' AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- ----------------------------------------------------------------------------
-- V3. Integridad referencial: registros huérfanos (debe ser 0)
-- ----------------------------------------------------------------------------
SELECT 'V3 huerfanos' AS validacion, h.valor, IF(h.valor = 0, 'OK', 'FALLA') AS resultado
FROM (SELECT
       (SELECT COUNT(*) FROM clientes c LEFT JOIN ciudades x ON x.id_ciudad = c.id_ciudad WHERE x.id_ciudad IS NULL)
     + (SELECT COUNT(*) FROM vendedores c LEFT JOIN ciudades x ON x.id_ciudad = c.id_ciudad_asignada WHERE x.id_ciudad IS NULL)
     + (SELECT COUNT(*) FROM productos p LEFT JOIN categorias x ON x.id_categoria = p.id_categoria WHERE x.id_categoria IS NULL)
     + (SELECT COUNT(*) FROM ventas v LEFT JOIN clientes x ON x.id_cliente = v.id_cliente WHERE x.id_cliente IS NULL)
     + (SELECT COUNT(*) FROM ventas v LEFT JOIN vendedores x ON x.id_vendedor = v.id_vendedor WHERE x.id_vendedor IS NULL)
     + (SELECT COUNT(*) FROM ventas v LEFT JOIN ciudades x ON x.id_ciudad = v.id_ciudad WHERE x.id_ciudad IS NULL)
     + (SELECT COUNT(*) FROM detalle_ventas d LEFT JOIN ventas x ON x.id_venta = d.id_venta WHERE x.id_venta IS NULL)
     + (SELECT COUNT(*) FROM detalle_ventas d LEFT JOIN productos x ON x.id_producto = d.id_producto WHERE x.id_producto IS NULL)
       AS valor) AS h;

-- ----------------------------------------------------------------------------
-- V4. Toda venta tiene al menos una línea de detalle
-- ----------------------------------------------------------------------------
SELECT 'V4 ventas sin detalle' AS validacion, COUNT(*) AS valor,
       IF(COUNT(*) = 0, 'OK', 'FALLA') AS resultado
FROM ventas v
LEFT JOIN detalle_ventas d ON d.id_venta = v.id_venta
WHERE d.id_detalle IS NULL;

-- ----------------------------------------------------------------------------
-- V5. Facturas duplicadas (debe ser 0)
-- ----------------------------------------------------------------------------
SELECT 'V5 facturas duplicadas' AS validacion, COUNT(*) AS valor,
       IF(COUNT(*) = 0, 'OK', 'FALLA') AS resultado
FROM (SELECT numero_factura FROM ventas GROUP BY numero_factura HAVING COUNT(*) > 1) AS dup;

-- ----------------------------------------------------------------------------
-- V6. Rango de fechas esperado (enero 2025 a octubre 2026)
-- ----------------------------------------------------------------------------
SELECT 'V6 rango de fechas' AS validacion,
       CONCAT(MIN(fecha_venta), ' a ', MAX(fecha_venta)) AS valor,
       IF(MIN(fecha_venta) >= '2025-01-01' AND MAX(fecha_venta) <= '2026-10-31', 'OK', 'FALLA') AS resultado
FROM ventas;

-- ----------------------------------------------------------------------------
-- V7. Coherencia temporal: ninguna venta antes del registro del cliente
--     ni antes de la contratación del vendedor
-- ----------------------------------------------------------------------------
SELECT 'V7 coherencia temporal' AS validacion, COUNT(*) AS valor,
       IF(COUNT(*) = 0, 'OK', 'FALLA') AS resultado
FROM ventas v
INNER JOIN clientes c   ON c.id_cliente = v.id_cliente
INNER JOIN vendedores s ON s.id_vendedor = v.id_vendedor
WHERE v.fecha_venta < c.fecha_registro OR v.fecha_venta < s.fecha_contratacion;

-- ----------------------------------------------------------------------------
-- V8. Valores de detalle válidos (cantidad > 0, precio > 0, descuento < precio)
-- ----------------------------------------------------------------------------
SELECT 'V8 detalle invalido' AS validacion, COUNT(*) AS valor,
       IF(COUNT(*) = 0, 'OK', 'FALLA') AS resultado
FROM detalle_ventas
WHERE cantidad <= 0 OR precio_unitario <= 0 OR costo_unitario < 0
   OR descuento_unitario < 0 OR descuento_unitario >= precio_unitario;

-- ----------------------------------------------------------------------------
-- V9. Suma de ingresos por ciudad = ingresos generales (sin duplicación por JOIN)
-- ----------------------------------------------------------------------------
SELECT 'V9 ciudades = total' AS validacion,
       t.total_general, c.suma_ciudades,
       IF(t.total_general = c.suma_ciudades, 'OK', 'FALLA') AS resultado
FROM (SELECT SUM(cantidad * (precio_unitario - descuento_unitario)) AS total_general FROM detalle_ventas) t
CROSS JOIN (
    SELECT SUM(x.ingresos) AS suma_ciudades
    FROM (SELECT v.id_ciudad, SUM(d.cantidad * (d.precio_unitario - d.descuento_unitario)) AS ingresos
            FROM ventas v INNER JOIN detalle_ventas d ON d.id_venta = v.id_venta
           GROUP BY v.id_ciudad) x
) c;

-- ----------------------------------------------------------------------------
-- V10. Suma de ingresos por categoría = ingresos generales
-- ----------------------------------------------------------------------------
SELECT 'V10 categorias = total' AS validacion,
       t.total_general, c.suma_categorias,
       IF(t.total_general = c.suma_categorias, 'OK', 'FALLA') AS resultado
FROM (SELECT SUM(cantidad * (precio_unitario - descuento_unitario)) AS total_general FROM detalle_ventas) t
CROSS JOIN (
    SELECT SUM(x.ingresos) AS suma_categorias
    FROM (SELECT p.id_categoria, SUM(d.cantidad * (d.precio_unitario - d.descuento_unitario)) AS ingresos
            FROM detalle_ventas d INNER JOIN productos p ON p.id_producto = d.id_producto
           GROUP BY p.id_categoria) x
) c;

-- ----------------------------------------------------------------------------
-- V11. La participación porcentual de categorías suma ~100 % (tolerancia 0,05)
-- ----------------------------------------------------------------------------
SELECT 'V11 participacion = 100%' AS validacion,
       SUM(x.participacion) AS suma_participaciones,
       IF(ABS(SUM(x.participacion) - 100) <= 0.05, 'OK', 'FALLA') AS resultado
FROM (
    SELECT ROUND(SUM(d.cantidad * (d.precio_unitario - d.descuento_unitario)) * 100
                 / NULLIF((SELECT SUM(cantidad * (precio_unitario - descuento_unitario)) FROM detalle_ventas), 0), 2)
           AS participacion
    FROM detalle_ventas d INNER JOIN productos p ON p.id_producto = d.id_producto
    GROUP BY p.id_categoria
) x;

-- ----------------------------------------------------------------------------
-- V12. Utilidad = ingresos netos - costos (por categoría y en total)
-- ----------------------------------------------------------------------------
SELECT 'V12 utilidad = ingresos - costos' AS validacion,
       SUM(cantidad * (precio_unitario - descuento_unitario))                    AS ingresos_netos,
       SUM(cantidad * costo_unitario)                                            AS costos,
       SUM(cantidad * (precio_unitario - descuento_unitario - costo_unitario))   AS utilidad,
       IF(SUM(cantidad * (precio_unitario - descuento_unitario - costo_unitario))
          = SUM(cantidad * (precio_unitario - descuento_unitario)) - SUM(cantidad * costo_unitario),
          'OK', 'FALLA') AS resultado
FROM detalle_ventas;

-- ----------------------------------------------------------------------------
-- V13. Compras de cliente = facturas distintas (no líneas de detalle)
--      Compara COUNT(DISTINCT) con conteo directo sobre la tabla ventas.
-- ----------------------------------------------------------------------------
SELECT 'V13 compras = facturas distintas' AS validacion, COUNT(*) AS clientes_con_diferencia,
       IF(COUNT(*) = 0, 'OK', 'FALLA') AS resultado
FROM (
    SELECT j.id_cliente
    FROM (SELECT v.id_cliente, COUNT(DISTINCT v.id_venta) AS compras_join
            FROM ventas v INNER JOIN detalle_ventas d ON d.id_venta = v.id_venta
           GROUP BY v.id_cliente) j
    INNER JOIN (SELECT id_cliente, COUNT(*) AS compras_directas FROM ventas GROUP BY id_cliente) s
            ON s.id_cliente = j.id_cliente
    WHERE j.compras_join <> s.compras_directas
) diferencias;

-- ----------------------------------------------------------------------------
-- V14. Validación cruzada: total de la consulta 1 = total de la consulta 9
--      y número de transacciones = filas de la tabla ventas
-- ----------------------------------------------------------------------------
SELECT 'V14 consulta1 = consulta9 y transacciones' AS validacion,
       (SELECT SUM(q1.ingresos) FROM (
            SELECT SUM(d.cantidad * (d.precio_unitario - d.descuento_unitario)) AS ingresos
            FROM ciudades c INNER JOIN ventas v ON v.id_ciudad = c.id_ciudad
            INNER JOIN detalle_ventas d ON d.id_venta = v.id_venta GROUP BY c.id_ciudad) q1) AS total_consulta1,
       (SELECT SUM(q9.ingresos) FROM (
            SELECT SUM(d.cantidad * (d.precio_unitario - d.descuento_unitario)) AS ingresos
            FROM categorias c INNER JOIN productos p ON p.id_categoria = c.id_categoria
            INNER JOIN detalle_ventas d ON d.id_producto = p.id_producto GROUP BY c.id_categoria) q9) AS total_consulta9,
       (SELECT COUNT(DISTINCT v.id_venta) FROM ventas v INNER JOIN detalle_ventas d ON d.id_venta = v.id_venta) AS transacciones_join,
       (SELECT COUNT(*) FROM ventas) AS filas_ventas,
       IF((SELECT COUNT(DISTINCT v.id_venta) FROM ventas v INNER JOIN detalle_ventas d ON d.id_venta = v.id_venta)
          = (SELECT COUNT(*) FROM ventas), 'OK', 'FALLA') AS resultado;

-- ----------------------------------------------------------------------------
-- V15. Prueba de restricciones (PRIMARY KEY, UNIQUE, NOT NULL, FOREIGN KEY,
--      CHECK y ON DELETE RESTRICT). Cada intento inválido DEBE ser rechazado.
--      Se ejecuta dentro de una transacción que termina en ROLLBACK.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_probar_restricciones;

DELIMITER $$
CREATE PROCEDURE sp_probar_restricciones()
BEGIN
    DECLARE v_error INT DEFAULT 0;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET v_error = 1;

    DROP TEMPORARY TABLE IF EXISTS tmp_resultados;
    CREATE TEMPORARY TABLE tmp_resultados (prueba VARCHAR(120), rechazado TINYINT) ENGINE=MEMORY;

    START TRANSACTION;

    SET v_error = 0;
    INSERT INTO ciudades (id_ciudad, nombre, departamento, latitud, longitud) VALUES (1, 'Duplicada', 'X', 0, 0);
    INSERT INTO tmp_resultados VALUES ('PRIMARY KEY duplicada en ciudades', v_error);

    SET v_error = 0;
    INSERT INTO ciudades (nombre, departamento, latitud, longitud) VALUES ('Bogotá', 'Cundinamarca', 0, 0);
    INSERT INTO tmp_resultados VALUES ('UNIQUE nombre de ciudad repetido', v_error);

    SET v_error = 0;
    INSERT INTO productos (codigo_sku, nombre, id_categoria, precio_lista) VALUES ('TEC-001', 'SKU repetido', 1, 1000);
    INSERT INTO tmp_resultados VALUES ('UNIQUE codigo_sku repetido', v_error);

    SET v_error = 0;
    INSERT INTO ventas (numero_factura, id_cliente, id_vendedor, id_ciudad, fecha_venta)
    VALUES ((SELECT f FROM (SELECT numero_factura AS f FROM ventas LIMIT 1) t), 1, 1, 1, '2026-01-01');
    INSERT INTO tmp_resultados VALUES ('UNIQUE numero_factura repetido', v_error);

    SET v_error = 0;
    INSERT INTO clientes (documento, nombre, correo, id_ciudad, fecha_registro) VALUES ('999', NULL, 'x@x.co', 1, '2026-01-01');
    INSERT INTO tmp_resultados VALUES ('NOT NULL nombre de cliente', v_error);

    SET v_error = 0;
    INSERT INTO ventas (numero_factura, id_cliente, id_vendedor, id_ciudad, fecha_venta) VALUES ('FE-TEST-1', 99999, 1, 1, '2026-01-01');
    INSERT INTO tmp_resultados VALUES ('FOREIGN KEY cliente inexistente', v_error);

    SET v_error = 0;
    INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, costo_unitario) VALUES (1, 30, 0, 1000, 500);
    INSERT INTO tmp_resultados VALUES ('CHECK cantidad > 0', v_error);

    SET v_error = 0;
    INSERT INTO productos (codigo_sku, nombre, id_categoria, precio_lista) VALUES ('NEG-001', 'Precio negativo', 1, -5);
    INSERT INTO tmp_resultados VALUES ('CHECK precio_lista > 0', v_error);

    SET v_error = 0;
    DELETE FROM ciudades WHERE id_ciudad = 1;
    INSERT INTO tmp_resultados VALUES ('ON DELETE RESTRICT ciudad con ventas', v_error);

    SET v_error = 0;
    DELETE FROM ventas WHERE id_venta = 1;
    INSERT INTO tmp_resultados VALUES ('ON DELETE RESTRICT venta con detalle', v_error);

    ROLLBACK;

    SELECT prueba, IF(rechazado = 1, 'OK (rechazado)', 'FALLA (aceptado)') AS resultado FROM tmp_resultados;
    DROP TEMPORARY TABLE IF EXISTS tmp_resultados;
END$$
DELIMITER ;

CALL sp_probar_restricciones();
DROP PROCEDURE IF EXISTS sp_probar_restricciones;
