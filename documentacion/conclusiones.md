# Conclusiones Técnicas — DataCommerce Analytics

## 1. Cumplimiento del modelado relacional e integridad
- Se construyó la base de datos `datacommerce_analytics` en **MySQL 8.0** normalizada hasta **Tercera Forma Normal (3FN)** con siete tablas (`ciudades`, `clientes`, `vendedores`, `categorias`, `productos`, `ventas`, `detalle_ventas`).
- La relación `N:M` entre facturas y productos quedó resuelta mediante `detalle_ventas` con restricción única compuesta `UNIQUE (id_venta, id_producto)` y almacenamiento de `precio_unitario`, `costo_unitario` y `descuento_unitario` históricos al momento de la transacción.
- Todas las claves foráneas aplican `ON DELETE RESTRICT`, impidiendo eliminaciones accidentales en cascada sobre el historial comercial. Las 11 pruebas parametrizadas de restricciones en `tests/test_database.py` y las 10 pruebas en `sp_probar_restricciones()` confirmaron el rechazo de inserciones duplicadas, nulas, huérfanas, cantidades inválidas y borrados protegidos.

## 2. Consistencia analítica entre SQL, API y Dashboard
- Las nueve consultas obligatorias y la consulta 10 (segmentación RFM) definidas en [03_consultas_analiticas.sql](../database/03_consultas_analiticas.sql) utilizan exactamente las mismas definiciones de ingreso neto, costo, utilidad y transacción distinta (`COUNT(DISTINCT id_venta)`) que el backend en Python/FastAPI.
- Las `82` pruebas automatizadas con `pytest` contra la instancia real de MySQL `8.0.43` demostraron coincidencia numérica exacta entre la ejecución SQL directa y todos los endpoints REST (`/api/dashboard/*`, `/api/ciudades/*`, `/api/vendedores/*`, `/api/categorias/*`, `/api/productos/*`, `/api/clientes/*`, `/api/analisis/*` y `/api/consultas/*`).
- Todas las validaciones cruzadas confirmaron la ausencia de duplicación por `JOIN`: la suma por ciudad (`$ 351.210.800 COP`), la suma por categoría (`$ 351.210.800 COP`) y el total general coinciden al centavo; la participación por categoría suma `100,00 %`; y el conteo de transacciones coincide con las `180` filas de `ventas`.

## 3. Arquitectura de software desacoplada y segura
- El backend implementa una separación clara en cuatro capas: configuración segura mediante variables de entorno (`config.py`), acceso a datos parametrizado con `PyMySQL` (`database.py`), repositorios SQL (`repositories/analytics_repository.py`), lógica de negocio y umbrales explícitos (`services/analytics_service.py`) y enrutamiento HTTP con validación Pydantic/FastAPI (`routers/api.py`).
- No existen credenciales quemadas en el código fuente ni concatenación de strings en SQL; las pruebas de validación (`422`) e intento de inyección SQL confirmaron el rechazo seguro de entradas malformadas.
- El frontend en React + TypeScript + Vite presenta siete módulos responsivos con estados de carga, error, ausencia de datos y filtros globales consistentes, consumiendo en vivo la base de datos MySQL y mostrando valores en formato colombiano (`$ 1.250.000 COP`).

## 4. Hallazgos clave del análisis de negocio
- La distinción entre **facturación** y **rentabilidad** resultó determinante: `Tecnología` lidera en ventas (`38,11 %`), pero ocupa el tercer puesto en utilidad por el margen de `10,46 %` en laptops; `Hogar y Muebles` genera la mayor utilidad absoluta (`$ 25.743.200 COP`) y `Salud y Bienestar` alcanza el mayor margen (`48,34 %`) y crecimiento (`+176,59 %`).
- La segmentación RFM identificó que `7` clientes **Premium** (`25 %` de la cartera compradora) generan el `52,54 %` de los ingresos, mientras `11` clientes **Potencial premium** representan una oportunidad inmediata de crecimiento por frecuencia y recencia activas.

## 5. Trabajos futuros
- Incorporar tablas de inventario, metas mensuales por vendedor y costos logísticos por ruta para enriquecer el cálculo de rentabilidad neta.
- Implementar exportación directa de reportes PDF/CSV desde el dashboard y autenticación por roles (gerencia vs. líder comercial).
- Conectar modelos predictivos de propensión de compra o fuga (*churn*) una vez se acumulen al menos 24–36 meses continuos de histórico transaccional real.
