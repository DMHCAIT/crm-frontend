/**
 * CRM Authentication Fix & Debug Tool
 * This file helps debug and fix authentication issues
 */

// 1. Check current authentication state
function checkAuthState() {
  console.log('=== CRM Authentication Status ===');
  console.log('Token (crm_auth_token):', localStorage.getItem('crm_auth_token'));
  console.log('Token (fallback):', localStorage.getItem('token'));
  console.log('User Data:', localStorage.getItem('crm_user_data'));
  console.log('==================================');
}

// 2. Set debug authentication for testing
function setDebugAuth() {
  const debugToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRlYnVnLXVzZXItMDAxIiwiZW1haWwiOiJzYW50aG9zaEBkbWhjYS5lZHUiLCJuYW1lIjoiU2FudGhvc2ggKERlYnVnKSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY5NDYxNjAwMCwiZXhwIjoxNzI2MTUyMDAwfQ.debug_signature';
  
  const debugUser = {
    id: 'debug-user-001',
    email: 'santhosh@dmhca.edu',
    name: 'Santhosh (Debug Mode)',
    role: 'admin',
    permissions: ['read', 'write', 'admin']
  };
  
  localStorage.setItem('crm_auth_token', debugToken);
  localStorage.setItem('crm_user_data', JSON.stringify(debugUser));
  
  console.log('✅ Debug authentication set!');
  console.log('Now refresh your CRM and try again.');
}

// 3. Clear all authentication
function clearAuth() {
  localStorage.removeItem('crm_auth_token');
  localStorage.removeItem('crm_user_data'); 
  localStorage.removeItem('token');
  localStorage.removeItem('auth_user');
  
  console.log('🗑️ All authentication cleared!');
}

// 4. Test API connectivity
async function testAPIConnectivity() {
  const token = localStorage.getItem('crm_auth_token');
  
  console.log('🧪 Testing API connectivity...');
  
  const endpoints = [
    '/health',
    '/leads', 
    '/communications',
    '/users'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`https://crm-backend-production-5e32.up.railway.app/api${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      
      if (endpoint === '/health') {
        const text = await response.text();
        console.log(`Health Response: ${text}`);
      }
      
    } catch (error) {
      console.error(`${endpoint}: ERROR -`, error.message);
    }
  }
}

// 5. Debug leads data
async function debugLeadsAPI() {
  const token = localStorage.getItem('crm_auth_token');
  
  try {
    console.log('🔍 Debugging Leads API...');
    
    const response = await fetch('https://crm-backend-production-5e32.up.railway.app/api/leads', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    
    console.log('Leads API Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Leads Data:', data);
      console.log('Leads Count:', Array.isArray(data) ? data.length : 'Not an array');
    } else {
      const errorText = await response.text();
      console.error('Leads API Error:', errorText);
    }
    
  } catch (error) {
    console.error('Leads API Network Error:', error);
  }
}

// Export functions for console use
window.checkAuthState = checkAuthState;
window.setDebugAuth = setDebugAuth; 
window.clearAuth = clearAuth;
window.testAPIConnectivity = testAPIConnectivity;
window.debugLeadsAPI = debugLeadsAPI;

console.log('🛠️ CRM Debug Tools Loaded!');
console.log('Available functions:');
console.log('- checkAuthState()');
console.log('- setDebugAuth()');
console.log('- clearAuth()');
console.log('- testAPIConnectivity()');
console.log('- debugLeadsAPI()');