# Power BI Setup Guide for CRM Analytics

## Step 1: Get Database Connection Details from Supabase

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com
   - Select your CRM project

2. **Get Database Credentials**
   - Navigate to: **Project Settings** → **Database**
   - Copy these details:
     ```
     Host: db.[your-project-ref].supabase.co
     Database name: postgres
     Port: 5432
     User: postgres
     Password: [your-database-password]
     ```

## Step 2: Install Power BI Desktop

1. Download from: https://powerbi.microsoft.com/desktop/
2. Install Power BI Desktop (Windows only)
3. Open Power BI Desktop

## Step 3: Connect Power BI to Your CRM Database

### Method 1: Direct PostgreSQL Connection (Recommended)

1. **In Power BI Desktop:**
   - Click **Get Data** → **More...**
   - Search for **PostgreSQL database**
   - Click **Connect**

2. **Enter Connection Details:**
   ```
   Server: db.[your-project-ref].supabase.co:5432
   Database: postgres
   ```
   - Data Connectivity mode: **Import** (for better performance)
   - Click **OK**

3. **Authentication:**
   - Select **Database** tab
   - Username: `postgres`
   - Password: `[your-database-password]`
   - Click **Connect**

4. **Select Tables:**
   - Check these tables:
     - ✅ leads
     - ✅ users
     - ✅ campaigns (if exists)
     - ✅ follow_ups (if exists)
   - Click **Load** or **Transform Data** (to clean data first)

### Method 2: Using Connection String (Alternative)

If direct connection doesn't work:

1. **Get Data** → **Blank Query**
2. **Advanced Editor** → Paste this:

```m
let
    Source = PostgreSQL.Database("db.[your-project-ref].supabase.co", "postgres", [
        Port = 5432,
        CommandTimeout = #duration(0, 0, 5, 0)
    ])
in
    Source
```

3. Replace `[your-project-ref]` with your actual project reference
4. Click **Done** → Enter credentials

## Step 4: Create Optimized SQL Views for Power BI

Run these in **Supabase SQL Editor** to create views optimized for analytics:

```sql
-- =====================================================
-- POWER BI ANALYTICS VIEWS
-- Run this in Supabase SQL Editor
-- =====================================================

-- View 1: Lead Analytics Summary
CREATE OR REPLACE VIEW vw_lead_analytics AS
SELECT 
    l.id,
    l.name,
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
    u.role as assigned_user_role,
    EXTRACT(YEAR FROM l.created_at) as year,
    EXTRACT(MONTH FROM l.created_at) as month,
    EXTRACT(QUARTER FROM l.created_at) as quarter,
    TO_CHAR(l.created_at, 'YYYY-MM') as year_month,
    DATE(l.created_at) as created_date,
    CASE 
        WHEN l.status = 'converted' THEN 1 
        ELSE 0 
    END as is_converted,
    CASE 
        WHEN l.sale_price > 0 THEN 1 
        ELSE 0 
    END as has_sale
FROM leads l
LEFT JOIN users u ON l.assigned_to = u.id;

-- View 2: Daily Lead Metrics
CREATE OR REPLACE VIEW vw_daily_lead_metrics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
    COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
    COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_leads,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_leads,
    SUM(estimated_value) as total_estimated_value,
    SUM(sale_price) as total_revenue,
    ROUND(AVG(estimated_value), 2) as avg_estimated_value,
    ROUND(AVG(sale_price), 2) as avg_sale_price
FROM leads
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- View 3: Lead Source Performance
CREATE OR REPLACE VIEW vw_lead_source_performance AS
SELECT 
    source,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_count,
    ROUND(COUNT(CASE WHEN status = 'converted' THEN 1 END)::numeric / 
          NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate,
    SUM(estimated_value) as total_estimated_value,
    SUM(sale_price) as total_revenue,
    ROUND(AVG(sale_price), 2) as avg_revenue_per_lead
FROM leads
GROUP BY source
ORDER BY total_leads DESC;

-- View 4: Sales Team Performance
CREATE OR REPLACE VIEW vw_team_performance AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    u.role,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as converted_leads,
    ROUND(COUNT(CASE WHEN l.status = 'converted' THEN 1 END)::numeric / 
          NULLIF(COUNT(l.id), 0) * 100, 2) as conversion_rate,
    SUM(l.sale_price) as total_revenue,
    ROUND(AVG(l.sale_price), 2) as avg_deal_size
FROM users u
LEFT JOIN leads l ON u.id = l.assigned_to
GROUP BY u.id, u.name, u.role
ORDER BY total_revenue DESC;

-- View 5: Monthly Revenue Trend
CREATE OR REPLACE VIEW vw_monthly_revenue AS
SELECT 
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
    SUM(estimated_value) as estimated_pipeline,
    SUM(sale_price) as actual_revenue,
    ROUND(AVG(sale_price), 2) as avg_deal_value
FROM leads
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;

-- Grant permissions (adjust based on your RLS policies)
GRANT SELECT ON vw_lead_analytics TO authenticated;
GRANT SELECT ON vw_daily_lead_metrics TO authenticated;
GRANT SELECT ON vw_lead_source_performance TO authenticated;
GRANT SELECT ON vw_team_performance TO authenticated;
GRANT SELECT ON vw_monthly_revenue TO authenticated;
```

## Step 5: Load Views into Power BI

1. After running the SQL above in Supabase
2. In Power BI → **Get Data** → **PostgreSQL**
3. Connect using credentials from Step 1
4. Select these new views:
   - ✅ vw_lead_analytics
   - ✅ vw_daily_lead_metrics
   - ✅ vw_lead_source_performance
   - ✅ vw_team_performance
   - ✅ vw_monthly_revenue

## Step 6: Create Power BI Date Table (Important!)

In Power BI → **Modeling** → **New Table** → Paste this DAX:

```dax
DateTable = 
ADDCOLUMNS(
    CALENDAR(DATE(2023, 1, 1), DATE(2030, 12, 31)),
    "Year", YEAR([Date]),
    "Month", FORMAT([Date], "MMMM"),
    "MonthNumber", MONTH([Date]),
    "Quarter", "Q" & FORMAT([Date], "Q"),
    "YearMonth", FORMAT([Date], "YYYY-MM"),
    "WeekDay", FORMAT([Date], "dddd"),
    "DayOfWeek", WEEKDAY([Date]),
    "IsWeekend", IF(WEEKDAY([Date]) IN {1, 7}, "Weekend", "Weekday")
)
```

**Create Relationship:**
- Drag `DateTable[Date]` to `vw_lead_analytics[created_date]`
- This enables time intelligence functions

## Step 7: Create Key Measures (DAX Formulas)

In Power BI → **Modeling** → **New Measure**:

```dax
-- Total Leads
Total Leads = COUNT(vw_lead_analytics[id])

-- Converted Leads
Converted Leads = CALCULATE(COUNT(vw_lead_analytics[id]), vw_lead_analytics[status] = "converted")

-- Conversion Rate
Conversion Rate = 
DIVIDE(
    [Converted Leads],
    [Total Leads],
    0
) * 100

-- Total Revenue
Total Revenue = SUM(vw_lead_analytics[sale_price])

-- Average Deal Size
Avg Deal Size = AVERAGE(vw_lead_analytics[sale_price])

-- Total Pipeline
Total Pipeline = SUM(vw_lead_analytics[estimated_value])

-- Month-over-Month Growth
MoM Growth = 
VAR CurrentMonth = [Total Revenue]
VAR PreviousMonth = CALCULATE([Total Revenue], DATEADD(DateTable[Date], -1, MONTH))
RETURN
DIVIDE(CurrentMonth - PreviousMonth, PreviousMonth, 0) * 100
```

## Step 8: Sample Dashboard Layout

Create these visualizations:

### Page 1: Executive Overview
1. **KPI Cards** (top row):
   - Total Leads
   - Conversion Rate %
   - Total Revenue
   - Average Deal Size

2. **Line Chart**: Monthly Revenue Trend
   - X-axis: `DateTable[YearMonth]`
   - Y-axis: `[Total Revenue]`

3. **Funnel Chart**: Lead Status Funnel
   - Category: `status`
   - Values: `COUNT(id)`

4. **Pie Chart**: Leads by Source
   - Legend: `source`
   - Values: `COUNT(id)`

### Page 2: Sales Performance
1. **Table**: Team Performance
   - Columns: `user_name`, `total_leads`, `converted_leads`, `conversion_rate`, `total_revenue`

2. **Bar Chart**: Revenue by User
   - Y-axis: `user_name`
   - X-axis: `[Total Revenue]`

3. **Scatter Chart**: Leads vs Revenue
   - X-axis: `total_leads`
   - Y-axis: `total_revenue`

### Page 3: Lead Analysis
1. **Heat Map**: Leads by Day of Week
2. **Stacked Bar Chart**: Lead Source Performance
3. **Trend Line**: Lead Creation Trend (30 days)

## Step 9: Set Up Auto-Refresh (Power BI Service)

1. **Publish to Power BI Service:**
   - Click **Publish** in Power BI Desktop
   - Sign in to Power BI Service

2. **Configure Gateway (for auto-refresh):**
   - Install Power BI Gateway on a Windows machine
   - Configure database connection
   - Set refresh schedule: Daily at 6 AM

3. **Alternative: Manual Refresh**
   - In Power BI Desktop: Click **Refresh**
   - In Power BI Service: Schedule refresh in dataset settings

## Step 10: Share Dashboard

1. **Create Workspace** in Power BI Service
2. **Publish Report**
3. **Share with Team:**
   - Click **Share** → Add team emails
   - Set permissions (View only or Edit)

## Troubleshooting

### Connection Issues:
- ✅ Check firewall allows port 5432
- ✅ Verify Supabase project is not paused
- ✅ Ensure IP is whitelisted (Supabase Settings → Database → Connection Pooling)

### Slow Performance:
- ✅ Use **Import** mode instead of DirectQuery
- ✅ Create indexes on frequently queried columns
- ✅ Use the pre-built views instead of raw tables

### Authentication Errors:
- ✅ Verify database password
- ✅ Check if RLS (Row Level Security) is blocking access
- ✅ Use `postgres` user or create a read-only user

## Next Steps

1. ✅ Run the SQL views creation script in Supabase
2. ✅ Connect Power BI to your database
3. ✅ Load the views into Power BI
4. ✅ Create the Date table
5. ✅ Build your first dashboard
6. ✅ Publish to Power BI Service
7. ✅ Share with your team

## Support Resources

- Power BI Documentation: https://docs.microsoft.com/power-bi/
- Supabase PostgreSQL Guide: https://supabase.com/docs/guides/database
- DAX Functions Reference: https://dax.guide/

---

**Need Help?**
- Check if views are created: Run `SELECT * FROM vw_lead_analytics LIMIT 10;` in Supabase
- Test connection: Use TablePlus or pgAdmin first to verify credentials
