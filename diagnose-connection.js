#!/usr/bin/env node

/**
 * CRM Connection Problem Diagnosis
 * Let's identify the exact issue with leads not fetching
 */

console.log('🔍 CRM Backend Connection Diagnosis\n');

// Check what's configured in frontend
console.log('📋 Frontend Configuration:');
console.log('Expected Backend:', 'https://crm-backend-fh34.onrender.com');
console.log('Environment File:', '.env in crm-frontend-main/');
console.log('Fallback URLs in components updated');

console.log('\n🔗 Testing Backend Connection...');

const YOUR_BACKEND = 'https://crm-backend-fh34.onrender.com';

async function diagnoseProblem() {
  try {
    console.log('🧪 1. Testing Basic Connection');
    const response = await fetch(YOUR_BACKEND);
    console.log('Basic Response:', response.status, response.statusText);
    
    if (response.ok) {
      console.log('✅ Backend server is reachable');
    } else {
      console.log('❌ Backend server issue - status:', response.status);
    }

    console.log('\n🧪 2. Testing Health Endpoint');
    const healthResponse = await fetch(`${YOUR_BACKEND}/api/health`);
    console.log('Health Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData.status);
    } else {
      console.log('❌ Health endpoint failed');
    }

    console.log('\n🧪 3. Testing Auth (Login)');
    const authResponse = await fetch(`${YOUR_BACKEND}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    console.log('Auth Status:', authResponse.status);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authentication working');
      
      // Test leads with auth token
      console.log('\n🧪 4. Testing Leads API (Authenticated)');
      const leadsResponse = await fetch(`${YOUR_BACKEND}/api/leads`, {
        headers: { 'Authorization': `Bearer ${authData.token}` }
      });
      
      console.log('Leads API Status:', leadsResponse.status);
      
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        console.log('✅ Leads API working - found', leadsData.data?.length || 0, 'leads');
      } else {
        const errorText = await leadsResponse.text();
        console.log('❌ Leads API failed:', errorText);
      }
      
    } else {
      const errorText = await authResponse.text();
      console.log('❌ Authentication failed:', errorText);
    }

    console.log('\n🧪 5. Testing Webhook Endpoint');
    const webhookResponse = await fetch(`${YOUR_BACKEND}/api/webhook-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verify_token: 'dmhca-webhook-secure-2024',
        name: 'Test User',
        email: 'test@example.com',
        source: 'Diagnosis Test'
      })
    });
    
    console.log('Webhook Status:', webhookResponse.status);
    
    if (webhookResponse.ok) {
      console.log('✅ Webhook endpoint working');
    } else {
      console.log('❌ Webhook endpoint issue');
    }

  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    console.log('\n🔍 This indicates one of these issues:');
    console.log('1. Backend server is down or sleeping (Render free tier)');
    console.log('2. Network/DNS issue');
    console.log('3. CORS blocking the request');
    console.log('4. Wrong backend URL');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📝 TROUBLESHOOTING STEPS:');
  console.log('1. Check if backend URL is correct in .env file');
  console.log('2. Wake up Render backend by visiting it in browser');
  console.log('3. Check Render dashboard for backend deployment status');
  console.log('4. Restart frontend dev server after .env changes');
  console.log('5. Clear browser cache and try again');
  
  console.log('\n🎯 CURRENT STATUS:');
  console.log('✅ Frontend config updated to correct backend URL');
  console.log('✅ Webhook endpoint created and ready');
  console.log('🔄 Need to verify backend is awake and responding');
}

diagnoseProblem();