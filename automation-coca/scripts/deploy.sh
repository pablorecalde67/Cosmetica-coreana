#!/bin/bash

# KBeauty CDE Deployment Script
# Soporta: Heroku, DigitalOcean, AWS, Manual

set -e

echo "🚀 KBeauty CDE Deployment Script"
echo "================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is clean
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}❌ Git working directory not clean. Commit changes first.${NC}"
  exit 1
fi

# Select deployment method
echo "Select deployment platform:"
echo "1) Heroku"
echo "2) DigitalOcean"
echo "3) Docker (local)"
echo ""
read -p "Choose option (1-3): " DEPLOY_METHOD

case $DEPLOY_METHOD in
  1)
    deploy_heroku
    ;;
  2)
    deploy_digitalocean
    ;;
  3)
    deploy_docker
    ;;
  *)
    echo -e "${RED}Invalid option${NC}"
    exit 1
    ;;
esac

function deploy_heroku() {
  echo -e "${YELLOW}📦 Deploying to Heroku...${NC}"
  
  # Check if heroku CLI is installed
  if ! command -v heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku CLI not found. Install it first.${NC}"
    exit 1
  fi
  
  read -p "Enter Heroku app name (or create new): " HEROKU_APP
  
  if [ -z "$HEROKU_APP" ]; then
    echo -e "${YELLOW}Creating new Heroku app...${NC}"
    heroku create
    HEROKU_APP=$(heroku apps:info -j | jq -r '.app.name')
  fi
  
  echo -e "${YELLOW}Setting environment variables...${NC}"
  heroku config:set NODE_ENV=production --app $HEROKU_APP
  heroku config:set PORT=3000 --app $HEROKU_APP
  
  echo -e "${YELLOW}Pushing to Heroku...${NC}"
  git push heroku main
  
  echo -e "${GREEN}✅ Deployed to Heroku!${NC}"
  echo -e "App URL: https://${HEROKU_APP}.herokuapp.com"
  heroku open --app $HEROKU_APP
}

function deploy_digitalocean() {
  echo -e "${YELLOW}📦 Deploying to DigitalOcean...${NC}"
  
  read -p "Enter DigitalOcean API Token: " DO_TOKEN
  read -p "Enter Droplet name: " DROPLET_NAME
  read -p "Enter your SSH key (path): " SSH_KEY
  
  if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ SSH key not found${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Building Docker image...${NC}"
  docker build -t kbeautycde:latest .
  
  echo -e "${YELLOW}Tagging image for DigitalOcean Registry...${NC}"
  docker tag kbeautycde:latest registry.digitalocean.com/kbeautycde/kbeautycde:latest
  
  echo -e "${YELLOW}Pushing to DigitalOcean Container Registry...${NC}"
  echo $DO_TOKEN | docker login -u $DO_TOKEN --password-stdin registry.digitalocean.com
  docker push registry.digitalocean.com/kbeautycde/kbeautycde:latest
  
  echo -e "${YELLOW}Creating/updating DigitalOcean App...${NC}"
  # Note: Requires app.yaml file
  
  echo -e "${GREEN}✅ Image pushed to DigitalOcean Registry!${NC}"
  echo "Next steps:"
  echo "1. Create a new DigitalOcean App"
  echo "2. Connect to Container Registry image"
  echo "3. Set environment variables"
  echo "4. Deploy"
}

function deploy_docker() {
  echo -e "${YELLOW}🐳 Building Docker image locally...${NC}"
  
  docker build -t kbeautycde:latest .
  
  echo -e "${YELLOW}Starting container...${NC}"
  docker run -p 3000:3000 \
    -e NODE_ENV=production \
    -e PORT=3000 \
    --name kbeautycde \
    kbeautycde:latest
  
  echo -e "${GREEN}✅ Container running!${NC}"
  echo "Access: http://localhost:3000"
}

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
