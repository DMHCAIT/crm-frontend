import React, { useState } from 'react';
import { getApiClient } from '../lib/backend';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Eye,
  Users,
  Activity
} from 'lucide-react';

const DatabaseConnectionTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setTesting(true);
    setError(null);
    setResults(null);

    const apiClient = getApiClient();
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Test 1: Health Check
      try {
        const health = await apiClient.healthCheck();
        testResults.tests.push({
          name: 'Backend Health Check',
          status: 'success',
          data: health,
          endpoint: '/health'
        });
      } catch (err) {
        testResults.tests.push({
          name: 'Backend Health Check',
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          endpoint: '/health'
        });
      }

      // Test 2: Authentication
      const token = localStorage.getItem('token');
      testResults.tests.push({
        name: 'Authentication Token',
        status: token ? 'success' : 'failed',
        data: token ? { hasToken: true, tokenLength: token.length } : null,
        error: token ? null : 'No authentication token found'
      });

      // Test 3: Leads API
      try {
        const leads = await apiClient.getLeads();
        testResults.tests.push({
          name: 'Leads API',
          status: 'success',
          data: { 
            count: Array.isArray(leads) ? leads.length : 0,
            type: Array.isArray(leads) ? 'array' : typeof leads,
            sample: Array.isArray(leads) && leads.length > 0 ? leads[0] : null
          },
          endpoint: '/leads'
        });
      } catch (err) {
        testResults.tests.push({
          name: 'Leads API',
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          endpoint: '/leads'
        });
      }

      // Test 4: Dashboard Stats
      try {
        const stats = await apiClient.getDashboardStats();
        testResults.tests.push({
          name: 'Dashboard Stats',
          status: 'success',
          data: stats,
          endpoint: '/dashboard/stats'
        });
      } catch (err) {
        testResults.tests.push({
          name: 'Dashboard Stats',
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          endpoint: '/dashboard/stats'
        });
      }

      // Test 5: Students API
      try {
        const students = await apiClient.getStudents();
        testResults.tests.push({
          name: 'Students API',
          status: 'success',
          data: { 
            count: Array.isArray(students) ? students.length : 0,
            type: Array.isArray(students) ? 'array' : typeof students
          },
          endpoint: '/students'
        });
      } catch (err) {
        testResults.tests.push({
          name: 'Students API',
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
          endpoint: '/students'
        });
      }

      setResults(testResults);
    } catch (generalError) {
      setError(generalError instanceof Error ? generalError.message : 'Unknown error occurred');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold">Database Connection Tester</h3>
            <p className="text-sm text-gray-600">Test API connectivity and data retrieval</p>
          </div>
        </div>
        <button
          onClick={runTests}
          disabled={testing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Testing...' : 'Run Tests'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Test Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="font-medium text-gray-800 mb-2">Test Results</h4>
            <p className="text-sm text-gray-600">Completed at: {new Date(results.timestamp).toLocaleString()}</p>
          </div>

          <div className="space-y-3">
            {results.tests.map((test: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {test.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <h5 className="font-medium">{test.name}</h5>
                  </div>
                  {test.endpoint && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {test.endpoint}
                    </span>
                  )}
                </div>

                {test.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-2">
                    <p className="text-sm text-red-700">{test.error}</p>
                  </div>
                )}

                {test.data && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-3">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <h4 className="font-medium mb-1">Next Steps:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check browser console for detailed API logs</li>
                  <li>Verify authentication token is valid</li>
                  <li>Ensure backend Railway service is running</li>
                  <li>Test network connectivity to backend</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {!results && !testing && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Click "Run Tests" to check database connectivity</p>
        </div>
      )}
    </div>
  );
};

export default DatabaseConnectionTester;