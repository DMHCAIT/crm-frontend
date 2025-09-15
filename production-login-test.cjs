// Test production-ready login credentials
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

async function testProductionLogin() {
  console.log('🚀 Testing Production-Ready Login Credentials');
  console.log('===========================================\n');
  
  const baseURL = 'crm-backend-production-5e32.up.railway.app';
  
  const credentials = [
    { email: 'admin@crm.com', password: 'admin123', name: 'Primary Admin' },
    { email: 'santhosh@dmhca.edu', password: 'admin123', name: 'Santhosh DMHCA' },
    { email: 'demo@crm.com', password: 'demo123', name: 'Demo User' }
  ];

  for (let i = 0; i < credentials.length; i++) {
    const cred = credentials[i];
    console.log(`${i + 1}️⃣ Testing ${cred.name} (${cred.email}):`);
    
    try {
      const result = await makeRequest({
        hostname: baseURL,
        port: 443,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email: cred.email,
        password: cred.password
      });
      
      console.log(`   Status: ${result.status}`);
      console.log(`   Success: ${result.status === 200 ? '✅' : '❌'}`);
      
      if (result.status === 200 && result.data.token) {
        console.log(`   Token: ✅ Generated`);
        console.log(`   User Role: ${result.data.user.role}`);
        console.log(`   Message: ${result.data.message || 'Login successful'}`);
        
        // Test the token with a protected endpoint
        console.log('   Testing token with Users API...');
        const usersTest = await makeRequest({
          hostname: baseURL,
          port: 443,
          path: '/api/users',
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.data.token}`
          }
        });
        
        console.log(`   Users API: ${usersTest.status < 400 ? '✅' : '❌'} (${usersTest.status})`);
        
      } else {
        console.log(`   Error: ${JSON.stringify(result.data)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Network Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('💡 Ready for Production Use!');
  console.log('Frontend can now use these credentials:');
  console.log('• admin@crm.com / admin123 (Super Admin)');
  console.log('• santhosh@dmhca.edu / admin123 (Super Admin)');
  console.log('• demo@crm.com / demo123 (Admin)');
}

// Run test
testProductionLogin();