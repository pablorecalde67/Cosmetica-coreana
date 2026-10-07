# K-Beauty CDE - Deployment Guide

Guía completa para desplegar la plataforma a producción.

## ✅ Pre-Deployment Checklist

### 1. Environment Setup
```bash
# Copy production environment template
cp .env.example .env

# Edit and fill in all required variables
nano .env

# Required variables for production:
- ADMIN_TOKEN (secure, random string)
- STRIPE_PUBLIC_KEY & STRIPE_SECRET_KEY
- PAYPAL credentials (if using PayPal)
- GOOGLE_ANALYTICS_ID
- All API keys for integrations
```

### 2. Initial Setup
```bash
# Install dependencies and initialize
npm run setup

# Verify everything is ready
npm run pre-deploy
```

### 3. Test Locally
```bash
# Run development server
npm run dev

# In another terminal, run tests
npm test

# All tests must pass (16+ test cases)
```

## 🚀 Deployment Methods

### Option 1: Heroku (Recommended for Quick Start)

#### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed

#### Steps
```bash
# Login to Heroku
heroku login

# Create new app (or use existing)
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set ADMIN_TOKEN=your-secure-token
heroku config:set STRIPE_PUBLIC_KEY=your_key
heroku config:set STRIPE_SECRET_KEY=your_key
# ... set all other required variables

# Deploy
git push heroku main

# View logs
heroku logs --tail

# Open app
heroku open
```

#### Cost
- Free tier: Limited to 550 dyno hours/month
- Hobby tier: $7/month for always-on
- Production: $25-50/month depending on scaling

#### Pros
- ✅ Easiest setup
- ✅ Automatic SSL/HTTPS
- ✅ Easy scaling
- ✅ Built-in monitoring

#### Cons
- ❌ Will sleep if on free tier
- ❌ Database not included (need external)
- ❌ More expensive than DIY

### Option 2: DigitalOcean App Platform

#### Prerequisites
- DigitalOcean account ($5-10/month)
- Docker image pushed to container registry

#### Steps
```bash
# Build and push Docker image
docker build -t your-registry/kbeautycde:latest .
docker push your-registry/kbeautycde:latest

# In DigitalOcean console:
# 1. Create new App from registry
# 2. Select your Docker image
# 3. Configure environment variables
# 4. Add database (PostgreSQL optional)
# 5. Deploy
```

#### Cost
- Starting at $5/month
- Scales with traffic

#### Pros
- ✅ Affordable
- ✅ Good performance
- ✅ Full control
- ✅ Integrated database options

#### Cons
- ❌ Slightly more setup
- ❌ Manual scaling

### Option 3: AWS (Enterprise Grade)

#### Setup
```bash
# Option A: Elastic Beanstalk
eb create kbeautycde-env
eb deploy

# Option B: ECS + Fargate
# Create ECS cluster, task definition, and service
```

#### Cost
- Free tier eligible (limited)
- Production: $20-100+/month

#### Pros
- ✅ Maximum scalability
- ✅ Enterprise features
- ✅ Global CDN available

#### Cons
- ❌ Complex setup
- ❌ Expensive
- ❌ Steep learning curve

### Option 4: Docker (Self-Hosted)

#### Prerequisites
- VPS with Docker installed
- SSH access to server

#### Steps
```bash
# Build image
docker build -t kbeautycde:latest .

# Run container
docker run -d \
  --name kbeautycde \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e ADMIN_TOKEN=your-token \
  -v /data:/app/data \
  kbeautycde:latest

# Setup reverse proxy with Nginx
# Setup SSL with Let's Encrypt
```

#### Cost
- $3-5/month for basic VPS

#### Pros
- ✅ Very cheap
- ✅ Full control
- ✅ No vendor lock-in

#### Cons
- ❌ Need to manage server
- ❌ Setup SSL yourself
- ❌ Handle monitoring/backups
- ❌ Scale manually

## 📋 Post-Deployment

### 1. Health Checks
```bash
# Test health endpoint
curl https://your-domain/api/admin/health

# View detailed monitoring
curl https://your-domain/api/monitoring/health \
  -H "Authorization: Bearer your-admin-token"
```

### 2. Configure Webhooks

**Stripe Webhooks**
- Dashboard → Developers → Webhooks
- Add endpoint: `https://your-domain/api/webhooks/stripe`
- Events: payment_intent.succeeded, charge.failed
- Secret saved to `STRIPE_WEBHOOK_SECRET`

**PayPal Webhooks**
- Account Settings → Notifications → Webhook
- URL: `https://your-domain/api/webhooks/paypal`
- Event types: PAYMENT.CAPTURE.COMPLETED

**Shipping Webhooks**
- Andreani API dashboard
- Shippo API dashboard
- URLs: `/api/webhooks/andreani`, `/api/webhooks/shippo`

### 3. Setup Domain & SSL
```bash
# Point domain to your server
# A record → your-server-ip

# Setup SSL (if not auto via platform)
# Option 1: Let's Encrypt (free)
sudo certbot certonly --standalone -d yourdomain.com

# Option 2: Use platform's built-in SSL
# (Heroku/DigitalOcean handle this automatically)
```

### 4. Setup Email Sending
```bash
# SendGrid
# 1. Create account at sendgrid.com
# 2. Create API key
# 3. Set SENDGRID_API_KEY in .env

# Or use Mailgun, AWS SES, etc.
```

### 5. Enable Analytics
```bash
# Google Analytics
# 1. Create GA4 property
# 2. Set GOOGLE_ANALYTICS_ID=G-XXXXX
# 3. Verify tracking works in admin dashboard

# Facebook Pixel
# 1. Create pixel
# 2. Set FACEBOOK_PIXEL_ID
```

### 6. Configure Admin Access
```bash
# Change default ADMIN_TOKEN
ADMIN_TOKEN=generate-secure-random-string

# Access admin dashboard
https://your-domain/admin.html

# Login with token from localStorage config
```

## 🔍 Monitoring & Maintenance

### Real-Time Monitoring
```bash
# Check system health
curl https://your-domain/api/monitoring/health

# Get detailed metrics
curl https://your-domain/api/monitoring/status \
  -H "Authorization: Bearer your-admin-token"

# View recent errors
curl https://your-domain/api/monitoring/errors \
  -H "Authorization: Bearer your-admin-token"

# Check active alerts
curl https://your-domain/api/monitoring/alerts \
  -H "Authorization: Bearer your-admin-token"
```

### Automated Backups
```bash
# Setup daily backups (cron job)
0 2 * * * /path/to/backup.sh

# Backup script should:
# 1. Export data/orders.json
# 2. Export data/products.json
# 3. Compress
# 4. Upload to S3 or backup service
```

### Log Monitoring
```bash
# Heroku logs
heroku logs --tail

# DigitalOcean App logs
doctl apps logs <app-id>

# Self-hosted Docker logs
docker logs kbeautycde --follow
```

## 🆘 Troubleshooting

### App not starting
```bash
# Check error logs
# Verify .env variables
# Run pre-deploy checks: npm run pre-deploy
# Check Node.js version (must be 18+)
```

### Database connection issues
```bash
# For JSON file-based storage:
# Verify data/ directory exists and is writable
mkdir -p data
chmod 755 data

# For external database:
# Test connection string
# Check firewall rules
```

### Webhooks not receiving events
```bash
# 1. Verify endpoint is publicly accessible
curl https://your-domain/api/webhooks/stripe

# 2. Check webhook secret matches provider
# 3. View webhook logs in provider dashboard
# 4. Test webhook from provider's dashboard
```

### Performance issues
```bash
# Check monitoring dashboard
# Look for slow endpoints
# Check error rate

# Scale up if needed:
# Heroku: heroku ps:scale web=2
# DigitalOcean: Increase instance size
```

## 📊 Monitoring Dashboard

Access at: `https://your-domain/admin.html`

**Features:**
- Real-time order statistics
- Product management
- Customer analytics
- Webhook status
- Email campaign metrics
- System performance metrics
- Error logs and alerts

## 🔐 Security Checklist

- [ ] Change default ADMIN_TOKEN
- [ ] Enable HTTPS/SSL
- [ ] Setup firewall rules
- [ ] Enable rate limiting
- [ ] Setup CORS properly
- [ ] Rotate API keys regularly
- [ ] Monitor error logs for attacks
- [ ] Keep dependencies updated
- [ ] Backup data regularly
- [ ] Setup monitoring alerts

## 📞 Support

For issues:
1. Check DEPLOYMENT.md (this file)
2. Review error logs
3. Run pre-deploy validation
4. Check monitoring dashboard
5. Test endpoints individually

---

**Version:** 1.0.0  
**Last Updated:** October 2026  
**Status:** Production Ready ✅
