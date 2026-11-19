# Guía Rápida para Capturas Manuales en MySQL Workbench

Las evidencias automáticas en `evidencias/01_bd_y_tablas.txt` a `03_resultados_10_consultas.txt` contienen las salidas exactas ejecutadas directamente contra **MySQL Server 8.0.43**. Si tu docente solicita capturas de pantalla tomadas específicamente dentro de la interfaz gráfica de **MySQL Workbench 8.0**, sigue estos 6 pasos (~3 minutos):

1. **Verificar conexión:** abre **MySQL Workbench 8.0** e ingresa a **Local instance MySQL80** con el usuario `root` y la contraseña definida en `.env`.
2. **Captura 1 — Base de datos y tablas:** en el panel izquierdo (**Schemas**), despliega `datacommerce_analytics → Tables`, haz clic derecho sobre `ventas → Table Inspector` (o ejecuta `SHOW TABLES;` en una pestaña SQL) y toma captura de las 7 tablas creadas.
3. **Captura 2 — Modelo relacional (Ingeniería inversa):** ve al menú **Database → Reverse Engineer…**, selecciona `datacommerce_analytics`, avanza hasta generar el diagrama EER y captura las 7 tablas con sus relaciones `1:N` y `N:M` resuelta por `detalle_ventas`. *(Como referencia ya dispones del diagrama exportado en [../documentacion/diagrama_er.png](../documentacion/diagrama_er.png)).*
4. **Captura 3 — Registros insertados:** ejecuta en una pestaña SQL (`Ctrl + Enter`):
   ```sql
   USE datacommerce_analytics;
   SELECT 'ciudades' AS tabla, COUNT(*) AS filas FROM ciudades
   UNION ALL SELECT 'clientes', COUNT(*) FROM clientes
   UNION ALL SELECT 'vendedores', COUNT(*) FROM vendedores
   UNION ALL SELECT 'categorias', COUNT(*) FROM categorias
   UNION ALL SELECT 'productos', COUNT(*) FROM productos
   UNION ALL SELECT 'ventas', COUNT(*) FROM ventas
   UNION ALL SELECT 'detalle_ventas', COUNT(*) FROM detalle_ventas;
   ```
   Toma captura de la cuadrícula inferior (**Result Grid**) mostrando los `658` registros.
5. **Captura 4 — Consultas 1 a 9:** abre [../database/03_consultas_analiticas.sql](../database/03_consultas_analiticas.sql) (*File → Open SQL Script*). Ubica el cursor dentro de las consultas clave (por ejemplo Consulta 1, 3, 5, 6 y 8) y pulsa `Ctrl + Enter` en cada una para capturar el **Result Grid** y el panel **Action Output**.
6. **Captura 5 — Consulta 10 (Clientes Premium RFM):** en el mismo script `03_consultas_analiticas.sql`, ejecuta primero `SET @fecha_corte = '2026-11-18';` y luego la Consulta 10 (`WITH compras_cliente AS ...`), capturando los `28` clientes segmentados (`7` Premium, `11` Potencial premium, `10` Regular).

> **Precaución importante:** **NO** ejecutes `database/01_esquema.sql` ni `02_datos.sql` si la base `datacommerce_analytics` ya está cargada y activa, ya que `01_esquema.sql` contiene `DROP DATABASE IF EXISTS datacommerce_analytics;`.
