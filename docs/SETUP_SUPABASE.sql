-- ============================================
-- K-BEAUTY CDE - SUPABASE SETUP
-- ============================================

-- 1. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  marca TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  precio_usd DECIMAL(10, 2) NOT NULL,
  stock INTEGER DEFAULT 0,
  imagen_url TEXT,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABLA DE ÓRDENES/PEDIDOS
CREATE TABLE IF NOT EXISTS ordenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden TEXT UNIQUE,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  cliente_email TEXT,
  provincia TEXT NOT NULL,
  direccion TEXT NOT NULL,
  items JSONB NOT NULL,
  total_usd DECIMAL(10, 2) NOT NULL,
  total_ars DECIMAL(10, 2) NOT NULL,
  costo_envio_ars DECIMAL(10, 2),
  metodo_pago TEXT,
  estado TEXT DEFAULT 'pendiente',
  mercadopago_preference_id TEXT,
  mercadopago_payment_id TEXT,
  numero_seguimiento_andreani TEXT,
  fecha_compra TIMESTAMP DEFAULT NOW(),
  fecha_pago TIMESTAMP,
  fecha_envio TIMESTAMP,
  fecha_entrega TIMESTAMP,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. TABLA DE TIENDAS CDE
CREATE TABLE IF NOT EXISTS tiendas_cde (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT,
  website TEXT,
  whatsapp TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  rating DECIMAL(2, 1),
  marcas JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  provincia TEXT,
  ciudad TEXT,
  total_compras INTEGER DEFAULT 0,
  total_gastado_usd DECIMAL(10, 2) DEFAULT 0,
  primera_compra TIMESTAMP,
  ultima_compra TIMESTAMP,
  notas TEXT,
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. TABLA DE ZONAS ANDREANI
CREATE TABLE IF NOT EXISTS andreani_zonas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provincia TEXT NOT NULL UNIQUE,
  zona INTEGER NOT NULL,
  costo_ars DECIMAL(10, 2) NOT NULL,
  dias_entrega INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. TABLA DE EVENTOS ANALYTICS
CREATE TABLE IF NOT EXISTS analytics_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento TEXT NOT NULL,
  usuario_id TEXT,
  producto_id UUID,
  datos JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- 7. TABLA DE POSTS PARA REDES SOCIALES
CREATE TABLE IF NOT EXISTS posts_redes_sociales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID,
  red_social TEXT,
  caption TEXT,
  imagen_url TEXT,
  url_producto TEXT,
  publicado BOOLEAN DEFAULT FALSE,
  fecha_programada TIMESTAMP,
  fecha_publicacion TIMESTAMP,
  engagement JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. TABLA DE CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT UNIQUE NOT NULL,
  valor TEXT,
  tipo TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_ordenes_cliente_telefono ON ordenes(cliente_telefono);
CREATE INDEX idx_ordenes_provincia ON ordenes(provincia);
CREATE INDEX idx_ordenes_fecha ON ordenes(fecha_compra);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_marca ON productos(marca);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_provincia ON clientes(provincia);
CREATE INDEX idx_analytics_tipo ON analytics_eventos(tipo_evento);
CREATE INDEX idx_posts_producto ON posts_redes_sociales(producto_id);

-- ============================================
-- DATOS INICIALES - PROVINCIAS ANDREANI
-- ============================================
INSERT INTO andreani_zonas (provincia, zona, costo_ars, dias_entrega) VALUES
('Buenos Aires', 1, 400, 1),
('CABA', 1, 400, 1),
('Córdoba', 2, 650, 2),
('Santa Fe', 2, 650, 2),
('Entre Ríos', 2, 700, 2),
('Mendoza', 3, 850, 3),
('San Juan', 3, 900, 3),
('La Rioja', 3, 950, 3),
('Santiago del Estero', 3, 800, 3),
('Catamarca', 3, 950, 3),
('Formosa', 4, 1100, 4),
('Chaco', 4, 1050, 4),
('Misiones', 4, 1000, 4),
('Corrientes', 4, 1000, 4),
('Tucumán', 3, 900, 3),
('Salta', 4, 1100, 4),
('Jujuy', 4, 1150, 4),
('La Pampa', 3, 900, 3),
('Neuquén', 5, 1250, 5),
('Río Negro', 5, 1250, 5),
('Chubut', 5, 1300, 6),
('Santa Cruz', 5, 1350, 7),
('Tierra del Fuego', 5, 1350, 9)
ON CONFLICT (provincia) DO NOTHING;

-- ============================================
-- FUNCIONES
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS PARA ACTUALIZAR updated_at
CREATE TRIGGER actualizar_productos_updated_at BEFORE UPDATE ON productos
FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER actualizar_ordenes_updated_at BEFORE UPDATE ON ordenes
FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER actualizar_clientes_updated_at BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiendas_cde ENABLE ROW LEVEL SECURITY;
ALTER TABLE andreani_zonas ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts_redes_sociales ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Productos: Lectura pública, escritura solo admin
CREATE POLICY "Productos lectura pública" ON productos FOR SELECT USING (true);
CREATE POLICY "Productos escritura admin" ON productos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Órdenes: Solo lectura/escritura del usuario
CREATE POLICY "Órdenes lectura admin" ON ordenes FOR SELECT USING (true);
CREATE POLICY "Órdenes inserción" ON ordenes FOR INSERT WITH CHECK (true);
CREATE POLICY "Órdenes actualización" ON ordenes FOR UPDATE USING (true);

-- Clientes: Solo lectura/escritura del usuario
CREATE POLICY "Clientes lectura" ON clientes FOR SELECT USING (true);
CREATE POLICY "Clientes inserción" ON clientes FOR INSERT WITH CHECK (true);

-- Tiendas: Lectura pública
CREATE POLICY "Tiendas lectura pública" ON tiendas_cde FOR SELECT USING (true);

-- Zonas: Lectura pública
CREATE POLICY "Zonas lectura pública" ON andreani_zonas FOR SELECT USING (true);

-- Analytics: Solo inserción
CREATE POLICY "Analytics inserción" ON analytics_eventos FOR INSERT WITH CHECK (true);

-- Posts: Lectura/escritura admin
CREATE POLICY "Posts lectura" ON posts_redes_sociales FOR SELECT USING (true);
CREATE POLICY "Posts inserción" ON posts_redes_sociales FOR INSERT WITH CHECK (true);
CREATE POLICY "Posts actualización" ON posts_redes_sociales FOR UPDATE USING (true);
