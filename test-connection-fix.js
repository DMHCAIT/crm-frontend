#!/usr/bin/env node

/**
 * Test Frontend-Backend Connection Fix
 * Verify the updated backend URL is working
 */

const CORRECT_BACKEND = 'https://crm-backend-main-6i64.onrender.com';

async function testConnection() {
  console.log('🔗 Testing Frontend-Backend Connection Fix\n');
  console.log('Updated Backend URL:', CORRECT_BACKEND);
  console.log('='.repeat(50));

  try {
    // Test 1: Health Check
    console.log('\n1️⃣ Health Check');
    const healthResponse = await fetch(`${CORRECT_BACKEND}/api/health`);
    console.log('Status:', healthResponse.status, healthResponse.statusText);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is ONLINE');
      console.log('Response:', healthData);
    } else {
      console.log('❌ Health check failed');
    }

    // Test 2: Auth Test
    console.log('\n2️⃣ Authentication Test');
    const authResponse = await fetch(`${CORRECT_BACKEND}/api/auth/login`, {
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
      const dashboardResponse = await fetch(`${CORRECT_BACKEND}/api/dashboard`, {
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
      
    } else {
      const errorText = await authResponse.text();
      console.log('❌ Authentication failed:', errorText);
    }

    // Test 4: Webhook Test
    console.log('\n4️⃣ Webhook Test');
    const webhookResponse = await fetch(`${CORRECT_BACKEND}/api/webhook-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verify_token: 'dmhca-webhook-secure-2024',
        name: 'Test Lead',
        email: 'test@example.com',
        phone: '1234567890',
        source: 'Connection Test'
      })
    });
    
    console.log('Webhook Status:', webhookResponse.status);
    
    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log('✅ Webhook working');
      console.log('Response:', webhookData.message);
    } else {
      const errorText = await webhookResponse.text();
      console.log('❌ Webhook failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎯 Connection test completed!');
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Frontend .env updated with correct backend URL');
  console.log('2. Fallback URLs in components updated');
  console.log('3. Restart your frontend development server');
  console.log('4. Test dashboard in browser');
}

testConnection().catch(console.error);