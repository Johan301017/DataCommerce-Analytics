# Informe de Auditoría y Preparación para la Entrega Académica

**Proyecto:** DataCommerce Analytics S.A.S. — Sistema de Inteligencia Comercial  
**Fuente académica primaria:** `tercer corte.pdf`  
**Fecha de auditoría:** 18 de noviembre de 2026  

---

## 1. Hallazgos encontrados durante la auditoría y correcciones aplicadas

Durante la revisión exhaustiva de código, base de datos, resultados del dashboard en vivo y documentos, se detectaron y corrigieron los siguientes detalles:

1. **Inconsistencia de formato numérico en Inteligencia Comercial (`backend/app/services/analytics_service.py` y `frontend/src/pages/Intelligence.tsx`):**
   - *Problema detectado:* Las tarjetas de métricas observadas y evidencias de riesgos mostraban decimales con punto en lugar de coma colombiana (`36.63 %`, `HHI ciudades = 2266.7`) y cantidades con `.0` (`23.0 unidades`, `85.0 unidades vendidas`).
   - *Corrección aplicada:* Se añadieron los formateadores `_es_num` y `_es_cop` en `analytics_service.py` y se redondearon las unidades a enteros (`23 unidades`, `36,63 %`, `$ 2.109.105 COP`, `HHI ciudades = 2.266,7`).

2. **Ajuste visual de celdas monetarias y fechas en tablas (`Clients.tsx`, `Sellers.tsx`, `Products.tsx`, `Geography.tsx`):**
   - *Problema detectado:* En las capturas previas de Clientes y Vendedores, valores como `$ 38.740.000 COP` se partían en varias líneas dentro de columnas estrechas.
   - *Corrección aplicada:* Se agregó `className: 'whitespace-nowrap'` en columnas monetarias, porcentajes y fechas de las tablas ordenables.

3. **Faltante de `.dockerignore` en `frontend/` y `backend/`:**
   - *Problema detectado:* `frontend/Dockerfile` (`COPY . .`) podía copiar accidentalmente `node_modules/` de Windows dentro de la imagen Linux si se ejecutaba `docker compose build`.
   - *Corrección aplicada:* Se crearon `frontend/.dockerignore` y `backend/.dockerignore`.

4. **Verificación directa DOM vs. MySQL en el navegador:**
   - Se comprobó mediante navegador real (Chrome headless) que los valores renderizados en el DOM del dashboard coinciden **al peso exacto** con las consultas SQL en MySQL:
     - Sin filtros: `$ 351.210.800 COP` ingresos / `$ 102.499.200 COP` utilidad (`180` ventas, `833` unidades).
     - Filtro combinado (`Medellín + Tecnología + 2026-01-01 a 2026-10-31`): `$ 17.004.000 COP` ingresos / `$ 2.939.000 COP` utilidad.
     - Combinación sin ventas (`Cúcuta + Diego Alejandro Morales`): manejo limpio con `$ 0 COP` y mensaje informativo en Inteligencia Comercial sin errores de consola.

5. **Perfeccionamiento de auditoría final (segunda revisión integral):**
   - **Filtro por producto (`Producto`):** Incorporado al selector global (`GET /api/catalogos` + `producto_id`) junto a ciudad, categoría, vendedor y fechas.
   - **Períodos comparables e histórico incompleto:** `analytics_service.py` marca `historico_incompleto = true` cuando el período previo cae fuera del histórico cargado (`< 2025-01-01`), evitando porcentajes engañosos en `Vista general` e `Inteligencia comercial`.
   - **Transiciones de fecha sin HTTP 422:** `useFetch.ts` y `Clients.tsx` validan `fecha_inicio <= fecha_fin` antes de emitir peticiones al backend.
   - **Segmentación RFM configurable:** `Clients.tsx` permite cambiar la fecha de corte (`fecha_corte`, predeterminada `2026-11-18`) sin alterar el corte académico base y muestra cobertura (`28 clientes con compras dentro de 30 clientes registrados`).
   - **Resiliencia del mapa sin OpenStreetMap y módulo SQL:** `Geography.tsx` detecta fallos de carga de tiles e informa la contingencia manteniendo marcadores GeoJSON/Leaflet interactivos; `SqlQueries.tsx` añade el botón funcional `Copiar SQL` y diferencia claramente el SQL estático sin filtros de las métricas filtradas del dashboard.
   - **Seguridad documental y codificación UTF-8:** Advertencia explícita antes de `DROP DATABASE` en `database/01_esquema.sql` y `README.md`; exportación limpia de `evidencias/04_resultados_pytest.txt` en UTF-8 sin BOM.

---

## 2. Estado general de preparación para la entrega

### Lo que está terminado y verificado
- **Base de datos MySQL 8.0 (`datacommerce_analytics`):** 7 tablas en 3FN, `658` registros deterministas, `15/15` validaciones en `04_validaciones.sql` aprobadas y `10` consultas analíticas ejecutadas sin errores.
- **Integridad y consistencia matemática:** `0` huérfanos, `0` ventas sin detalle, `0` líneas con pérdida unitaria o descuento inválido, suma de ciudades = suma de categorías = total general (`$ 351.210.800 COP`), participación por categoría = `100,00 %` y `180` facturas únicas sin duplicación por `JOIN`.
- **Backend y Frontend:** API FastAPI conectada a MySQL real, dashboard React + TypeScript con 7 módulos, 6 filtros globales (ciudad, categoría, vendedor, producto, fecha inicio y fecha fin), fecha de corte RFM configurable en `Clientes`, mapa Leaflet con contingencia offline de OpenStreetMap, botón `Copiar SQL` y vista móvil sin desbordamiento.
- **Pruebas:** `82/82` pruebas en `pytest` aprobadas (guardadas en UTF-8 sin BOM en `evidencias/04_resultados_pytest.txt`) y `tsc --noEmit` sin errores.
- **Documentación y PDFs:** Documentos Markdown completos + matriz de trazabilidad + diagrama ER (`PNG` y `SVG`) + versión PDF profesional en `documentacion/pdf/` + informe final `AUDITORIA_FINAL.md`.
- **Evidencias reales:** Reportes de ejecución SQL/pytest en UTF-8 + capturas reales del dashboard web (desktop, filtros, mapa online/offline, clientes RFM, módulo SQL y móvil responsive) + guía `evidencias/GUIA_CAPTURAS_WORKBENCH.md`.

### Qué falta / consideraciones honestas (no bloqueantes para la entrega)
1. **Docker Compose no ejecutado en este equipo:** `docker-compose.yml` y los `Dockerfile` están preparados, pero no se ejecutaron porque Docker Desktop no está instalado en este Windows. La ejecución local nativa está 100 % verificada.
2. **Capturas de la interfaz gráfica de MySQL Workbench (intervención manual del estudiante):** Las evidencias `01_`–`03_` contienen las salidas reales del cliente oficial `mysql.exe` (MySQL `8.0.43`). Si el docente solicita capturas de la GUI de MySQL Workbench (*Reverse Engineer* y cuadrícula de resultados), sigue la guía [`evidencias/GUIA_CAPTURAS_WORKBENCH.md`](../evidencias/GUIA_CAPTURAS_WORKBENCH.md).
3. **Advertencia menor de `httpx` en `pytest`:** Aparece 1 `StarletteDeprecationWarning` informativa por el wrapper `TestClient` de Starlette; no afecta ninguna funcionalidad ni prueba.

---

## 3. Guía paso a paso para ejecutar y demostrar el sistema ante el docente

### Preparación previa (2 minutos antes de la sustentación)
1. Verifique que el servicio **MySQL80** esté corriendo (y el MySQL de XAMPP detenido).
2. Abra **MySQL Workbench 8.0** y conéctese a `Local instance MySQL80` (usuario `root`, contraseña configurada en `.env`).
3. Tenga abiertos en pestañas de Workbench:
   - `database/01_esquema.sql` (para mostrar las 7 tablas, restricciones y `ON DELETE RESTRICT`).
   - `database/03_consultas_analiticas.sql` (para ejecutar consultas individuales en vivo con `Ctrl + Enter`).
4. Inicie Backend y Frontend en dos terminales PowerShell (si no están activos):
   - Terminal 1 (Backend):
     ```powershell
     cd C:\Users\Johan\Documents\bigdata-datacommerce-analytics\backend
     .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
     ```
   - Terminal 2 (Frontend):
     ```powershell
     cd C:\Users\Johan\Documents\bigdata-datacommerce-analytics\frontend
     npm run dev
     ```
5. Abra **`http://localhost:5173`** en el navegador (y opcionalmente **`http://localhost:8000/docs`** para mostrar Swagger).

### Guion recomendado de demostración (10 minutos)
1. **Arquitectura y Modelo (2 min):** Muestre `documentacion/diagrama_er.png` (o *Reverse Engineer* en Workbench) explicando por qué `ventas.id_ciudad` es independiente de `clientes.id_ciudad` (`33` de `180` ventas ocurren en otra ciudad) y por qué `detalle_ventas` guarda precios/costos históricos.
2. **SQL en vivo en MySQL Workbench (3 min):** Ejecute en Workbench la **Consulta 3** (contrastando `Tecnología` líder en ingresos vs. `Hogar y Muebles` líder en utilidad), la **Consulta 5** (subconsulta de productos sobre el promedio) y la **Consulta 10** (RFM con `PERCENT_RANK`).
3. **Dashboard Ejecutivo y coincidencia con MySQL (3 min):**
   - En `Vista general`, muestre `$ 351.210.800 COP` y el indicador `MySQL conectado`.
   - Aplique un filtro (ej. `Ciudad = Bogotá` → `$ 128.655.400 COP`, `61` ventas) y luego limpie filtros.
   - Muestre el mapa interactivo en `Análisis geográfico`, el podio en `Vendedores`, el margen rojo de `TEC-001` en `Productos`, los `7` clientes `Premium` en `Clientes` y la pestaña `Consultas SQL` ejecutando la Consulta 10 en vivo.
4. **Análisis, estrategias y pruebas (2 min):** Presente `documentacion/pdf/analisis_comercial.pdf` (las 4 respuestas y 3 estrategias con KPIs/metas) y ejecute en terminal `.\backend\.venv\Scripts\python.exe -m pytest tests -v` para demostrar las `82` pruebas automatizadas pasando sin fallos.
