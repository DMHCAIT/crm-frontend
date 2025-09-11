/**
 * API Connection Test Utility
 * Test connection to the CRM backend APIs
 */

interface ApiTestResult {
  endpoint: string;
  status: 'success' | 'error';
  message: string;
  data?: any;
  responseTime?: number;
}

class ApiTester {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_BASE_URL || 'https://crm-backend-production-5e32.up.railway.app';
  }

  async testEndpoint(endpoint: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<ApiTestResult> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        endpoint,
        status: 'success',
        message: `✅ Connected successfully (${responseTime}ms)`,
        data: result,
        responseTime
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        endpoint,
        status: 'error',
        message: `❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime
      };
    }
  }

  async testAllEndpoints(): Promise<ApiTestResult[]> {
    const endpoints = [
      { path: '/', name: 'Root' },
      { path: '/health', name: 'Health Check' },
      { path: '/api/dashboard/stats', name: 'Dashboard Stats' },
      { path: '/api/analytics/realtime', name: 'Real-time Analytics' },
      { path: '/api/leads', name: 'Leads API' },
      { path: '/api/students', name: 'Students API' },
      { path: '/api/users', name: 'Users API' },
      { path: '/api/communications', name: 'Communications API' },
      { path: '/api/documents', name: 'Documents API' },
      { path: '/api/payments', name: 'Payments API' },
      { path: '/api/integrations', name: 'Integrations API' },
    ];

    const results: ApiTestResult[] = [];

    console.log(`🔍 Testing ${endpoints.length} API endpoints...`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);

    for (const endpoint of endpoints) {
      console.log(`Testing ${endpoint.name}...`);
      const result = await this.testEndpoint(endpoint.path);
      results.push(result);
      console.log(result.message);
    }

    return results;
  }

  generateReport(results: ApiTestResult[]): void {
    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = results.length;
    const avgResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;

    console.log('\n📊 API Test Report');
    console.log('==================');
    console.log(`✅ Success: ${successCount}/${totalCount}`);
    console.log(`⚡ Average Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log(`🎯 Success Rate: ${Math.round((successCount / totalCount) * 100)}%`);

    if (successCount === totalCount) {
      console.log('🎉 All endpoints are working correctly!');
    } else {
      console.log('\n❌ Failed Endpoints:');
      results
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`   ${r.endpoint}: ${r.message}`));
    }
  }
}

// Export for use in components
export const testBackendConnection = async (): Promise<void> => {
  const tester = new ApiTester();
  const results = await tester.testAllEndpoints();
  tester.generateReport(results);
  return;
};

// Quick health check
export const quickHealthCheck = async (): Promise<boolean> => {
  const tester = new ApiTester();
  const result = await tester.testEndpoint('/health');
  return result.status === 'success';
};

export default ApiTester;
