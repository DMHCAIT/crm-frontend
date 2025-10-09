#!/usr/bin/env node

/**
 * Backend Connection Diagnostics
 * Test all CRM backend endpoints to identify connection issues
 */

const API_BASE = 'https://crm-backend-main-6i64.onrender.com';

async function testEndpoint(url, method = 'GET', body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const text = await response.text();
    
    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: text
    };
  } catch (error) {
    return {
      error: error.message,
      status: 'CONNECTION_ERROR'
    };
  }
}

async function runDiagnostics() {
  console.log('🔍 CRM Backend Connection Diagnostics\n');
  console.log('Backend URL:', API_BASE);
  console.log('Timestamp:', new Date().toISOString());
  console.log('='.repeat(50));

  // Test 1: Health Check
  console.log('\n1️⃣ Health Check');
  const health = await testEndpoint(`${API_BASE}/api/health`);
  console.log('Status:', health.status || health.error);
  if (health.ok) {
    console.log('✅ Backend is UP');
  } else {
    console.log('❌ Backend DOWN or unreachable');
    console.log('Error:', health.data || health.error);
  }

  // Test 2: Leads Endpoint (Main Issue)
  console.log('\n2️⃣ Leads Endpoint (Dashboard)');
  const leads = await testEndpoint(`${API_BASE}/api/leads`);
  console.log('Status:', leads.status || leads.error);
  if (leads.ok) {
    console.log('✅ Leads endpoint working');
    console.log('Sample response:', leads.data.substring(0, 200) + '...');
  } else {
    console.log('❌ Leads endpoint failed');
    console.log('Error:', leads.data || leads.error);
  }

  // Test 3: Dashboard Endpoint
  console.log('\n3️⃣ Dashboard Endpoint');
  const dashboard = await testEndpoint(`${API_BASE}/api/dashboard`);
  console.log('Status:', dashboard.status || dashboard.error);
  if (dashboard.ok) {
    console.log('✅ Dashboard endpoint working');
  } else {
    console.log('❌ Dashboard endpoint failed');
    console.log('Error:', dashboard.data || dashboard.error);
  }

  // Test 4: Simple Auth Test
  console.log('\n4️⃣ Authentication Test');
  const auth = await testEndpoint(`${API_BASE}/api/auth/login`, 'POST', {
    username: 'admin',
    password: 'admin123'
  });
  console.log('Status:', auth.status || auth.error);
  if (auth.ok) {
    console.log('✅ Authentication working');
    const authData = JSON.parse(auth.data);
    const token = authData.token;
    
    // Test 5: Authenticated Leads Request
    console.log('\n5️⃣ Authenticated Leads Request');
    const authLeads = await testEndpoint(`${API_BASE}/api/leads`, 'GET', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log('Status:', authLeads.status || authLeads.error);
    if (authLeads.ok) {
      console.log('✅ Authenticated leads request working');
    } else {
      console.log('❌ Authenticated leads request failed');
      console.log('Error:', authLeads.data || authLeads.error);
    }
  } else {
    console.log('❌ Authentication failed');
    console.log('Error:', auth.data || auth.error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Diagnostics completed');
}

runDiagnostics().catch(error => {
  console.error('❌ Diagnostic error:', error);
});