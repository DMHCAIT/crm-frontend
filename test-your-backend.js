#!/usr/bin/env node

/**
 * Test Your Actual Backend Connection
 * Testing https://crm-backend-fh34.onrender.com
 */

const YOUR_BACKEND = 'https://crm-backend-fh34.onrender.com';

async function testYourBackend() {
  console.log('🔗 Testing Your Actual Backend Connection\n');
  console.log('Backend URL:', YOUR_BACKEND);
  console.log('='.repeat(50));

  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Health Check');
    const healthResponse = await fetch(`${YOUR_BACKEND}/api/health`);
    console.log('Status:', healthResponse.status, healthResponse.statusText);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is ONLINE');
      console.log('Response:', healthData);
    } else {
      console.log('❌ Health check failed');
      const errorText = await healthResponse.text();
      console.log('Error:', errorText);
    }

    // Test 2: Auth Test
    console.log('\n2️⃣ Authentication Test');
    const authResponse = await fetch(`${YOUR_BACKEND}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    console.log('Auth Status:', authResponse.status);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authentication working');
      console.log('Token received:', authData.token ? 'Yes' : 'No');
      
      // Test 3: Dashboard with Token
      console.log('\n3️⃣ Dashboard API (with auth)');
      const dashboardResponse = await fetch(`${YOUR_BACKEND}/api/dashboard`, {
        headers: { 'Authorization': `Bearer ${authData.token}` }
      });
      
      console.log('Dashboard Status:', dashboardResponse.status);
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('✅ Dashboard API working');
        console.log('Leads count:', dashboardData.data?.leadsCount || 'Unknown');
      } else {
        const errorText = await dashboardResponse.text();
        console.log('❌ Dashboard failed:', errorText);
      }
      
      // Test 4: Leads API
      console.log('\n4️⃣ Leads API Test');
      const leadsResponse = await fetch(`${YOUR_BACKEND}/api/leads`, {
        headers: { 'Authorization': `Bearer ${authData.token}` }
      });
      
      console.log('Leads Status:', leadsResponse.status);
      
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        console.log('✅ Leads API working');
        console.log('Total leads:', leadsData.data?.length || 0);
      } else {
        const errorText = await leadsResponse.text();
        console.log('❌ Leads API failed:', errorText);
      }
      
    } else {
      const errorText = await authResponse.text();
      console.log('❌ Authentication failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.log('This suggests the backend might be down or unreachable');
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 Backend test completed!');
}

testYourBackend().catch(console.error);