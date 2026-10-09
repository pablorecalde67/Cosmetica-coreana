# 🚀 K-Beauty CDE - Setup Automático

## Tu tienda está lista. Falta UN paso.

**Lo que ya está funcionando:**
- ✅ Sitio público en GitHub Pages
- ✅ 1000 productos generados
- ✅ Despliegue automático
- ✅ Panel admin

**Lo que falta:**
- Crear base de datos en Supabase (5 minutos)

---

## Solución: Script Automático

Tienes DOS opciones:

### Opción 1: Script Python (RECOMENDADO) - 2 minutos

**Paso 1:** Clona o descarga el proyecto:
```bash
git clone https://github.com/pablorecalde67/Cosmetica-coreana.git
cd Cosmetica-coreana
```

**Paso 2:** Ejecuta el script:
```bash
python3 setup_supabase_auto.py
```

**Paso 3:** Cuando te pida, copia el `SERVICE_ROLE_KEY`:
1. Abre: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a: **Project Settings** → **API**
4. Busca `service_role` (token largo que empieza con `eyJ...`)
5. Cópialo y pégalo en el script

El script hace TODO automáticamente:
- ✓ Crea 8 tablas
- ✓ Carga 1000 productos
- ✓ Verifica que funcionó
- ✓ Avisa cuando está listo

### Opción 2: Manual en Supabase - 5 minutos

1. Abre: https://app.supabase.com
2. Ve a **SQL Editor**
3. New Query
4. Copia todo de `SETUP_SUPABASE.sql`
5. Click en ▶ Run
6. New Query nuevamente
7. Copia todo de `LOAD_PRODUCTOS.sql`
8. Click en ▶ Run

---

## ¿Dónde está el SERVICE_ROLE_KEY?

En Supabase:
1. Ve a tu proyecto
2. **Project Settings** (esquina abajo a la izquierda)
3. **API** tab
4. Verás `anon public` y `service_role` 
5. Copia el valor de `service_role`

**Importante:** Es un token largo que empieza con `eyJ...` (como el que usaste para admin.html pero diferente)

---

## URLs Finales

Una vez que ejecutes el script:

```
🏪 Tienda: https://pablorecalde67.github.io/Cosmetica-coreana/
📊 Admin: https://pablorecalde67.github.io/Cosmetica-coreana/admin.html
🌐 Dominio: https://www.kbeautycde.com (cuando esté registrado)
```

---

## Verificación

El script te dirá al final:
```
✓ 8 tablas creadas
✓ 1000 productos cargados
✓ Row Level Security habilitado
¡Proyecto completamente operacional!
```

Si ves eso, ¡LISTO! Tu tienda está 100% operacional.

---

## Si algo falla

El script te dirá exactamente qué pasó. Generalmente:

**"Error de conexión"** 
→ Necesita también la contraseña de la DB. La pide automáticamente. Está en: **Project Settings** → **Database** → **Password**

**"Archivo SQL no encontrado"**
→ Asegúrate de estar en la carpeta correcta: `cd Cosmetica-coreana`

**"Token inválido"**
→ Copia desde `service_role`, no desde otro lado. Debe empezar con `eyJ...`

---

## Soporte Técnico

Si tienes problemas:
1. Verifica que estés en la carpeta correcta
2. El SERVICE_ROLE_KEY debe ser la línea completa (token muy largo)
3. Si pide contraseña, cópiala de Supabase Database Settings

**Última actualización:** 2024-10-09  
**Versión:** 1.0 (Completamente automático)
