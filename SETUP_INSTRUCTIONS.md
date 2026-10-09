# 🎀 K-Beauty CDE - Instrucciones de Configuración

## Estado Actual

✅ **GitHub Pages**: Funcionando - Tu tienda está en línea  
✅ **Productos JSON**: 1000 productos listos  
✅ **Interfaz**: tienda-simple.html + admin.html desplegados  
⏳ **Base de Datos**: Necesita configuración final

## Paso 1: Obtén tu Contraseña Supabase

1. Abre: https://app.supabase.com
2. Selecciona tu proyecto: **supabase-sky-grass**
3. Ve a: **Settings** → **Database** → **Database Settings**
4. Busca: **Database Password**
5. Copia tu contraseña (la que usaste cuando creaste el proyecto)

> 💡 **Si no la tienes**: En Supabase Settings → Database → Reset Password

## Paso 2: Ejecuta el Setup

### macOS / Linux
```bash
chmod +x setup.sh
./setup.sh
```

Luego ingresa tu **Supabase Password** cuando lo pida.

### Windows
Haz doble-clic en: **setup.bat**

Luego ingresa tu **Supabase Password** cuando lo pida.

## ¿Qué Hace el Setup?

1. ✅ Crea 8 tablas en tu base de datos
2. ✅ Carga 1000 productos K-Beauty
3. ✅ Configura 23 provincias de envío Andreani
4. ✅ Crea índices de performance
5. ✅ Activa políticas de seguridad

**Tiempo estimado**: 1-2 minutos

## Después del Setup

Tu tienda estará completamente operativa:

- 🌐 Tienda: https://pablorecalde67.github.io/Cosmetica-coreana/
- 📊 Admin: https://pablorecalde67.github.io/Cosmetica-coreana/admin.html

## Solución de Problemas

### Error: "Python 3 no está instalado"
- Descarga Python desde: https://www.python.org/downloads/
- **Importante**: Durante la instalación, marca **"Add Python to PATH"**
- Reinicia tu terminal/cmd después de instalar

### Error: "Connection refused" o "No se pudo conectar"
- Verifica que tu **password sea correcto**
- Asegúrate de tener **conexión a Internet**
- En Supabase, verifica que el proyecto esté **activo**

### Error: "psycopg2 installation failed"
- Prueba manualmente:
  - macOS/Linux: `pip3 install psycopg2-binary`
  - Windows: `pip install psycopg2-binary`

### Todo completado pero errores en red
- El setup puede funcionar aunque se muestren algunos warnings
- Los productos se cargan exitosamente si ves el mensaje verde final

## Verificación

Después del setup, abre tu admin:
https://pablorecalde67.github.io/Cosmetica-coreana/admin.html

Deberías ver:
- ✅ Conexión exitosa a Supabase
- 📊 1000 productos disponibles
- 📋 Capacidad de crear órdenes

## Necesitas Ayuda?

Si algo no funciona:

1. Copia toda la salida del terminal
2. Abre un issue en: https://github.com/pablorecalde67/Cosmetica-coreana/issues
3. Incluye:
   - El error exacto que ves
   - Tu sistema operativo (Windows/Mac/Linux)
   - La versión de Python: `python --version`

---

**Última actualización**: Octubre 2026  
**Estado**: Producción ✨
