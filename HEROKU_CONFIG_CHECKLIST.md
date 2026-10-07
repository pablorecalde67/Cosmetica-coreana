# 🎯 Heroku Configuration Checklist (iPad-Friendly)

## ✅ Quick Start

1. Open Heroku Dashboard: https://dashboard.heroku.com
2. Click app: **kbeautycde**
3. Go to **Settings** tab
4. Click **Reveal Config Vars**
5. Copy-paste variables below one by one

---

## 📋 Variables to Add (In Order)

### Phase 1: Essential (Required for app to run)
These are already auto-configured, but verify:
- ✅ NODE_ENV = `production`
- ✅ PORT = `3000`
- ✅ PUBLIC_BASE_URL = `https://kbeautycde.herokuapp.com`
- ✅ ADMIN_TOKEN = (auto-generated, leave as is)

### Phase 2: AI & Analysis (For skin analysis feature)
**Get from**: https://console.anthropic.com

```
ANTHROPIC_API_KEY = [copy your Anthropic API key]
AI_MODEL = claude-sonnet-5
```

### Phase 3: Payments (For checkout to work)

#### Stripe (https://dashboard.stripe.com → API keys)
```
STRIPE_PUBLIC_KEY = pk_live_[your-live-key]
STRIPE_SECRET_KEY = sk_live_[your-live-key]
STRIPE_WEBHOOK_SECRET = whsec_[your-webhook-signing-secret]
```

#### PayPal (https://developer.paypal.com → Applications & Sandbox)
```
PAYPAL_CLIENT_ID = [your-client-id]
PAYPAL_CLIENT_SECRET = [your-secret]
PAYPAL_WEBHOOK_ID = [from Webhooks section]
```

### Phase 4: Email & Notifications

**Gmail Setup** (if using Gmail to send/receive orders):
1. Go to your Google Account: https://myaccount.google.com
2. Security → App passwords → Select "Mail" & "Windows Computer"
3. Copy the 16-character password

```
EMAIL_USER = your.email@gmail.com
EMAIL_APP_PASSWORD = [16-char app password]
EMAIL_IMAP_HOST = imap.gmail.com
EMAIL_IMAP_PORT = 993
EMAIL_SUBJECT_TAG = COCA
```

### Phase 5: Instagram & Meta (For product posting)

**Get Meta tokens** (https://business.facebook.com/meta-business-suite):
1. Settings → Business Accounts → Users
2. Find your User Token (60-day User Token)
3. Your Instagram Business Account ID

```
META_USER_TOKEN = [60-day user token]
META_PAGE_ID = [your-facebook-page-id]
META_IG_USER_ID = [your-instagram-business-account-id]
```

**Instagram Scraping** (optional, for auto-sync product images):
```
INSTAGRAM_USERNAME = your.instagram.account
INSTAGRAM_PASSWORD = your.instagram.password
INSTAGRAM_ALBUM_URL = https://www.instagram.com/p/[album-id]/
INSTAGRAM_SYNC_INTERVAL = 60
```

### Phase 6: Shipping Providers

#### Andreani (for Argentina domestic shipping)
```
ANDREANI_API_KEY = [from Andreani API portal]
ANDREANI_CONTRACT = [your-contract-id]
```

#### Shippo (for international shipping)
```
SHIPPO_API_KEY = [from Shippo dashboard]
```

### Phase 7: Transfer/Payment Info

```
TRANSFER_ALIAS = [your.mpago.alias]
TRANSFER_HOLDER_NAME = [Account Holder Name]
```

### Phase 8: Analytics & Marketing (Optional)

**Google Analytics**:
```
GOOGLE_ANALYTICS_ID = G-[your-ga4-id]
```

**Facebook Pixel**:
```
FACEBOOK_PIXEL_ID = [your-pixel-id]
```

**TikTok Pixel**:
```
TIKTOK_PIXEL_ID = [your-pixel-id]
```

**SendGrid** (for email marketing):
```
SENDGRID_API_KEY = SG.[your-api-key]
```

**Mailchimp**:
```
MAILCHIMP_API_KEY = [your-api-key]
MAILCHIMP_LIST_ID = [your-list-id]
```

### Phase 9: WhatsApp (Optional)

```
WHATSAPP_OWNER_NUMBER = 549[your-number]
WHATSAPP_MONITORED_CHATS = [chat1,chat2,chat3]
WHATSAPP_STATUS_SOURCES = [number1,number2]
```

---

## 🚀 How to Add Variables (Step by Step)

1. **Open Heroku**: https://dashboard.heroku.com/apps/kbeautycde
2. **Click Settings tab** (top of page)
3. **Find "Config Vars"** section
4. **Click "Reveal Config Vars"** (to see current variables)
5. **Copy variable name** from checklist (e.g., `STRIPE_PUBLIC_KEY`)
6. **Paste into first field**
7. **Click in second field**
8. **Paste the value** (e.g., your actual Stripe key)
9. **Click "Add"** button
10. **Repeat** for each variable

---

## 🔗 Quick Links to Get Values

| Variable | Where to Get It |
|----------|-----------------|
| ANTHROPIC_API_KEY | https://console.anthropic.com → API Keys |
| STRIPE_PUBLIC_KEY | https://dashboard.stripe.com → Developers → API Keys → Publishable Key |
| STRIPE_SECRET_KEY | https://dashboard.stripe.com → Developers → API Keys → Secret Key |
| STRIPE_WEBHOOK_SECRET | https://dashboard.stripe.com → Developers → Webhooks → Signing Secret |
| PAYPAL_CLIENT_ID | https://developer.paypal.com → Sandbox App Accounts |
| PAYPAL_CLIENT_SECRET | https://developer.paypal.com → Sandbox App Accounts |
| PAYPAL_WEBHOOK_ID | https://developer.paypal.com → Webhooks → View Webhook Details |
| EMAIL_APP_PASSWORD | https://myaccount.google.com → Security → App passwords |
| META_USER_TOKEN | https://business.facebook.com → Settings → Business Accounts → Users |
| META_PAGE_ID | https://business.facebook.com → Business Settings → Accounts → Pages |
| SHIPPO_API_KEY | https://goshippo.com → Account Settings → API → API Tokens |
| GOOGLE_ANALYTICS_ID | https://analytics.google.com → Admin → Property Settings |
| FACEBOOK_PIXEL_ID | https://business.facebook.com → Events Manager → Pixel → Settings |

---

## ✨ Testing Configuration

After adding all variables, test each component:

```
1. Basic App: https://kbeautycde.herokuapp.com
2. Health Check: https://kbeautycde.herokuapp.com/api/admin/health
3. API: https://kbeautycde.herokuapp.com/api/products (should show products)
```

---

## 🔐 Security Notes

- ✅ Never share API keys in messages or commits
- ✅ All values are stored securely in Heroku Config Vars
- ✅ Use "live" keys in production, NOT test/sandbox keys
- ✅ Change ADMIN_TOKEN to your own secure value if needed
- ✅ Regenerate webhooks secrets after deployment

---

## 📞 Need Help?

If deployment fails:
1. Check Heroku logs: https://dashboard.heroku.com/apps/kbeautycde/logs
2. Look for error messages mentioning missing variables
3. Add any missing required variables
4. Restart app: Settings → Restart Dynos

---

**Status**: Ready for configuration  
**App URL**: https://kbeautycde.herokuapp.com  
**Dashboard**: https://dashboard.heroku.com/apps/kbeautycde
