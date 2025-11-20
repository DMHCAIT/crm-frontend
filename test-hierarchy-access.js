// 🧪 TEST SCRIPT: Hierarchy Access Verification
// This script tests if the hierarchy-based access control is working properly

const https = require('https');
const http = require('http');

// Configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
const API_URL = process.env.API_URL || 'http://localhost:3000'; // Your backend URL
const TEST_USERS = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    expectedRole: 'super_admin',
    expectedAccess: 'all_leads'
  },
  {
    email: 'manager@example.com', 
    password: 'manager123',
    expectedRole: 'manager',
    expectedAccess: 'team_leads_and_below'
  },
  {
    email: 'counselor@example.com',
    password: 'counselor123', 
    expectedRole: 'counselor',
    expectedAccess: 'own_leads_only'
  }
];

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Test login and get token
async function testLogin(email, password) {
  console.log(`\n🔐 Testing login for: ${email}`);
  
  try {
    const response = await makeRequest(
      `${API_URL}/api/simple-auth/login`,
      'POST',
      {},
      { email, password }
    );
    
    if (response.status === 200 && response.data.token) {
      console.log(`✅ Login successful`);
      console.log(`   User: ${response.data.user?.name || response.data.user?.username}`);
      console.log(`   Role: ${response.data.user?.role}`);
      return {
        success: true,
        token: response.data.token,
        user: response.data.user
      };
    } else {
      console.log(`❌ Login failed: ${JSON.stringify(response.data)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Login error: ${error.message}`);
    return { success: false };
  }
}

// Test assignable users endpoint
async function testAssignableUsers(token, user) {
  console.log(`\n👥 Testing assignable users for: ${user.username || user.email}`);
  
  try {
    const response = await makeRequest(
      `${API_URL}/api/assignable-users`,
      'GET',
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.status === 200) {
      const users = response.data.users || response.data.data || [];
      console.log(`✅ Assignable users retrieved: ${users.length} users`);
      console.log(`   Users list:`);
      users.forEach(u => {
        const isSelf = u.username === user.username || u.email === user.email;
        console.log(`   - ${u.name} (${u.role}) ${isSelf ? '👤 YOU' : ''}`);
      });
      return { success: true, count: users.length, users };
    } else {
      console.log(`❌ Failed to get assignable users: ${JSON.stringify(response.data)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Assignable users error: ${error.message}`);
    return { success: false };
  }
}

// Test leads access
async function testLeadsAccess(token, user) {
  console.log(`\n📋 Testing leads access for: ${user.username || user.email}`);
  
  try {
    const response = await makeRequest(
      `${API_URL}/api/leads`,
      'GET',
      { 'Authorization': `Bearer ${token}` }
    );
    
    if (response.status === 200) {
      const leads = response.data.leads || response.data.data || [];
      console.log(`✅ Leads retrieved: ${leads.length} leads`);
      
      // Group leads by assigned user
      const assignmentCounts = {};
      leads.forEach(lead => {
        const assignee = lead.assigned_to || lead.assignedTo || 'Unassigned';
        assignmentCounts[assignee] = (assignmentCounts[assignee] || 0) + 1;
      });
      
      console.log(`   Leads by assignee:`);
      Object.entries(assignmentCounts).forEach(([assignee, count]) => {
        const isSelf = assignee === user.username || assignee === user.email;
        console.log(`   - ${assignee}: ${count} leads ${isSelf ? '👤 YOUR LEADS' : ''}`);
      });
      
      return { success: true, count: leads.length, assignments: assignmentCounts };
    } else {
      console.log(`❌ Failed to get leads: ${JSON.stringify(response.data)}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`❌ Leads access error: ${error.message}`);
    return { success: false };
  }
}

// Main test runner
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 HIERARCHY ACCESS CONTROL TEST');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Testing against: ${API_URL}`);
  console.log('');
  
  const results = [];
  
  for (const testUser of TEST_USERS) {
    console.log('\n' + '─'.repeat(60));
    console.log(`Testing User: ${testUser.email}`);
    console.log(`Expected Role: ${testUser.expectedRole}`);
    console.log(`Expected Access: ${testUser.expectedAccess}`);
    console.log('─'.repeat(60));
    
    // Step 1: Login
    const loginResult = await testLogin(testUser.email, testUser.password);
    if (!loginResult.success) {
      results.push({
        user: testUser.email,
        role: testUser.expectedRole,
        login: '❌ FAILED',
        assignableUsers: 'N/A',
        leadsAccess: 'N/A'
      });
      continue;
    }
    
    // Step 2: Test assignable users
    const assignableResult = await testAssignableUsers(loginResult.token, loginResult.user);
    
    // Step 3: Test leads access
    const leadsResult = await testLeadsAccess(loginResult.token, loginResult.user);
    
    results.push({
      user: testUser.email,
      role: loginResult.user.role,
      login: '✅ SUCCESS',
      assignableUsers: assignableResult.success ? `✅ ${assignableResult.count} users` : '❌ FAILED',
      leadsAccess: leadsResult.success ? `✅ ${leadsResult.count} leads` : '❌ FAILED'
    });
  }
  
  // Summary
  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.table(results);
  
  console.log('\n✨ Hierarchy Access Control Verification Complete!');
  console.log('\n📝 Key Points to Verify:');
  console.log('   1. Super Admin should see ALL leads (including unassigned)');
  console.log('   2. Super Admin should be able to assign to ALL users');
  console.log('   3. Managers should see leads from team leaders and counselors');
  console.log('   4. Managers should be able to assign to team leaders and counselors');
  console.log('   5. Counselors should only see their own leads');
  console.log('   6. Counselors should only be able to assign to themselves');
  console.log('\n');
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
