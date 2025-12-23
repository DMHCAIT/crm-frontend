# Database Migration Instructions

## Objective
Add financial tracking fields to enable:
- **Estimated Value** for ALL leads (pipeline forecasting)
- **Sale Price** for ENROLLED leads only (actual revenue tracking)

## Prerequisites
- Access to Supabase dashboard
- SQL Editor permissions

## Migration Steps

### 1. Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Run the Migration
Copy the entire contents of `add-estimated-value-sale-price.sql` and execute it.

The migration will:
- ✅ Add `estimated_value` column (DECIMAL) for all leads
- ✅ Add `sale_price` column (DECIMAL) for enrolled leads
- ✅ Add `currency` column (VARCHAR) for internationalization
- ✅ Migrate existing data from old fields
- ✅ Create performance indexes
- ✅ Set default values based on company (DMHCA vs IBMP)

### 3. Verify Migration
Run this query to verify the columns were created:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('estimated_value', 'sale_price', 'currency')
ORDER BY column_name;
```

Expected output:
```
column_name      | data_type        | is_nullable | column_default
-----------------|------------------|-------------|----------------
currency         | character varying| YES         | NULL
estimated_value  | numeric          | YES         | NULL
sale_price       | numeric          | YES         | NULL
```

### 4. Check Data Migration
Verify data was migrated from old fields:

```sql
SELECT 
    id, 
    name, 
    status, 
    company,
    estimated_value, 
    sale_price,
    currency
FROM leads 
WHERE status = 'Enrolled' OR estimated_value IS NOT NULL OR sale_price IS NOT NULL
LIMIT 10;
```

### 5. Test the Application
1. **Create a new lead**: Verify "Estimated Value" field is visible for all statuses
2. **Change lead to Enrolled**: Verify "Sale Price" field appears
3. **Check dashboard**: Revenue calculations should show actual + estimated revenue
4. **Card view**: Should display color-coded badges (green=sale, blue=estimated)

## Rollback (if needed)
If something goes wrong, run:

```sql
ALTER TABLE leads DROP COLUMN IF EXISTS estimated_value;
ALTER TABLE leads DROP COLUMN IF EXISTS sale_price;
ALTER TABLE leads DROP COLUMN IF EXISTS currency;
DROP INDEX IF EXISTS idx_leads_enrolled_sale_price;
DROP INDEX IF EXISTS idx_leads_estimated_value;
```

## What Changed

### Frontend (`LeadsManagement.tsx`)
- ✅ Estimated Value shown for ALL leads
- ✅ Sale Price shown ONLY for Enrolled leads
- ✅ Revenue calculations updated (actual + weighted estimated)
- ✅ Color-coded financial badges in card view

### Backend (`leads.js`)
- ✅ Handles both camelCase and snake_case field names
- ✅ Saves estimated_value for all leads
- ✅ Saves sale_price only when provided
- ✅ Returns both field formats in API responses

### Database Schema
```sql
-- New columns
estimated_value DECIMAL(10,2)  -- For all leads
sale_price      DECIMAL(10,2)  -- For enrolled leads only
currency        VARCHAR(3)     -- ISO currency code (INR, USD, etc.)

-- Indexes for performance
idx_leads_enrolled_sale_price  -- Fast queries on enrolled revenue
idx_leads_estimated_value      -- Fast queries on pipeline value
```

## Business Impact
- **Better Forecasting**: See potential pipeline value across all leads
- **Accurate Revenue**: Track actual sale prices separate from estimates
- **Status-Based Display**: Sale price only appears when leads are enrolled
- **Dashboard Metrics**: Actual revenue + weighted estimated revenue (30% probability)

## Support
If you encounter issues:
1. Check Supabase logs for SQL errors
2. Verify user has correct database permissions
3. Test with a single lead creation/update first
4. Check browser console for API errors
