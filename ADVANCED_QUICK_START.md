# 🚀 Quick Start - Advanced Features v2.0

**Tu sitio ya tiene features de nivel avanzado.**  
Aquí está todo lo que necesitas saber en 5 minutos.

---

## ✅ Lo Que Está Activo AHORA

✅ **Seguridad Enterprise**
- Headers de seguridad automáticos
- Rate limiting activado
- CORS protegido

✅ **Caché Inteligente**
- Respuestas más rápidas
- Compresión automática
- Menos carga en servidor

✅ **Monitoreo 24/7**
- Diagnósticos en tiempo real
- Alertas de problemas
- Métricas de performance

✅ **API v2 Avanzada**
- Nuevos endpoints
- Documentación incluida
- Health checks detallados

---

## 🎯 Endpoints Principales

### 1. **Verificar que todo funciona**
```bash
curl https://kbeautycde.herokuapp.com/api/v2/health
```
**Respuesta esperada**: `{ "status": "OK" }`

### 2. **Ver estado completo** (El más importante)
```bash
curl https://kbeautycde.herokuapp.com/api/v2/status
```
**Includes**: Uptime, CPU, memoria, servicios

### 3. **Ver documentación de API**
```bash
curl https://kbeautycde.herokuapp.com/api/v2/docs
```
**Shows**: Todos los endpoints disponibles

### 4. **Diagnostics (requiere ADMIN_TOKEN)**
```bash
curl -H "X-Admin-Token: TU_TOKEN_AQUI" \
  https://kbeautycde.herokuapp.com/api/v2/diagnostics
```
**Shows**: CPU, memoria, Node.js info, warnings

### 5. **Stats de Performance**
```bash
curl https://kbeautycde.herokuapp.com/api/v2/stats
```

---

## 🔐 Admin Token

Para acceder a endpoints protegidos (`/diagnostics`, `/config`):

1. Obtener tu token (está en Heroku Config Vars):
```bash
# En Heroku Dashboard → Settings → Config Vars → ADMIN_TOKEN
# O: curl headers en requests:
```

2. Usarlo en requests:
```bash
curl -H "X-Admin-Token: $ADMIN_TOKEN" \
  https://kbeautycde.herokuapp.com/api/v2/diagnostics
```

---

## 📊 ¿Qué es cada métrica?

### Uptime
- **Qué es**: Cuánto tiempo lleva corriendo
- **Importa si**: < 1 hora = reciente restart (normal)

### CPU Usage
- **Qué es**: Porcentaje de CPU usado
- **Alerta si**: > 80% (contactar Claude)

### Memory Usage
- **Qué es**: Cuánta RAM usa el app
- **Alerta si**: > 85% (probablemente memory leak)

### Error Rate
- **Qué es**: Porcentaje de requests con error
- **Alerta si**: > 1% (revisar logs)

### Cache Size
- **Qué es**: Cuántos datos están cacheados
- **Info**: Más es mejor (hasta 100-200 items)

---

## ⚡ Rate Limiting

**Qué es**: Protección contra abuso.  
**Límites**:
- API General: 100 requests / 15 minutos
- Checkout: 10 requests / 1 minuto
- Auth: 5 intentos / 15 minutos

**Si lo activas**:
- Respuesta: `429 Too Many Requests`
- Esperar: El tiempo indicado en headers

---

## 🗄️ Caching

**Automático para**:
- `/api/v2/health` - 30 segundos
- `/api/v2/products` - 10 minutos
- `/api/v2/status` - 5 minutos

**Beneficio**: Respuestas super rápidas.

**Para forçar refresco**:
```bash
# Usar header para bypass cache (si implementado)
curl -H "X-Cache-Bypass: true" https://...
```

---

## 🔧 Troubleshooting

### "App no responde"
```bash
# 1. Check health
curl https://kbeautycde.herokuapp.com/api/v2/health

# 2. Check status
curl https://kbeautycde.herokuapp.com/api/v2/status

# 3. Check logs
# Ir a: https://dashboard.heroku.com/apps/kbeautycde/logs
```

### "CPU muy alto"
```bash
# Ver detalles
curl https://kbeautycde.herokuapp.com/api/v2/stats

# Posibles causas:
# - Muchas requests (aumentar dyno)
# - Memory leak (reiniciar)
# - Operación pesada en background
```

### "Memory muy alto"
```bash
# Probablemente memory leak
# Solución: Reiniciar dyno

# Heroku Dashboard → Settings → More → Restart all dynos
```

---

## 📱 Desde iPad

1. **Abrir en Safari**: 
   - `https://kbeautycde.herokuapp.com/api/v2/docs`

2. **Copiar URL y abrir en navegador**:
   - Reemplazar `$ADMIN_TOKEN` con tu token real

3. **Ver respuestas formateadas**:
   - Safari puede formatear JSON automáticamente

---

## 🚀 Lo Próximo

Dentro de las features avanzadas que vinieron:

✅ **Hoy**: Security, Caching, Monitoring  
🔜 **Próximo**: OAuth, JWT tokens  
🔜 **Futuro**: GraphQL, Real-time updates  

---

## 💡 Tips Importantes

1. **Guarda tu ADMIN_TOKEN** - Lo vas a necesitar para diagnostics

2. **Monitorea regularmente** - Entra a `/api/v2/status` cada semana

3. **Entiende los warnings** - Si ves warning en diagnostics, revisa logs

4. **Cache es tu amigo** - Más cache = sitio más rápido

5. **Rate limiting protege** - Permite que el sitio responda bien bajo carga

---

## 📞 Ayuda Rápida

| Necesito | URL |
|----------|-----|
| Verificar todo | `/api/v2/status` |
| Ver documentación API | `/api/v2/docs` |
| Diagnostics sistema | `/api/v2/diagnostics` |
| Performance stats | `/api/v2/stats` |
| Health check simple | `/api/v2/health` |

---

## ✨ Resumen

Tu K-Beauty CDE ahora tiene:

🔒 **Enterprise Security** - Protegido contra ataques  
⚡ **Lightning Fast** - Caché inteligente  
📊 **Full Visibility** - Diagnostics en tiempo real  
🎯 **Production Ready** - Listo para escalar  

**¿Preguntas?** Ver `/api/v2/docs` para docs completa.

---

*Última actualización: 2026-10-07*  
*Generado con Claude Haiku 4.5*  
*Status: ✅ Producción*
