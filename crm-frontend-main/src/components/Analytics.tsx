import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, RefreshCw } from 'lucide-react';
import { useLeads } from '../hooks/useQueries';

interface LeadSourceData {
  name: string;
  count: number;
  revenue: number;
  conversionRate: number;
}

interface AnalyticsData {
  totalLeads: number;
  totalRevenue: number;
  avgConversionRate: number;
  leadSources: LeadSourceData[];
  monthlyData: any[];
  recentActivity: any[];
}

const Analytics: React.FC = () => {
  const { data: leadsData, isLoading: loadingLeads, refetch } = useLeads(1, 10000); // Fetch all leads for analytics
  const [dateRange, setDateRange] = useState('30');
  const [companyFilter, setCompanyFilter] = useState('all');

  // ==========================================
  // OPTIMIZED ANALYTICS WITH DSA TECHNIQUES
  // ==========================================
  
  // Pre-process leads array - Handle both response formats
  const leadsArray = useMemo(() => {
    const leads = (leadsData as any)?.leads || (leadsData as any)?.data || [];
    console.log('📊 Analytics: Processing', leads.length, 'leads from API');
    return Array.isArray(leads) ? leads : [];
  }, [leadsData]);

  // Filter leads by date and company - Memoized for performance
  const filteredLeads = useMemo(() => {
    console.log('📊 Analytics: Filtering', leadsArray.length, 'leads');
    const startTime = performance.now();
    
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(dateRange));
    const thresholdTimestamp = dateThreshold.getTime();
    
    const filtered = leadsArray.filter((lead: any) => {
      const leadTimestamp = new Date(lead.createdAt).getTime();
      const matchesDate = leadTimestamp >= thresholdTimestamp;
      const matchesCompany = companyFilter === 'all' || lead.company?.toLowerCase() === companyFilter.toLowerCase();
      return matchesDate && matchesCompany;
    });
    
    const endTime = performance.now();
    console.log(`✅ Filtered to ${filtered.length} leads in ${(endTime - startTime).toFixed(2)}ms`);
    
    return filtered;
  }, [leadsArray, dateRange, companyFilter]);

  // Process lead source data with efficient Map-based algorithm - O(n)
  const leadSourcesData = useMemo((): LeadSourceData[] => {
    console.log('📈 Analytics: Processing lead sources from', filteredLeads.length, 'leads');
    const startTime = performance.now();
    
    // Use Map for O(1) lookups
    const sourceMap = new Map<string, { count: number; revenue: number; total: number; converted: number }>();
    
    // Single pass O(n) algorithm
    filteredLeads.forEach((lead: any) => {
      const source = lead.source || 'Unknown';
      const current = sourceMap.get(source) || { count: 0, revenue: 0, total: 0, converted: 0 };
      
      current.count += 1;
      current.total += 1;
      
      // Calculate revenue based on status (case-insensitive)
      const statusLower = (lead.status || '').toLowerCase();
      if (statusLower === 'enrolled' || statusLower === 'won') {
        current.converted += 1;
        current.revenue += lead.salePrice || lead.sale_price || 0;
      } else if (statusLower === 'warm' || statusLower === 'hot') {
        const estimatedVal = lead.estimatedValue || lead.estimated_value || 0;
        current.revenue += estimatedVal * 0.3; // 30% probability
      }
      
      sourceMap.set(source, current);
    });

    // Convert to array and sort by count - O(m log m) where m is number of sources
    const result = Array.from(sourceMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      revenue: data.revenue,
      conversionRate: data.total > 0 ? (data.converted / data.total) * 100 : 0
    })).sort((a, b) => b.count - a.count);
    
    const endTime = performance.now();
    console.log(`✅ Processed ${result.length} sources in ${(endTime - startTime).toFixed(2)}ms`);
    
    return result;
  }, [filteredLeads]);

  // Calculate analytics data with efficient single-pass algorithm
  const analyticsData = useMemo((): AnalyticsData => {
    console.log('💹 Analytics: Calculating metrics from', filteredLeads.length, 'filtered leads');
    const startTime = performance.now();
    
    let totalRevenue = 0;
    let convertedCount = 0;
    const statusCounts: Record<string, number> = {};
    
    // Single pass O(n) algorithm
    filteredLeads.forEach((lead: any) => {
      let revenue = 0;
      const status = lead.status || 'Unknown';
      
      // Count statuses
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Calculate revenue based on status (case-insensitive matching)
      const statusLower = status.toLowerCase();
      if (statusLower === 'enrolled' || statusLower === 'won') {
        convertedCount++;
        // Use sale_price for enrolled leads
        revenue = lead.salePrice || lead.sale_price || 0;
      } else if (statusLower === 'warm' || statusLower === 'hot') {
        // For warm/hot leads, use estimated value with probability factor
        const estimatedVal = lead.estimatedValue || lead.estimated_value || 0;
        revenue = estimatedVal * 0.3; // 30% probability
      }
      
      totalRevenue += revenue;
    });

    const avgConversionRate = filteredLeads.length > 0 
      ? (convertedCount / filteredLeads.length) * 100 
      : 0;
    
    const endTime = performance.now();
    console.log(`✅ Analytics calculated in ${(endTime - startTime).toFixed(2)}ms`);
    console.log('📊 Status Distribution:', statusCounts);
    console.log('💰 Total Revenue:', totalRevenue, 'Converted:', convertedCount, 'Rate:', avgConversionRate.toFixed(1) + '%');
    
    return {
      totalLeads: filteredLeads.length,
      totalRevenue,
      avgConversionRate,
      leadSources: leadSourcesData,
      monthlyData: [],
      recentActivity: []
    };
  }, [filteredLeads, leadSourcesData]);

  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loadingLeads) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg text-gray-600">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
            CRM Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time insights from your CRM data ({leadsArray.length} total leads)
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Companies</option>
            <option value="ibmp">IBMP</option>
            <option value="dmhca">DMHCA</option>
          </select>

          <button
            onClick={() => refetch()}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900">{formatLargeNumber(analyticsData.totalLeads)}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                {companyFilter === 'ibmp' ? `$${formatLargeNumber(analyticsData.totalRevenue)}` :
                 companyFilter === 'dmhca' ? `₹${formatLargeNumber(analyticsData.totalRevenue)}` :
                 formatLargeNumber(analyticsData.totalRevenue)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-600">{analyticsData.avgConversionRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lead Sources</p>
              <p className="text-3xl font-bold text-orange-600">{analyticsData.leadSources.length}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Lead Sources Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Lead Sources Performance</h2>
          <p className="text-gray-600 text-sm">Real data from your CRM system</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Leads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.leadSources.map((source, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{source.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {source.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {companyFilter === 'ibmp' ? `$${formatLargeNumber(source.revenue)}` :
                     companyFilter === 'dmhca' ? `₹${formatLargeNumber(source.revenue)}` :
                     formatLargeNumber(source.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(source.conversionRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{source.conversionRate.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {analyticsData.leadSources.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No data available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;