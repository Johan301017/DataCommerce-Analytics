"""
DataCommerce Analytics S.A.S. - Generador determinista de datos sinteticos.

Genera el archivo database/02_datos.sql con datos ficticios (no reales) y
coherentes con el contexto colombiano. Usa una semilla fija (SEMILLA = 2026),
por lo que cada ejecucion produce exactamente el mismo archivo.

Uso:
    python database/generador/generar_datos.py

Reglas de simulacion (documentadas en documentacion/analisis_comercial.md):
  * Periodo: 2025-01-01 a 2026-10-31.
  * Estacionalidad mensual (nov/dic altos, ene/feb bajos) y crecimiento 2026.
  * Pesos por ciudad distintos para 2025 y 2026 (algunas ciudades crecen mas).
  * Cada venta se registra en una ciudad; el vendedor normalmente pertenece a
    esa ciudad. El cliente usualmente reside en esa ciudad, pero no siempre
    (por eso la ciudad de la venta se guarda en la tabla ventas).
  * Precios historicos: en 2025 los precios y costos eran menores al catalogo
    actual (incremento de lista aplicado en enero de 2026).
  * Margenes diferentes por categoria y un producto descontinuado.
"""
import random
from datetime import date, timedelta
from pathlib import Path

SEMILLA = 2026
random.seed(SEMILLA)

SALIDA = Path(__file__).resolve().parents[1] / "02_datos.sql"
FECHA_INICIO = date(2025, 1, 1)
FECHA_FIN = date(2026, 10, 31)
NUM_VENTAS = 180

# ---------------------------------------------------------------------------
# Catalogos base
# ---------------------------------------------------------------------------
CIUDADES = [
    # id, nombre, departamento, latitud, longitud, poblacion aproximada
    (1, "Bogotá", "Cundinamarca", 4.7110000, -74.0721000, 7900000),
    (2, "Medellín", "Antioquia", 6.2442000, -75.5812000, 2600000),
    (3, "Cali", "Valle del Cauca", 3.4516000, -76.5320000, 2280000),
    (4, "Barranquilla", "Atlántico", 10.9685000, -74.7813000, 1330000),
    (5, "Cúcuta", "Norte de Santander", 7.8891000, -72.4967000, 790000),
    (6, "Bucaramanga", "Santander", 7.1193000, -73.1227000, 620000),
    (7, "Cartagena", "Bolívar", 10.3910000, -75.4794000, 1060000),
    (8, "Pereira", "Risaralda", 4.8133000, -75.6961000, 480000),
]

CATEGORIAS = [
    (1, "Tecnología", "Computadores, monitores, periféricos y accesorios tecnológicos"),
    (2, "Hogar y Muebles", "Mobiliario de oficina en casa, iluminación y pequeños electrodomésticos"),
    (3, "Deportes y Outdoor", "Equipamiento deportivo, calzado y artículos para actividades al aire libre"),
    (4, "Oficina y Papelería", "Suministros de oficina, impresión, papelería y organización"),
    (5, "Salud y Bienestar", "Dispositivos de cuidado personal, bienestar y calidad del aire"),
]

# id, sku, nombre, categoria, precio_lista_actual (2026), costo_actual (2026), activo, popularidad
PRODUCTOS = [
    (1, "TEC-001", "Laptop Empresarial 15.6 pulgadas", 1, 3200000, 2780000, 1, 6),
    (2, "TEC-002", "Monitor LED 27 pulgadas 4K", 1, 1850000, 1480000, 1, 6),
    (3, "TEC-003", "Teclado Mecánico Inalámbrico", 1, 320000, 224000, 1, 8),
    (4, "TEC-004", "Mouse Ergonómico Inalámbrico", 1, 185000, 122000, 1, 10),
    (5, "TEC-005", "Webcam HD 1080p", 1, 275000, 195000, 0, 5),
    (6, "TEC-006", "Audífonos Bluetooth con Cancelación de Ruido", 1, 450000, 324000, 1, 7),
    (7, "HOG-001", "Escritorio Ajustable Eléctrico", 2, 1450000, 870000, 1, 4),
    (8, "HOG-002", "Silla Ergonómica Premium", 2, 1680000, 1010000, 1, 5),
    (9, "HOG-003", "Lámpara LED de Escritorio", 2, 189000, 110000, 1, 7),
    (10, "HOG-004", "Organizador Modular 6 Espacios", 2, 245000, 150000, 1, 5),
    (11, "HOG-005", "Set de Estantes Flotantes x3", 2, 350000, 205000, 1, 4),
    (12, "HOG-006", "Aspiradora Robot Inteligente", 2, 980000, 640000, 1, 4),
    (13, "DEP-001", "Bicicleta de Montaña Rin 29", 3, 2400000, 1700000, 1, 3),
    (14, "DEP-002", "Zapatillas Running Pro", 3, 420000, 255000, 1, 7),
    (15, "DEP-003", "Kit Mancuernas Ajustables 20 kg", 3, 380000, 230000, 1, 4),
    (16, "DEP-004", "Set Bandas de Resistencia x5", 3, 95000, 48000, 1, 6),
    (17, "DEP-005", "Carpa Camping 4 Personas", 3, 650000, 400000, 1, 3),
    (18, "DEP-006", "Botella Térmica Acero 1 L", 3, 78000, 39000, 1, 8),
    (19, "OFI-001", "Impresora Multifuncional WiFi", 4, 890000, 600000, 1, 5),
    (20, "OFI-002", "Resma de Papel Carta x5", 4, 85000, 52000, 1, 9),
    (21, "OFI-003", "Set Marcadores Premium x24", 4, 62000, 31000, 1, 6),
    (22, "OFI-004", "Tablero Acrílico 120x80 cm", 4, 215000, 130000, 1, 3),
    (23, "OFI-005", "Agenda Ejecutiva 2026", 4, 75000, 36000, 1, 6),
    (24, "OFI-006", "Destructora de Documentos", 4, 520000, 340000, 1, 3),
    (25, "SAL-001", "Tensiómetro Digital de Brazo", 5, 165000, 80000, 1, 4),
    (26, "SAL-002", "Báscula Inteligente WiFi", 5, 198000, 96000, 1, 4),
    (27, "SAL-003", "Masajeador Cervical Eléctrico", 5, 285000, 140000, 1, 4),
    (28, "SAL-004", "Purificador de Aire HEPA", 5, 780000, 420000, 1, 3),
    (29, "SAL-005", "Humidificador Ultrasónico 3 L", 5, 245000, 120000, 1, 3),
    (30, "SAL-006", "Kit Aromaterapia x8 Aceites", 5, 135000, 62000, 1, 4),
]
PRODUCTO_DESCONTINUADO = 5            # se dejo de vender desde marzo de 2026
FECHA_DESCONTINUADO = date(2026, 3, 1)

# id, nombre, correo, ciudad asignada, fecha contratacion
VENDEDORES = [
    (1, "Carlos Andrés Martínez", "carlos.martinez@datacommerce.co", 1, "2023-03-01"),
    (2, "María Fernanda López", "maria.lopez@datacommerce.co", 1, "2023-08-15"),
    (3, "Juan Pablo Rodríguez", "juan.rodriguez@datacommerce.co", 2, "2023-05-10"),
    (4, "Laura Valentina Torres", "laura.torres@datacommerce.co", 3, "2024-01-20"),
    (5, "Andrés Felipe Gómez", "andres.gomez@datacommerce.co", 4, "2024-02-05"),
    (6, "Daniela Alejandra Ruiz", "daniela.ruiz@datacommerce.co", 5, "2024-04-15"),
    (7, "Santiago David Herrera", "santiago.herrera@datacommerce.co", 6, "2024-06-01"),
    (8, "Valentina Sofía Castro", "valentina.castro@datacommerce.co", 7, "2024-03-20"),
    (9, "Diego Alejandro Morales", "diego.morales@datacommerce.co", 8, "2025-06-01"),
    (10, "Camila Andrea Vargas", "camila.vargas@datacommerce.co", 2, "2024-07-15"),
]
# Peso del vendedor dentro de su ciudad y factor de ticket (tamano de pedido)
PESO_VENDEDOR = {1: 62, 2: 38, 3: 75, 10: 25, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1}
FACTOR_TICKET = {1: 1.00, 2: 1.25, 3: 1.05, 4: 1.00, 5: 0.95, 6: 0.80,
                 7: 1.00, 8: 0.90, 9: 1.20, 10: 0.70}

# Clientes ficticios: nombre, ciudad de residencia, propension de compra, fecha registro
CLIENTES = [
    ("Ana María Gutiérrez", 1, 9, "2024-09-12"),
    ("Pedro José Ramírez", 1, 7, "2024-10-03"),
    ("Lucía del Carmen Peña", 1, 2, "2025-02-18"),
    ("Roberto Carlos Mejía", 1, 5, "2024-11-21"),
    ("Sandra Patricia Muñoz", 1, 1, "2025-07-09"),
    ("Felipe Antonio Díaz", 1, 4, "2024-12-01"),
    ("Carolina Isabel Ríos", 1, 3, "2026-01-15"),
    ("Jorge Enrique Salazar", 2, 8, "2024-08-30"),
    ("Natalia Andrea Duarte", 2, 6, "2024-10-17"),
    ("Óscar Mauricio Pardo", 2, 2, "2025-03-05"),
    ("Camila Fernanda Acosta", 2, 4, "2024-12-11"),
    ("Gustavo Ernesto Niño", 2, 1, "2025-09-22"),
    ("Paola Alexandra Medina", 2, 3, "2025-01-08"),
    ("Hernán David Quintero", 3, 6, "2024-09-25"),
    ("Tatiana Marcela Vargas", 3, 3, "2024-11-02"),
    ("Álvaro Javier Pineda", 3, 2, "2025-04-14"),
    ("Mónica Liliana Cárdenas", 3, 1, "2025-10-30"),
    ("Esteban Camilo Lozano", 4, 5, "2024-10-09"),
    ("Luisa Fernanda Monroy", 4, 2, "2025-02-27"),
    ("Fabián Andrés Ortega", 4, 1, "2025-06-16"),
    ("Claudia Milena Rojas", 5, 3, "2024-12-19"),
    ("Julio César Bermúdez", 5, 1, "2025-05-06"),
    ("Angélica María Suárez", 6, 4, "2024-11-28"),
    ("Iván Darío Castaño", 6, 2, "2025-08-01"),
    ("Diana Carolina Flórez", 6, 2, "2026-02-10"),
    ("Mauricio Alejandro Gil", 7, 3, "2024-10-21"),
    ("Rosa Elena Navarro", 7, 1, "2025-03-19"),
    ("Christian Eduardo Peña", 8, 4, "2025-01-24"),
    ("Viviana Lorena Ospina", 8, 3, "2025-07-30"),
    ("Miguel Ángel Restrepo", 8, 1, "2026-03-03"),
]
# Clientes que dejaron de comprar (ultima compra posible) -> alimentan recencia
CLIENTES_INACTIVOS = {4: date(2026, 3, 31), 15: date(2026, 2, 28), 11: date(2026, 4, 30)}

ESTACIONALIDAD = {1: 0.70, 2: 0.75, 3: 0.90, 4: 0.90, 5: 1.00, 6: 1.05,
                  7: 0.95, 8: 1.00, 9: 1.00, 10: 1.10, 11: 1.30, 12: 1.50}
CRECIMIENTO_ANUAL = {2025: 1.00, 2026: 1.15}
PESO_CIUDAD = {
    2025: {1: 34, 2: 24, 3: 16, 4: 10, 5: 5, 6: 4, 7: 4, 8: 3},
    2026: {1: 31, 2: 22, 3: 14, 4: 10, 5: 5, 6: 6, 7: 5, 8: 7},
}
FACTOR_PRECIO_2025 = 0.94   # en 2025 la lista era 6 % menor
FACTOR_COSTO_2025 = 0.95


def sin_acentos(texto: str) -> str:
    tabla = str.maketrans("áéíóúÁÉÍÓÚñÑ", "aeiouAEIOUnN")
    return texto.translate(tabla)


def sql_str(texto: str) -> str:
    return "'" + texto.replace("\\", "\\\\").replace("'", "''") + "'"


def generar_fechas():
    """Selecciona NUM_VENTAS fechas segun estacionalidad y crecimiento."""
    dias, pesos = [], []
    d = FECHA_INICIO
    while d <= FECHA_FIN:
        dias.append(d)
        pesos.append(ESTACIONALIDAD[d.month] * CRECIMIENTO_ANUAL[d.year])
        d += timedelta(days=1)
    return sorted(random.choices(dias, weights=pesos, k=NUM_VENTAS))


def elegir_vendedor(ciudad: int, fecha: date) -> int:
    candidatos = [v for v in VENDEDORES
                  if v[3] == ciudad and date.fromisoformat(v[4]) <= fecha]
    if not candidatos or random.random() < 0.08:
        # cobertura: un vendedor de Bogota o Medellin atiende otra plaza
        candidatos = [v for v in VENDEDORES if v[0] in (1, 3)]
    ids = [v[0] for v in candidatos]
    return random.choices(ids, weights=[PESO_VENDEDOR[i] for i in ids], k=1)[0]


def elegir_cliente(ciudad: int, fecha: date) -> int:
    def habilitado(idx: int) -> bool:
        c = CLIENTES[idx - 1]
        if date.fromisoformat(c[3]) > fecha:
            return False
        limite = CLIENTES_INACTIVOS.get(idx)
        return limite is None or fecha <= limite

    locales = [i for i in range(1, len(CLIENTES) + 1)
               if CLIENTES[i - 1][1] == ciudad and habilitado(i)]
    todos = [i for i in range(1, len(CLIENTES) + 1) if habilitado(i)]
    pool = locales if (locales and random.random() < 0.82) else todos
    return random.choices(pool, weights=[CLIENTES[i - 1][2] for i in pool], k=1)[0]


def generar():
    fechas = generar_fechas()
    ventas, detalles = [], []
    consecutivo = {2025: 0, 2026: 0}
    for id_venta, fecha in enumerate(fechas, start=1):
        ciudad_ids = list(PESO_CIUDAD[fecha.year].keys())
        ciudad = random.choices(ciudad_ids, weights=list(PESO_CIUDAD[fecha.year].values()), k=1)[0]
        vendedor = elegir_vendedor(ciudad, fecha)
        cliente = elegir_cliente(ciudad, fecha)
        consecutivo[fecha.year] += 1
        factura = f"FE-{fecha.year}-{consecutivo[fecha.year]:05d}"
        ventas.append((id_venta, factura, cliente, vendedor, ciudad, fecha.isoformat()))

        factor = FACTOR_TICKET[vendedor]
        num_items = random.choices([1, 2, 3, 4], weights=[30, 38, 22, 10], k=1)[0]
        if factor >= 1.2 and num_items < 4 and random.random() < 0.35:
            num_items += 1
        disponibles = [p for p in PRODUCTOS
                       if not (p[0] == PRODUCTO_DESCONTINUADO and fecha >= FECHA_DESCONTINUADO)]
        elegidos = []
        while len(elegidos) < num_items:
            p = random.choices(disponibles, weights=[x[7] for x in disponibles], k=1)[0]
            if p not in elegidos:
                elegidos.append(p)

        for p in elegidos:
            pid, _, _, _, lista, costo, _, _ = p
            if fecha.year == 2025:
                precio = round(lista * FACTOR_PRECIO_2025, -2)
                costo_u = round(costo * FACTOR_COSTO_2025, -2)
            else:
                precio, costo_u = float(lista), float(costo)
            if lista >= 1000000:
                cantidad = random.choices([1, 2, 3], weights=[70, 22, 8], k=1)[0]
            elif lista >= 300000:
                cantidad = random.choices([1, 2, 3, 4], weights=[50, 30, 14, 6], k=1)[0]
            else:
                cantidad = random.choices([1, 2, 3, 4, 5, 6], weights=[28, 27, 18, 12, 9, 6], k=1)[0]
            if factor >= 1.2 and random.random() < 0.4:
                cantidad += 1
            elif factor < 0.85 and cantidad > 1 and random.random() < 0.5:
                cantidad -= 1
            pct = random.choices([0, 0.05, 0.10, 0.15], weights=[64, 20, 11, 5], k=1)[0]
            descuento = round(precio * pct, -2)
            detalles.append([None, id_venta, pid, cantidad, precio, costo_u, descuento])

    for i, d in enumerate(detalles, start=1):
        d[0] = i
    return ventas, detalles


def construir_sql(ventas, detalles) -> str:
    L = []
    L.append("-- ============================================================================")
    L.append("-- DataCommerce Analytics S.A.S.")
    L.append("-- Script 02: Insercion de datos sinteticos (ficticios)")
    L.append(f"-- Generado por database/generador/generar_datos.py con semilla fija {SEMILLA}.")
    L.append("-- Ejecutar DESPUES de 01_esquema.sql. Motor: MySQL 8.0. Moneda: COP.")
    L.append("-- Los nombres, documentos y correos son inventados; no corresponden a personas reales.")
    L.append("-- ============================================================================")
    L.append("")
    L.append("USE datacommerce_analytics;")
    L.append("SET NAMES utf8mb4;")
    L.append("START TRANSACTION;")
    L.append("")

    L.append("-- CIUDADES (8)")
    L.append("INSERT INTO ciudades (id_ciudad, nombre, departamento, latitud, longitud, poblacion) VALUES")
    L.append(",\n".join(f"({c[0]}, {sql_str(c[1])}, {sql_str(c[2])}, {c[3]:.7f}, {c[4]:.7f}, {c[5]})"
                        for c in CIUDADES) + ";")
    L.append("")

    L.append("-- CATEGORIAS (5)")
    L.append("INSERT INTO categorias (id_categoria, nombre, descripcion) VALUES")
    L.append(",\n".join(f"({c[0]}, {sql_str(c[1])}, {sql_str(c[2])})" for c in CATEGORIAS) + ";")
    L.append("")

    L.append("-- PRODUCTOS (30) - precio_lista corresponde al catalogo VIGENTE (2026)")
    L.append("INSERT INTO productos (id_producto, codigo_sku, nombre, id_categoria, precio_lista, activo) VALUES")
    L.append(",\n".join(f"({p[0]}, {sql_str(p[1])}, {sql_str(p[2])}, {p[3]}, {p[4]:.2f}, {p[6]})"
                        for p in PRODUCTOS) + ";")
    L.append("")

    L.append("-- VENDEDORES (10)")
    L.append("INSERT INTO vendedores (id_vendedor, nombre, correo, id_ciudad_asignada, fecha_contratacion) VALUES")
    L.append(",\n".join(f"({v[0]}, {sql_str(v[1])}, {sql_str(v[2])}, {v[3]}, '{v[4]}')"
                        for v in VENDEDORES) + ";")
    L.append("")

    L.append("-- CLIENTES (30) - documentos y correos ficticios")
    filas = []
    for i, (nombre, ciudad, _, registro) in enumerate(CLIENTES, start=1):
        partes = sin_acentos(nombre).lower().split()
        correo = f"{partes[0]}.{partes[-1]}{i:02d}@correo-ficticio.co"
        documento = f"{1000100000 + i * 7919}"
        filas.append(f"({i}, '{documento}', {sql_str(nombre)}, '{correo}', {ciudad}, '{registro}')")
    L.append("INSERT INTO clientes (id_cliente, documento, nombre, correo, id_ciudad, fecha_registro) VALUES")
    L.append(",\n".join(filas) + ";")
    L.append("")

    L.append(f"-- VENTAS ({len(ventas)}) - encabezados de factura")
    for k in range(0, len(ventas), 60):
        L.append("INSERT INTO ventas (id_venta, numero_factura, id_cliente, id_vendedor, id_ciudad, fecha_venta) VALUES")
        L.append(",\n".join(f"({v[0]}, '{v[1]}', {v[2]}, {v[3]}, {v[4]}, '{v[5]}')"
                            for v in ventas[k:k + 60]) + ";")
        L.append("")

    L.append(f"-- DETALLE_VENTAS ({len(detalles)}) - precio, costo y descuento historicos por unidad")
    for k in range(0, len(detalles), 60):
        L.append("INSERT INTO detalle_ventas (id_detalle, id_venta, id_producto, cantidad, "
                 "precio_unitario, costo_unitario, descuento_unitario) VALUES")
        L.append(",\n".join(f"({d[0]}, {d[1]}, {d[2]}, {d[3]}, {d[4]:.2f}, {d[5]:.2f}, {d[6]:.2f})"
                            for d in detalles[k:k + 60]) + ";")
        L.append("")

    L.append("COMMIT;")
    L.append("")
    total = len(CIUDADES) + len(CATEGORIAS) + len(PRODUCTOS) + len(VENDEDORES) + len(CLIENTES) + len(ventas) + len(detalles)
    L.append(f"-- Resumen: ciudades={len(CIUDADES)}, categorias={len(CATEGORIAS)}, productos={len(PRODUCTOS)}, "
             f"vendedores={len(VENDEDORES)}, clientes={len(CLIENTES)}, ventas={len(ventas)}, "
             f"detalle_ventas={len(detalles)}, total={total}")
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    v, d = generar()
    SALIDA.write_text(construir_sql(v, d), encoding="utf-8")
    print(f"Archivo generado: {SALIDA}")
    print(f"ventas={len(v)} detalle_ventas={len(d)}")
