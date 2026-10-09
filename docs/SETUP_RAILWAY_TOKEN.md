# ⚡ SETUP AUTOMÁTICO - RAILWAY TOKEN

## 🎯 UN SOLO PASO (Copy-Paste)

Para que el deployment sea completamente automático (cada push = deploy):

### 1️⃣ Obtén tu Railway Token

Entra a: **https://railway.app/account/tokens**

Busca "API Token" y copia el token largo (empieza con `eyJ...`)

### 2️⃣ Agrégalo a GitHub Secrets

Ve a: **https://github.com/pablorecalde67/Cosmetica-coreana/settings/secrets/actions**

Haz click en **"New repository secret"**

- **Name:** `RAILWAY_TOKEN`
- **Value:** Pega el token que copiaste

Haz click en **"Add secret"**

### 3️⃣ Obtén tu Project ID de Railway

En Railway dashboard (https://railway.app/dashboard):
- Abre tu proyecto
- En URL verás: `https://railway.app/project/xxxxx`
- Copia ese `xxxxx`

### 4️⃣ Agrega el Project ID a GitHub Secrets

Ve a: **https://github.com/pablorecalde67/Cosmetica-coreana/settings/secrets/actions**

Haz click en **"New repository secret"**

- **Name:** `RAILWAY_PROJECT_ID`
- **Value:** Pega el ID que copiaste

Haz click en **"Add secret"**

---

## ✅ LISTO

Ahora cada vez que hagas push a GitHub, **automáticamente se despliega a Railway**.

No tienes que hacer nada más. Es completamente automático.

---

**Tiempo:** 5 minutos  
**Dificultad:** Copy-paste solamente  
**Resultado:** Deployment automático en cada push
