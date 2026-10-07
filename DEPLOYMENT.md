# 🚀 K-Beauty CDE - Heroku Deployment Guide

## Current Status

✅ **Automated Deployment Setup Complete**
- GitHub Actions workflow configured for automatic deployment
- Heroku app created: `kbeautycde`
- Environment variables auto-configured for basic operation

## Deployment Architecture

```
GitHub Repository (main branch)
        ↓
GitHub Actions Workflow (.github/workflows/deploy.yml)
        ↓
Heroku Git Push (automation-coca subdirectory)
        ↓
Heroku Buildpack (Node.js)
        ↓
App Live at: https://kbeautycde.herokuapp.com
```

## Automatic Deployment Process

Every push to `main` branch triggers:

1. **Create/Check Heroku App** - Ensures `kbeautycde` app exists
2. **Configure Buildpack** - Sets up Node.js runtime
3. **Set Environment Variables** - Auto-configures production settings
4. **Deploy Code** - Pushes automation-coca subdirectory to Heroku
5. **Health Checks** - Monitors app startup (2-3 minutes typical)

## Current Auto-Configured Variables

```
NODE_ENV=production
PORT=3000
PUBLIC_BASE_URL=https://kbeautycde.herokuapp.com
ADMIN_TOKEN=coca-prod-[random-hex]
EMAIL_IMAP_HOST=imap.gmail.com
EMAIL_IMAP_PORT=993
EMAIL_SUBJECT_TAG=COCA
```

## Required Configuration (Manual)

Add these variables via **Heroku Dashboard** → **Settings** → **Config Vars**:

### 🔐 Security & Admin
```
ADMIN_TOKEN = [your-secure-token]  # Already auto-generated in deployment
ANTHROPIC_API_KEY = [from anthropic.com console]
```

### 💳 Payment Gateways

**Stripe** (https://dashboard.stripe.com)
```
STRIPE_PUBLIC_KEY = pk_live_[your-key]
STRIPE_SECRET_KEY = sk_live_[your-key]
STRIPE_WEBHOOK_SECRET = whsec_[your-secret]
```

**PayPal** (https://developer.paypal.com)
```
PAYPAL_CLIENT_ID = [your-client-id]
PAYPAL_CLIENT_SECRET = [your-secret]
PAYPAL_WEBHOOK_ID = [your-webhook-id]
```

### 📮 Email Integration

**Gmail IMAP** (for order notifications)
```
EMAIL_USER = [your-gmail@gmail.com]
EMAIL_APP_PASSWORD = [16-char app-specific password from Google Account]
```

### 📱 Social Media

**Meta/Facebook/Instagram Integration**
```
META_USER_TOKEN = [60-day user token from Meta]
META_PAGE_ID = [your-facebook-page-id]
META_IG_USER_ID = [your-instagram-user-id]
```

**Instagram Scraping** (for product images)
```
INSTAGRAM_USERNAME = [instagram-account]
INSTAGRAM_PASSWORD = [app-password or regular password]
INSTAGRAM_ALBUM_URL = [private-album-url]
INSTAGRAM_SYNC_INTERVAL = 60  # minutes (0 = disabled)
```

### 🚚 Shipping Providers

**Andreani** (Argentina shipping)
```
ANDREANI_API_KEY = [your-api-key]
ANDREANI_CONTRACT = [your-contract-id]
```

**Shippo** (International shipping)
```
SHIPPO_API_KEY = [your-api-key]
```

### 💰 Transfer/Payment Info

```
TRANSFER_ALIAS = [your.alias.here]  # MercadoPago alias
TRANSFER_HOLDER_NAME = [Account Name]
```

### 📊 Analytics & Marketing

```
GOOGLE_ANALYTICS_ID = G-[your-ga4-id]
FACEBOOK_PIXEL_ID = [your-pixel-id]
TIKTOK_PIXEL_ID = [your-pixel-id]
SENDGRID_API_KEY = SG.[your-key]
MAILCHIMP_API_KEY = [your-key]
MAILCHIMP_LIST_ID = [your-list-id]
```

### 💬 WhatsApp

```
WHATSAPP_OWNER_NUMBER = 549[your-number]  # Without +, with country code
WHATSAPP_MONITORED_CHATS = [chat1,chat2]  # Comma-separated numbers
WHATSAPP_STATUS_SOURCES = [number1,number2]  # Business numbers for status scraping
```

## Setting Environment Variables

### Option 1: Heroku Dashboard (Recommended for sensitive keys)
1. Go to https://dashboard.heroku.com/apps/kbeautycde
2. Click **Settings** tab
3. Click **Reveal Config Vars**
4. Add each variable one by one

### Option 2: Heroku CLI
```bash
heroku config:set VAR_NAME="value" -a kbeautycde
heroku config:get -a kbeautycde  # View all variables
```

### Option 3: GitHub Actions Secret + Workflow
```bash
# If adding a new automated variable, update .github/workflows/deploy.yml
# Add the variable to the "Configure app and set buildpack" step
```

## Webhooks Configuration

After setting up payment gateways, configure webhooks:

### Stripe Webhook
1. Dashboard → Webhooks
2. Add endpoint: `https://kbeautycde.herokuapp.com/api/webhooks/stripe`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

### PayPal Webhook
1. Developer portal → Webhooks
2. Endpoint URL: `https://kbeautycde.herokuapp.com/api/webhooks/paypal`
3. Events: `PAYMENT.SALE.COMPLETED`, `PAYMENT.SALE.REFUNDED`

### Instagram/Meta Webhook
1. Meta App → Webhooks
2. Callback URL: `https://kbeautycde.herokuapp.com/api/webhooks/instagram`
3. Subscribe to: `messages`, `messaging_postbacks`

### Email Webhook (for marketing)
1. SendGrid → Mail Send (if using)
2. Webhook URL: `https://kbeautycde.herokuapp.com/api/webhooks/email`

## Monitoring & Logs

### View App Logs
```bash
# Via Heroku Dashboard
https://dashboard.heroku.com/apps/kbeautycde/logs

# Via CLI
heroku logs -a kbeautycde -t  # tail (live)
heroku logs -a kbeautycde -n 100  # last 100 lines
```

### Monitor Health
```bash
curl https://kbeautycde.herokuapp.com/api/admin/health
```

### Check Dyno Status
```bash
heroku ps -a kbeautycde
```

## Testing Deployment

After configuration:

```bash
# Test basic connectivity
curl https://kbeautycde.herokuapp.com/

# Test API
curl https://kbeautycde.herokuapp.com/api/admin/health

# Check environment
curl https://kbeautycde.herokuapp.com/api/config  # (if endpoint exists)
```

## Common Issues & Solutions

### App Crashes on Startup
**Symptom**: H10 (App crashed) error in logs

```bash
# Check logs for errors
heroku logs -a kbeautycde

# Common cause: Missing required env vars
# Solution: Check config.js for required variables and set them
```

### Cannot connect to external services
**Symptom**: Email, Stripe, PayPal failures

```bash
# Check if env vars are set
heroku config -a kbeautycde

# Verify values are correct
# Note: Heroku shows masked values for security
```

### Port not exposed correctly
**Symptom**: Timeout or connection refused

```bash
# Dockerfile must expose port 3000
# package.json must have: "type": "module"
# config.js must read PORT from environment
```

## Deployment Pipeline

```
Push to main
    ↓
GitHub Actions triggers
    ↓
[1] Create/Check app
    ↓
[2] Configure buildpack (Node.js)
    ↓
[3] Set environment variables
    ↓
[4] Push code (git subtree split)
    ↓
[5] Heroku builds Node.js app
    ↓
[6] Health checks (2-3 min wait)
    ↓
✅ Live at https://kbeautycde.herokuapp.com
```

## Next Steps

1. ✅ Deployment workflow configured
2. ⏳ Wait for first deployment to complete (~5 minutes)
3. 📋 Set all required config vars in Heroku dashboard
4. 🧪 Test endpoints and payment flows
5. 🔗 Configure webhooks for payment providers
6. 📊 Set up monitoring and alerts
7. 📱 Connect WhatsApp and Instagram
8. 🚀 Launch to production users

---

**Last Updated**: 2026-10-07
**Deployment Version**: 1.1 (Improved with buildpack & auto-config)
