#!/bin/bash

# Pre-Deployment Validation Script
# Verifies all systems are ready for production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Pre-Deployment Validation${NC}"
echo "=================================="
echo ""

# Counter for checks
PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASSED++))
}

check_fail() {
  echo -e "${RED}❌ $1${NC}"
  ((FAILED++))
}

check_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNINGS++))
}

# 1. Check Node.js version
echo "1. Checking Node.js..."
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION == v18* ]] || [[ $NODE_VERSION == v20* ]] || [[ $NODE_VERSION == v22* ]]; then
  check_pass "Node.js version: $NODE_VERSION"
else
  check_warn "Node.js version $NODE_VERSION (recommended 18+)"
fi

# 2. Check npm packages
echo ""
echo "2. Checking npm packages..."
if npm ls > /dev/null 2>&1; then
  check_pass "npm dependencies installed"
else
  check_fail "npm dependencies not installed (run: npm ci)"
fi

# 3. Check environment file
echo ""
echo "3. Checking environment configuration..."
if [ -f .env ]; then
  check_pass ".env file exists"

  # Check critical env vars
  if grep -q "ADMIN_TOKEN" .env; then
    check_pass "ADMIN_TOKEN configured"
  else
    check_warn "ADMIN_TOKEN not in .env"
  fi

  if grep -q "STRIPE" .env; then
    check_pass "Stripe keys configured"
  else
    check_warn "Stripe keys not configured"
  fi
else
  check_warn ".env file not found (copy from .env.production)"
fi

# 4. Check database files
echo ""
echo "4. Checking data directory..."
if [ -d data ]; then
  check_pass "data/ directory exists"
  if [ -f data/products.json ]; then
    check_pass "products.json exists"
  else
    check_warn "products.json not found"
  fi
else
  check_fail "data/ directory not found"
fi

# 5. Check Docker (if deploying with Docker)
echo ""
echo "5. Checking Docker setup..."
if command -v docker &> /dev/null; then
  if [ -f Dockerfile ]; then
    check_pass "Docker is installed and Dockerfile exists"
    # Test Docker build
    if docker build --no-cache -t kbeautycde:test . > /dev/null 2>&1; then
      check_pass "Docker build test passed"
      docker rmi kbeautycde:test > /dev/null 2>&1
    else
      check_fail "Docker build test failed"
    fi
  else
    check_fail "Dockerfile not found"
  fi
else
  check_warn "Docker not installed (required for containerization)"
fi

# 6. Check test suite
echo ""
echo "6. Running test suite..."
if [ -f scripts/test-suite.js ]; then
  if timeout 60 node scripts/test-suite.js > /dev/null 2>&1; then
    check_pass "Test suite passed"
  else
    check_fail "Test suite failed"
  fi
else
  check_fail "Test suite not found"
fi

# 7. Check git status
echo ""
echo "7. Checking git status..."
if ! git diff-index --quiet HEAD --; then
  check_warn "Uncommitted changes in git"
else
  check_pass "Git working directory is clean"
fi

# 8. Check deployment scripts
echo ""
echo "8. Checking deployment scripts..."
if [ -f scripts/deploy.sh ]; then
  check_pass "deploy.sh exists"
else
  check_fail "deploy.sh not found"
fi

# 9. Security checks
echo ""
echo "9. Running security checks..."
if ! grep -r "\.env" .gitignore > /dev/null 2>&1; then
  check_warn ".env not in .gitignore (security risk)"
else
  check_pass ".env is in .gitignore"
fi

if grep -r "password\|secret\|token" package.json > /dev/null 2>&1; then
  check_warn "Possible secrets in package.json"
else
  check_pass "No secrets detected in package.json"
fi

# 10. File permissions
echo ""
echo "10. Checking file permissions..."
if [ -x scripts/deploy.sh ]; then
  check_pass "deploy.sh is executable"
else
  check_warn "deploy.sh is not executable (run: chmod +x scripts/deploy.sh)"
fi

# Summary
echo ""
echo "=================================="
echo -e "${BLUE}📊 Summary${NC}"
echo -e "${GREEN}Passed: ${PASSED}${NC}"
if [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}Warnings: ${WARNINGS}${NC}"
fi
if [ $FAILED -gt 0 ]; then
  echo -e "${RED}Failed: ${FAILED}${NC}"
fi

TOTAL=$((PASSED + WARNINGS + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo ""
echo "Ready for deployment: $PERCENTAGE%"

if [ $FAILED -gt 0 ]; then
  echo -e "${RED}❌ Fix errors before deploying${NC}"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Warnings detected, proceed with caution${NC}"
  exit 0
else
  echo -e "${GREEN}✅ All checks passed! Ready for production${NC}"
  exit 0
fi
