import React, { useState, useMemo } from 'react';
import { 
  useRevenueForecast, 
  usePipelineVelocity, 
  useLeadScores 
} from '../hooks/useQueries';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Timer,
  Target,
  Users,
  Award,
  AlertTriangle,
  ArrowRight,
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';

const AdvancedAnalytics: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'forecast' | 'velocity' | 'scores'>('forecast');

  const { data: forecastData, isLoading: forecastLoading } = useRevenueForecast();
  const { data: velocityData, isLoading: velocityLoading } = usePipelineVelocity();
  const { data: scoresData, isLoading: scoresLoading } = useLeadScores();

  const forecastSummary = useMemo(() => {
    if (!forecastData?.success || !forecastData?.data) return null;
    return forecastData.data.summary;
  }, [forecastData]);

  const monthlyForecast = useMemo(() => {
    if (!forecastData?.success || !forecastData?.data) return [];
    return forecastData.data.by_month || [];
  }, [forecastData]);

  const topOpportunities = useMemo(() => {
    if (!forecastData?.success || !forecastData?.data) return [];
    return forecastData.data.top_opportunities || [];
  }, [forecastData]);

  const velocityMetrics = useMemo(() => {
    if (!velocityData?.success || !velocityData?.data) return null;
    return velocityData.data.overall_metrics;
  }, [velocityData]);

  const stageTransitions = useMemo(() => {
    if (!velocityData?.success || !velocityData?.data) return [];
    const transitions = velocityData.data.stage_transitions || {};
    return Object.entries(transitions).map(([key, value]: [string, any]) => ({
      transition: key,
      ...value
    }));
  }, [velocityData]);

  const scoresSummary = useMemo(() => {
    if (!scoresData?.success || !scoresData?.data) return null;
    return scoresData.data.summary;
  }, [scoresData]);

  const scoredLeads = useMemo(() => {
    if (!scoresData?.success || !scoresData?.data) return [];
    return (scoresData.data.data || []).slice(0, 15);
  }, [scoresData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              Advanced Analytics
            </h1>
            <p className="text-blue-100 mt-2">
              AI-powered insights, forecasting, and performance metrics
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setSelectedTab('forecast')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTab === 'forecast'
                ? 'bg-white text-blue-700 shadow-lg'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenue Forecast
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('velocity')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTab === 'velocity'
                ? 'bg-white text-blue-700 shadow-lg'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Pipeline Velocity
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('scores')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedTab === 'scores'
                ? 'bg-white text-blue-700 shadow-lg'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Lead Scores
            </div>
          </button>
        </div>
      </div>

      {/* Revenue Forecast Tab */}
      {selectedTab === 'forecast' && (
        <div className="space-y-6">
          {forecastLoading ? (
            <div className="bg-white rounded-lg shadow-lg p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Expected Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(forecastSummary?.expected || 0)}
                      </p>
                    </div>
                    <Target className="w-10 h-10 text-green-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Optimistic</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(forecastSummary?.optimistic || 0)}
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-blue-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-amber-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pessimistic</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(forecastSummary?.pessimistic || 0)}
                      </p>
                    </div>
                    <TrendingDown className="w-10 h-10 text-amber-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pipeline Leads</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {forecastSummary?.total_pipeline_leads || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {forecastSummary?.confidence || 85}% confidence
                      </p>
                    </div>
                    <Users className="w-10 h-10 text-purple-500 opacity-50" />
                  </div>
                </div>
              </div>

              {/* Monthly Forecast */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Forecast</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {monthlyForecast.map((month: any, idx: number) => (
                    <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-700">{month.month}</p>
                      <p className="text-2xl font-bold text-blue-900 mt-2">
                        {formatCurrency(month.expected_revenue)}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {month.lead_count} leads in pipeline
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Opportunities */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Opportunities</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Lead</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Source</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Estimated</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Expected</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Probability</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {topOpportunities.map((opp: any) => (
                        <tr key={opp.lead_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{opp.lead_name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              opp.status === 'Hot' ? 'bg-red-100 text-red-700' :
                              opp.status === 'Warm' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {opp.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{opp.source}</td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatCurrency(opp.estimated_value)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-green-700">
                            {formatCurrency(opp.expected_value)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-blue-700 font-medium">{opp.probability}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Pipeline Velocity Tab */}
      {selectedTab === 'velocity' && (
        <div className="space-y-6">
          {velocityLoading ? (
            <div className="bg-white rounded-lg shadow-lg p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Overall Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Pipeline Time</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {velocityMetrics?.avg_total_pipeline_days?.toFixed(1) || '—'} days
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {velocityMetrics?.avg_total_pipeline_hours?.toFixed(0) || '—'} hours total
                      </p>
                    </div>
                    <Timer className="w-10 h-10 text-green-500 opacity-50" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Conversions</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {velocityMetrics?.successful_conversions || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Last 90 days</p>
                    </div>
                    <Activity className="w-10 h-10 text-blue-500 opacity-50" />
                  </div>
                </div>

                <div className={`rounded-lg shadow-lg p-6 border-l-4 ${
                  velocityMetrics?.health_status === 'Healthy' 
                    ? 'bg-green-50 border-green-500' 
                    : velocityMetrics?.health_status === 'Normal'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-amber-50 border-amber-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pipeline Health</p>
                      <p className={`text-2xl font-bold mt-1 ${
                        velocityMetrics?.health_status === 'Healthy' 
                          ? 'text-green-700' 
                          : velocityMetrics?.health_status === 'Normal'
                          ? 'text-blue-700'
                          : 'text-amber-700'
                      }`}>
                        {velocityMetrics?.health_status || 'Unknown'}
                      </p>
                    </div>
                    <Zap className={`w-10 h-10 opacity-50 ${
                      velocityMetrics?.health_status === 'Healthy' 
                        ? 'text-green-500' 
                        : velocityMetrics?.health_status === 'Normal'
                        ? 'text-blue-500'
                        : 'text-amber-500'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Stage Transitions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Transition Times</h3>
                <div className="space-y-3">
                  {stageTransitions.map((trans: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <ArrowRight className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">{trans.transition}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">Avg: </span>
                          <span className="font-semibold text-blue-700">{trans.avg_days} days</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Min: </span>
                          <span className="font-semibold text-green-700">{trans.min_hours}h</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Max: </span>
                          <span className="font-semibold text-amber-700">{trans.max_hours}h</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Count: </span>
                          <span className="font-semibold text-gray-700">{trans.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageTransitions.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No transition data available. Transitions are tracked when lead status changes.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Lead Scores Tab */}
      {selectedTab === 'scores' && (
        <div className="space-y-6">
          {scoresLoading ? (
            <div className="bg-white rounded-lg shadow-lg p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border border-green-200">
                  <p className="text-sm text-green-700 font-medium">High Score (75-100)</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {scoresSummary?.high_score || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium">Medium Score (50-74)</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">
                    {scoresSummary?.medium_score || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-lg p-6 border border-amber-200">
                  <p className="text-sm text-amber-700 font-medium">Low Score (&lt;50)</p>
                  <p className="text-3xl font-bold text-amber-900 mt-2">
                    {scoresSummary?.low_score || 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-lg p-6 border border-red-200">
                  <p className="text-sm text-red-700 font-medium">High Churn Risk</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">
                    {scoresSummary?.high_churn_risk || 0}
                  </p>
                </div>
              </div>

              {/* Top Scored Leads */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Scored Leads</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Lead</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Score</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700">Churn Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {scoredLeads.map((lead: any) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{lead.name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lead.status === 'Hot' ? 'bg-red-100 text-red-700' :
                              lead.status === 'Warm' ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    lead.score >= 75 ? 'bg-green-500' :
                                    lead.score >= 50 ? 'bg-blue-500' :
                                    'bg-amber-500'
                                  }`}
                                  style={{ width: `${lead.score}%` }}
                                />
                              </div>
                              <span className="font-semibold text-gray-900">{lead.score}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lead.churn_risk === 'High' ? 'bg-red-100 text-red-700' :
                              lead.churn_risk === 'Medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {lead.churn_risk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
