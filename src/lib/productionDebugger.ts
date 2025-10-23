/**
 * PRODUCTION DEBUG HELPER
 * Use this to test backend connectivity in production
 */

// Add this to your browser console or create a debug component

const API_BASE = import.meta.env.VITE_API_BASE_URL || (() => {
  throw new Error('VITE_API_BASE_URL environment variable is required');
})();

class ProductionDebugger {
  static async testHealth() {
    try {
      console.log('🏥 Testing backend health...');
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();
      console.log('✅ Backend Health:', data);
      return data;
    } catch (error) {
      console.error('❌ Backend Health Failed:', error);
      return null;
    }
  }

  static async testDebugLogin() {
    try {
      console.log('🧪 Testing debug login...');
      const response = await fetch(`${API_BASE}/api/auth/debug-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Debug Login Success:', data);
      
      // Store token for testing
      localStorage.setItem('crm_auth_token', data.token);
      localStorage.setItem('crm_user_data', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('❌ Debug Login Failed:', error);
      return null;
    }
  }

  static async testProtectedEndpoint(endpoint = 'users') {
    try {
      console.log(`🔐 Testing protected endpoint: ${endpoint}...`);
      const token = localStorage.getItem('crm_auth_token');
      
      if (!token) {
        console.error('❌ No token found. Run testDebugLogin() first.');
        return null;
      }
      
      const response = await fetch(`${API_BASE}/api/${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ ${endpoint} API Success:`, data);
      return data;
    } catch (error) {
      console.error(`❌ ${endpoint} API Failed:`, error);
      return null;
    }
  }

  static async runFullTest() {
    console.log('🚀 Running full production connectivity test...');
    console.log('');
    
    // Test 1: Health check
    const health = await this.testHealth();
    if (!health) {
      console.log('💥 Backend appears to be down!');
      return false;
    }
    
    // Test 2: Debug login
    const login = await this.testDebugLogin();
    if (!login) {
      console.log('💥 Authentication system not working!');
      return false;
    }
    
    // Test 3: Protected endpoints
    const endpoints = ['users', 'leads', 'students'];
    for (const endpoint of endpoints) {
      await this.testProtectedEndpoint(endpoint);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
    }
    
    console.log('');
    console.log('🎉 Production connectivity test completed!');
    console.log('Check results above for any failures.');
    return true;
  }

  static clearAuth() {
    localStorage.removeItem('crm_auth_token');
    localStorage.removeItem('crm_user_data');
    console.log('🧹 Cleared authentication data');
  }
}

// Make it globally available
(window as any).ProductionDebugger = ProductionDebugger;

// Usage instructions
console.log('🔧 Production Debugger loaded!');
console.log('');
console.log('Available commands:');
console.log('  ProductionDebugger.runFullTest()     - Run complete connectivity test');
console.log('  ProductionDebugger.testHealth()      - Test backend health');
console.log('  ProductionDebugger.testDebugLogin()  - Test authentication');
console.log('  ProductionDebugger.clearAuth()       - Clear stored tokens');
console.log('');
console.log('Run ProductionDebugger.runFullTest() to start testing!');

export default ProductionDebugger;