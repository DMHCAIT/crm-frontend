// Complete Authentication Status Check for CRM System
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

async function comprehensiveAuthTest() {
  console.log('🔐 CRM Authentication System Status Check');
  console.log('==========================================\n');
  
  const baseURL = 'crm-backend-production-5e32.up.railway.app';
  let token = null;
  
  try {
    // 1. Health Check
    console.log('📡 Backend Health Status:');
    const health = await makeRequest({
      hostname: baseURL,
      port: 443,
      path: '/health',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`   Status: ${health.status === 200 ? '✅ Healthy' : '❌ Unhealthy'}`);
    if (health.data && health.data.services) {
      console.log(`   Database: ${health.data.services.database || 'unknown'}`);
      console.log(`   Auth: ${health.data.services.authentication || 'unknown'}`);
    }
    console.log('');
    
    // 2. Debug Login Test
    console.log('🧪 Debug Authentication:');
    const debugAuth = await makeRequest({
      hostname: baseURL,
      port: 443,
      path: '/api/auth/debug-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`   Status: ${debugAuth.status === 200 ? '✅ Working' : '❌ Failed'}`);
    if (debugAuth.data && debugAuth.data.token) {
      token = debugAuth.data.token;
      console.log('   Token: ✅ Generated successfully');
      console.log(`   User: ${debugAuth.data.user.name} (${debugAuth.data.user.role})`);
    } else {
      console.log('   Token: ❌ Failed to generate');
    }
    console.log('');
    
    // 3. Test All Protected Endpoints
    if (token) {
      console.log('🛡️  Protected Endpoints Status:');
      
      const endpoints = [
        { path: '/api/users', name: 'User Management' },
        { path: '/api/leads', name: 'Lead Management' },
        { path: '/api/students', name: 'Student Management' },
        { path: '/api/auth/verify', name: 'Token Verification' },
        { path: '/api/dashboard', name: 'Dashboard Data' }
      ];
      
      for (const endpoint of endpoints) {
        try {
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
          
          const status = result.status < 400 ? '✅' : '❌';
          console.log(`   ${endpoint.name}: ${status} (${result.status})`);
          
          if (result.status >= 400 && result.data && result.data.error) {
            console.log(`     Error: ${result.data.error}`);
          }
          
        } catch (error) {
          console.log(`   ${endpoint.name}: ❌ Network Error`);
        }
      }
    }
    
    console.log('');
    
    // 4. Frontend Connection Test
    console.log('🖥️  Frontend Integration:');
    console.log(`   Local Dev Server: http://localhost:5173/`);
    console.log(`   Production URL: https://crmdmhca.com/`);
    console.log(`   Debug Login Button: ${token ? '✅ Ready to test' : '❌ Backend issues'}`);
    
    console.log('\n🎯 Summary:');
    console.log(`   Backend Health: ${health.status === 200 ? '✅' : '❌'}`);
    console.log(`   Debug Login: ${debugAuth.status === 200 ? '✅' : '❌'}`);
    console.log(`   JWT Token: ${token ? '✅' : '❌'}`);
    console.log(`   Railway Deployment: ${token ? '⚠️  Partial (some endpoints working)' : '❌ Issues detected'}`);
    
    if (token) {
      console.log('\n💡 Next Steps:');
      console.log('   1. Test debug login button on frontend');
      console.log('   2. Wait for Railway auto-deploy (JWT fixes)');
      console.log('   3. Verify user management functionality');
    }
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
  }
}

// Run comprehensive test
comprehensiveAuthTest();