# Diccionario de Datos — `datacommerce_analytics`

**Motor:** MySQL 8.0 (`InnoDB`) · **Codificación:** `utf8mb4_unicode_ci` · **Moneda:** Pesos Colombianos (`COP`)  
**Script fuente:** [01_esquema.sql](../database/01_esquema.sql)

---

## 1. Tabla `ciudades`

Catálogo de ciudades colombianas donde opera DataCommerce Analytics S.A.S. Incluye coordenadas geográficas para el módulo de análisis espacial.

| Campo | Tipo de dato | Nulo | Clave / Restricciones | Por defecto | Descripción | Ejemplo |
|---|---|---|---|---|---|---|
| `id_ciudad` | `INT` | `NO` | `PK` (`pk_ciudades`), `AUTO_INCREMENT` | — | Identificador único de la ciudad | `1` |
| `nombre` | `VARCHAR(100)` | `NO` | `UNIQUE` (`uq_ciudad_nombre`) | — | Nombre oficial de la ciudad | `Bogotá` |
| `departamento` | `VARCHAR(100)` | `NO` | — | — | Departamento de Colombia | `Cundinamarca` |
| `latitud` | `DECIMAL(10, 7)` | `NO` | — | — | Coordenada de latitud (WGS84) | `4.7110000` |
| `longitud` | `DECIMAL(10, 7)` | `NO` | — | — | Coordenada de longitud (WGS84) | `-74.0721000` |
| `poblacion` | `INT` | `SÍ` | — | `NULL` | Población aproximada de referencia | `7900000` |
| `created_at` | `TIMESTAMP` | `NO` | — | `CURRENT_TIMESTAMP` | Fecha y hora de creación del registro | `2026-11-18 09:18:26` |

---

## 2. Tabla `clientes`

Registro maestro de clientes (datos sintéticos ficticios).

| Campo | Tipo de dato | Nulo | Clave / Restricciones | Por defecto | Descripción | Ejemplo |
|---|---|---|---|---|---|---|
| `id_cliente` | `INT` | `NO` | `PK` (`pk_clientes`), `AUTO_INCREMENT` | — | Identificador único del cliente | `1` |
| `documento` | `VARCHAR(20)` | `NO` | `UNIQUE` (`uq_cliente_documento`) | — | Número de documento ficticio | `1000107919` |
| `nombre` | `VARCHAR(150)` | `NO` | — | — | Nombre completo del cliente | `Ana María Gutiérrez` |
| `correo` | `VARCHAR(200)` | `NO` | `UNIQUE` (`uq_cliente_correo`) | — | Correo electrónico ficticio de contacto | `ana.gutierrez01@correo-ficticio.co` |
| `id_ciudad` | `INT` | `NO` | `FK` (`fk_clientes_ciudad`) → `ciudades(id_ciudad)`, `IDX` | — | Ciudad de residencia del cliente | `1` |
| `fecha_registro` | `DATE` | `NO` | `IDX` (`idx_clientes_fecha_registro`) | — | Fecha de alta del cliente | `2024-09-12` |

---

## 3. Tabla `vendedores`

Asesores comerciales vinculados a la empresa.

| Campo | Tipo de dato | Nulo | Clave / Restricciones | Por defecto | Descripción | Ejemplo |
|---|---|---|---|---|---|---|
| `id_vendedor` | `INT` | `NO` | `PK` (`pk_vendedores`), `AUTO_INCREMENT` | — | Identificador único del vendedor | `3` |
| `nombre` | `VARCHAR(150)` | `NO` | — | — | Nombre completo del vendedor | `Juan Pablo Rodríguez` |
| `correo` | `VARCHAR(200)` | `NO` | `UNIQUE` (`uq_vendedor_correo`) | — | Correo corporativo ficticio | `juan.rodriguez@datacommerce.co` |
| `id_ciudad_asignada` | `INT` | `NO` | `FK` (`fk_vendedores_ciudad`) → `ciudades(id_ciudad)`, `IDX` | — | Plaza principal asignada al vendedor | `2` |
| `fecha_contratacion` | `DATE` | `NO` | — | — | Fecha de ingreso a la compañía | `2023-05-10` |
| `activo` | `TINYINT(1)` | `NO` | `CHECK` (`activo IN (0, 1)`) | `1` | Estado del vendedor (`1` activo, `0` inactivo) | `1` |

---

## 4. Tabla `categorias`

Líneas o categorías comerciales del catálogo de productos.

| Campo | Tipo de dato | Nulo | Clave / Restricciones | Por defecto | Descripción | Ejemplo |
|---|---|---|---|---|---|---|
| `id_categoria` | `INT` | `NO` | `PK` (`pk_categorias`), `AUTO_INCREMENT` | — | Identificador único de la categoría | `1` |
| `nombre` | `VARCHAR(100)` | `NO` | `UNIQUE` (`uq_categoria_nombre`) | — | Nombre de la categoría | `Tecnología` |
| `descripcion` | `VARCHAR(500)` | `SÍ` | — | `NULL` | Descripción comercial de la línea | `Computadores, monitores...` |

---

## 5. Tabla `productos`

Catálogo maestro de productos comercializados.

| Campo | Tipo de dato | Nulo | Clave / Restricciones | Por defecto | Descripción | Ejemplo |
|---|---|---|---|---|---|---|
| `id_producto` | `INT` | `NO` | `PK` (`pk_productos`), `AUTO_INCREMENT` | — | Identificador único del producto | `1` |
| `codigo_sku` | `VARCHAR(30)` | `NO` | `UNIQUE` (`uq_producto_sku`) | — | Código SKU de referencia comercial | `TEC-001` |
| `nombre` | `VARCHAR(200)` | `NO` | — | — | Nombre descriptivo del producto | `Laptop Empresarial 15.6 pulgadas` |
| `id_categoria` | `INT` | `NO` | `FK` (`fk_productos_categoria`) → `categorias(id_categoria)`, `IDX` | — | Categoría a la que pertenece | `1` |
| `precio_lista` | `DECIMAL(12, 2)` | `NO` | `CHECK` (`precio_lista > 0`) | — | Precio de lista vigente en COP | `3200000.00` |
| `activo` | `TINYINT(1)` | `NO` | `CHECK` (`activo IN (0, 1)`) | `1` | Estado en catálogo (`1` activo, `0` descontinuado) | `1` |
| `created_at` | `TIMESTAMP` | `NO` | — | `CURRENT_TIMESTAMP` | Marca temporal de registro | `2026-11-18 09:18:26` |

---

## 6. Tabla `ventas`

Encabezado de cada factura o transacción comercial.

| Campo | Tipo de dato | Nulo | Clave / Restricciones | Por defecto | Descripción | Ejemplo |
|---|---|---|---|---|---|---|
| `id_venta` | `INT` | `NO` | `PK` (`pk_ventas`), `AUTO_INCREMENT` | — | Identificador interno de la factura | `1` |
| `numero_factura` | `VARCHAR(20)` | `NO` | `UNIQUE` (`uq_venta_factura`) | — | Consecutivo único de facturación | `FE-2025-00001` |
| `id_cliente` | `INT` | `NO` | `FK` (`fk_ventas_cliente`) → `clientes(id_cliente)`, `IDX` | — | Cliente que realiza la compra | `1` |
| `id_vendedor` | `INT` | `NO` | `FK` (`fk_ventas_vendedor`) → `vendedores(id_vendedor)`, `IDX` | — | Vendedor que gestionó la transacción | `3` |
| `id_ciudad` | `INT` | `NO` | `FK` (`fk_ventas_ciudad`) → `ciudades(id_ciudad)`, `IDX` | — | Ciudad donde ocurrió efectivamente la venta | `2` |
| `fecha_venta` | `DATE` | `NO` | `IDX` (`idx_ventas_fecha`) | — | Fecha de emisión de la factura | `2025-01-03` |
| `created_at` | `TIMESTAMP` | `NO` | — | `CURRENT_TIMESTAMP` | Marca temporal de inserción | `2026-11-18 09:18:26` |

---

## 7. Tabla `detalle_ventas`

Líneas de detalle de cada factura. Resuelve la relación `N:M` entre `ventas` y `productos` y conserva los valores unitarios históricos de la operación.

| Campo | Tipo de dato | Nulo | Clave / Restricciones | Por defecto | Descripción | Ejemplo |
|---|---|---|---|---|---|---|
| `id_detalle` | `INT` | `NO` | `PK` (`pk_detalle_ventas`), `AUTO_INCREMENT` | — | Identificador único de la línea de detalle | `1` |
| `id_venta` | `INT` | `NO` | `FK` (`fk_detalle_venta`) → `ventas(id_venta)`, `UQ` compuesta (`id_venta`, `id_producto`), `IDX` | — | Factura a la que pertenece la línea | `1` |
| `id_producto` | `INT` | `NO` | `FK` (`fk_detalle_producto`) → `productos(id_producto)`, `UQ` compuesta (`id_venta`, `id_producto`), `IDX` | — | Producto vendido en la línea | `4` |
| `cantidad` | `INT` | `NO` | `CHECK` (`cantidad > 0`) | — | Número de unidades vendidas | `2` |
| `precio_unitario` | `DECIMAL(12, 2)` | `NO` | `CHECK` (`precio_unitario > 0`) | — | Precio unitario bruto al momento de la venta (COP) | `173900.00` |
| `costo_unitario` | `DECIMAL(12, 2)` | `NO` | `CHECK` (`costo_unitario >= 0`) | — | Costo unitario al momento de la venta (COP) | `115900.00` |
| `descuento_unitario` | `DECIMAL(12, 2)` | `NO` | `CHECK` (`descuento_unitario >= 0`), `CHECK` (`descuento_unitario < precio_unitario`) | `0.00` | Descuento aplicado por unidad (COP) | `8700.00` |

### Fórmulas de cálculo comercial sobre `detalle_ventas`

$$\text{Ingreso neto de línea} = \text{cantidad} \times (\text{precio\_unitario} - \text{descuento\_unitario})$$

$$\text{Costo total de línea} = \text{cantidad} \times \text{costo\_unitario}$$

$$\text{Utilidad de línea} = \text{Ingreso neto de línea} - \text{Costo total de línea}$$
