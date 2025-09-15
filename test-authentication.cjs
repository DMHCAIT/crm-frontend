// Simple Node.js test for CRM authentication
const https = require('https');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAuthentication() {
  console.log('🔍 Testing CRM Backend Authentication...\n');
  
  const baseURL = 'crm-backend-production-5e32.up.railway.app';
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthCheck = await makeRequest({
      hostname: baseURL,
      port: 443,
      path: '/health',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`   Status: ${healthCheck.status}`);
    console.log(`   Response: ${JSON.stringify(healthCheck.data)}\n`);
    
    // Test 2: Debug login
    console.log('2️⃣ Testing debug login endpoint...');
    const debugLogin = await makeRequest({
      hostname: baseURL,
      port: 443,
      path: '/api/auth/debug-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`   Status: ${debugLogin.status}`);
    console.log(`   Response: ${JSON.stringify(debugLogin.data, null, 2)}\n`);
    
    // Test 3: Regular login with test credentials
    console.log('3️⃣ Testing regular login endpoint...');
    const regularLogin = await makeRequest({
      hostname: baseURL,
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@crm.com',
      password: 'admin123'
    });
    console.log(`   Status: ${regularLogin.status}`);
    console.log(`   Response: ${JSON.stringify(regularLogin.data, null, 2)}\n`);
    
    // Test 4: Check if token from debug login works
    if (debugLogin.data && debugLogin.data.token) {
      console.log('4️⃣ Testing token validation...');
      const tokenTest = await makeRequest({
        hostname: baseURL,
        port: 443,
        path: '/api/users',
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${debugLogin.data.token}`
        }
      });
      console.log(`   Status: ${tokenTest.status}`);
      console.log(`   Response: ${JSON.stringify(tokenTest.data, null, 2)}\n`);
    }
    
    console.log('✅ Authentication test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthentication();