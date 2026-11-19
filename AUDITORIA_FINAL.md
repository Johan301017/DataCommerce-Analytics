# AUDITORÍA FINAL Y PERFECCIONAMIENTO — DataCommerce Analytics

**Repositorio auditado:** `https://github.com/Johan301017/DataCommerce-Analytics`  
**Fuente académica primaria:** `tercer corte.pdf`  
**Fecha de auditoría:** 18 de noviembre de 2026  
**Entorno verificado:** Windows · MySQL Server `8.0.43` · Python `3.14.0` (FastAPI) · Node.js `v24.11.1` (frontend Vite + React + TypeScript)

---

## 1. Resumen ejecutivo

La auditoría integral confirma que **DataCommerce Analytics** cumple rigurosamente los **9 apartados académicos** y los **7 entregables obligatorios** definidos en `tercer corte.pdf`, conservando intacta su arquitectura (`MySQL 8.0 + Python/FastAPI + React/TypeScript/Tailwind/Recharts/Leaflet`) y la totalidad de sus métricas comerciales verificadas (`$ 351.210.800 COP` en ingresos netos, `$ 102.499.200 COP` en utilidad, `180` transacciones y `658` registros deterministas).

Durante la auditoría se detectaron y corrigieron brechas técnicas y de experiencia de usuario concretas: un archivo de pruebas guardado en codificación `UTF-16 LE` incompatible con lectura directa en GitHub, peticiones HTTP `422` transitorias al cambiar rangos de fechas en el navegador, ausencia de advertencia explícita sobre `DROP DATABASE` en `01_esquema.sql` y `README.md`, falta de botón `Copiar SQL` y aviso explícito en el módulo de consultas estáticas, ausencia de protección frente a comparativas de crecimiento sobre históricos parciales, y manejo visual cuando fallan los mosaicos de OpenStreetMap. También se incorporaron el filtro global por producto (`producto_id`), el selector interactivo de fecha de corte RFM (manteniendo `2026-11-18` por defecto) y 7 nuevas pruebas automatizadas para casos límite, alcanzando **82/82 pruebas aprobadas** en `pytest` y **0 errores** de consola o red en las pruebas de navegador.

---

## 2. Requisitos académicos revisados

Se auditaron directamente contra el código fuente, los scripts SQL, los registros de MySQL `8.0.43`, el DOM del dashboard y la documentación PDF/Markdown:
- **Apartados 1–9 de `tercer corte.pdf`:** diseño 3FN (mínimo 6 entidades → 7 implementadas), explicación de relaciones/PK/FK/redundancia/anomalías/normalización, restricciones SQL (`PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`, `AUTO_INCREMENT`), carga mínima de 20 registros (`658` reales), las 9 consultas analíticas obligatorias, consulta 10 de clientes premium RFM, las 4 preguntas analíticas, las 3 estrategias basadas en datos y el dashboard ejecutivo completo.
- **7 entregables obligatorios:** Script SQL, Modelo relacional, Evidencias de ejecución, Consultas funcionales, Documento analítico, Dashboard y Conclusiones técnicas.
- **Evaluaciones técnicas solicitadas:** conveniencia de estados de venta, filtro por producto, fecha de corte RFM editable, comportamiento offline de OpenStreetMap, seguridad en Git y codificación UTF-8.

---

## 3. Hallazgos detectados

### 3.1 Hallazgos corregidos
1. **Archivo de resultados `pytest` en UTF-16 LE (`evidencias/04_resultados_pytest.txt`):** PowerShell `Tee-Object` escribió el archivo con BOM `FF FE` (UTF-16 LE), provocando que Git lo tratara como binario y dificultando su lectura directa en GitHub.
2. **Peticiones HTTP `422` al editar fechas en el dashboard:** Al cambiar `fecha_inicio` a una fecha posterior a la `fecha_fin` previa antes de ajustar `fecha_fin`, `useFilteredFetch` y `Clients.tsx` disparaban 5 peticiones HTTP que devolvían `422 Unprocessable Content` y errores en la consola del navegador.
3. **Comparativa de crecimiento potencialmente engañosa en subperiodos tempranos:** Al filtrar ventanas cercanas al inicio del histórico (`2025-02-01` a `2025-03-31`), la ventana previa (`2024-12-04` a `2025-01-31`) quedaba parcialmente fuera de la base (`minima = 2025-01-01`), generando tasas de crecimiento distorsionadas al comparar 59 días contra 31 días disponibles.
4. **Falta de advertencia visible sobre `DROP DATABASE`:** Ni `README.md` ni `database/01_esquema.sql` advertían de forma destacada que ejecutar `01_esquema.sql` borra la base existente.
5. **Módulo `Consultas SQL` (`SqlQueries.tsx`):** Faltaba un botón para copiar el código SQL y una diferenciación visual destacada frente a la barra superior de filtros cuando el usuario tiene filtros globales activos.
6. **Mapa Leaflet sin conexión (`Geography.tsx`):** Si los mosaicos de OpenStreetMap fallaban o no había internet, el mapa quedaba gris sin informar al usuario que los marcadores y la tabla desde MySQL seguían operativos.
7. **Segmentación RFM sin control de fecha de corte en UI y sin visibilidad de clientes sin compra:** El backend ya soportaba `fecha_corte`, pero `Clients.tsx` no permitía probar cortes históricos ni mostraba cuántos de los `30` clientes registrados no tenían compras (`2`).
8. **Detalles menores de SQL, Docker y ortografía:** Faltaba `NULLIF(pu.frecuencia, 0)` y desempates deterministas en `03_consultas_analiticas.sql`; faltaba aclarar en `manual_ejecucion.md` que `Node.js` es solo para el frontend; y se detectó la errata `"multiproduto"` en `analisis_comercial.md`.

### 3.2 Evaluaciones técnicas solicitadas (sin alteración innecesaria del esquema)

#### A. Conveniencia de incorporar estados de venta en la tabla `ventas`
- **Evaluación:** En un entorno productivo real resulta recomendable agregar un campo `estado ENUM('Completada', 'Anulada', 'Pendiente', 'Devuelta') NOT NULL DEFAULT 'Completada'` en `ventas` para diferenciar facturas emitidas, anulaciones y pedidos pendientes sin borrar registros.
- **Decisión en este proyecto:** **No se modificó el esquema actual**, dado que las `180` transacciones simuladas representan ventas efectivamente cerradas, ningún requisito de `tercer corte.pdf` pide flujos transaccionales de anulación y alterar la tabla sin necesidad pondría en riesgo la estabilidad del modelo verificado.
- **Impacto que tendría si se incorporara en una versión futura:**
  1. **Consultas SQL (`03_consultas_analiticas.sql` y `analytics_repository.py`):** todas las 10 consultas y KPIs deberían incluir `WHERE v.estado = 'Completada'` (o separar ingresos brutos vs. anulados) para no sumar facturas anuladas como ingresos ni contar clientes con órdenes canceladas en RFM.
  2. **Datos (`02_datos.sql` y `generar_datos.py`):** habría que generar un subconjunto de facturas anuladas/pendientes y garantizar que no alteren las metas académicas de volumen válido.
  3. **Pruebas (`tests/`):** se requerirían nuevas pruebas que verifiquen que los totales por ciudad, categoría, vendedor y RFM excluyen explícitamente facturas en estado `'Anulada'` o `'Pendiente'`.

#### B. Filtro por producto en el dashboard
- **Evaluación y decisión:** Debido a que `BASE_FROM` en `analytics_repository.py` ya une `detalle_ventas dv` y `productos p` en todas las consultas del repositorio, fue posible incorporar `producto_id` sin alterar la estabilidad ni las consultas existentes. A nivel semántico, igual que `categoria_id`, filtrar por `producto_id` acota las líneas `detalle_ventas` correspondientes al producto seleccionado (mostrando sus ingresos, unidades, utilidad y el número de facturas distintas en las que apareció).

#### C. Fecha de corte RFM configurable en la interfaz
- **Evaluación y decisión:** Se habilitó un campo `Fecha de corte RFM` dentro del panel de criterios en `Clientes` con valor inicial `2026-11-18` y botón de restablecimiento `Corte académico`. De este modo el evaluador puede simular cortes históricos (p. ej. `2025-12-31`) sin alterar en absoluto los resultados oficiales del informe (`7` Premium, `11` Potencial premium, `10` Regular).

### 3.3 Hallazgo informativo en el árbol de trabajo Git
- Existe un archivo residual no versionado en la raíz llamado `tore --staged .env` (producto de un comando incompleto en terminal previo, que contiene únicamente el listado de nombres de archivo de `git ls-files`, sin credenciales). Se dejó intacto sin publicarlo ni alterar commits por respeto al historial de trabajo del estudiante (puede eliminarse manualmente antes del próximo `git add`).

---

## 4. Correcciones realizadas

1. **Advertencias `DROP DATABASE`:** Agregadas en cabecera de [database/01_esquema.sql](database/01_esquema.sql), [README.md](README.md) y [documentacion/manual_ejecucion.md](documentacion/manual_ejecucion.md).
2. **Hardening de consultas SQL:** Agregado `NULLIF(pu.frecuencia, 0)` en Consulta 10 y ordenación determinista de desempate en Consultas 2 y 8 de [database/03_consultas_analiticas.sql](database/03_consultas_analiticas.sql), manteniendo resultados idénticos.
3. **Filtro por producto:** Implementado de extremo a extremo en `filters.py`, `analytics_repository.py`, `types/index.ts`, `FiltersContext.tsx` y `FilterBar.tsx`.
4. **Protección de comparativas históricas:** Implementado control `comparable` / `historico_incompleto` en `periodos_comparables()`, `kpis()` y `analisis_ejecutivo()` de `analytics_service.py` y mostrado en `Overview.tsx`.
5. **Prevención de HTTP 422 en cliente:** Validación `fechasInvalidas(f)` agregada en `useFetch.ts` y `Clients.tsx`.
6. **Selector de fecha de corte y cobertura RFM:** Implementado en `analytics_service.py`, `api.ts` y `Clients.tsx` (`28` con compras de `30` registrados).
7. **Módulo `Consultas SQL`:** Agregado botón funcional `Copiar SQL` con respaldo `execCommand('copy')` y banner aclaratorio de modo sin filtros en `SqlQueries.tsx`.
8. **Resiliencia del mapa Leaflet:** Agregado manejador `tileerror` / `tileload` y banner informativo sin conexión en `Geography.tsx`.
9. **Codificación UTF-8 y documentación:** Regenerado `evidencias/04_resultados_pytest.txt` en **UTF-8 puro (sin BOM)** con cabecera de auditoría; corregida la errata `"multiproduto"` → `"multiproducto"` y añadida nota explícita sobre datos sintéticos en `analisis_comercial.md`; aclarado rol de `Node.js` (solo frontend) en `manual_ejecucion.md`; actualizada `matriz_requisitos.md` y reexportados todos los PDF en `documentacion/pdf/`.

---

## 5. Archivos modificados y creados

| Archivo | Tipo de cambio |
|---|---|
| `database/01_esquema.sql` | Modificado (advertencia `DROP DATABASE`) |
| `database/03_consultas_analiticas.sql` | Modificado (`NULLIF` en C10 y desempate determinista en C2/C8) |
| `backend/app/filters.py` | Modificado (filtro `producto_id`) |
| `backend/app/repositories/analytics_repository.py` | Modificado (`productos` en `catalogos()`) |
| `backend/app/services/analytics_service.py` | Modificado (`comparable`/`historico_incompleto`, `clientes_registrados`) |
| `frontend/src/types/index.ts` | Modificado (`producto_id`, `periodos`, `clientes_registrados`) |
| `frontend/src/services/api.ts` | Modificado (parámetro `fecha_corte` en `api.premium`) |
| `frontend/src/context/FiltersContext.tsx` | Modificado (`producto_id` en `FILTROS_VACIOS`) |
| `frontend/src/hooks/useFetch.ts` | Modificado (guardia `fechasInvalidas`) |
| `frontend/src/components/FilterBar.tsx` | Modificado (selector `Producto`) |
| `frontend/src/pages/Overview.tsx` | Modificado (mensaje de histórico incompleto) |
| `frontend/src/pages/Geography.tsx` | Modificado (manejo `tileerror` offline de OpenStreetMap) |
| `frontend/src/pages/Clients.tsx` | Modificado (selector fecha de corte RFM, cobertura y `fechasInvalidas`) |
| `frontend/src/pages/SqlQueries.tsx` | Modificado (botón `Copiar SQL` y banner de modo sin filtros) |
| `tests/test_api.py` y `tests/test_consultas.py` | Modificados (`+7` pruebas nuevas de casos borde) |
| `README.md`, `manual_ejecucion.md`, `consultas_explicadas.md`, `analisis_comercial.md`, `conclusiones.md`, `matriz_requisitos.md`, `auditoria_y_entrega.md` | Modificados (advertencias, aclaraciones, ortografía, trazabilidad y conteo de 82 pruebas) |
| `documentacion/pdf/*.pdf` | Reexportados (`9` PDFs actualizados) |
| `evidencias/02_*.txt`–`15_*.png`, `evidencias/README.md`, `evidencias/GUIA_CAPTURAS_WORKBENCH.md` | Actualizados/Creados en UTF-8 y capturas actuales |
| `AUDITORIA_FINAL.md` | Creado (este informe) |

---

## 6. Resultados de pruebas

Todas las pruebas se ejecutaron después de los últimos cambios sobre la base real **MySQL `8.0.43`**:
- **Pytest (`.\backend\.venv\Scripts\python.exe -m pytest tests -v`):** **`82` ejecutadas, `82` aprobadas, `0` fallidas** (`ReturnCode = 0`). Registro completo en UTF-8 disponible en [evidencias/04_resultados_pytest.txt](evidencias/04_resultados_pytest.txt).
- **Validaciones SQL (`04_validaciones.sql`):** `V1`–`V14` `OK` (`$ 351.210.800,00 COP` en ciudades = categorías = total; `180` facturas distintas) y `V15` (`10/10` rechazos `OK`).
- **Consultas analíticas (`03_consultas_analiticas.sql`):** Las 10 consultas ejecutadas en MySQL `8.0.43` coinciden con `analisis_comercial.md` y con el dashboard web ([evidencias/03_resultados_10_consultas.txt](evidencias/03_resultados_10_consultas.txt)).
- **Frontend (`npx tsc --noEmit` y `npm run build`):** `tsc=0`, `build=0`.
- **Navegador real (Chrome headless sobre `http://localhost:5173`):** Las 7 vistas, filtros individuales/combinados (incluido `TEC-001` `$ 3.040.000 COP`), periodo histórico incompleto, periodo vacío (`2030`), restablecimiento de filtros, fecha de corte RFM, `Copiar SQL`, modo offline OpenStreetMap y diseño móvil (`390×844` sin overflow) pasaron con **`0` errores de consola, `0` errores JS y `0` errores HTTP >= 400**.

---

## 7. Evidencias generadas

- **Salidas reales de BD y pruebas (UTF-8):** `evidencias/01_bd_y_tablas.txt`, `02_validaciones_integridad.txt`, `03_resultados_10_consultas.txt`, `04_resultados_pytest.txt`.
- **Capturas actuales del dashboard (`11` imágenes reales):** `evidencias/05_dashboard_vista_general.png` hasta `evidencias/15_dashboard_mapa_sin_conexion_osm.png` (incluye filtros combinados con producto y modo offline OpenStreetMap).
- **Modelo y documentación:** `documentacion/diagrama_er.png`, `diagrama_er.svg` y `documentacion/pdf/*.pdf`.
- **Guía manual de Workbench:** `evidencias/GUIA_CAPTURAS_WORKBENCH.md`.

---

## 8. Limitaciones pendientes

1. **Docker Compose no ejecutado en este equipo:** Los archivos `docker-compose.yml`, `Dockerfile` y `.dockerignore` están configurados, pero Docker Desktop no está instalado en este equipo; su clasificación en la matriz es **Implementado, pendiente de verificación**.
2. **Capturas dentro de la ventana gráfica de MySQL Workbench:** No se automatizaron capturas GUI de la aplicación de escritorio Workbench; se documentaron los pasos exactos en `evidencias/GUIA_CAPTURAS_WORKBENCH.md` para que el estudiante las tome manualmente si lo desea.
3. **Archivo residual local `tore --staged .env`:** No pertenece al proyecto ni está en Git; se recomienda eliminarlo localmente antes de confirmar cambios en GitHub.
4. **Advertencia menor de `pytest`:** `StarletteDeprecationWarning` en `fastapi.testclient` (informativa, sin impacto funcional).

---

## 9. Evaluación final de los nueve puntos de `tercer corte.pdf`

| # | Apartado de `tercer corte.pdf` | Evaluación final |
|---|---|---|
| 1 | Diseño de modelo relacional profesional (≥ 6 entidades) | **Cumple y verificado** |
| 2 | Explicación de relaciones, PK, FK, tipos, redundancia, anomalías y normalización | **Cumple y verificado** |
| 3 | Creación de tablas con `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`, `AUTO_INCREMENT` | **Cumple y verificado** |
| 4 | Inserción mínima de 20 registros coherentes y relacionados (`658` reales) | **Cumple y verificado** |
| 5 | Nueve consultas SQL analíticas obligatorias | **Cumple y verificado** |
| 6 | Consulta de clientes potencialmente premium (criterios, lógica y justificación RFM) | **Cumple y verificado** |
| 7 | Análisis de resultados y respuesta a los cuatro interrogantes | **Cumple y verificado** |
| 8 | Propuesta de tres estrategias basadas en datos | **Cumple y verificado** |
| 9 | Dashboard ejecutivo (indicadores, filtros, gráficos, mapas y comparativas) | **Cumple y verificado** |

---

## 10. Evaluación final de los siete entregables obligatorios

| # | Entregable obligatorio | Evaluación final |
|---|---|---|
| 1 | Script SQL (`01_esquema.sql` a `04_validaciones.sql`) | **Cumple y verificado** |
| 2 | Modelo relacional (`modelo_relacional.md`, `diccionario_datos.md`, `normalizacion.md`, `diagrama_er.png`) | **Cumple y verificado** |
| 3 | Evidencias de ejecución (`evidencias/01_`–`15_` + `GUIA_CAPTURAS_WORKBENCH.md`) | **Cumple y verificado** |
| 4 | Consultas funcionales (`03_consultas_analiticas.sql`, `consultas_explicadas.md`, módulo `/consultas`) | **Cumple y verificado** |
| 5 | Documento analítico (`analisis_comercial.md` y PDF) | **Cumple y verificado** |
| 6 | Dashboard (`frontend/` + `backend/` conectado a MySQL real) | **Cumple y verificado** |
| 7 | Conclusiones técnicas (`conclusiones.md` y PDF) | **Cumple y verificado** |
