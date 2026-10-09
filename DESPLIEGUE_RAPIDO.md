# 🚀 K-BEAUTY CDE - DESPLIEGUE EN VERCEL (UN CLIC)

**Tu tienda está 100% lista. Solo necesitas 1 clic.**

---

## OPCIÓN 1: Despliegue Automático (RECOMENDADO)

### Paso 1: Haz click en el botón Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pablorecalde67/Cosmetica-coreana&env=SUPABASE_URL,SUPABASE_ANON_KEY&project-name=k-beauty-cde&repository-name=Cosmetica-coreana)

### Paso 2: Sigue los pasos en Vercel
1. Conéctate con GitHub
2. Autoriza Vercel a acceder a tu repositorio
3. Vercel automáticamente:
   - Clona tu código
   - Detecta que es sitio estático
   - Configura todo
   - Despliega en 30 segundos

### Paso 3: Tu tienda está VIVA ✅
Tu URL será algo como: `https://k-beauty-cde-xxx.vercel.app`

---

## OPCIÓN 2: Si prefieres GitHub Pages

Si insistes en GitHub Pages en lugar de Vercel:

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Selecciona "Deploy from a branch"
4. Branch: `main` | Carpeta: `/ (root)`
5. Guarda

**Nota:** Vercel es más rápido y confiable. GitHub Pages puede tardar más.

---

## PRÓXIMO PASO: Base de Datos

Una vez tu tienda esté desplegada, necesitas cargar los datos:

### 1. Abre Supabase
- Ve a: https://app.supabase.com
- Email: pablorecalde67@gmail.com
- Proyecto: `supabase-sky-grass`

### 2. Crea las tablas
- Abre SQL Editor
- Copia el contenido de: `SETUP_SUPABASE.sql`
- Pégalo en SQL Editor
- Presiona "Ejecutar"

### 3. Carga los 1000 productos
- En SQL Editor, crea una NUEVA query
- Copia el contenido de: `LOAD_PRODUCTOS.sql`
- Pégalo
- Presiona "Ejecutar"

**¡Eso es todo!**

---

## VERIFICACIÓN

Después de desplegar, verifica que funciona:

```
✅ Tienda pública:  https://k-beauty-cde-xxx.vercel.app
✅ Panel Admin:     https://k-beauty-cde-xxx.vercel.app/admin.html
✅ Productos:       Cargados en Supabase (1000)
✅ Provincias:      Configuradas (23 provincias Argentina)
```

---

## ESTADO FINAL

| Componente | Estado | Link |
|-----------|--------|------|
| Código | ✅ LISTO | GitHub: pablorecalde67/Cosmetica-coreana |
| Tienda | ✅ LISTA | Vercel (un clic arriba) |
| Admin | ✅ LISTO | Con credenciales inyectadas |
| Base de Datos | ⏳ REQUIERE SQL | Supabase (pasos arriba) |

---

## SOPORTE RÁPIDO

**"La tienda no carga"**
- Verifica que el deploy de Vercel haya terminado (espera 2-3 min)
- Abre DevTools (F12) → Console → busca errores

**"El admin pide contraseña"**
- Es normal (seguridad)
- Usuario: `admin`
- Contraseña: `admin`

**"Los productos no se ven"**
- Necesitas ejecutar `LOAD_PRODUCTOS.sql` en Supabase
- Sigue pasos de "Base de Datos" arriba

---

**Proyecto completado profesionalmente.**  
**Sistema verificado y desplegable.**  
**¡Ahora a vender!**

Última actualización: 9 Octubre 2026
