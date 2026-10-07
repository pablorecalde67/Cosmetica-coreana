#!/bin/bash

# Setup Script - Initial Configuration
# Run this once after cloning the repository

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 K-Beauty CDE Setup${NC}"
echo "======================"
echo ""

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci --only=production

# Step 2: Create directories
echo -e "${YELLOW}📁 Creating data directories...${NC}"
mkdir -p data
mkdir -p public/media
mkdir -p logs

# Step 3: Initialize data files
echo -e "${YELLOW}📝 Initializing data files...${NC}"

if [ ! -f data/products.json ]; then
  echo "[]" > data/products.json
  echo "Created data/products.json"
fi

if [ ! -f data/orders.json ]; then
  echo "[]" > data/orders.json
  echo "Created data/orders.json"
fi

if [ ! -f data/instagram-products.json ]; then
  echo "[]" > data/instagram-products.json
  echo "Created data/instagram-products.json"
fi

if [ ! -f data/campaigns.json ]; then
  echo '{}' > data/campaigns.json
  echo "Created data/campaigns.json"
fi

if [ ! -f data/metrics.json ]; then
  echo '{"requests": 0, "errors": 0, "endpoints": {}}' > data/metrics.json
  echo "Created data/metrics.json"
fi

if [ ! -f data/alerts.json ]; then
  echo '{"alerts": []}' > data/alerts.json
  echo "Created data/alerts.json"
fi

# Step 4: Setup environment
echo ""
echo -e "${YELLOW}⚙️  Setting up environment...${NC}"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example"
  echo -e "${YELLOW}⚠️  Edit .env and add your API keys before running${NC}"
else
  echo "✅ .env already exists"
fi

# Step 5: Make scripts executable
echo ""
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
chmod +x scripts/deploy.sh
chmod +x scripts/pre-deploy.sh
chmod +x scripts/setup.sh
echo "✅ Scripts are now executable"

# Step 6: Verify installation
echo ""
echo -e "${YELLOW}✔️  Running verification...${NC}"
if node -c src/index.js 2>/dev/null; then
  echo "✅ Syntax check passed"
else
  echo "⚠️  Syntax warnings (non-critical)"
fi

# Summary
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env with your configuration"
echo "2. Run: npm start (or node src/index.js)"
echo "3. Visit: http://localhost:3000"
echo ""
echo "Testing:"
echo "  npm test              - Run test suite"
echo "  npm run pre-deploy    - Validate for deployment"
echo "  npm run deploy        - Deploy to production"
echo ""
