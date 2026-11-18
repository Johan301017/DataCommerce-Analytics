# Evidencias de Ejecución — DataCommerce Analytics

Todas las evidencias en esta carpeta fueron obtenidas mediante ejecuciones reales del sistema sobre **MySQL Server 8.0.43**, el backend **FastAPI** y el dashboard **React + Vite** en `http://localhost:5173`.

## 1. Evidencias de base de datos, SQL y pruebas automatizadas

| Archivo | Evidencia que contiene |
|---|---|
| [01_bd_y_tablas.txt](01_bd_y_tablas.txt) | Base de datos `datacommerce_analytics` creada en MySQL 8.0, listado de 7 tablas, 8 relaciones de clave foránea y conteo exacto de `658` registros. |
| [02_validaciones_integridad.txt](02_validaciones_integridad.txt) | Ejecución real de `database/04_validaciones.sql`: validaciones `V1`–`V14` aprobadas (`OK`) y `V15` (10 pruebas de rechazo de restricciones PK, UNIQUE, NOT NULL, FK, CHECK y `ON DELETE RESTRICT`). |
| [03_resultados_10_consultas.txt](03_resultados_10_consultas.txt) | Salida real de MySQL 8.0 al ejecutar `database/03_consultas_analiticas.sql` (las 9 consultas obligatorias y la consulta 10 de clientes premium). |
| [04_resultados_pytest.txt](04_resultados_pytest.txt) | Salida real de `pytest tests -v`: **75/75 pruebas aprobadas** contra MySQL real y API REST. |

## 2. Capturas de pantalla reales del dashboard web

| Imagen | Módulo / verificación |
|---|---|
| [05_dashboard_vista_general.png](05_dashboard_vista_general.png) | Dashboard principal (`Vista general`) con estado `MySQL conectado`, 8 KPIs (`$ 351.210.800 COP`), evolución mensual, participación por categoría y rankings. |
| [06_dashboard_filtro_bogota.png](06_dashboard_filtro_bogota.png) | Filtros globales activos (`Ciudad de la venta = Bogotá`): actualización dinámica de KPIs (`$ 128.655.400 COP`, `61` transacciones) y todos los gráficos. |
| [07_dashboard_mapa_geografia.png](07_dashboard_mapa_geografia.png) | Mapa interactivo de Colombia en Leaflet + OpenStreetMap con marcadores proporcionales, popup abierto de Bogotá, participación nacional y tabla regional ordenable. |
| [08_dashboard_vendedores.png](08_dashboard_vendedores.png) | Podio Top 3 de vendedores, gráfico de ingresos vs. utilidad, dispersión de productividad y tabla completa. |
| [09_dashboard_productos_categorias.png](09_dashboard_productos_categorias.png) | Rentabilidad y participación por categoría, productos más vendidos/mayores ingresos (alerta ámbar para margen < 15 %) y tablas ordenables. |
| [10_dashboard_clientes_rfm.png](10_dashboard_clientes_rfm.png) | Segmentación RFM (`7` Premium, `11` Potencial premium, `10` Regular), gráfico recencia vs. frecuencia, ranking de clientes y compras repetidas. |
| [11_dashboard_inteligencia.png](11_dashboard_inteligencia.png) | Módulo de Inteligencia Comercial: métricas observadas separadas de interpretaciones, crecimiento comparable por ciudad, HHI y evaluación explícita de 6 riesgos. |
| [12_dashboard_consultas_sql.png](12_dashboard_consultas_sql.png) | Módulo de Consultas SQL ejecutando en vivo la Consulta 10 literal del script `03_consultas_analiticas.sql` contra MySQL. |
| [13_dashboard_movil_responsive.png](13_dashboard_movil_responsive.png) | Diseño responsive verificado en viewport móvil (`390×844`), sin desbordamiento horizontal y con menú lateral colapsable. |

> **Nota sobre MySQL Workbench:** Si se desea adjuntar adicionalmente capturas de la interfaz gráfica de **MySQL Workbench 8.0**, abra `database/01_esquema.sql` a `database/04_validaciones.sql` en Workbench sobre la conexión `Local instance MySQL80` o ejecute *Database → Reverse Engineer* sobre `datacommerce_analytics` (el diagrama equivalente ya se encuentra exportado en [documentacion/diagrama_er.png](../documentacion/diagrama_er.png)).
