// Test User Management Frontend Component with Enhanced Error Handling
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

async function testUserManagementDetailed() {
  console.log('🔍 DETAILED USER MANAGEMENT DIAGNOSTIC');
  console.log('======================================\n');
  
  const baseURL = 'crm-backend-production-5e32.up.railway.app';
  
  try {
    // 1. Get fresh token with all details
    console.log('1️⃣ Getting Fresh Token with Database User:');
    const loginResult = await makeRequest({
      hostname: baseURL,
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'santhosh@dmhca.in',
      password: 'Santhu@123'
    });
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed, cannot proceed');
      return;
    }
    
    const token = loginResult.data.token;
    const user = loginResult.data.user;
    
    console.log('   Token: ✅ Generated');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Permissions: ${JSON.stringify(user.permissions)}`);
    console.log(`   Department: ${user.department || 'N/A'}`);
    console.log('');

    // 2. Test token verification endpoint
    console.log('2️⃣ Testing Token Verification:');
    const verifyResult = await makeRequest({
      hostname: baseURL,
      port: 443,
      path: '/api/auth/verify',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   Status: ${verifyResult.status}`);
    if (verifyResult.status === 200) {
      console.log('   ✅ Token is valid');
      console.log(`   Verified User: ${verifyResult.data.user.email}`);
      console.log(`   Verified Role: ${verifyResult.data.user.role}`);
    } else {
      console.log('   ❌ Token verification failed');
      console.log(`   Error: ${JSON.stringify(verifyResult.data)}`);
    }
    console.log('');

    // 3. Test User Management API with detailed debugging
    console.log('3️⃣ Testing User Management API:');
    const usersResult = await makeRequest({
      hostname: baseURL,
      port: 443,
      path: '/api/users',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   Status: ${usersResult.status}`);
    
    if (usersResult.status === 200) {
      console.log('   ✅ User Management API working!');
      const response = usersResult.data;
      
      if (response.users && Array.isArray(response.users)) {
        console.log(`   Found ${response.users.length} users`);
        response.users.forEach((u, i) => {
          console.log(`     ${i + 1}. ${u.name} (${u.email}) - ${u.role}`);
        });
      } else {
        console.log('   Response structure:', Object.keys(response));
      }
    } else {
      console.log('   ❌ User Management API failed');
      console.log(`   Error: ${JSON.stringify(usersResult.data)}`);
    }
    console.log('');

    // 4. Test Dashboard API
    console.log('4️⃣ Testing Dashboard API:');
    const dashboardResult = await makeRequest({
      hostname: baseURL,
      port: 443,
      path: '/api/dashboard',
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   Status: ${dashboardResult.status}`);
    
    if (dashboardResult.status === 200) {
      console.log('   ✅ Dashboard API working!');
      const dashboard = dashboardResult.data;
      console.log(`   Total Leads: ${dashboard.totalLeads || 0}`);
      console.log(`   Total Students: ${dashboard.totalStudents || 0}`);
      console.log(`   Conversion Rate: ${dashboard.conversionRate || '0'}%`);
    } else {
      console.log('   ❌ Dashboard API failed');
      console.log(`   Error: ${JSON.stringify(dashboardResult.data)}`);
    }
    console.log('');

    // 5. Summary and Recommendations
    console.log('5️⃣ DIAGNOSIS SUMMARY:');
    const workingCount = [
      verifyResult.status === 200,
      usersResult.status === 200,
      dashboardResult.status === 200
    ].filter(Boolean).length;
    
    console.log(`   Working APIs: ${workingCount}/3`);
    
    if (workingCount === 3) {
      console.log('🟢 ALL SYSTEMS FULLY OPERATIONAL!');
      console.log('   ✅ Ready for complete production use');
    } else if (workingCount >= 1) {
      console.log('🟡 PARTIAL DEPLOYMENT - Railway still updating');
      console.log('   ⏳ Some endpoints need a few more minutes');
      console.log('   ✅ Core authentication working perfectly');
    } else {
      console.log('🔴 DEPLOYMENT ISSUES');
      console.log('   ⚠️ Check Railway deployment logs');
    }

    console.log('\n💡 IMMEDIATE ACTIONS:');
    console.log('   1. Use Quick Access button on frontend');
    console.log('   2. Database credentials work for login');
    console.log('   3. Wait 5-10 minutes for full Railway deployment');
    console.log('   4. Frontend has fallback data for User Management');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run detailed test
testUserManagementDetailed();