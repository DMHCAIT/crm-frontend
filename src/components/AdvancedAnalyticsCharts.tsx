import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getApiClient } from '../lib/backend';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { TrendingUp, Users, DollarSign, Target, Calendar, Download } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  leadsOverTime: { date: string; count: number }[];
  conversionRate: { stage: string; count: number; rate: number }[];
  sourceDistribution: { source: string; count: number; percentage: number }[];
  assigneePerformance: { user: string; leads: number; conversions: number; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  statusDistribution: { status: string; count: number }[];
}

const AdvancedAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();
      const response = await apiClient.getAdvancedAnalytics({ range: dateRange });
      setData(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Export analytics as PDF or Excel
    console.log('Exporting analytics report...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  // Chart configurations
  const leadsOverTimeData = {
    labels: data.leadsOverTime.map(d => d.date),
    datasets: [
      {
        label: 'Leads',
        data: data.leadsOverTime.map(d => d.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const conversionFunnelData = {
    labels: data.conversionRate.map(d => d.stage),
    datasets: [
      {
        label: 'Conversions',
        data: data.conversionRate.map(d => d.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderWidth: 1
      }
    ]
  };

  const sourceDistributionData = {
    labels: data.sourceDistribution.map(d => d.source),
    datasets: [
      {
        data: data.sourceDistribution.map(d => d.count),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  const assigneePerformanceData = {
    labels: data.assigneePerformance.map(d => d.user),
    datasets: [
      {
        label: 'Leads',
        data: data.assigneePerformance.map(d => d.leads),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Conversions',
        data: data.assigneePerformance.map(d => d.conversions),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      }
    ]
  };

  const revenueData = {
    labels: data.monthlyRevenue.map(d => d.month),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: data.monthlyRevenue.map(d => d.revenue),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2
      }
    ]
  };

  const statusDistributionData = {
    labels: data.statusDistribution.map(d => d.status),
    datasets: [
      {
        data: data.statusDistribution.map(d => d.count),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6'
        ],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Advanced Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={exportReport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Leads</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {data.leadsOverTime.reduce((sum, d) => sum + d.count, 0)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Conversion Rate</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {data.conversionRate.length > 0 
                  ? `${data.conversionRate[data.conversionRate.length - 1].rate.toFixed(1)}%`
                  : '0%'
                }
              </p>
            </div>
            <Target className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {data.assigneePerformance.length}
              </p>
            </div>
            <Users className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                ₹{data.monthlyRevenue.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Over Time */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Leads Trend</h3>
          <div className="h-80">
            <Line data={leadsOverTimeData} options={chartOptions} />
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversion Funnel</h3>
          <div className="h-80">
            <Bar data={conversionFunnelData} options={barOptions} />
          </div>
        </div>

        {/* Source Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lead Sources</h3>
          <div className="h-80">
            <Doughnut data={sourceDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Lead Status</h3>
          <div className="h-80">
            <Pie data={statusDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Performance</h3>
          <div className="h-80">
            <Bar data={assigneePerformanceData} options={barOptions} />
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-6 rounded-lg shadow-sm border lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <div className="h-80">
            <Bar data={revenueData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Team Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.assigneePerformance.map((perf, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                    {perf.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {perf.leads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {perf.conversions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {perf.leads > 0 ? ((perf.conversions / perf.leads) * 100).toFixed(1) : '0'}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ₹{perf.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
