-- =====================================================
-- POWER BI ANALYTICS VIEWS FOR CRM
-- Run this script in Supabase SQL Editor
-- These views optimize data for Power BI reporting
-- =====================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS vw_lead_analytics CASCADE;
DROP VIEW IF EXISTS vw_daily_lead_metrics CASCADE;
DROP VIEW IF EXISTS vw_lead_source_performance CASCADE;
DROP VIEW IF EXISTS vw_team_performance CASCADE;
DROP VIEW IF EXISTS vw_monthly_revenue CASCADE;
DROP VIEW IF EXISTS vw_lead_funnel CASCADE;

-- =====================================================
-- View 1: Lead Analytics Summary (Main View)
-- Complete lead information with user details
-- =====================================================
CREATE OR REPLACE VIEW vw_lead_analytics AS
SELECT 
    l.id,
    l."fullName" as name,
    l.email,
    l.phone,
    l.status,
    l.source,
    l.estimated_value,
    l.sale_price,
    l.created_at,
    l.updated_at,
    l.assigned_to,
    u.name as assigned_user_name,
    u.email as assigned_user_email,
    u.role as assigned_user_role,
    -- Date dimensions for time-based analysis
    EXTRACT(YEAR FROM l.created_at) as year,
    EXTRACT(MONTH FROM l.created_at) as month,
    EXTRACT(QUARTER FROM l.created_at) as quarter,
    EXTRACT(DAY FROM l.created_at) as day,
    TO_CHAR(l.created_at, 'YYYY-MM') as year_month,
    TO_CHAR(l.created_at, 'YYYY-Q') as year_quarter,
    DATE(l.created_at) as created_date,
    TO_CHAR(l.created_at, 'Day') as day_of_week,
    EXTRACT(DOW FROM l.created_at) as day_of_week_number,
    -- Business logic flags
    CASE 
        WHEN l.status = 'converted' THEN 1 
        ELSE 0 
    END as is_converted,
    CASE 
        WHEN l.status = 'lost' THEN 1 
        ELSE 0 
    END as is_lost,
    CASE 
        WHEN l.sale_price > 0 THEN 1 
        ELSE 0 
    END as has_sale,
    CASE 
        WHEN l.estimated_value > 0 THEN 1 
        ELSE 0 
    END as has_estimate,
    -- Time calculations
    DATE_PART('day', NOW() - l.created_at) as days_since_created,
    DATE_PART('day', l.updated_at - l.created_at) as days_to_last_update,
    -- Revenue metrics
    COALESCE(l.sale_price, 0) as revenue,
    COALESCE(l.estimated_value, 0) as pipeline_value
FROM leads l
LEFT JOIN users u ON l.assigned_to::uuid = u.id;

-- =====================================================
-- View 2: Daily Lead Metrics
-- Daily aggregations for trend analysis
-- =====================================================
CREATE OR REPLACE VIEW vw_daily_lead_metrics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
    COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
    COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_leads,
    COUNT(CASE WHEN status = 'proposal' THEN 1 END) as proposal_leads,
    COUNT(CASE WHEN status = 'negotiation' THEN 1 END) as negotiation_leads,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_leads,
    -- Revenue metrics
    SUM(estimated_value) as total_estimated_value,
    SUM(sale_price) as total_revenue,
    ROUND(AVG(estimated_value), 2) as avg_estimated_value,
    ROUND(AVG(sale_price), 2) as avg_sale_price,
    -- Conversion rate
    ROUND(COUNT(CASE WHEN status = 'converted' THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate
FROM leads
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- =====================================================
-- View 3: Lead Source Performance
-- Performance metrics by lead source
-- =====================================================
CREATE OR REPLACE VIEW vw_lead_source_performance AS
SELECT 
    COALESCE(source, 'Unknown') as source,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
    COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_count,
    COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_count,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_count,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_count,
    -- Conversion metrics
    ROUND(COUNT(CASE WHEN status = 'converted' THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate,
    ROUND(COUNT(CASE WHEN status = 'lost' THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0) * 100, 2) as loss_rate,
    -- Revenue metrics
    SUM(estimated_value) as total_estimated_value,
    SUM(sale_price) as total_revenue,
    ROUND(AVG(estimated_value), 2) as avg_estimated_value,
    ROUND(AVG(sale_price), 2) as avg_revenue_per_lead,
    -- ROI indicators
    ROUND(SUM(sale_price) / NULLIF(COUNT(*), 0), 2) as revenue_per_lead
FROM leads
GROUP BY source
ORDER BY total_leads DESC;

-- =====================================================
-- View 4: Sales Team Performance
-- Individual user/team performance metrics
-- =====================================================
CREATE OR REPLACE VIEW vw_team_performance AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    u.role,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.status = 'new' THEN 1 END) as new_leads,
    COUNT(CASE WHEN l.status = 'contacted' THEN 1 END) as contacted_leads,
    COUNT(CASE WHEN l.status = 'qualified' THEN 1 END) as qualified_leads,
    COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as converted_leads,
    COUNT(CASE WHEN l.status = 'lost' THEN 1 END) as lost_leads,
    -- Performance metrics
    ROUND(COUNT(CASE WHEN l.status = 'converted' THEN 1 END)::numeric / 
          NULLIF(COUNT(l.id), 0) * 100, 2) as conversion_rate,
    -- Revenue metrics
    SUM(l.sale_price) as total_revenue,
    SUM(l.estimated_value) as total_pipeline,
    ROUND(AVG(l.sale_price), 2) as avg_deal_size,
    ROUND(SUM(l.sale_price) / NULLIF(COUNT(CASE WHEN l.status = 'converted' THEN 1 END), 0), 2) as avg_revenue_per_conversion
FROM users u
LEFT JOIN leads l ON u.id = l.assigned_to::uuid
GROUP BY u.id, u.name, u.email, u.role
ORDER BY total_revenue DESC NULLS LAST;

-- =====================================================
-- View 5: Monthly Revenue Trend
-- Month-over-month performance tracking
-- =====================================================
CREATE OR REPLACE VIEW vw_monthly_revenue AS
SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as month,
    EXTRACT(YEAR FROM created_at) as year,
    EXTRACT(MONTH FROM created_at) as month_number,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_leads,
    -- Conversion metrics
    ROUND(COUNT(CASE WHEN status = 'converted' THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate,
    -- Revenue metrics
    SUM(estimated_value) as estimated_pipeline,
    SUM(sale_price) as actual_revenue,
    ROUND(AVG(sale_price), 2) as avg_deal_value,
    -- Growth indicators
    SUM(CASE WHEN status = 'converted' THEN sale_price ELSE 0 END) as closed_revenue,
    SUM(CASE WHEN status NOT IN ('converted', 'lost') THEN estimated_value ELSE 0 END) as open_pipeline
FROM leads
GROUP BY TO_CHAR(created_at, 'YYYY-MM'), EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
ORDER BY month DESC;

-- =====================================================
-- View 6: Lead Funnel Analysis
-- Sales funnel visualization data
-- =====================================================
CREATE OR REPLACE VIEW vw_lead_funnel AS
SELECT 
    status,
    COUNT(*) as lead_count,
    SUM(estimated_value) as total_value,
    ROUND(AVG(estimated_value), 2) as avg_value,
    -- Funnel stage ordering
    CASE status
        WHEN 'new' THEN 1
        WHEN 'contacted' THEN 2
        WHEN 'qualified' THEN 3
        WHEN 'proposal' THEN 4
        WHEN 'negotiation' THEN 5
        WHEN 'converted' THEN 6
        WHEN 'lost' THEN 7
        ELSE 99
    END as stage_order,
    -- Percentage of total
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM leads) * 100, 2) as percentage_of_total
FROM leads
GROUP BY status
ORDER BY stage_order;

-- =====================================================
-- Grant Permissions
-- Adjust based on your RLS policies
-- =====================================================
GRANT SELECT ON vw_lead_analytics TO authenticated;
GRANT SELECT ON vw_daily_lead_metrics TO authenticated;
GRANT SELECT ON vw_lead_source_performance TO authenticated;
GRANT SELECT ON vw_team_performance TO authenticated;
GRANT SELECT ON vw_monthly_revenue TO authenticated;
GRANT SELECT ON vw_lead_funnel TO authenticated;

-- =====================================================
-- Create Indexes for Better Performance (Optional)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_sale_price ON leads(sale_price) WHERE sale_price > 0;

-- =====================================================
-- Verification Queries
-- Run these to test the views
-- =====================================================

-- Test View 1: Lead Analytics
-- SELECT * FROM vw_lead_analytics LIMIT 10;

-- Test View 2: Daily Metrics
-- SELECT * FROM vw_daily_lead_metrics LIMIT 10;

-- Test View 3: Source Performance
-- SELECT * FROM vw_lead_source_performance;

-- Test View 4: Team Performance
-- SELECT * FROM vw_team_performance;

-- Test View 5: Monthly Revenue
-- SELECT * FROM vw_monthly_revenue LIMIT 12;

-- Test View 6: Funnel
-- SELECT * FROM vw_lead_funnel;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Power BI Analytics Views Created Successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '  1. vw_lead_analytics - Main analytical view';
  RAISE NOTICE '  2. vw_daily_lead_metrics - Daily trends';
  RAISE NOTICE '  3. vw_lead_source_performance - Source analysis';
  RAISE NOTICE '  4. vw_team_performance - Team metrics';
  RAISE NOTICE '  5. vw_monthly_revenue - Monthly trends';
  RAISE NOTICE '  6. vw_lead_funnel - Sales funnel';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Connect Power BI to your database';
  RAISE NOTICE '  2. Import these views into Power BI';
  RAISE NOTICE '  3. Create your dashboards';
  RAISE NOTICE '';
  RAISE NOTICE 'For detailed instructions, see: POWER_BI_SETUP_GUIDE.md';
  RAISE NOTICE '========================================';
END $$;
