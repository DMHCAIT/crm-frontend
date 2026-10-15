import { describe, expect, it } from 'vitest';
import { buildAnalyticsCharts } from '../lib/analyticsCharts';
import type { LeadDetails } from '../lib/leadDuplicates';

const makeLead = (id: string, updates: Partial<LeadDetails> = {}): LeadDetails => ({
  id, fullName: 'Example', email: `${id}@example.test`, phone: '+995555123456',
  country: 'Georgia', branch: '', qualification: '', source: 'Manual', course: '',
  status: 'Fresh', assignedTo: 'counselor', followUp: '', company: '',
  createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z', notes: [],
  ...updates
});

describe('analytics charts from the complete accessible lead list', () => {
  const now = new Date('2026-01-20T10:00:00Z');
  it('aggregates dates, statuses, sources and actual enrolled revenue within the requested range', () => {
    const result = buildAnalyticsCharts([
      makeLead('1', { status: 'Enrolled', actualRevenue: 50 }),
      makeLead('2', { estimatedValue: 999 }),
      makeLead('old', { createdAt: '2025-01-01T00:00:00Z' }),
      makeLead('future', { createdAt: '2026-02-01T00:00:00Z' }),
      makeLead('invalid', { createdAt: 'invalid' })
    ], '7d', now);
    expect(result.leadsOverTime).toEqual([{ date: '2026-01-15', count: 2 }]);
    expect(result.sourceDistribution).toEqual([{ source: 'Manual', count: 2, percentage: 100 }]);
    expect(result.conversionRate).toEqual([
      { stage: 'Enrolled', count: 1, rate: 50 }, { stage: 'Fresh', count: 1, rate: 50 }
    ]);
    expect(result.assigneePerformance).toEqual([{ user: 'counselor', leads: 2, conversions: 1, revenue: 50 }]);
    expect(result.monthlyRevenue).toEqual([{ month: '2026-01', revenue: 50 }]);
  });
  it('uses all rows, not a single page, and preserves real empty results', () => {
    const result = buildAnalyticsCharts(Array.from({ length: 1250 }, (_, n) => makeLead(`${n}`)), '30d', now);
    expect(result.statusDistribution).toEqual([{ status: 'Fresh', count: 1250 }]);
    expect(buildAnalyticsCharts([], '30d', now).conversionRate).toEqual([]);
  });
  it('rejects unsupported ranges explicitly', () => {
    expect(() => buildAnalyticsCharts([], 'invalid', now)).toThrow('Invalid analytics date range');
  });
});
