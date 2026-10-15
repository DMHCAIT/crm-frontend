export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface RevenueForecast {
  currentRevenue: number;
  forecast: { expected: number; optimistic: number };
  totalPotential: number;
  pipelineByStatus: { status: string; value: number; count: number }[];
  monthlyTrends: { month: string; leads: number; revenue: number; conversions: number; conversionRate: number }[];
  insights: { bestSource: string; bestSourceRate: string | number; totalLeads: number; activeLeads: number };
}

export interface PipelineVelocity {
  velocity: { avgTimeToContact: number; avgTimeToQualify: number; avgTimeToConvert: number; totalPipelineTime: number };
  pipelineHealth: { status: string; recommendation: string };
  conversionMetrics: { conversionsInPeriod: number; daysAnalyzed: number; conversionVelocity: number };
}

export interface AnalyticsCharts {
  leadsOverTime: { date: string; count: number }[];
  conversionRate: { stage: string; count: number; rate: number }[];
  sourceDistribution: { source: string; count: number; percentage: number }[];
  assigneePerformance: { user: string; leads: number; conversions: number; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  statusDistribution: { status: string; count: number }[];
}

export interface ScheduledExport {
  id: string;
  name: string;
  exportType: 'leads' | 'students' | 'analytics' | 'full';
  format: 'csv' | 'pdf' | 'xlsx';
  frequency: 'daily' | 'weekly' | 'monthly';
  schedule: string;
  email: string;
  lastRun?: string;
  nextRun: string;
  status: 'active' | 'paused' | 'error';
  filters?: Record<string, unknown>;
}

export interface DatabaseDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  original_filename: string;
  created_at: string;
  uploaded_by_id: string;
  uploaded_by?: { name?: string; fullName?: string; username?: string } | null;
}

export interface CrmDocument extends DatabaseDocument {
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DatabaseScheduledExport {
  id: string;
  name: string;
  export_type: ScheduledExport['exportType'];
  format: ScheduledExport['format'];
  frequency: ScheduledExport['frequency'];
  schedule_time: string;
  email: string;
  last_run?: string | null;
  next_run: string;
  status: ScheduledExport['status'];
  filters?: Record<string, unknown>;
}
