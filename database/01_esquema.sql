-- ============================================================================
-- DataCommerce Analytics S.A.S.
-- Script 01: Creación del esquema de base de datos
-- Motor: MySQL 8.0
-- Autor: Equipo de Business Intelligence & Data Analytics
-- Fecha: 2026-11-18
-- ============================================================================
-- ADVERTENCIA IMPORTANTE:
-- Este script ejecuta DROP DATABASE IF EXISTS datacommerce_analytics.
-- Si ya existe una base de datos activa con datos propios o modificados,
-- su ejecución ELIMINARÁ TODAS LAS TABLAS Y REGISTROS existentes.
-- Úselo únicamente para instalación inicial o reinicio completo del entorno.
-- ============================================================================

-- Crear la base de datos (ADVERTENCIA: elimina la base si ya existe)
DROP DATABASE IF EXISTS datacommerce_analytics;
CREATE DATABASE datacommerce_analytics
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE datacommerce_analytics;

-- ============================================================================
-- TABLA 1: ciudades
-- Almacena las ciudades donde opera DataCommerce Analytics.
-- Incluye coordenadas geográficas para visualización en mapas.
-- ============================================================================
CREATE TABLE ciudades (
    id_ciudad       INT             NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)    NOT NULL,
    departamento    VARCHAR(100)    NOT NULL,
    latitud         DECIMAL(10, 7)  NOT NULL,
    longitud        DECIMAL(10, 7)  NOT NULL,
    poblacion       INT             NULL COMMENT 'Población aproximada para contexto',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_ciudades PRIMARY KEY (id_ciudad),
    CONSTRAINT uq_ciudad_nombre UNIQUE (nombre)
) ENGINE=InnoDB COMMENT='Ciudades donde opera DataCommerce Analytics S.A.S.';

-- ============================================================================
-- TABLA 2: clientes
-- Almacena información de los clientes registrados.
-- Documento ficticio único; ciudad de residencia referenciada.
-- ============================================================================
CREATE TABLE clientes (
    id_cliente      INT             NOT NULL AUTO_INCREMENT,
    documento       VARCHAR(20)     NOT NULL COMMENT 'Documento de identidad ficticio',
    nombre          VARCHAR(150)    NOT NULL,
    correo          VARCHAR(200)    NOT NULL,
    id_ciudad       INT             NOT NULL COMMENT 'Ciudad de residencia',
    fecha_registro  DATE            NOT NULL,
    
    CONSTRAINT pk_clientes PRIMARY KEY (id_cliente),
    CONSTRAINT uq_cliente_documento UNIQUE (documento),
    CONSTRAINT uq_cliente_correo UNIQUE (correo),
    CONSTRAINT fk_clientes_ciudad FOREIGN KEY (id_ciudad)
        REFERENCES ciudades(id_ciudad)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Clientes registrados en el sistema';

-- Índice para búsquedas frecuentes por ciudad
CREATE INDEX idx_clientes_ciudad ON clientes(id_ciudad);
CREATE INDEX idx_clientes_fecha_registro ON clientes(fecha_registro);

-- ============================================================================
-- TABLA 3: vendedores
-- Almacena información de los vendedores de la empresa.
-- Cada vendedor tiene una ciudad asignada como zona principal.
-- ============================================================================
CREATE TABLE vendedores (
    id_vendedor         INT             NOT NULL AUTO_INCREMENT,
    nombre              VARCHAR(150)    NOT NULL,
    correo              VARCHAR(200)    NOT NULL,
    id_ciudad_asignada  INT             NOT NULL COMMENT 'Ciudad principal asignada',
    fecha_contratacion  DATE            NOT NULL,
    activo              TINYINT(1)      NOT NULL DEFAULT 1,
    
    CONSTRAINT pk_vendedores PRIMARY KEY (id_vendedor),
    CONSTRAINT uq_vendedor_correo UNIQUE (correo),
    CONSTRAINT fk_vendedores_ciudad FOREIGN KEY (id_ciudad_asignada)
        REFERENCES ciudades(id_ciudad)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_vendedor_activo CHECK (activo IN (0, 1))
) ENGINE=InnoDB COMMENT='Vendedores de DataCommerce Analytics S.A.S.';

CREATE INDEX idx_vendedores_ciudad ON vendedores(id_ciudad_asignada);

-- ============================================================================
-- TABLA 4: categorias
-- Categorías de productos del catálogo.
-- ============================================================================
CREATE TABLE categorias (
    id_categoria    INT             NOT NULL AUTO_INCREMENT,
    nombre          VARCHAR(100)    NOT NULL,
    descripcion     VARCHAR(500)    NULL,
    
    CONSTRAINT pk_categorias PRIMARY KEY (id_categoria),
    CONSTRAINT uq_categoria_nombre UNIQUE (nombre)
) ENGINE=InnoDB COMMENT='Categorías de productos';

-- ============================================================================
-- TABLA 5: productos
-- Catálogo de productos con precio de lista actual.
-- Los precios históricos se guardan en detalle_ventas.
-- ============================================================================
CREATE TABLE productos (
    id_producto     INT             NOT NULL AUTO_INCREMENT,
    codigo_sku      VARCHAR(30)     NOT NULL COMMENT 'Código SKU único',
    nombre          VARCHAR(200)    NOT NULL,
    id_categoria    INT             NOT NULL,
    precio_lista    DECIMAL(12, 2)  NOT NULL COMMENT 'Precio actual en COP',
    activo          TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_productos PRIMARY KEY (id_producto),
    CONSTRAINT uq_producto_sku UNIQUE (codigo_sku),
    CONSTRAINT fk_productos_categoria FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_producto_precio CHECK (precio_lista > 0),
    CONSTRAINT chk_producto_activo CHECK (activo IN (0, 1))
) ENGINE=InnoDB COMMENT='Catálogo de productos';

CREATE INDEX idx_productos_categoria ON productos(id_categoria);

-- ============================================================================
-- TABLA 6: ventas
-- Encabezado de cada transacción de venta.
-- La ciudad de la venta se almacena independientemente de la ciudad
-- de residencia del cliente, para análisis geográfico correcto.
-- ============================================================================
CREATE TABLE ventas (
    id_venta        INT             NOT NULL AUTO_INCREMENT,
    numero_factura  VARCHAR(20)     NOT NULL COMMENT 'Número de factura único',
    id_cliente      INT             NOT NULL,
    id_vendedor     INT             NOT NULL,
    id_ciudad       INT             NOT NULL COMMENT 'Ciudad donde ocurrió la venta',
    fecha_venta     DATE            NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT pk_ventas PRIMARY KEY (id_venta),
    CONSTRAINT uq_venta_factura UNIQUE (numero_factura),
    CONSTRAINT fk_ventas_cliente FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_vendedor FOREIGN KEY (id_vendedor)
        REFERENCES vendedores(id_vendedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_ventas_ciudad FOREIGN KEY (id_ciudad)
        REFERENCES ciudades(id_ciudad)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Encabezado de transacciones de venta';

-- Índices para consultas analíticas frecuentes
CREATE INDEX idx_ventas_cliente ON ventas(id_cliente);
CREATE INDEX idx_ventas_vendedor ON ventas(id_vendedor);
CREATE INDEX idx_ventas_ciudad ON ventas(id_ciudad);
CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);

-- ============================================================================
-- TABLA 7: detalle_ventas
-- Líneas de detalle de cada venta.
-- Almacena precio unitario, costo unitario y descuento al momento
-- de la transacción para preservar datos históricos.
-- Resuelve la relación N:M entre ventas y productos.
-- ============================================================================
CREATE TABLE detalle_ventas (
    id_detalle          INT             NOT NULL AUTO_INCREMENT,
    id_venta            INT             NOT NULL,
    id_producto         INT             NOT NULL,
    cantidad            INT             NOT NULL,
    precio_unitario     DECIMAL(12, 2)  NOT NULL COMMENT 'Precio al momento de la venta (COP)',
    costo_unitario      DECIMAL(12, 2)  NOT NULL COMMENT 'Costo al momento de la venta (COP)',
    descuento_unitario  DECIMAL(12, 2)  NOT NULL DEFAULT 0.00 COMMENT 'Descuento por unidad (COP)',
    
    CONSTRAINT pk_detalle_ventas PRIMARY KEY (id_detalle),
    CONSTRAINT fk_detalle_venta FOREIGN KEY (id_venta)
        REFERENCES ventas(id_venta)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_detalle_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_precio CHECK (precio_unitario > 0),
    CONSTRAINT chk_detalle_costo CHECK (costo_unitario >= 0),
    CONSTRAINT chk_detalle_descuento CHECK (descuento_unitario >= 0),
    CONSTRAINT chk_detalle_descuento_max CHECK (descuento_unitario < precio_unitario),
    CONSTRAINT uq_detalle_venta_producto UNIQUE (id_venta, id_producto)
) ENGINE=InnoDB COMMENT='Detalle de líneas por venta - relación N:M entre ventas y productos';

-- Índices para consultas de detalle
CREATE INDEX idx_detalle_venta ON detalle_ventas(id_venta);
CREATE INDEX idx_detalle_producto ON detalle_ventas(id_producto);

-- ============================================================================
-- NOTAS DE DISEÑO:
--
-- 1. ON DELETE RESTRICT en todas las FK: impide eliminar registros
--    padre que tengan transacciones históricas asociadas.
--
-- 2. Los precios en detalle_ventas son independientes del catálogo
--    actual, preservando la integridad histórica.
--
-- 3. id_ciudad en ventas es independiente de id_ciudad en clientes,
--    permitiendo que un cliente de Bogotá compre en Medellín.
--
-- 4. DECIMAL(12,2) permite valores hasta 9,999,999,999.99 COP,
--    adecuado para transacciones en pesos colombianos.
--
-- 5. Todos los campos monetarios son NOT NULL para evitar errores
--    en cálculos de agregación (SUM con NULL).
-- ============================================================================
