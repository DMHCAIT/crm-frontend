#!/usr/bin/env node

/**
 * Test script to verify the fixed assignable-users API endpoint
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

async function testAssignableUsersAPI() {
  console.log('🧪 Testing Fixed Assignable Users API...\n');

  try {
    // Test 1: Test without authentication (should still work with fallback)
    console.log('📋 Step 1: Testing endpoint without authentication...');
    const responseNoAuth = await fetch(`${API_BASE}/api/assignable-users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Response Status: ${responseNoAuth.status}`);
    const textNoAuth = await responseNoAuth.text();
    console.log(`📡 Response: ${textNoAuth}`);

    if (responseNoAuth.ok) {
      const dataNoAuth = JSON.parse(textNoAuth);
      console.log('✅ SUCCESS: Endpoint works without authentication');
      console.log(`📊 Returned ${dataNoAuth.users?.length || 0} users`);
      
      if (dataNoAuth.users && dataNoAuth.users.length > 0) {
        console.log('👥 Sample user:', dataNoAuth.users[0]);
      }
    } else {
      console.log('❌ FAILURE: Endpoint still failing');
      console.log('💥 Response details:', textNoAuth);
    }

    // Test 2: Test with basic JWT token (admin)
    console.log('\n📋 Step 2: Testing with admin JWT token...');
    
    // First get a token
    const loginResponse = await fetch(`${API_BASE}/api/simple-auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token;
      
      console.log('🔑 Got admin token, testing assignable-users with auth...');
      
      const responseWithAuth = await fetch(`${API_BASE}/api/assignable-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`📡 Authenticated Response Status: ${responseWithAuth.status}`);
      const textWithAuth = await responseWithAuth.text();
      
      if (responseWithAuth.ok) {
        const dataWithAuth = JSON.parse(textWithAuth);
        console.log('✅ SUCCESS: Endpoint works with authentication');
        console.log(`📊 Returned ${dataWithAuth.users?.length || 0} users for admin`);
        
        if (dataWithAuth.users && dataWithAuth.users.length > 0) {
          console.log('👥 Sample authenticated user:', dataWithAuth.users[0]);
        }
      } else {
        console.log('❌ FAILURE: Authenticated request failed');
        console.log('💥 Response details:', textWithAuth);
      }
    } else {
      console.log('⚠️ Could not get admin token, skipping authenticated test');
    }

  } catch (error) {
    console.error('💥 Test failed with exception:', error.message);
    console.log('ℹ️ Make sure the backend server is running on port 3001');
  }
}

// Run the test
if (require.main === module) {
  console.log('🔧 Assignable Users API Fix Test');
  console.log('==================================\n');
  
  testAssignableUsersAPI().then(() => {
    console.log('\n✅ Test completed');
  }).catch(err => {
    console.error('\n💥 Test failed:', err);
    process.exit(1);
  });
}

module.exports = { testAssignableUsersAPI };