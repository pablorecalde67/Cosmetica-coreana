# 🚀 SETUP SUPABASE - GUÍA VISUAL AUTOMÁTICA

## ✅ PASO 1: Crear Proyecto Supabase

### En tu navegador:
```
https://supabase.com → Sign Up → Crear Cuenta
```

**Datos:**
- Email: `tu_email@gmail.com`
- Contraseña: La que uses normalmente
- Proyecto: `kbeautycde`
- Región: `South America (São Paulo)`
- Database password: Algo seguro (lo recordarás)

**Esperar:** 2-3 minutos (Supabase crea la DB)

---

## ✅ PASO 2: Ejecutar SQL

Una vez creado el proyecto:

1. **Click en "SQL Editor"** (en el menú izquierdo)
2. **Click en "New Query"**
3. **Copiar TODO el SQL que sigue:**

```sql
-- K-BEAUTY CDE - SETUP COMPLETO
-- Copiar y ejecutar TODO esto

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

-- 2. TABLA DE ÓRDENES
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

-- 3. TABLA DE CLIENTES
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

-- 4. TABLA DE ZONAS ANDREANI
CREATE TABLE IF NOT EXISTS andreani_zonas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provincia TEXT NOT NULL UNIQUE,
  zona INTEGER NOT NULL,
  costo_ars DECIMAL(10, 2) NOT NULL,
  dias_entrega INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. TABLA DE TIENDAS
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

-- 6. TABLA DE POSTS EN REDES
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

-- 7. TABLA DE ANALYTICS
CREATE TABLE IF NOT EXISTS analytics_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_evento TEXT NOT NULL,
  usuario_id TEXT,
  producto_id UUID,
  datos JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- 8. TABLA DE CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave TEXT UNIQUE NOT NULL,
  valor TEXT,
  tipo TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_ordenes_fecha ON ordenes(fecha_compra);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);

-- PROVINCIAS ANDREANI (23 PROVINCIAS)
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
```

4. **Click en "Run"** (botón arriba a la derecha)
5. **Esperar confirmación** ✅ `Ejecutada exitosamente`

---

## ✅ PASO 3: Obtener Credenciales

1. **Click en "Settings"** (engranaje, abajo a la izquierda)
2. **Click en "API"**
3. **Copiar estos 2 valores:**

```
🔷 Project URL:
   https://xxxxxxxxx.supabase.co

🔷 anon public (clave):
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
```

**Guardar en un bloc de notas** (los vas a necesitar)

---

## ✅ PASO 4: Actualizar admin.html

**Abre:** `automation-coca/public/admin.html`

**Busca estas líneas (aproximadamente línea 409-411):**

```javascript
const SUPABASE_URL = 'https://YOUR-SUPABASE-URL.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-KEY';
```

**Reemplaza con TUS valores:**

```javascript
const SUPABASE_URL = 'https://xxxxxxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...';
```

**Guarda el archivo**

---

## ✅ PASO 5: Prueba

1. Abre en tu navegador:
   ```
   https://pablorecalde67.github.io/Cosmetica-coreana/admin.html
   ```

2. Te pedirá una contraseña. La contraseña es:
   ```
   kbeautycde2024
   ```

3. Si entra → ✅ **TODO FUNCIONA**

---

## ✅ PASO 6: Deploy a GitHub (OPCIONAL pero recomendado)

```bash
# En tu computadora (terminal)
cd /ruta/a/cosmetica-coreana

git add .
git commit -m "Supabase integrado y admin panel activo"
git push origin main

git subtree push --prefix automation-coca/public origin gh-pages
```

---

## 🎉 ¡LISTO!

Después de hacer estos pasos:

✅ Base de datos creada
✅ 8 tablas preparadas
✅ 23 provincias cargadas
✅ Admin panel funcional
✅ Sistema listo para vender

---

## 📊 QUÉ PASA AHORA

Cuando un cliente compra:

```
1. Cliente va a tienda
2. Compra producto
3. Selecciona provincia
   → Costo Andreani se calcula automático
4. Paga por Mercado Pago o WhatsApp
5. Sistema registra automáticamente:
   - En tabla "ordenes"
   - En tabla "clientes"
   - En analytics
   - En dashboard
6. TÚ ves todo en admin.html
```

---

## 🆘 SI ALGO FALLA

| Problema | Solución |
|----------|----------|
| Admin no carga | Verifica que copiaste bien SUPABASE_URL y ANON_KEY |
| Error SQL | Copia el SQL completo nuevamente, sin saltos |
| No aparecen provincias | Actualiza la página con F5 |
| No hay datos | Verifica que Supabase esté corriendo (Settings → Status) |

---

## 📱 ACCESO DESDE IPAD

Todos estos URLs funcionan en iPad Safari:

```
Tienda:     https://pablorecalde67.github.io/Cosmetica-coreana/shop.html
Admin:      https://pablorecalde67.github.io/Cosmetica-coreana/admin.html
Tarjeta:    https://claude.ai/artifact/YUHwxxnonWjRzNqV9ZwQ6r
Landing:    https://pablorecalde67.github.io/Cosmetica-coreana/landing.html
```

---

## ⏱️ TIEMPO TOTAL

- Crear Supabase: **5 minutos**
- Ejecutar SQL: **1 minuto**
- Copiar credenciales: **2 minutos**
- Actualizar admin.html: **1 minuto**
- Deploy: **1 minuto**

**TOTAL: 10 MINUTOS**

---

**¡A vender belleza coreana! 🌸**
