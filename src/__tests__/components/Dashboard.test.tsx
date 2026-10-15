import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../components/Dashboard';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'viewer', name: 'Test Counselor', role: 'counselor' } })
}));
vi.mock('../../hooks/useQueries', () => ({
  useDashboardStats: () => ({
    data: { data: { leads: { data: { total: 1250, enrolled: 50, actualRevenue: 10000, todayLeads: 4 } } } },
    isLoading: false
  }),
  useLeads: () => ({ data: { leads: [], total: 1250 }, isLoading: false })
}));

describe('Dashboard Component', () => {
  it('uses the full accessible total, not the length of the loaded page', () => {
    render(<Dashboard />);
    expect(screen.getByText('1250')).toBeInTheDocument();
    expect(screen.getByText('My Leads')).toBeInTheDocument();
  });
});