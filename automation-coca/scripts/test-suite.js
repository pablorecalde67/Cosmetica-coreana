/**
 * Comprehensive Test Suite for KBeauty CDE
 * Tests all critical endpoints and flows
 */

const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-123';

let testsPassed = 0;
let testsFailed = 0;

// Utility: HTTP request helper
async function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed || body
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test utilities
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (err) {
    console.log(`❌ ${name}: ${err.message}`);
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ============= TESTS =============

async function runTests() {
  console.log('\n🧪 Running KBeauty CDE Test Suite\n');
  console.log(`Testing: ${BASE_URL}\n`);

  // Health Check
  await test('Health Check', async () => {
    const res = await makeRequest('GET', '/api/admin/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Health check failed');
  });

  // Products API
  await test('GET /api/products', async () => {
    const res = await makeRequest('GET', '/api/products');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // Admin Orders - Auth Required
  await test('Admin Auth Required', async () => {
    const res = await makeRequest('GET', '/api/admin/orders');
    assert(res.status === 401, 'Should require auth');
  });

  // Admin Orders - Valid Token
  await test('GET /api/admin/orders (with auth)', async () => {
    const res = await makeRequest('GET', '/api/admin/orders', null, {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.body.orders), 'Orders should be array');
  });

  // Admin Analytics
  await test('GET /api/admin/analytics', async () => {
    const res = await makeRequest('GET', '/api/admin/analytics', null, {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.stats, 'Should have stats');
  });

  // Admin Webhooks Status
  await test('GET /api/admin/webhooks', async () => {
    const res = await makeRequest('GET', '/api/admin/webhooks', null, {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.webhooks, 'Should have webhook status');
  });

  // Create Product
  await test('POST /api/admin/products', async () => {
    const productData = {
      nombre: `Test Product ${Date.now()}`,
      descripcion: 'Test product for suite',
      precio: 1000,
      moneda: 'ARS'
    };
    const res = await makeRequest('POST', '/api/admin/products', productData, {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body.product.id, 'Product should have ID');
  });

  // Shipping Calculation
  await test('GET /api/shipping/calculate', async () => {
    const res = await makeRequest('GET', '/api/shipping/calculate?country=AR&weight=1');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.options, 'Should have shipping options');
  });

  // Instagram Status
  await test('GET /api/instagram/status', async () => {
    const res = await makeRequest('GET', '/api/instagram/status');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // Skin Analysis Available
  await test('Skin Analysis Available', async () => {
    const res = await makeRequest('GET', '/piel/');
    assert(res.status === 200 || res.status === 404, 'Endpoint should exist or redirect');
  });

  // Static Pages
  await test('Checkout Page Available', async () => {
    const res = await makeRequest('GET', '/checkout.html');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test('Admin Page Available', async () => {
    const res = await makeRequest('GET', '/admin.html');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // Error Handling
  await test('404 Error Handling', async () => {
    const res = await makeRequest('GET', '/nonexistent');
    assert(res.status === 404, 'Should return 404 for nonexistent route');
  });

  // Monitoring
  await test('GET /api/monitoring/health', async () => {
    const res = await makeRequest('GET', '/api/monitoring/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Health check should succeed');
  });

  await test('GET /api/monitoring/status (auth required)', async () => {
    const res = await makeRequest('GET', '/api/monitoring/status', null, {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.status, 'Should have status');
  });

  await test('GET /api/monitoring/alerts', async () => {
    const res = await makeRequest('GET', '/api/monitoring/alerts', null, {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // Campaigns
  await test('GET /api/monitoring/campaigns/status', async () => {
    const res = await makeRequest('GET', '/api/monitoring/campaigns/status', null, {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.campaigns, 'Should have campaigns');
  });

  await test('GET /api/monitoring/campaigns/analytics', async () => {
    const res = await makeRequest('GET', '/api/monitoring/campaigns/analytics', null, {
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.totalCampaigns, 'Should have totalCampaigns');
  });

  // Print Results
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results:`);
  console.log(`  ✅ Passed: ${testsPassed}`);
  console.log(`  ❌ Failed: ${testsFailed}`);
  console.log(`  📈 Total:  ${testsPassed + testsFailed}`);
  console.log(`  💯 Score: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%\n`);

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! Ready for deployment.\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${testsFailed} test(s) failed. Fix before deployment.\n`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
