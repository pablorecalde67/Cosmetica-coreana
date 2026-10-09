# Setup Supabase - Guía Completa Paso a Paso

## Estado Actual del Proyecto

✅ **Completado:**
- Tienda pública en GitHub Pages: https://pablorecalde67.github.io/Cosmetica-coreana/
- 1000 productos K-Beauty generados y listos
- Panel admin creado con credenciales Supabase
- Despliegue automático configurado

⏳ **Pendiente:**
- Crear tablas en Supabase (8 tablas)
- Cargar 1000 productos en la base de datos
- Activar Row Level Security

---

## Paso 1: Acceder a Supabase

1. Abre: https://app.supabase.com
2. Inicia sesión con tu cuenta
3. Selecciona el proyecto: dkdtilspjdbeqdtsrytq

---

## Paso 2: Crear las Tablas

1. En el panel de Supabase, ve a **SQL Editor**
2. Haz clic en **New Query**
3. Copia TODO el contenido de: **SETUP_SUPABASE.sql**
4. Pega en el editor
5. Haz clic en **▶ Run**
6. Espera a que termine (toma ~5 segundos)

**Qué hace este SQL:**
- Crea 8 tablas: productos, clientes, ordenes, tiendas_cde, andreani_zonas, analytics_eventos, posts_redes_sociales, configuracion
- Crea 10 índices para optimizar búsquedas
- Crea 6 triggers para timestamps automáticos
- Carga las 23 provincias argentinas con costos de envío
- Habilita Row Level Security

---

## Paso 3: Cargar los 1000 Productos

1. En **SQL Editor**, haz clic en **New Query**
2. Copia TODO el contenido de: **LOAD_PRODUCTOS.sql**
3. Pega en el editor
4. Haz clic en **▶ Run**
5. Espera a que termine (toma ~10-15 segundos)

**Qué hace este SQL:**
- Inserta 1000 productos en la tabla `productos`
- Cada producto tiene: SKU, marca, categoría, nombre, precio USD, stock, rating, reviews

---

## Paso 4: Verificar que Funcionó

1. En el panel de Supabase, ve a **Table Editor**
2. Selecciona la tabla `productos`
3. Deberías ver 1000 filas de productos K-Beauty
4. Haz clic en una fila para ver todos los detalles

### Verificar Provincias

1. En **Table Editor**, selecciona `andreani_zonas`
2. Deberías ver 23 provincias con sus costos de envío

---

## Paso 5: Probar el Panel Admin

1. Abre: https://pablorecalde67.github.io/Cosmetica-coreana/admin.html
2. Si la conexión a Supabase es correcta, verás:
   - ✓ Estado del sistema: "Conectado"
   - Estadísticas de órdenes, clientes, etc.
   - Tabla de órdenes recientes

Si ves error "Error conectando a Supabase", verifica que:
- Ejecutaste ambos archivos SQL
- Las tablas se crearon correctamente en Supabase
- Las credenciales en admin.html son correctas

---

## URLs Finales

**Tienda Pública:**
```
https://pablorecalde67.github.io/Cosmetica-coreana/
```

**Panel Admin:**
```
https://pablorecalde67.github.io/Cosmetica-coreana/admin.html
```

**Supabase Dashboard:**
```
https://app.supabase.com/
```

---

## Solución de Problemas

### "Error en SQL"
- Copia TODO el archivo, incluyendo comentarios
- Asegúrate de que el editor de SQL esté vacío antes de pegar
- Si hay un error, lee el mensaje y busca la línea problemática

### "No veo los productos"
- Ejecuta primero SETUP_SUPABASE.sql
- Luego ejecuta LOAD_PRODUCTOS.sql
- El orden es importante

### "Error 403 en admin.html"
- Las tablas pueden no estar creadas aún
- Verifica en Table Editor que las tablas existan
- Puede tardar un momento después de ejecutar el SQL

### "Las provincias no se ven"
- En SETUP_SUPABASE.sql se cargan automáticamente
- Verifica la tabla andreani_zonas en Table Editor

---

## Próximos Pasos (Opcionales)

1. **Registrar dominio:** www.kbeautycde.com
2. **Configurar DNS:** Apuntar a GitHub Pages
3. **Agregar más funcionalidades:** Chat, carrito persistente, etc.

---

## Soporte

Si algo no funciona:
1. Verifica que completaste ambos pasos (SETUP + LOAD)
2. Mira la tabla `productos` en Supabase - debería tener 1000 filas
3. Revisa la consola del navegador (F12) para ver errores

**Última actualización:** 2024-10-09
