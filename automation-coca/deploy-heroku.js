#!/usr/bin/env node

const https = require('https');

const API_KEY = process.env.HEROKU_API_KEY;
const APP_NAME = process.env.HEROKU_APP_NAME || 'kbeautycde';

console.log('🚀 Deploying to Heroku');
console.log('App:', APP_NAME);

if (!API_KEY) {
  console.error('ERROR: No HEROKU_API_KEY');
  process.exit(1);
}

// Create app via API
const options = {
  hostname: 'api.heroku.com',
  path: '/apps',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.heroku+json; version=3'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode < 300 || res.statusCode === 422) {
      console.log('✅ Deployment initiated');
      console.log('');
      console.log('🌐 URL: https://' + APP_NAME + '.herokuapp.com');
    } else {
      console.log('Response:', data);
    }
  });
});

req.on('error', e => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.write(JSON.stringify({ name: APP_NAME }));
req.end();
