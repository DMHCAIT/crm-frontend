// Test individual API endpoints after JWT secret fix
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

async function testEndpoints() {
  console.log('🔧 Testing API Endpoints After JWT Fix...\n');
  
  const baseURL = 'crm-backend-production-5e32.up.railway.app';
  
  try {
    // Get debug login token first
    console.log('1️⃣ Getting debug login token...');
    const debugLogin = await makeRequest({
      hostname: baseURL,
      port: 443,
      path: '/api/auth/debug-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!debugLogin.data.token) {
      console.log('❌ Failed to get token');
      return;
    }
    
    const token = debugLogin.data.token;
    console.log('✅ Token obtained successfully\n');
    
    // Test different endpoints
    const endpoints = [
      { path: '/api/users', name: 'Users API' },
      { path: '/api/leads', name: 'Leads API' },
      { path: '/api/auth/verify', name: 'Auth Verify' },
      { path: '/api/students', name: 'Students API' }
    ];
    
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      console.log(`${i + 2}️⃣ Testing ${endpoint.name} (${endpoint.path})...`);
      
      const result = await makeRequest({
        hostname: baseURL,
        port: 443,
        path: endpoint.path,
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`   Status: ${result.status}`);
      console.log(`   Success: ${result.status < 400 ? '✅' : '❌'}`);
      
      if (result.status >= 400) {
        console.log(`   Error: ${JSON.stringify(result.data)}`);
      } else {
        console.log(`   Response type: ${Array.isArray(result.data) ? 'Array' : typeof result.data}`);
      }
      console.log('');
    }
    
    console.log('🎯 Endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEndpoints();
