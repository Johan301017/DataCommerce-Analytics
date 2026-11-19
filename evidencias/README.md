# Evidencias de Ejecución — DataCommerce Analytics

Todas las evidencias en esta carpeta fueron obtenidas mediante ejecuciones reales del sistema sobre **MySQL Server 8.0.43**, el backend **FastAPI** y el dashboard **React + Vite** en `http://localhost:5173`.

## 1. Evidencias de base de datos, SQL y pruebas automatizadas (UTF-8)

| Archivo | Evidencia que contiene |
|---|---|
| [01_bd_y_tablas.txt](01_bd_y_tablas.txt) | Base de datos `datacommerce_analytics` creada en MySQL 8.0, listado de 7 tablas, 8 relaciones de clave foránea y conteo exacto de `658` registros. |
| [02_validaciones_integridad.txt](02_validaciones_integridad.txt) | Ejecución real de `database/04_validaciones.sql`: validaciones `V1`–`V14` aprobadas (`OK`) y `V15` (10 pruebas de rechazo de restricciones PK, UNIQUE, NOT NULL, FK, CHECK y `ON DELETE RESTRICT`). |
| [03_resultados_10_consultas.txt](03_resultados_10_consultas.txt) | Salida real de MySQL 8.0 al ejecutar `database/03_consultas_analiticas.sql` (las 9 consultas obligatorias y la consulta 10 de clientes premium). |
| [04_resultados_pytest.txt](04_resultados_pytest.txt) | Salida en codificación **UTF-8 (sin BOM)** de `pytest tests -v`: **82/82 pruebas aprobadas** contra MySQL `8.0.43` y API REST, con fecha, resumen de correcciones y limitaciones. |

## 2. Capturas de pantalla reales del dashboard web

| Imagen | Módulo / verificación |
|---|---|
| [05_dashboard_vista_general.png](05_dashboard_vista_general.png) | Dashboard principal (`Vista general`) con estado `MySQL conectado`, 8 KPIs (`$ 351.210.800 COP`), evolución mensual, participación por categoría y rankings. |
| [06_dashboard_filtro_bogota.png](06_dashboard_filtro_bogota.png) | Filtro individual (`Ciudad de la venta = Bogotá`): actualización dinámica de KPIs (`$ 128.655.400 COP`, `61` transacciones) y gráficos. |
| [07_dashboard_mapa_geografia.png](07_dashboard_mapa_geografia.png) | Mapa interactivo de Colombia en Leaflet + OpenStreetMap con marcadores proporcionales, popup abierto de Bogotá, participación nacional y tabla regional ordenable. |
| [08_dashboard_vendedores.png](08_dashboard_vendedores.png) | Podio Top 3 de vendedores, gráfico de ingresos vs. utilidad, dispersión de productividad y tabla completa. |
| [09_dashboard_productos_categorias.png](09_dashboard_productos_categorias.png) | Rentabilidad y participación por categoría, productos más vendidos/mayores ingresos (alerta ámbar para margen < 15 %) y tablas ordenables. |
| [10_dashboard_clientes_rfm.png](10_dashboard_clientes_rfm.png) | Segmentación RFM (`7` Premium, `11` Potencial premium, `10` Regular), selector configurable de fecha de corte RFM, cobertura de clientes (`28/30`) y compras repetidas. |
| [11_dashboard_inteligencia.png](11_dashboard_inteligencia.png) | Módulo de Inteligencia Comercial: métricas observadas separadas de interpretaciones, crecimiento comparable por ciudad, HHI y evaluación explícita de 6 riesgos. |
| [12_dashboard_consultas_sql.png](12_dashboard_consultas_sql.png) | Módulo de Consultas SQL ejecutando la Consulta 10 literal del script `03_consultas_analiticas.sql`, con aviso de modo sin filtros y botón funcional `Copiar SQL` (`Copiado`). |
| [13_dashboard_movil_responsive.png](13_dashboard_movil_responsive.png) | Diseño responsive verificado en viewport móvil (`390×844`), sin desbordamiento horizontal y con menú lateral colapsable. |
| [14_dashboard_filtro_combinado_producto.png](14_dashboard_filtro_combinado_producto.png) | Filtro combinado (fechas + `Medellín` + `Tecnología` + producto `TEC-001`) actualizando KPIs (`$ 3.040.000 COP`) y gráficos desde MySQL. |
| [15_dashboard_mapa_sin_conexion_osm.png](15_dashboard_mapa_sin_conexion_osm.png) | Prueba de mapa sin conexión a OpenStreetMap: aviso informativo visible sin bloquear los marcadores ni la tabla regional. |

> **Capturas en MySQL Workbench:** Para tomar capturas gráficas dentro de la ventana de MySQL Workbench 8.0 manualmente antes de la entrega, consulte [GUIA_CAPTURAS_WORKBENCH.md](GUIA_CAPTURAS_WORKBENCH.md).
