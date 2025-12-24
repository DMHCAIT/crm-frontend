// Advanced Analytics Dashboard with Revenue Forecasting & Pipeline Velocity
import React, { useState } from 'react';
import { 
  useRevenueForecast, 
  usePipelineVelocity,
  useTopLeads,
  useAtRiskLeads,
  useCalculateAllScores
} from '../hooks/useAnalytics';
import { LeadScoreBadge } from './LeadScoreBadge';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  RefreshCw,
  Zap,
  Users,
  Activity
} from 'lucide-react';

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [velocityDays, setVelocityDays] = useState(90);

  const { data: forecast, isLoading: forecastLoading, refetch: refetchForecast } = useRevenueForecast();
  const { data: velocity, isLoading: velocityLoading, refetch: refetchVelocity } = usePipelineVelocity(velocityDays);
  const { data: topLeads, isLoading: topLeadsLoading } = useTopLeads(10);
  const { data: atRiskLeads, isLoading: atRiskLoading } = useAtRiskLeads(10);
  const calculateAllScores = useCalculateAllScores();

  const handleCalculateScores = async () => {
    try {
      await calculateAllScores.mutateAsync(1000);
      refetchForecast();
      refetchVelocity();
    } catch (error) {
      console.error('Error calculating scores:', error);
    }
  };

  const formatCurrency = (value: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatHours = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return days > 0 ? `${days}d ${remainingHours}h` : `${remainingHours}h`;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-600" />
              Advanced Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Revenue forecasting, pipeline velocity, and predictive insights
            </p>
          </div>
          <button
            onClick={handleCalculateScores}
            disabled={calculateAllScores.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            {calculateAllScores.isPending ? 'Calculating...' : 'Calculate All Scores'}
          </button>
        </div>
      </div>

      {/* Revenue Forecast Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Revenue Forecast
        </h2>

        {forecastLoading ? (
          <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : forecast ? (
          <div>
            {/* Forecast Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <p className="text-sm opacity-90">Current Revenue</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(forecast.currentRevenue)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <p className="text-sm opacity-90">Expected Forecast</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(forecast.forecast.expected)}
                </p>
                <p className="text-xs mt-1 opacity-75">95% confidence</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <p className="text-sm opacity-90">Optimistic</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(forecast.forecast.optimistic)}
                </p>
                <p className="text-xs mt-1 opacity-75">Best case scenario</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                <p className="text-sm opacity-90">Total Potential</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(forecast.totalPotential)}
                </p>
                <p className="text-xs mt-1 opacity-75">Current + Pipeline</p>
              </div>
            </div>

            {/* Pipeline by Status */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline by Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {forecast.pipelineByStatus.map((item: any) => (
                  <div key={item.status} className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{item.status}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {formatCurrency(item.value)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.count} leads</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends (Last 6 Months)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Month</th>
                      <th className="px-4 py-2 text-right">Leads</th>
                      <th className="px-4 py-2 text-right">Revenue</th>
                      <th className="px-4 py-2 text-right">Conversions</th>
                      <th className="px-4 py-2 text-right">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {forecast.monthlyTrends.map((trend: any) => (
                      <tr key={trend.month} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{trend.month}</td>
                        <td className="px-4 py-3 text-right">{trend.leads}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(trend.revenue)}</td>
                        <td className="px-4 py-3 text-right">{trend.conversions}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {trend.conversionRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                <div>
                  <p className="font-medium">Best Source</p>
                  <p>{forecast.insights.bestSource} ({forecast.insights.bestSourceRate})</p>
                </div>
                <div>
                  <p className="font-medium">Total Leads</p>
                  <p>{forecast.insights.totalLeads.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium">Active Leads</p>
                  <p>{forecast.insights.activeLeads.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Pipeline Velocity Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Pipeline Velocity
          </h2>
          <select
            value={velocityDays}
            onChange={(e) => setVelocityDays(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
          </select>
        </div>

        {velocityLoading ? (
          <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : velocity ? (
          <div>
            {/* Velocity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Time to Contact</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatHours(velocity.velocity.avgTimeToContact)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Average</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Time to Qualify</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatHours(velocity.velocity.avgTimeToQualify)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Average</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Time to Convert</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatHours(velocity.velocity.avgTimeToConvert)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Average</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600">Total Pipeline Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatHours(velocity.velocity.totalPipelineTime)}
                </p>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    velocity.pipelineHealth.status === 'Healthy' 
                      ? 'bg-green-100 text-green-800'
                      : velocity.pipelineHealth.status === 'Moderate'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {velocity.pipelineHealth.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Conversion Metrics */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Conversions in Period</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {velocity.conversionMetrics.conversionsInPeriod}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Days Analyzed</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {velocity.conversionMetrics.daysAnalyzed}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Conversion Velocity</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {velocity.conversionMetrics.conversionVelocity}
                  </p>
                  <p className="text-xs text-gray-500">per day</p>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className={`border rounded-lg p-4 ${
              velocity.pipelineHealth.status === 'Healthy'
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <p className={`font-semibold ${
                velocity.pipelineHealth.status === 'Healthy' ? 'text-green-900' : 'text-yellow-900'
              }`}>
                💡 {velocity.pipelineHealth.recommendation}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Top Leads & At-Risk Leads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Scoring Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Top Scoring Leads
          </h2>
          {topLeadsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {topLeads?.slice(0, 5).map((lead: any) => (
                <div key={lead.lead_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{lead.lead_id}</p>
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(lead.last_calculated).toLocaleDateString()}
                    </p>
                  </div>
                  <LeadScoreBadge score={lead.score} scoreLevel={lead.score_level} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* At-Risk Leads */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            At-Risk Leads
          </h2>
          {atRiskLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {atRiskLeads?.slice(0, 5).map((lead: any) => (
                <div key={lead.lead_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{lead.lead_id}</p>
                    <p className="text-xs text-gray-500">
                      Churn level: {lead.churn_level}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-red-600">{lead.churn_risk}%</span>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
