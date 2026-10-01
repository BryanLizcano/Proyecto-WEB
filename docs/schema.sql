-- ============================================================================
-- PROYECTO: Tienda en Línea Modular
-- ARCHIVO: docs/schema.sql
-- MOTOR: PostgreSQL 14+
-- AUTORES: Bryan Gonzalo Lizcano Durán & Edward Daniel Marín Díaz
-- DESCRIPCIÓN: Definición del esquema DDL de la base de datos relacional
--              para la tienda en línea modular con integridad referencial,
--              restricciones de dominio (CHECK), índices y datos iniciales (seed).
-- ============================================================================

-- Configuración de zona horaria y codificación
SET client_encoding = 'UTF8';
SET timezone = 'UTC';

-- ----------------------------------------------------------------------------
-- 1. LIMPIEZA DE TABLAS PREVIAS (DROP IF EXISTS en orden de dependencia)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS detalle_pedido CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS producto CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS administrador CASCADE;

-- ----------------------------------------------------------------------------
-- 2. EXTENSIONES ÚTILES
-- ----------------------------------------------------------------------------
-- Extensión para búsquedas difusas y trigramas (para RF-07: Búsqueda por palabras clave)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- 3. CREACIÓN DE TABLAS
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- TABLA: administrador
-- Justificación: Almacena las credenciales de los administradores que tienen
-- acceso al panel de administración (RF-05). La entidad es independiente y
-- sin relaciones foráneas directas con el resto de entidades del negocio.
-- ----------------------------------------------------------------------------
CREATE TABLE administrador (
    id_administrador SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_administrador_email UNIQUE (email),
    CONSTRAINT chk_administrador_email_formato CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON TABLE administrador IS 'Usuarios administradores con acceso exclusivo al panel administrativo.';
COMMENT ON COLUMN administrador.password_hash IS 'Contraseña cifrada con algoritmo bcrypt (mínimo 10 rondas de salt).';

-- ----------------------------------------------------------------------------
-- TABLA: categoria
-- Justificación: Clasificación lógica de productos (RF-01, RF-03).
-- El nombre debe ser único para evitar duplicidad de categorías en el catálogo.
-- ----------------------------------------------------------------------------
CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    CONSTRAINT uq_categoria_nombre UNIQUE (nombre)
);

COMMENT ON TABLE categoria IS 'Categorías para organizar y filtrar los productos en catálogo.';

-- ----------------------------------------------------------------------------
-- TABLA: producto
-- Justificación: Catálogo de artículos disponibles para compra (RF-02, RF-03, RF-07).
-- Clave Foránea a categoria:
--   ON DELETE RESTRICT: Impide eliminar una categoría que tenga productos asociados.
--   Esto previene que productos queden huérfanos sin categoría.
-- Restricciones CHECK:
--   precio >= 0: No se permiten precios negativos.
--   stock >= 0: El inventario disponible no puede ser negativo.
-- ----------------------------------------------------------------------------
CREATE TABLE producto (
    id_producto SERIAL PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    imagen_url VARCHAR(255),
    CONSTRAINT fk_producto_categoria FOREIGN KEY (id_categoria)
        REFERENCES categoria (id_categoria)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_producto_precio CHECK (precio >= 0),
    CONSTRAINT chk_producto_stock CHECK (stock >= 0)
);

COMMENT ON TABLE producto IS 'Inventario y catálogo de productos disponibles para la venta.';
COMMENT ON COLUMN producto.id_categoria IS 'FK hacia la categoría. ON DELETE RESTRICT para proteger la integridad.';

-- ----------------------------------------------------------------------------
-- TABLA: pedido
-- Justificación: Registra las compras confirmadas por los clientes (RF-06, RF-08).
-- No requiere registro de usuario previo (los clientes ingresan nombre y contacto).
-- Restricciones:
--   total >= 0: Monto consolidado del pedido.
--   estado: Limitado a valores discretos válidos en el flujo comercial.
-- ----------------------------------------------------------------------------
CREATE TABLE pedido (
    id_pedido SERIAL PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    contacto_cliente VARCHAR(100) NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT chk_pedido_total CHECK (total >= 0),
    CONSTRAINT chk_pedido_estado CHECK (estado IN ('PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION', 'COMPLETADO', 'CANCELADO'))
);

COMMENT ON TABLE pedido IS 'Cabecera de pedidos generados por clientes desde el carrito de compras.';
COMMENT ON COLUMN pedido.contacto_cliente IS 'Teléfono o correo electrónico suministrado por el cliente.';
COMMENT ON COLUMN pedido.total IS 'Total recalculado y verificado en backend a partir de los precios unitarios.';

-- ----------------------------------------------------------------------------
-- TABLA: detalle_pedido
-- Justificación: Resuelve la relación N a M entre pedido y producto.
-- Almacena cada ítem ordenado con su cantidad y el precio_unitario vigente
-- al momento de la compra (inmutabilidad histórica de precios).
-- Políticas ON DELETE:
--   id_pedido -> ON DELETE CASCADE: Si administrativamente se elimina un pedido,
--                se eliminan automáticamente sus líneas de detalle.
--   id_producto -> ON DELETE RESTRICT: No se permite eliminar un producto del
--                  catálogo si ya figura en el historial de un pedido.
-- Restricciones CHECK:
--   cantidad > 0: No se permiten líneas con cero o cantidades negativas.
--   precio_unitario >= 0: Monto unitario cobrado al momento de la orden.
-- ----------------------------------------------------------------------------
CREATE TABLE detalle_pedido (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_detalle_pedido_pedido FOREIGN KEY (id_pedido)
        REFERENCES pedido (id_pedido)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_pedido_producto FOREIGN KEY (id_producto)
        REFERENCES producto (id_producto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT chk_detalle_pedido_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_pedido_precio_unitario CHECK (precio_unitario >= 0)
);

COMMENT ON TABLE detalle_pedido IS 'Renglones o ítems asociados a un pedido.';
COMMENT ON COLUMN detalle_pedido.precio_unitario IS 'Copia del precio del producto al momento de comprar; inmune a variaciones futuras de precio.';

-- ----------------------------------------------------------------------------
-- 4. ÍNDICES DE RENDIMIENTO (OPTIMIZACIÓN DE CONSULTAS)
-- ----------------------------------------------------------------------------

-- Índice para acelerar el filtrado de productos por categoría (RF-03)
CREATE INDEX idx_producto_id_categoria ON producto (id_categoria);

-- Índice para búsqueda rápida por nombre de producto y palabras clave (RF-07)
-- Utiliza trigramas para permitir coincidencias parciales rápidas ILIKE '%termino%'
CREATE INDEX idx_producto_nombre_trgm ON producto USING gin (nombre gin_trgm_ops);

-- Índice alternativo en minúsculas para búsquedas B-tree
CREATE INDEX idx_producto_nombre_lower ON producto (LOWER(nombre));

-- Índices en claves foráneas de detalle_pedido para acelerar JOINs al consultar detalle de pedido (RF-08)
CREATE INDEX idx_detalle_pedido_id_pedido ON detalle_pedido (id_pedido);
CREATE INDEX idx_detalle_pedido_id_producto ON detalle_pedido (id_producto);

-- Índice para ordenar y filtrar pedidos cronológicamente en el panel admin (RF-08)
CREATE INDEX idx_pedido_fecha ON pedido (fecha DESC);
CREATE INDEX idx_pedido_estado ON pedido (estado);

-- ----------------------------------------------------------------------------
-- 5. SEED DATA (DATOS INICIALES MÍNIMOS DE PRUEBA)
-- ----------------------------------------------------------------------------

-- Categorías iniciales (2 categorías)
INSERT INTO categoria (nombre, descripcion) VALUES
('Calzado Deportivo', 'Zapatos, tenis de running y calzado ergonómico para entrenamiento de alto rendimiento.'),
('Ropa y Accesorios', 'Prendas transpirables, sudaderas, camisetas técnicas y accesorios deportivos.');

-- Productos iniciales (5 productos asociados a las categorías previas)
INSERT INTO producto (id_categoria, nombre, descripcion, precio, stock, imagen_url) VALUES
(1, 'Tenis Running Nitro 2.0', 'Calzado ligero con suela de amortiguación reactiva ideal para media y larga distancia.', 89.99, 25, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'),
(1, 'Zapatillas Trail Runner Waterproof', 'Calzado reforzado con agarre multidireccional y membrana impermeable.', 115.50, 14, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600'),
(2, 'Camiseta Técnica Dry-Fit', 'Camiseta deportiva transpirable con tecnología de secado rápido y protección UV.', 24.90, 50, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600'),
(2, 'Sudadera con Capucha Sport Fleece', 'Sudadera térmica con bolsillo canguro y capucha ajustable para entrenamiento en clima frío.', 49.99, 30, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600'),
(2, 'Gorra Deportiva Aeroready', 'Gorra con visera curva, cierre ajustable y paneles transpirables.', 18.00, 40, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600');

-- ----------------------------------------------------------------------------
-- 6. INSTRUCCIÓN PARA CREACIÓN DEL ADMINISTRADOR (SEGURIDAD)
-- ----------------------------------------------------------------------------
-- IMPORTANTE: No se incluye un hash de contraseña predeterminado ni credenciales
-- en texto plano en este script por buenas prácticas de seguridad informática.
--
-- Para insertar el primer usuario administrador en la base de datos:
-- 1. Ejecutar el siguiente comando en PowerShell / Node.js para generar el hash bcrypt:
--
--    node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TuPasswordSeguro123!', 10).then(h => console.log(h));"
--
-- 2. Copiar el hash resultante y ejecutar la sentencia INSERT:
--
--    INSERT INTO administrador (nombre, email, password_hash)
--    VALUES ('Administrador General', 'admin@tiendamodular.com', '<HASH_BCRYPT_GENERADO>');
-- ----------------------------------------------------------------------------
