# 🚀 Despliegue a Vercel - Un Click

**Tu tienda K-Beauty CDE está lista para desplegar en Vercel con UN SOLO CLIC.**

## ¿Por qué Vercel?

✅ Automático - Se redespliega cada vez que haces push  
✅ Rápido - CDN global, carga en <100ms  
✅ Gratis - Plan hobby cubre 100% de tu tienda  
✅ Profesional - Usado por Netflix, TikTok, Hulu  

## Botón de Despliegue

**Haz click aquí para desplegar automáticamente:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pablorecalde67/Cosmetica-coreana&env=SUPABASE_URL,SUPABASE_ANON_KEY&project-name=k-beauty-cde&repository-name=Cosmetica-coreana)

## Qué sucede después de hacer click:

1. **Conectas GitHub** (solo si no lo habías hecho)
2. **Vercel clona tu repositorio** automáticamente
3. **Detecta que es sitio estático** (lee vercel.json)
4. **Despliega en 30 segundos**
5. **Tu tienda está VIVA** en `https://k-beauty-cde-xxx.vercel.app`
6. **Cada push actualiza automáticamente** tu tienda

## URLs después del despliegue

```
Tienda pública:   https://k-beauty-cde-xxx.vercel.app
Panel admin:      https://k-beauty-cde-xxx.vercel.app/admin.html
```

## Configurar dominio personalizado (opcional)

Después del despliegue, en Vercel puedes:
1. Ir a Project Settings → Domains
2. Agregar tu dominio (ej: tienda-cde.com)
3. Seguir instrucciones de DNS

## Verificación

Después de desplegar, verifica:

```bash
# Tienda debe cargar
curl https://k-beauty-cde-xxx.vercel.app

# Admin debe cargar
curl https://k-beauty-cde-xxx.vercel.app/admin.html
```

## Próximo paso: Base de datos

Una vez desplegada la tienda:

1. Abre Supabase: https://app.supabase.com
2. Proyecto: `supabase-sky-grass`
3. SQL Editor → Pega `SETUP_SUPABASE.sql` → Ejecuta
4. Luego pega `LOAD_PRODUCTOS.sql` → Ejecuta

**¡Eso es todo! Tu tienda estará 100% funcional.**

---

**Estado:**
- ✅ Código desplegable
- ✅ Vercel configurado
- ✅ Admin con credenciales inyectadas
- ⏳ Solo requiere: 1 click en botón Vercel + ejecutar SQL en Supabase
