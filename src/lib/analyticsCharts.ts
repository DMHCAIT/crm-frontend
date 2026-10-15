import type { AnalyticsCharts } from '../types/api';
import type { LeadDetails } from './leadDuplicates';

export function buildAnalyticsCharts(leads: LeadDetails[], range: string, now = new Date()): AnalyticsCharts {
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range];
  if (!days || !Number.isFinite(now.getTime())) throw new Error('Invalid analytics date range');
  const start = now.getTime() - days * 86400000;
  const dates = new Map<string, number>();
  const statuses = new Map<string, number>();
  const sources = new Map<string, number>();
  const months = new Map<string, number>();
  const assignees = new Map<string, AnalyticsCharts['assigneePerformance'][number]>();
  let total = 0;
  for (const lead of leads) {
    const created = Date.parse(lead.createdAt);
    if (!Number.isFinite(created) || created < start || created > now.getTime()) continue;
    total++;
    const date = new Date(created).toISOString().slice(0, 10);
    const month = date.slice(0, 7);
    const status = lead.status || 'Unknown';
    const source = lead.source || 'Unknown';
    const enrolled = status === 'Enrolled';
    const rawRevenue = lead.actualRevenue ?? lead.actual_revenue ?? lead.salePrice ?? lead.sale_price ?? lead.fees ?? 0;
    const revenue = enrolled && Number.isFinite(Number(rawRevenue)) ? Number(rawRevenue) : 0;
    dates.set(date, (dates.get(date) || 0) + 1);
    statuses.set(status, (statuses.get(status) || 0) + 1);
    sources.set(source, (sources.get(source) || 0) + 1);
    months.set(month, (months.get(month) || 0) + revenue);
    const user = lead.assignedTo || 'Unassigned';
    const assignee = assignees.get(user) || { user, leads: 0, conversions: 0, revenue: 0 };
    assignee.leads++;
    assignee.conversions += Number(enrolled);
    assignee.revenue += revenue;
    assignees.set(user, assignee);
  }
  return {
    leadsOverTime: [...dates].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count })),
    statusDistribution: [...statuses].map(([status, count]) => ({ status, count })),
    conversionRate: [...statuses].map(([stage, count]) => ({ stage, count, rate: count / total * 100 })),
    sourceDistribution: [...sources].map(([source, count]) => ({ source, count, percentage: count / total * 100 })),
    monthlyRevenue: [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, revenue]) => ({ month, revenue })),
    assigneePerformance: [...assignees.values()]
  };
}
