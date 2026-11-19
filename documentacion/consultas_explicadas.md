# Consultas SQL Analíticas Explicadas y Verificadas

**Script fuente:** [03_consultas_analiticas.sql](../database/03_consultas_analiticas.sql)  
**Motor de ejecución:** MySQL 8.0 (`8.0.43`)  
**Fecha de corte RFM (Consulta 10):** `2026-11-18`  
**Total general verificado:** `$ 351.210.800 COP` en `180` transacciones (`395` líneas de detalle).

---

## Convenciones matemáticas comunes

Para mantener consistencia estricta entre las diez consultas SQL, las validaciones (`04_validaciones.sql`) y el dashboard web, en todo el sistema se aplican las siguientes definiciones sobre `detalle_ventas`:

$$\text{Ingreso neto} = \sum \text{cantidad} \times (\text{precio\_unitario} - \text{descuento\_unitario})$$

$$\text{Costo total} = \sum \text{cantidad} \times \text{costo\_unitario}$$

$$\text{Utilidad} = \text{Ingreso neto} - \text{Costo total}$$

$$\text{Margen (\%)} = \frac{\text{Utilidad}}{\text{Ingreso neto}} \times 100$$

Además, toda consulta que cuenta transacciones o compras por cliente utiliza `COUNT(DISTINCT v.id_venta)`, evitando que una factura con múltiples líneas de detalle se cuente más de una vez.

---

## Consulta 1: Total vendido por ciudad

### Enunciado y objetivo
Mostrar el nombre de la ciudad, su departamento, el número de ventas y los ingresos totales generados en cada plaza, ordenados de mayor a menor. Permite conocer el peso geográfico real de la operación comercial.

### Código SQL
```sql
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
```

### Explicación técnica
- Se une `ciudades` con `ventas` mediante `v.id_ciudad` (la ciudad donde **ocurrió la venta**, no `clientes.id_ciudad`).
- Se une `detalle_ventas` para calcular el ingreso neto por línea antes de sumar por ciudad.
- `COUNT(DISTINCT v.id_venta)` garantiza contar facturas únicas y no filas de detalle.

### Resultado real de ejecución (MySQL 8.0)

| Ciudad | Departamento | Ventas | Ingresos totales (COP) |
|---|---|---:|---:|
| Bogotá | Cundinamarca | 61 | $ 128.655.400 |
| Medellín | Antioquia | 44 | $ 88.451.000 |
| Cali | Valle del Cauca | 22 | $ 38.370.800 |
| Pereira | Risaralda | 12 | $ 33.002.300 |
| Cartagena | Bolívar | 8 | $ 21.090.000 |
| Bucaramanga | Santander | 12 | $ 14.727.500 |
| Barranquilla | Atlántico | 14 | $ 14.413.000 |
| Cúcuta | Norte de Santander | 7 | $ 12.500.800 |
| **Total** | — | **180** | **$ 351.210.800** |

### Interpretación
Bogotá y Medellín concentran el **61,82 %** de la facturación nacional (`$ 217.106.400 COP` y `105` de las `180` ventas). Pereira supera a Cartagena, Bucaramanga y Barranquilla en ingresos totales pese a tener solo `12` ventas, debido a un ticket promedio elevado (`$ 2.750.192 COP`).

---

## Consulta 2: Top 3 vendedores con mayores ingresos

### Enunciado y objetivo
Identificar los tres vendedores con mayor facturación acumulada, mostrando posición, nombre, cantidad de ventas e ingresos generados.

### Código SQL
```sql
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
```

### Explicación técnica
- Agrupa por vendedor (`ve.id_vendedor, ve.nombre`) después de unir `ventas` y `detalle_ventas`.
- Emplea la función de ventana `ROW_NUMBER() OVER (...)` (compatible con MySQL 8.0) para asignar la posición `1, 2, 3` de acuerdo con el ingreso neto agregado, y `LIMIT 3` para restringir el resultado al podio.

### Resultado real de ejecución (MySQL 8.0)

| Posición | Vendedor | Ventas | Ingresos generados (COP) |
|---:|---|---:|---:|
| 1 | Juan Pablo Rodríguez | 42 | $ 90.517.400 |
| 2 | María Fernanda López | 24 | $ 68.445.200 |
| 3 | Carlos Andrés Martínez | 35 | $ 54.285.900 |

### Interpretación
Los tres primeros vendedores suman `$ 213.248.500 COP`, equivalentes al **60,72 %** de los ingresos totales de la compañía (`101` de `180` transacciones), lo que evidencia una fuerte concentración comercial en tres asesores de Medellín y Bogotá.

---

## Consulta 3: Categoría más rentable

### Enunciado y objetivo
Calcular ingresos netos, costos, utilidad absoluta y margen porcentual por categoría, identificando la categoría más rentable y diferenciándola de la categoría con mayor facturación.

### Código SQL
```sql
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
```

### Explicación técnica
- Una subconsulta agregada calcula `ingresos_netos`, `costos` y `utilidad` por categoría a partir de los valores históricos de `detalle_ventas`.
- La consulta externa calcula el margen con `NULLIF(t.ingresos_netos, 0)` para prevenir división por cero, y aplica dos funciones `RANK()` para contrastar el ordenamiento por utilidad frente al ordenamiento por facturación.

### Resultado real de ejecución (MySQL 8.0)

| Categoría | Ingresos netos (COP) | Costos (COP) | Utilidad (COP) | Margen (%) | Rank utilidad | Rank facturación |
|---|---:|---:|---:|---:|---:|---:|
| Hogar y Muebles | $ 70.215.300 | $ 44.472.100 | $ 25.743.200 | 36,66 % | 1 | 3 |
| Deportes y Outdoor | $ 77.567.400 | $ 52.190.200 | $ 25.377.200 | 32,72 % | 2 | 2 |
| Tecnología | $ 133.838.500 | $ 110.956.900 | $ 22.881.600 | 17,10 % | 3 | 1 |
| Salud y Bienestar | $ 32.248.100 | $ 16.660.800 | $ 15.587.300 | 48,34 % | 4 | 5 |
| Oficina y Papelería | $ 37.341.500 | $ 24.431.600 | $ 12.909.900 | 34,57 % | 5 | 4 |

### Interpretación
**Hogar y Muebles** es la categoría más rentable en utilidad absoluta (`$ 25.743.200 COP`), aunque ocupa el **tercer lugar** en facturación (`$ 70.215.300 COP`). En contraste, **Tecnología** lidera ampliamente la facturación (`$ 133.838.500 COP`, puesto 1), pero su bajo margen (`17,10 %`) la relega al tercer puesto en utilidad (`$ 22.881.600 COP`). Además, **Salud y Bienestar** exhibe el margen porcentual más alto (`48,34 %`).

---

## Consulta 4: Promedio de ventas por vendedor

### Enunciado y objetivo
Evaluar el número de transacciones distintas, los ingresos acumulados y el valor promedio por venta (ticket promedio) de cada uno de los diez vendedores.

### Código SQL
```sql
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
```

### Explicación técnica
- El denominador es `COUNT(DISTINCT v.id_venta)`, lo que evita el error clásico de dividir entre el número de líneas de `detalle_ventas` (395 líneas frente a 180 facturas).
- Incluye la ciudad asignada de cada vendedor mediante `JOIN` con `ciudades`.

### Resultado real de ejecución (MySQL 8.0)

| Vendedor | Ciudad asignada | Transacciones | Ingresos totales (COP) | Promedio por venta (COP) |
|---|---|---:|---:|---:|
| Diego Alejandro Morales | Pereira | 11 | $ 32.549.200 | $ 2.959.018,18 |
| María Fernanda López | Bogotá | 24 | $ 68.445.200 | $ 2.851.883,33 |
| Valentina Sofía Castro | Cartagena | 8 | $ 21.090.000 | $ 2.636.250,00 |
| Juan Pablo Rodríguez | Medellín | 42 | $ 90.517.400 | $ 2.155.176,19 |
| Daniela Alejandra Ruiz | Cúcuta | 7 | $ 12.500.800 | $ 1.785.828,57 |
| Laura Valentina Torres | Cali | 22 | $ 38.370.800 | $ 1.744.127,27 |
| Carlos Andrés Martínez | Bogotá | 35 | $ 54.285.900 | $ 1.551.025,71 |
| Camila Andrea Vargas | Medellín | 6 | $ 7.951.000 | $ 1.325.166,67 |
| Santiago David Herrera | Bucaramanga | 12 | $ 14.727.500 | $ 1.227.291,67 |
| Andrés Felipe Gómez | Barranquilla | 13 | $ 10.773.000 | $ 828.692,31 |

### Interpretación
Se observa una diferencia clara entre volumen total y productividad por factura: **Diego Alejandro Morales** (Pereira) y **María Fernanda López** (Bogotá) logran los tickets promedio más altos (`$ 2.959.018` y `$ 2.851.883 COP`), mientras que **Juan Pablo Rodríguez** lidera la facturación total principalmente por alto volumen de cierres (`42` facturas).

---

## Consulta 5: Productos cuyo valor total vendido supera el promedio general

### Enunciado y objetivo
Identificar los artículos del catálogo cuyo ingreso neto acumulado supera el promedio general de ingresos acumulados por producto, utilizando obligatoriamente una subconsulta.

### Código SQL
```sql
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
```

### Explicación técnica
- **Qué representa el promedio:** La subconsulta derivada `x` primero suma el ingreso acumulado de cada uno de los `30` productos con ventas (`GROUP BY d2.id_producto`) y luego promedia esos `30` totales (`$ 351.210.800 / 30 = $ 11.707.026,67 COP`). No es el promedio por línea de detalle, sino el promedio por producto.
- La cláusula `HAVING` filtra únicamente los productos cuyo `ingreso_total` supera ese umbral.

### Resultado real de ejecución (MySQL 8.0)

| SKU | Producto | Categoría | Unidades | Ingreso total (COP) | Promedio referencia (COP) |
|---|---|---|---:|---:|---:|
| TEC-001 | Laptop Empresarial 15.6 pulgadas | Tecnología | 23 | $ 70.009.600 | $ 11.707.026,67 |
| DEP-001 | Bicicleta de Montaña Rin 29 | Deportes y Outdoor | 19 | $ 43.684.800 | $ 11.707.026,67 |
| TEC-002 | Monitor LED 27 pulgadas 4K | Tecnología | 13 | $ 22.890.000 | $ 11.707.026,67 |
| OFI-001 | Impresora Multifuncional WiFi | Oficina y Papelería | 24 | $ 20.063.300 | $ 11.707.026,67 |
| HOG-002 | Silla Ergonómica Premium | Hogar y Muebles | 12 | $ 19.140.200 | $ 11.707.026,67 |
| HOG-006 | Aspiradora Robot Inteligente | Hogar y Muebles | 20 | $ 18.448.500 | $ 11.707.026,67 |
| TEC-004 | Mouse Ergonómico Inalámbrico | Tecnología | 85 | $ 14.822.000 | $ 11.707.026,67 |
| HOG-001 | Escritorio Ajustable Eléctrico | Hogar y Muebles | 9 | $ 12.251.100 | $ 11.707.026,67 |

### Interpretación
Solo **8 de los 30 productos** (`26,7 %` del catálogo) superan el promedio general por producto, pero esos 8 artículos generan en conjunto `$ 221.309.500 COP`, es decir, el **63,01 %** de toda la facturación de la empresa.

---

## Consulta 6: Ciudades con ventas superiores al promedio nacional

### Enunciado y objetivo
Determinar qué ciudades superan el ingreso promedio nacional por ciudad.

### Código SQL
```sql
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
```

### Explicación técnica
- La subconsulta `z` calcula el ingreso total de cada una de las 8 ciudades y luego promedia esos 8 totales (`$ 351.210.800 / 8 = $ 43.901.350,00 COP`). Esto evita confundir el promedio por ciudad con el promedio por factura (`$ 1.951.171,11 COP`).

### Resultado real de ejecución (MySQL 8.0)

| Ciudad | Ventas | Ingresos ciudad (COP) | Promedio nacional por ciudad (COP) |
|---|---:|---:|---:|
| Bogotá | 61 | $ 128.655.400 | $ 43.901.350,00 |
| Medellín | 44 | $ 88.451.000 | $ 43.901.350,00 |

### Interpretación
Únicamente **Bogotá** y **Medellín** superan el promedio nacional por ciudad (`$ 43,90 M COP`), mientras que las seis ciudades restantes se ubican por debajo (`Cali`, la tercera, alcanza `$ 38,37 M COP`).

---

## Consulta 7: Clientes con compras repetidas

### Enunciado y objetivo
Listar los clientes que hayan realizado más de una transacción, mostrando su ciudad de residencia, cantidad de compras, ingresos generados y fecha de su última compra.

### Código SQL
```sql
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
```

### Explicación técnica
- Usa `INNER JOIN` para relacionar clientes, su ciudad de residencia, sus facturas y sus líneas de detalle.
- `GROUP BY cl.id_cliente, ...` acompañado de `HAVING COUNT(DISTINCT v.id_venta) > 1` filtra únicamente compradores recurrentes.
- `MAX(v.fecha_venta)` obtiene la fecha de la transacción más reciente.

### Resultado real de ejecución (MySQL 8.0 — 23 clientes)

| Cliente | Ciudad residencia | Compras | Ingresos (COP) | Última compra |
|---|---|---:|---:|---|
| Ana María Gutiérrez | Bogotá | 20 | $ 32.881.900 | 2026-09-22 |
| Jorge Enrique Salazar | Medellín | 20 | $ 30.408.600 | 2026-10-12 |
| Pedro José Ramírez | Bogotá | 16 | $ 38.740.000 | 2026-09-17 |
| Hernán David Quintero | Cali | 13 | $ 19.155.900 | 2026-08-28 |
| Natalia Andrea Duarte | Medellín | 11 | $ 25.251.700 | 2026-10-20 |
| Esteban Camilo Lozano | Barranquilla | 9 | $ 12.960.900 | 2026-06-05 |
| Christian Eduardo Peña | Pereira | 8 | $ 16.990.400 | 2026-10-03 |
| Roberto Carlos Mejía | Bogotá | 8 | $ 12.293.500 | 2026-02-14 |
| Felipe Antonio Díaz | Bogotá | 7 | $ 21.106.900 | 2026-09-20 |
| Lucía del Carmen Peña | Bogotá | 7 | $ 15.450.300 | 2026-10-24 |
| Óscar Mauricio Pardo | Medellín | 7 | $ 9.933.200 | 2026-09-23 |
| Álvaro Javier Pineda | Cali | 6 | $ 14.100.400 | 2026-10-13 |
| Claudia Milena Rojas | Cúcuta | 6 | $ 8.604.400 | 2026-08-21 |
| Mauricio Alejandro Gil | Cartagena | 6 | $ 7.633.400 | 2026-10-08 |
| Angélica María Suárez | Bucaramanga | 5 | $ 9.208.700 | 2026-09-25 |
| Iván Darío Castaño | Bucaramanga | 5 | $ 6.444.700 | 2026-07-09 |
| Luisa Fernanda Monroy | Barranquilla | 5 | $ 5.588.900 | 2026-10-31 |
| Camila Fernanda Acosta | Medellín | 4 | $ 9.012.900 | 2025-06-26 |
| Paola Alexandra Medina | Medellín | 3 | $ 9.686.900 | 2026-09-13 |
| Mónica Liliana Cárdenas | Cali | 3 | $ 1.636.700 | 2026-10-04 |
| Carolina Isabel Ríos | Bogotá | 2 | $ 10.898.200 | 2026-10-07 |
| Julio César Bermúdez | Cúcuta | 2 | $ 4.577.900 | 2026-02-17 |
| Diana Carolina Flórez | Bucaramanga | 2 | $ 1.501.300 | 2026-06-06 |

### Interpretación
De los `28` clientes con al menos una compra registrada (de `30` registrados), **23 (`82,14 %`)** han comprado más de una vez, lo cual refleja una base sólida de fidelidad recurrente.

---

## Consulta 8: Mes con mayores ingresos

### Enunciado y objetivo
Identificar el mes calendario específico (sin mezclar años distintos) en el que se obtuvieron los mayores ingresos.

### Código SQL
```sql
SELECT
    YEAR(v.fecha_venta)                                              AS anio,
    MONTH(v.fecha_venta)                                            AS mes,
    DATE_FORMAT(MIN(v.fecha_venta), '%Y-%m')                         AS periodo,
    COUNT(DISTINCT v.id_venta)                                       AS num_transacciones,
    SUM(dv.cantidad * (dv.precio_unitario - dv.descuento_unitario))  AS ingresos
FROM ventas v
INNER JOIN detalle_ventas dv ON dv.id_venta = v.id_venta
GROUP BY YEAR(v.fecha_venta), MONTH(v.fecha_venta)
ORDER BY ingresos DESC, anio DESC, mes DESC
LIMIT 1;
```

### Explicación técnica
- `GROUP BY YEAR(v.fecha_venta), MONTH(v.fecha_venta)` distingue enero–octubre de 2025 respecto a enero–octubre de 2026 (22 periodos mensuales en total).
- `DATE_FORMAT(MIN(v.fecha_venta), '%Y-%m')` entrega una etiqueta legible compatible con el modo `ONLY_FULL_GROUP_BY` de MySQL 8.0.

### Resultado real de ejecución (MySQL 8.0)

| Año | Mes | Periodo | Transacciones | Ingresos (COP) |
|---:|---:|---|---:|---:|
| 2025 | 12 | `2025-12` | 25 | $ 37.918.900 |

### Interpretación
**Diciembre de 2025** fue el mes de mayor facturación (`$ 37.918.900 COP` en `25` transacciones), reflejando el efecto estacional de fin de año. En 2026, cuyo corte llega hasta octubre, los meses más altos fueron **julio de 2026** (`$ 31.597.200 COP`) y **septiembre de 2026** (`$ 29.954.000 COP`).

---

## Consulta 9: Participación porcentual de cada categoría en las ventas totales

### Enunciado y objetivo
Calcular el porcentaje de participación de cada categoría sobre la facturación total, garantizando que la suma se aproxime al 100 % y previniendo divisiones por cero.

### Código SQL
```sql
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
```

### Explicación técnica
- La subconsulta escalar calcula la facturación neta total de la tabla `detalle_ventas`.
- `NULLIF(..., 0)` devuelve `NULL` en lugar de generar un error de división por cero si no hubiera registros.

### Resultado real de ejecución (MySQL 8.0)

| Categoría | Ingresos categoría (COP) | Participación (%) |
|---|---:|---:|
| Tecnología | $ 133.838.500 | 38,11 % |
| Deportes y Outdoor | $ 77.567.400 | 22,09 % |
| Hogar y Muebles | $ 70.215.300 | 19,99 % |
| Oficina y Papelería | $ 37.341.500 | 10,63 % |
| Salud y Bienestar | $ 32.248.100 | 9,18 % |
| **Suma total** | **$ 351.210.800** | **100,00 %** |

---

## Consulta 10: Identificación de clientes potencialmente premium (metodología RFM)

### Enunciado, criterios y justificación
Detectar y segmentar a los clientes activos utilizando una regla transparente basada en tres dimensiones **RFM**, con fecha de corte configurable (`@fecha_corte = '2026-11-18'`):

1. **Criterio 1 — Frecuencia (`F ≥ 3`):** El cliente ha realizado al menos `3` compras (facturas distintas) hasta la fecha de corte. Descarta compras aisladas o fortuitas.
2. **Criterio 2 — Recencia (`R ≤ 180 días`):** Su última compra ocurrió dentro de los `180` días anteriores al `2026-11-18` (desde `2026-05-22`). Asegura vigencia comercial y evita clasificar como "premium" a clientes perdidos hace más de un semestre.
3. **Criterio 3 — Valor monetario (`PERCENT_RANK ≥ 0,75`):** Su gasto acumulado se encuentra en el **25 % superior** de los compradores según `PERCENT_RANK() OVER (ORDER BY monetario)`. En MySQL 8.0, `PERCENT_RANK` asigna valores entre `0` (menor gasto) y `1` (mayor gasto) según `(posición - 1) / (n - 1)`, adaptándose automáticamente al volumen del periodo.

### Reglas de clasificación (mutuamente excluyentes)
Cada criterio cumplido suma `1` punto (`criterios_cumplidos ∈ {0, 1, 2, 3}`):
- **Premium (`3 puntos`):** cumple los tres criterios simultáneamente (alta frecuencia, compra reciente y top 25 % en gasto).
- **Potencial premium (`2 puntos`):** cumple exactamente dos criterios (por ejemplo, frecuencia alta y recencia vigente, pero aún por debajo del umbral del 25 % superior en gasto; son candidatos inmediatos a *upselling* o venta cruzada).
- **Regular (`0 o 1 punto`):** cumple uno o ningún criterio.

### Código SQL
```sql
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
    cl.documento,
    cl.nombre                                                        AS cliente,
    ci.nombre                                                        AS ciudad,
    pu.frecuencia                                                    AS num_compras,
    pu.monetario                                                     AS ingresos_acumulados,
    ROUND(pu.monetario / NULLIF(pu.frecuencia, 0), 2)                AS ticket_promedio,
    pu.ultima_compra,
    pu.recencia_dias                                                 AS dias_desde_ultima_compra,
    ROUND(pu.percentil_gasto * 100, 1)                               AS percentil_gasto,
    pu.criterios_cumplidos,
    CASE pu.criterios_cumplidos
        WHEN 3 THEN 'Premium'
        WHEN 2 THEN 'Potencial premium'
        ELSE 'Regular'
    END                                                              AS segmento
FROM puntaje pu
INNER JOIN clientes cl ON cl.id_cliente = pu.id_cliente
INNER JOIN ciudades ci ON ci.id_ciudad = cl.id_ciudad
ORDER BY pu.criterios_cumplidos DESC, pu.monetario DESC;
```

### Resumen de resultados reales (28 clientes con compras)

| Segmento | Clientes | Ingresos acumulados (COP) | Participación en ingresos | Ticket promedio (COP) |
|---|---:|---:|---:|---:|
| **Premium** | 7 | $ 184.535.400 | 52,54 % | $ 1.942.478 |
| **Potencial premium** | 11 | $ 101.248.500 | 28,83 % | $ 1.633.040 |
| **Regular** | 10 | $ 65.426.900 | 18,63 % | $ 2.844.648 |
| **Total** | **28** | **$ 351.210.800** | **100,00 %** | **$ 1.951.171** |

*(Nota: los 2 clientes registrados restantes —`Fabián Andrés Ortega` y `Miguel Ángel Restrepo`— no registran facturas emitidas en el periodo, por lo que no ingresan al cálculo RFM sobre `ventas`; en el módulo web `Clientes` se informa explícitamente la cobertura frente al total de `30` clientes registrados).*

### Limitaciones del modelo RFM y comportamiento en casos límite
1. **Clientes sin compras:** Como la CTE parte de `ventas`, los clientes registrados sin transacciones (`2` de `30`) quedan excluidos del ranking porcentual para no distorsionar `PERCENT_RANK`.
2. **Conjuntos pequeños y empates:** Con un solo comprador filtrado (`n = 1`), `PERCENT_RANK()` devuelve `0,0` por definición del estándar SQL, por lo que ningún cliente alcanza el cuartil `≥ 0,75`; si existen empates exactos en `monetario`, ambos reciben el mismo `PERCENT_RANK`.
3. **Ausencia de rentabilidad individual:** La métrica monetaria (`M`) pondera ingresos netos y no utilidad neta por cliente, por lo que un cliente que compre exclusivamente artículos de bajo margen puede ubicarse en `Premium`.
4. **Sensibilidad a la fecha de corte:** Al cambiar `@fecha_corte` (disponible en el endpoint y en la vista `Clientes`), se recalculan tanto `recencia_dias` como la ventana de transacciones válidas (`fecha_venta <= @fecha_corte`), conservando intactos los resultados del corte académico `2026-11-18`.

#### Detalle de los 7 clientes **Premium**
| Documento | Cliente | Ciudad | Compras | Ingresos (COP) | Ticket prom. (COP) | Última compra | Días | Percentil |
|---|---|---|---:|---:|---:|---|---:|---:|
| 1000115838 | Pedro José Ramírez | Bogotá | 16 | $ 38.740.000 | $ 2.421.250 | 2026-09-17 | 62 | 100,0 |
| 1000107919 | Ana María Gutiérrez | Bogotá | 20 | $ 32.881.900 | $ 1.644.095 | 2026-09-22 | 57 | 96,3 |
| 1000163352 | Jorge Enrique Salazar | Medellín | 20 | $ 30.408.600 | $ 1.520.430 | 2026-10-12 | 37 | 92,6 |
| 1000171271 | Natalia Andrea Duarte | Medellín | 11 | $ 25.251.700 | $ 2.295.609 | 2026-10-20 | 29 | 88,9 |
| 1000147514 | Felipe Antonio Díaz | Bogotá | 7 | $ 21.106.900 | $ 3.015.271 | 2026-09-20 | 59 | 85,2 |
| 1000210866 | Hernán David Quintero | Cali | 13 | $ 19.155.900 | $ 1.473.531 | 2026-08-28 | 82 | 81,5 |
| 1000321732 | Christian Eduardo Peña | Pereira | 8 | $ 16.990.400 | $ 2.123.800 | 2026-10-03 | 46 | 77,8 |

### Utilidad comercial
Los **7 clientes Premium** (apenas el `25 %` de la cartera compradora) generan el **52,54 %** de los ingresos totales. Al mismo tiempo, dos clientes frecuentes históricos (`Roberto Carlos Mejía` con 8 compras / `$ 12,29 M` y `Camila Fernanda Acosta` con 4 compras / `$ 9,01 M`) quedaron clasificados en `Regular` porque superaron los `180` días sin comprar (`277` y `510` días respectivamente), evidenciando fuga o inactividad que el equipo comercial puede reactivar.
