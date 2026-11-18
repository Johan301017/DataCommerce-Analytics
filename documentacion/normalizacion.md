# Normalización, Dependencias Funcionales y Análisis de Anomalías

**Base de datos:** `datacommerce_analytics`

---

## 1. ¿Por qué normalizar el modelo?

En una tabla plana o desnormalizada (por ejemplo, una sola hoja tipo Excel donde cada fila mezcla datos de la factura, el cliente, su ciudad, el vendedor, la categoría y el producto), la misma información se repite decenas o cientos de veces. Esa redundancia provoca desperdicio de almacenamiento, inconsistencias ante cambios y bloqueos lógicos al insertar o borrar registros.

El proceso de **normalización** aplica reglas formales progresivas (Formas Normales) basadas en **dependencias funcionales** para descomponer las entidades hasta lograr una estructura estable en **Tercera Forma Normal (3FN)**.

---

## 2. Análisis por Formas Normales

### 2.1 Primera Forma Normal (1FN)
**Condición:** Cada atributo debe contener valores atómicos e indivisibles; no pueden existir grupos repetitivos ni columnas multivaluadas, y cada tabla debe contar con una clave primaria.

**Cumplimiento en `datacommerce_analytics`:**
- Una factura con varios productos **no** se almacena como una lista separada por comas (ej. `"TEC-001, TEC-004"`) ni como columnas repetidas (`producto_1`, `producto_2`, `producto_3`). En su lugar, la tabla `detalle_ventas` representa cada ítem de la factura como una fila independiente identificada por `id_detalle` y restringida por `UNIQUE (id_venta, id_producto)`.
- Las coordenadas geográficas de las ciudades están separadas en columnas atómicas (`latitud` y `longitud`), al igual que el nombre de la ciudad y el departamento.
- Todas las siete tablas definen una clave primaria (`PRIMARY KEY`) no nula.

### 2.2 Segunda Forma Normal (2FN)
**Condición:** La tabla está en 1FN y todo atributo no clave depende funcionalmente de la **totalidad** de la clave primaria (sin dependencias parciales).

**Cumplimiento en `datacommerce_analytics`:**
- Las siete tablas usan una clave primaria simple (`id_ciudad`, `id_cliente`, `id_vendedor`, `id_categoria`, `id_producto`, `id_venta`, `id_detalle`). Por definición, ninguna tabla con clave simple puede presentar dependencias parciales.
- Incluso si se considera la clave candidata compuesta `(id_venta, id_producto)` de `detalle_ventas`:
  - `cantidad`, `precio_unitario`, `costo_unitario` y `descuento_unitario` dependen de **ambos** (`id_venta` e `id_producto` juntos), porque el mismo producto puede venderse a otro precio o cantidad en otra factura.
  - Los atributos que dependen únicamente de `id_producto` (`codigo_sku`, `nombre`, `id_categoria`) residen en `productos`, y los atributos que dependen únicamente de `id_venta` (`numero_factura`, `id_cliente`, `id_vendedor`, `id_ciudad`, `fecha_venta`) residen en `ventas`.

### 2.3 Tercera Forma Normal (3FN)
**Condición:** La tabla está en 2FN y ningún atributo no clave depende transitivamente de la clave primaria a través de otro atributo no clave (`A → B → C`).

**Cumplimiento en `datacommerce_analytics`:**
- **Eliminación de transitividades en `clientes` y `vendedores`:** Ni `clientes` ni `vendedores` almacenan el nombre de la ciudad o del departamento; guardan exclusivamente la clave foránea (`id_ciudad` o `id_ciudad_asignada`) hacia `ciudades`. Así se evita la dependencia transitiva `id_cliente → id_ciudad → departamento`.
- **Eliminación de transitividades en `productos`:** El nombre y descripción de la categoría no se repiten en cada producto; `productos` referencia `id_categoria` hacia `categorias`.
- **Eliminación de transitividades en `ventas`:** `ventas` guarda solo `id_cliente`, `id_vendedor` e `id_ciudad`, nunca nombres, correos ni departamentos.
- **Justificación de `precio_unitario` y `costo_unitario` en `detalle_ventas`:** A primera vista podría parecer redundante guardar `precio_unitario` existiendo `productos.precio_lista`. Sin embargo, **no representan el mismo hecho ni violan 3FN**: `productos.precio_lista` es el *precio vigente actual* del catálogo, mientras que `detalle_ventas.precio_unitario` es el *precio histórico pactado en esa factura específica* (por ejemplo, en 2025 la lista era 6 % inferior al catálogo vigente de 2026). Depende funcionalmente de `(id_venta, id_producto)`, no de `id_producto` solo.
- **Justificación de `ventas.id_ciudad` frente a `clientes.id_ciudad`:** Representan hechos distintos: dónde reside el cliente frente a dónde ocurrió la venta (en el conjunto de datos real, 33 de las 180 transacciones ocurren en una ciudad diferente a la residencia del cliente).

---

## 3. Dependencias funcionales explícitas

| Tabla | Determinante (clave) | Atributos dependientes funcionalmente |
|---|---|---|
| `ciudades` | `id_ciudad` (y `nombre`) | `nombre`, `departamento`, `latitud`, `longitud`, `poblacion`, `created_at` |
| `clientes` | `id_cliente` (y `documento`, `correo`) | `documento`, `nombre`, `correo`, `id_ciudad`, `fecha_registro` |
| `vendedores` | `id_vendedor` (y `correo`) | `nombre`, `correo`, `id_ciudad_asignada`, `fecha_contratacion`, `activo` |
| `categorias` | `id_categoria` (y `nombre`) | `nombre`, `descripcion` |
| `productos` | `id_producto` (y `codigo_sku`) | `codigo_sku`, `nombre`, `id_categoria`, `precio_lista`, `activo`, `created_at` |
| `ventas` | `id_venta` (y `numero_factura`) | `numero_factura`, `id_cliente`, `id_vendedor`, `id_ciudad`, `fecha_venta`, `created_at` |
| `detalle_ventas` | `id_detalle` (y `(id_venta, id_producto)`) | `id_venta`, `id_producto`, `cantidad`, `precio_unitario`, `costo_unitario`, `descuento_unitario` |

*(No existen atributos calculados almacenados como `subtotal_linea` o `total_factura`, evitando dependencias derivables y manteniendo una única fuente de verdad en las consultas SQL.)*

---

## 4. Redundancia y anomalías evitadas

Para ilustrar los problemas que resuelve este diseño, considérese un escenario no normalizado con una única tabla `registro_ventas` que mezclara todos los campos.

### 4.1 Redundancia de datos
Sin normalización, los 395 registros de detalle repetirían 395 veces nombres de ciudades, departamentos, coordenadas, nombres y correos de clientes, datos de vendedores, descripciones de categorías y nombres de productos. Con el modelo normalizado en 3FN, cada entidad maestra se almacena **una sola vez** (8 ciudades, 5 categorías, 10 vendedores, 30 clientes, 30 productos).

### 4.2 Anomalías de inserción
- **Problema sin normalización:** No se podría registrar una nueva ciudad de operación, un nuevo cliente recién registrado (como `Fabián Andrés Ortega` o `Miguel Ángel Restrepo`, que todavía no registran compras en el sistema), un nuevo vendedor o un nuevo producto sin inventar una factura ficticia o dejar en `NULL` la clave de venta.
- **Solución del modelo:** Al separar `ciudades`, `clientes`, `vendedores`, `categorias` y `productos` en tablas independientes, cualquier entidad maestra puede darse de alta antes de que exista una transacción asociada.

### 4.3 Anomalías de actualización
- **Problema sin normalización:** Si una categoría cambia de nombre o un vendedor actualiza su correo corporativo, habría que modificar decenas de filas históricas; si se actualiza solo una parte de ellas, la base queda en estado inconsistente (dos nombres distintos para la misma categoría en los reportes).
- **Solución del modelo:** Al actualizar un registro único en `categorias`, `vendedores` o `clientes`, el cambio se refleja automáticamente en todas las consultas gracias a las uniones por clave foránea. Al mismo tiempo, como las listas de precios cambian en el tiempo, mantener `precio_unitario` y `costo_unitario` en `detalle_ventas` protege la contabilidad histórica frente a actualizaciones en `productos.precio_lista`.

### 4.4 Anomalías de eliminación
- **Problema sin normalización:** Si se elimina la única factura de un cliente que compró una sola vez (por ejemplo `Gustavo Ernesto Niño` o `Rosa Elena Navarro`), se perderían también todos sus datos de contacto y registro como cliente. De igual manera, si un catálogo permitiera borrar en cascada un producto o una ciudad, desaparecerían las ventas históricas asociadas y los totales financieros cambiarían sin rastro.
- **Solución del modelo:**
  1. Separar las entidades maestras garantiza que la existencia de un cliente, producto o ciudad no dependa de las facturas.
  2. La política `ON DELETE RESTRICT` en todas las 8 claves foráneas impide eliminar registros padre (`ciudades`, `clientes`, `vendedores`, `categorias`, `productos`, `ventas`) mientras existan registros hijos vinculados en `ventas` o `detalle_ventas`.
