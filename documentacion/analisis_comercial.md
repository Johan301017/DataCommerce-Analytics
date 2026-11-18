# Documento Analítico de Inteligencia Comercial — DataCommerce Analytics S.A.S.

**Autores:** Equipo de Business Intelligence & Data Analytics  
**Periodo analizado:** 1 de enero de 2025 al 31 de octubre de 2026 (22 meses)  
**Fecha de corte RFM:** 18 de noviembre de 2026  
**Fuente de datos:** Base de datos `datacommerce_analytics` en MySQL 8.0 (`658` registros sintéticos deterministas, semilla `2026`)

---

## 1. Introducción

El presente informe consolida el análisis cuantitativo de la operación comercial de **DataCommerce Analytics S.A.S.** en ocho ciudades de Colombia, a partir de la ejecución verificada de diez consultas SQL analíticas y del tablero interactivo de inteligencia de negocios. Todas las cifras expuestas provienen directamente de consultas sobre MySQL 8.0 y han sido validadas matemáticamente para garantizar ausencia de duplicaciones y coherencia entre módulos.

---

## 2. Objetivos

- **Objetivo general:** Evaluar el desempeño comercial histórico de DataCommerce Analytics S.A.S. mediante SQL avanzado e indicadores estratégicos de negocio para fundamentar decisiones gerenciales basadas en datos.
- **Objetivos específicos:**
  1. Medir la facturación, costos, utilidad y márgenes por ciudad, vendedor, categoría, producto y mes.
  2. Responder los cuatro interrogantes estratégicos propuestos por la gerencia con evidencia cuantitativa.
  3. Implementar un esquema de segmentación de clientes basado en metodología RFM (Recencia, Frecuencia y Valor Monetario).
  4. Formular tres estrategias comerciales medibles mediante KPIs y metas realistas, diferenciando explícitamente los hechos observados de las interpretaciones y recomendaciones.

---

## 3. Contexto empresarial y metodología

### 3.1 Contexto de operación
DataCommerce Analytics S.A.S. comercializa `30` referencias organizadas en `5` categorías (`Tecnología`, `Hogar y Muebles`, `Deportes y Outdoor`, `Oficina y Papelería` y `Salud y Bienestar`) a través de `10` asesores comerciales distribuidos en `8` ciudades colombianas (`Bogotá`, `Medellín`, `Cali`, `Barranquilla`, `Cúcuta`, `Bucaramanga`, `Cartagena` y `Pereira`).

### 3.2 Metodología de análisis
1. **Modelado y carga reproducible:** Esquema en 3FN con preservación histórica de precios, costos y descuentos por línea (`detalle_ventas`) y registro independiente de la ciudad donde ocurre cada venta (`ventas.id_ciudad`).
2. **Consultas SQL verificadas:** Ejecución directa de las 9 consultas obligatorias y la consulta 10 (segmentación RFM) en MySQL 8.0.
3. **Comparación interanual homogénea:** Dado que 2025 cubre 12 meses y 2026 cubre hasta el 31 de octubre (10 meses), las tasas de crecimiento interanual se calculan sobre **periodos comparables** (`2026-01-01` a `2026-10-31` frente a `2025-01-01` a `2025-10-31`), evitando sesgos por meses faltantes de noviembre y diciembre de 2026.
4. **Criterios explícitos de riesgo:** Cada posible riesgo comercial se evalúa frente a un umbral numérico definido previamente y solo se declara respaldado cuando los datos observados lo superan.

---

## 4. Resultados generales del periodo

| Indicador global (enero 2025 – octubre 2026) | Valor observado |
|---|---:|
| **Ingresos netos totales** | **$ 351.210.800 COP** |
| **Costos totales** | **$ 248.711.600 COP** |
| **Utilidad bruta total** | **$ 102.499.200 COP** |
| **Margen de utilidad promedio** | **29,18 %** |
| **Total de transacciones (facturas distintas)** | **180** |
| **Ticket promedio** | **$ 1.951.171 COP** |
| **Clientes activos (con ≥ 1 compra)** | **28** (de 30 registrados) |
| **Unidades vendidas** | **833 unidades** |
| **Crecimiento periodo comparable (ene–oct 2026 vs ene–oct 2025)** | **+118,58 %** (`$ 200,78 M` vs `$ 91,86 M`) |
| **Mes de mayores ingresos** | **Diciembre de 2025** (`$ 37.918.900 COP`, 25 ventas) |

---

## 5. Respuestas a los cuatro interrogantes estratégicos

### Pregunta 1: ¿Qué ciudad representa mayor oportunidad?

#### Evidencia cuantitativa observada
| Ciudad | Ingresos totales (COP) | Participación | Ventas | Ticket prom. (COP) | Margen | Ene–Oct 2025 (COP) | Ene–Oct 2026 (COP) | Crecimiento comparable |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **Bogotá** | $ 128.655.400 | 36,63 % | 61 | $ 2.109.105 | 27,83 % | $ 32.368.300 | $ 77.164.900 | +138,40 % |
| **Medellín** | $ 88.451.000 | 25,18 % | 44 | $ 2.010.250 | 32,14 % | $ 29.176.900 | $ 43.695.300 | +49,76 % |
| **Cali** | $ 38.370.800 | 10,93 % | 22 | $ 1.744.127 | 27,80 % | $ 14.808.700 | $ 16.220.300 | +9,53 % |
| **Pereira** | $ 33.002.300 | 9,40 % | 12 | $ 2.750.192 | 28,87 % | $ 3.389.500 | $ 28.352.700 | **+736,49 %** |
| **Cartagena** | $ 21.090.000 | 6,00 % | 8 | $ 2.636.250 | 21,46 % | $ 3.668.500 | $ 16.189.600 | +341,31 % |
| **Bucaramanga** | $ 14.727.500 | 4,19 % | 12 | $ 1.227.292 | 37,81 % | $ 2.818.700 | $ 6.559.300 | +132,71 % |
| **Barranquilla** | $ 14.413.000 | 4,10 % | 14 | $ 1.029.500 | 33,93 % | $ 3.581.600 | $ 8.789.100 | +145,40 % |
| **Cúcuta** | $ 12.500.800 | 3,56 % | 7 | $ 1.785.829 | 24,69 % | $ 2.044.700 | $ 3.806.600 | +86,17 % |

#### Análisis y distinción entre liderazgo actual y oportunidad de crecimiento
- **Ciudad líder en volumen actual:** **Bogotá** encabeza la facturación nacional con `$ 128.655.400 COP` (`36,63 %`), `61` transacciones y crecimiento interanual de `+138,40 %`, seguida por **Medellín** (`$ 88.451.000 COP`, `25,18 %`). Ambas son las únicas plazas por encima del promedio nacional por ciudad (`$ 43.901.350 COP`).
- **Ciudad con mayor oportunidad de expansión observada:** **Pereira** se destaca como la principal oportunidad de crecimiento. Pese a ubicarse cuarta en volumen (`9,40 %`, `12` ventas), presenta el **ticket promedio más alto del país (`$ 2.750.192 COP`)** y el **mayor crecimiento observado (`+736,49 %`)** al pasar de `$ 3.389.500` (ene–oct 2025) a `$ 28.352.700` (ene–oct 2026), impulsada además tras la contratación de su vendedor asignado en junio de 2025. Como plazas complementarias destacan **Cartagena** (segundo ticket más alto, `$ 2.636.250 COP`, y `+341,31 %` de crecimiento con solo 8 ventas) y **Cali** (tercera ciudad en población de referencia con ~2,28 millones de habitantes, pero estancada en apenas `+9,53 %` interanual).

#### Aclaración metodológica obligatoria
Los registros internos de facturación muestran demanda **efectivamente capturada**, pero **no permiten calcular el potencial total del mercado ni la participación real de mercado (*market share*)** en ninguna ciudad sin información externa (tamaño del mercado objetivo, gasto de competidores, demanda insatisfecha o penetración digital regional).

---

### Pregunta 2: ¿Qué vendedor tiene mejor rendimiento?

#### Evidencia cuantitativa observada
| Pos. | Vendedor | Ciudad asignada | Ventas | Ingresos (COP) | Partic. | Ticket prom. (COP) | Utilidad (COP) | Margen |
|---:|---|---|---:|---:|---:|---:|---:|---:|
| 1 | **Juan Pablo Rodríguez** | Medellín | 42 | $ 90.517.400 | 25,77 % | $ 2.155.176 | $ 28.974.300 | 32,01 % |
| 2 | **María Fernanda López** | Bogotá | 24 | $ 68.445.200 | 19,49 % | $ 2.851.883 | $ 16.997.600 | 24,83 % |
| 3 | **Carlos Andrés Martínez** | Bogotá | 35 | $ 54.285.900 | 15,46 % | $ 1.551.026 | $ 16.302.800 | 30,03 % |
| 4 | Laura Valentina Torres | Cali | 22 | $ 38.370.800 | 10,93 % | $ 1.744.127 | $ 10.666.400 | 27,80 % |
| 5 | **Diego Alejandro Morales** | Pereira | 11 | $ 32.549.200 | 9,27 % | **$ 2.959.018** | $ 9.328.700 | 28,66 % |
| 6 | Valentina Sofía Castro | Cartagena | 8 | $ 21.090.000 | 6,00 % | $ 2.636.250 | $ 4.525.800 | 21,46 % |
| 7 | Santiago David Herrera | Bucaramanga | 12 | $ 14.727.500 | 4,19 % | $ 1.227.292 | $ 5.568.300 | 37,81 % |
| 8 | Daniela Alejandra Ruiz | Cúcuta | 7 | $ 12.500.800 | 3,56 % | $ 1.785.829 | $ 3.086.400 | 24,69 % |
| 9 | Andrés Felipe Gómez | Barranquilla | 13 | $ 10.773.000 | 3,07 % | $ 828.692 | $ 3.780.500 | 35,09 % |
| 10 | **Camila Andrea Vargas** | Medellín | 6 | $ 7.951.000 | 2,26 % | $ 1.325.167 | $ 3.268.400 | **41,11 %** |

#### Evaluación multidimensional (facturación total vs. productividad individual)
No existe un único ganador en todas las dimensiones; la respuesta depende del criterio priorizado:
- **Mejor rendimiento en volumen y utilidad absoluta:** **Juan Pablo Rodríguez** (Medellín) ocupa el primer lugar con `$ 90.517.400 COP` (`25,77 %` del total nacional), `$ 28.974.300 COP` de utilidad (`32,01 %` de margen) y `42` facturas cerradas (incluidas `4` ventas de cobertura en otras ciudades).
- **Mayor productividad por transacción (ticket promedio):** **Diego Alejandro Morales** (Pereira) alcanza el ticket promedio más alto (`$ 2.959.018 COP` en `11` ventas), seguido muy de cerca por **María Fernanda López** (Bogotá, `$ 2.851.883 COP` en `24` ventas), quien además muestra un excelente equilibrio entre alto volumen y alto valor por factura.
- **Mejor margen de rentabilidad por peso vendido:** **Camila Andrea Vargas** (`41,11 %`) y **Santiago David Herrera** (`37,81 %`), aunque sobre bases de facturación pequeñas.

#### Limitaciones de los datos disponibles sobre vendedores
- **Antigüedad desigual:** Los líderes (`Juan Pablo`, `Carlos Andrés`, `María Fernanda`) fueron contratados en **2023**, mientras que `Diego Alejandro Morales` ingresó en **junio de 2025**; comparar totales acumulados sin ajustar por meses activos desfavorece a ingresos posteriores.
- **Efecto de plaza y ausencia de metas:** Los vendedores asignados a Bogotá y Medellín atienden mercados más grandes; además, la base no contiene cuotas asignadas, número de prospectos atendidos, tasa de conversión ni gastos de viáticos/comisiones, por lo que no se puede medir eficiencia de conversión ni rentabilidad neta de nómina.

---

### Pregunta 3: ¿Qué categoría debería fortalecerse?

#### Evidencia cuantitativa y evolución interanual (ene–oct 2025 vs ene–oct 2026)
| Categoría | Ingresos totales | Partic. | Utilidad total | Margen | Rank fact. | Rank util. | Crec. ingresos (ene–oct YoY) | Crec. utilidad (ene–oct YoY) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **Tecnología** | $ 133.838.500 | 38,11 % | $ 22.881.600 | **17,10 %** | 1 | 3 | +105,00 % | +124,46 % |
| **Deportes y Outdoor** | $ 77.567.400 | 22,09 % | $ 25.377.200 | 32,72 % | 2 | 2 | +164,36 % | +145,21 % |
| **Hogar y Muebles** | $ 70.215.300 | 19,99 % | **$ 25.743.200** | 36,66 % | 3 | **1** | +175,65 % | +163,30 % |
| **Oficina y Papelería** | $ 37.341.500 | 10,63 % | **$ 12.909.900** | 34,57 % | 4 | 5 | **+9,92 %** | **+14,85 %** |
| **Salud y Bienestar** | $ 32.248.100 | **9,18 %** | $ 15.587.300 | **48,34 %** | 5 | 4 | **+176,59 %** | **+191,36 %** |

#### Justificación de la categoría prioritaria a fortalecer
Se identifican dos frentes complementarios, priorizando **Salud y Bienestar** para expansión comercial y **Tecnología** para saneamiento de margen:
1. **Prioridad de expansión comercial — *Salud y Bienestar*:** Es la categoría con **mayor margen porcentual del portafolio (`48,34 %`, casi 20 puntos por encima del promedio global de `29,18 %`)** y la de **mayor aceleración interanual (`+176,59 %` en ingresos y `+191,36 %` en utilidad)**; sin embargo, apenas representa el **9,18 %** de las ventas totales (última en facturación). Aumentar su participación en las compras mediante venta cruzada tiene un impacto directo y desproporcionado sobre la utilidad neta. *(Por otro lado, **Oficina y Papelería** muestra estancamiento con apenas `+9,92 %` interanual pese a mover 194 unidades, lo que amerita revisar su reposicionamiento en paquetes corporativos).*
2. **Prioridad de corrección de rentabilidad — *Tecnología*:** Aunque lidera la facturación (`38,11 %`), cae al tercer lugar en utilidad por su margen de solo `17,10 %`. En particular, el producto estrella **`TEC-001` (Laptop Empresarial 15.6 pulgadas)** aporta el `19,93 %` de toda la facturación (`$ 70.009.600 COP`), pero deja apenas **`10,46 %` de margen** (`$ 7.320.600 COP` de utilidad), arrastrando hacia abajo la rentabilidad global.

---

### Pregunta 4: ¿Qué riesgos identifica?

A continuación se evalúan seis posibles riesgos aplicando umbrales explícitos sobre los datos observados. **Solo se declaran respaldados aquellos cuya métrica supera el umbral definido**:

| Posible riesgo | Métrica evaluada | Valor observado | Umbral | ¿Respaldado? | Evidencia en los datos |
|---|---|---:|---:|:---:|---|
| **Dependencia de pocos vendedores** | Participación de los 3 mayores vendedores | **60,72 %** | > 50,0 % | **Sí** | Juan Pablo Rodríguez (`25,77 %`), María Fernanda López (`19,49 %`) y Carlos Andrés Martínez (`15,46 %`) generan `$ 213,25 M COP` y `101` de `180` ventas. |
| **Concentración geográfica de ingresos** | Participación de la ciudad líder (`Bogotá`) | **36,63 %** | > 35,0 % | **Sí** | Bogotá concentra `36,63 %` y junto con Medellín suman `61,82 %`; HHI de ciudades = `2.266,7` (concentración moderada-alta). |
| **Productos con bajo margen** | Productos con margen < 15,0 % | **1 producto** | > 0 | **Sí** | `TEC-001` (`Laptop Empresarial 15.6"`) tiene margen de `10,46 %` siendo el producto #1 en ingresos (`19,93 %` del total). |
| **Variabilidad temporal de ventas** | Coeficiente de variación mensual (σ / μ) | **0,625** | > 0,35 | **Sí** | Oscilación marcada entre `May 2025` (`$ 765.700`, 2 ventas) y `Dic 2025` (`$ 37.918.900`, 25 ventas). |
| **Dependencia de una categoría** | Participación de la categoría líder (`Tecnología`) | **38,11 %** | > 40,0 % | **No** *(bajo umbral)* | Aunque `Tecnología` no supera el umbral de `40 %`, el HHI de categorías es `2.537,2`, por lo que conviene monitorear que no siga escalando sin mejorar su margen. |
| **Baja frecuencia de recompra** | % de clientes activos con > 1 compra | **82,14 %** | < 50,0 % | **No respaldado** | `23` de `28` clientes compradores han comprado más de una vez (solo `5` clientes realizaron una única compra y `2` registrados no han comprado aún). |

---

## 6. Segmentación de clientes potencialmente premium (RFM)

Con corte a **2026-11-18**, se aplicó la consulta SQL 10 utilizando **Recencia** (`R ≤ 180 días`), **Frecuencia** (`F ≥ 3 compras distintas`) y **Valor Monetario** (`PERCENT_RANK ≥ 0,75`, cuartil superior).

| Segmento | Regla (criterios cumplidos) | Clientes | Ingresos (COP) | Participación | Ticket prom. (COP) |
|---|---|---:|---:|---:|---:|
| **Premium** | 3 de 3 criterios | 7 (25,0 %) | $ 184.535.400 | **52,54 %** | $ 1.942.478 |
| **Potencial premium** | 2 de 3 criterios | 11 (39,3 %) | $ 101.248.500 | 28,83 % | $ 1.633.040 |
| **Regular** | 0 o 1 criterio | 10 (35,7 %) | $ 65.426.900 | 18,63 % | $ 2.844.648 |

Los **7 clientes Premium** (ubicados principalmente en Bogotá y Medellín, además de Hernán David Quintero en Cali y Christian Eduardo Peña en Pereira) sostienen más de la mitad de la facturación (`52,54 %`). El grupo **Potencial premium** (11 clientes) ya cumple frecuencia (`≥ 3`) y recencia (`≤ 180` días), pero su gasto acumulado aún no alcanza el percentil `75` (por ejemplo, `Lucía del Carmen Peña` está en el percentil `74,1` con `$ 15.450.300 COP`), lo que los convierte en el segmento de conversión más inmediata.

---

## 7. Tres estrategias de negocio basadas en datos

### Estrategia 1: Programa de conversión "Potencial → Premium" y mezcla hacia *Salud y Bienestar* (Venta cruzada dirigida)
- **Hallazgo que la justifica:** `Salud y Bienestar` genera el margen más alto (`48,34 %`) y el mayor crecimiento interanual (`+176,59 %`), pero participa solo con `9,18 %` de las ventas. Simultáneamente, existen `11` clientes **Potencial premium** que compran con frecuencia (`3` a `9` veces) y recencia vigente (`18` a `166` días), pero cuyo ticket promedio (`$ 1.633.040 COP`) es inferior al del grupo Premium (`$ 1.942.478 COP`).
- **Objetivo:** Elevar la participación de *Salud y Bienestar* en la facturación total y migrar al menos a 4 clientes de *Potencial premium* hacia el segmento *Premium* durante los próximos 6 meses.
- **Acciones concretas:**
  1. Diseñar paquetes de venta cruzada (*bundles*) de oficina saludable: combinar productos de alta demanda en `Tecnología` y `Hogar` (como `TEC-004` Mouse Ergonómico o `HOG-002` Silla Ergonómica) con `SAL-004` Purificador de Aire HEPA o `SAL-003` Masajeador Cervical.
  2. Activar campañas comerciales personalizadas para los 5 clientes *Potencial premium* más cercanos al umbral (`Lucía del Carmen Peña`, `Álvaro Javier Pineda`, `Esteban Camilo Lozano`, `Óscar Mauricio Pardo` y `Paola Alexandra Medina`) y reactivar a los 2 clientes frecuentes inactivos (`Roberto Carlos Mejía` y `Camila Fernanda Acosta`).
- **Indicador KPI:** Participación porcentual de `Salud y Bienestar` sobre ingresos totales, porcentaje de clientes en segmento `Premium` y margen bruto promedio de la compañía.
- **Meta sugerida y justificación:** Incrementar la participación de `Salud y Bienestar` del **`9,18 %` al `13,0 %`** y el margen global del **`29,18 %` al `31,0 %`** en 6 meses. Es alcanzable porque la categoría ya duplicó su base en 2026 (`+176,59 %`) y los 11 clientes objetivo ya muestran hábito de recompra activo.
- **Riesgos y limitaciones:** Si la venta cruzada se apoya en descuentos superiores al `10 %`, se puede erosionar la ventaja de margen; además, la capacidad de inventario en productos de bienestar no está modelada en la base actual.

### Estrategia 2: Consolidación regional en plazas de alto ticket y crecimiento (Pereira, Cartagena y Cali)
- **Hallazgo que la justifica:** `Bogotá` y `Medellín` concentran `61,82 %` de los ingresos, generando vulnerabilidad territorial (`HHI ciudades = 2.266,7`). En contraste, **Pereira** creció `+736,49 %` con el ticket promedio más alto (`$ 2.750.192 COP`), **Cartagena** creció `+341,31 %` con ticket de `$ 2.636.250 COP` (apenas 8 ventas) y **Cali** tuvo un crecimiento discreto de `+9,53 %` pese a ser la tercera ciudad por tamaño demográfico.
- **Objetivo:** Reducir la concentración en Bogotá y Medellín ampliando el volumen de transacciones en Pereira, Cartagena y Cali.
- **Acciones concretas:**
  1. Aumentar la capacidad de prospección en Pereira y Cartagena mediante asignación parcial de apoyo comercial desde Medellín/Bogotá o vinculación de un asesor adicional para el Eje Cafetero/Caribe.
  2. Implementar un plan de recuperación de cuentas corporativas en Cali (donde `Laura Valentina Torres` atiende `22` ventas con ticket de `$ 1.744.127 COP`) enfocado en líneas de mayor margen (`Hogar y Muebles`).
  3. Monitorear trimestralmente el seguimiento de los `2` clientes ya registrados sin compras (`Barranquilla` y `Pereira`).
- **Indicador KPI:** Participación conjunta de ciudades distintas a Bogotá/Medellín en ingresos totales, número de transacciones mensuales en Pereira/Cartagena/Cali y valor del `HHI` geográfico.
- **Meta sugerida y justificación:** Aumentar la participación conjunta de Pereira, Cartagena y Cali del **`26,33 %` al `32,0 %`** (reduciendo Bogotá + Medellín por debajo del `58 %` y el `HHI` de ciudades por debajo de `2.100`) en dos trimestres. La meta se respalda en la tracción demostrada durante 2026 en Pereira y Cartagena.
- **Riesgos y limitaciones:** No se cuenta con estudios externos de demanda regional ni costos logísticos de despacho interciudad; expandir ventas sin controlar fletes podría disminuir el margen neto por ciudad.

### Estrategia 3: Optimización de rentabilidad en *Tecnología* y transferencia de mejores prácticas comerciales
- **Hallazgo que la justifica:** Dos desequilibrios estructurales afectan la utilidad y la estabilidad comercial: primero, `TEC-001` (*Laptop Empresarial 15.6"*) representa `19,93 %` de las ventas totales con un margen de apenas `10,46 %`, haciendo que *Tecnología* caiga del puesto `1` en ingresos al `3` en utilidad (`17,10 %` de margen); segundo, `3` vendedores generan el **`60,72 %`** de la facturación mientras asesores de plazas intermedias como `Andrés Felipe Gómez` (Barranquilla, ticket `$ 828.692 COP`) y `Santiago David Herrera` (Bucaramanga, `$ 1.227.292 COP`) cierran pedidos significativamente más pequeños.
- **Objetivo:** Mejorar la rentabilidad unitaria de la línea tecnológica y reducir la dependencia del Top 3 de vendedores elevando el ticket promedio del grupo medio/bajo.
- **Acciones concretas:**
  1. Limitar los descuentos discrecionales en `TEC-001` (que hoy promedian un precio efectivo de `$ 3.043.896 COP` frente a un precio de lista de `$ 3.200.000 COP`) y vincular su venta obligatoriamente con accesorios complementarios de mayor margen (`TEC-004` Mouse con `31,81 %` de margen, `HOG-002` Silla con `38,26 %` o `TEC-006` Audífonos con `25,79 %`).
  2. Estandarizar el guion comercial de `María Fernanda López` (ticket `$ 2,85 M COP`) y `Diego Alejandro Morales` (ticket `$ 2,96 M COP`) para capacitar en venta consultiva multiproduto a los vendedores de Barranquilla, Bucaramanga y Medellín-2 (`Camila Andrea Vargas`).
- **Indicador KPI:** Margen porcentual de la categoría `Tecnología`, porcentaje de ventas de `TEC-001` con más de un ítem en la factura y participación conjunta del Top 3 de vendedores.
- **Meta sugerida y justificación:** Elevar el margen de `Tecnología` del **`17,10 %` al `21,0 %`** (aportando más de `$ 5 M COP` adicionales de utilidad a igual volumen) y reducir la concentración del Top 3 de vendedores del **`60,72 %` a menos del `53,0 %`** en 6 meses.
- **Riesgos y limitaciones:** La elasticidad de la demanda en laptops ante menor descuento puede frenar unidades vendidas si existen competidores con menor precio; adicionalmente, la base no registra la estructura de comisiones para validar si los descuentos actuales responden a incentivos por volumen bruto en lugar de utilidad.

---

## 8. Limitaciones del análisis

1. **Naturaleza sintética de los datos:** Aunque deterministas y estadísticamente coherentes, los `658` registros son simulados para fines académicos.
2. **Ausencia de variables externas de mercado:** No se dispone de tamaño de mercado por ciudad, precios de competencia ni indicadores macroeconómicos regionales.
3. **Ausencia de costos operativos indirectos:** Los costos almacenados corresponden al costo unitario de adquisición/producto; no incluyen fletes intermunicipales, almacenamiento, devoluciones, comisiones ni gastos fijos de nómina.
4. **Periodo incompleto en 2026:** La serie finaliza el `2026-10-31`, por lo que las comparaciones anuales completas deben restringirse a los meses comparables (enero–octubre).

---

## 9. Conclusiones técnicas

El análisis demuestra la importancia de modelar correctamente los hechos comerciales antes de interpretarlos: separar la **ciudad de la venta** de la **residencia del cliente**, preservar **costos y precios históricos** en `detalle_ventas` y contar **facturas distintas** (`COUNT(DISTINCT id_venta)`) evitó distorsiones graves en geografía, rentabilidad y productividad individual. Gracias a esta arquitectura, fue posible distinguir entre liderazgo en ingresos (`Tecnología`, `Juan Pablo Rodríguez`, `Bogotá`) y liderazgo en rentabilidad o crecimiento (`Hogar y Muebles`, `Salud y Bienestar`, `Diego Alejandro Morales`, `Pereira`), fundamentando tres estrategias accionables con métricas trazables directamente en MySQL.
