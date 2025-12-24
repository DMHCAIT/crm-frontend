// Cohort Analysis Dashboard Component
import React, { useMemo } from 'react';
import { useLeads } from '../hooks/useQueries';
import { Users, TrendingUp, Calendar, BarChart3, RefreshCw } from 'lucide-react';

interface CohortData {
  month: string;
  totalLeads: number;
  month1Conversions: number;
  month2Conversions: number;
  month3Conversions: number;
  month1Rate: string;
  month2Rate: string;
  month3Rate: string;
}

const CohortAnalysis: React.FC = () => {
  const { data: leadsData, isLoading, refetch } = useLeads(1, 50000);

  // Calculate cohort data
  const cohorts = useMemo(() => {
    const leads = (leadsData as any)?.leads || [];
    const cohortMap = new Map<string, any>();

    leads.forEach((lead: any) => {
      const cohortMonth = new Date(lead.createdAt || lead.created_at).toISOString().slice(0, 7); // YYYY-MM

      if (!cohortMap.has(cohortMonth)) {
        cohortMap.set(cohortMonth, {
          month: cohortMonth,
          totalLeads: 0,
          month1Conversions: 0,
          month2Conversions: 0,
          month3Conversions: 0,
        });
      }

      const cohort = cohortMap.get(cohortMonth)!;
      cohort.totalLeads++;

      // Check if enrolled
      if (lead.status === 'Enrolled') {
        const enrolledDate = new Date(lead.updatedAt || lead.updated_at);
        const createdDate = new Date(lead.createdAt || lead.created_at);
        const monthsDiff = Math.floor(
          (enrolledDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        if (monthsDiff <= 1) cohort.month1Conversions++;
        if (monthsDiff <= 2) cohort.month2Conversions++;
        if (monthsDiff <= 3) cohort.month3Conversions++;
      }
    });

    return Array.from(cohortMap.values())
      .map((c) => ({
        ...c,
        month1Rate: ((c.month1Conversions / c.totalLeads) * 100).toFixed(1),
        month2Rate: ((c.month2Conversions / c.totalLeads) * 100).toFixed(1),
        month3Rate: ((c.month3Conversions / c.totalLeads) * 100).toFixed(1),
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12); // Last 12 months
  }, [leadsData]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (cohorts.length === 0) return { avgMonth1: 0, avgMonth2: 0, avgMonth3: 0, totalLeads: 0 };

    const totalLeads = cohorts.reduce((sum, c) => sum + c.totalLeads, 0);
    const avgMonth1 = cohorts.reduce((sum, c) => sum + parseFloat(c.month1Rate), 0) / cohorts.length;
    const avgMonth2 = cohorts.reduce((sum, c) => sum + parseFloat(c.month2Rate), 0) / cohorts.length;
    const avgMonth3 = cohorts.reduce((sum, c) => sum + parseFloat(c.month3Rate), 0) / cohorts.length;

    return {
      avgMonth1: avgMonth1.toFixed(1),
      avgMonth2: avgMonth2.toFixed(1),
      avgMonth3: avgMonth3.toFixed(1),
      totalLeads,
    };
  }, [cohorts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-8 h-8 text-blue-600" />
              Cohort Analysis
            </h1>
            <p className="text-gray-600 mt-1">
              Track how groups of leads convert over time
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Month 1</p>
              <p className="text-2xl font-bold text-green-600">{stats.avgMonth1}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Month 2</p>
              <p className="text-2xl font-bold text-blue-600">{stats.avgMonth2}%</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Month 3</p>
              <p className="text-2xl font-bold text-purple-600">{stats.avgMonth3}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Cohort Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Cohort Conversion Rates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Shows what percentage of leads from each cohort converted within 1, 2, and 3 months
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cohort Month
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Leads
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50">
                  Month 1
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                  Month 2
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                  Month 3
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cohorts.map((cohort) => (
                <tr key={cohort.month} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">
                        {new Date(cohort.month).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-gray-900">
                      {cohort.totalLeads}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center bg-green-50">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-green-700">
                        {cohort.month1Rate}%
                      </span>
                      <span className="text-xs text-green-600">
                        {cohort.month1Conversions} converted
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center bg-blue-50">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-blue-700">
                        {cohort.month2Rate}%
                      </span>
                      <span className="text-xs text-blue-600">
                        {cohort.month2Conversions} converted
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center bg-purple-50">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-purple-700">
                        {cohort.month3Rate}%
                      </span>
                      <span className="text-xs text-purple-600">
                        {cohort.month3Conversions} converted
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Key Insights</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Most conversions happen within the first month</li>
            <li>• Conversion rates typically stabilize after 3 months</li>
            <li>• Early engagement strongly correlates with conversion success</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">🎯 Recommendations</h3>
          <ul className="space-y-1 text-sm text-green-800">
            <li>• Focus on first 30 days for maximum conversion potential</li>
            <li>• Track cohorts with below-average Month 1 rates</li>
            <li>• Implement re-engagement campaigns after Month 2</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CohortAnalysis;
