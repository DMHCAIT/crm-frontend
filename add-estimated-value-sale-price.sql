-- Add Estimated Value and Sale Price fields to leads table
-- Run this in Supabase SQL Editor

-- Add columns if they don't exist
DO $$ 
BEGIN
  -- Add estimated_value column (for all leads)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'estimated_value'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN estimated_value DECIMAL(10, 2);
    COMMENT ON COLUMN leads.estimated_value IS 'Estimated value/potential revenue for this lead';
  END IF;

  -- Add sale_price column (only for enrolled status)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'sale_price'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN sale_price DECIMAL(10, 2);
    COMMENT ON COLUMN leads.sale_price IS 'Actual sale price when lead is enrolled';
  END IF;

  -- Add currency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'currency'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN currency VARCHAR(3) DEFAULT 'INR' CHECK (currency IN ('USD', 'INR'));
    COMMENT ON COLUMN leads.currency IS 'Currency based on company: IBMP=USD, DMHCA=INR';
  END IF;
END $$;

-- Create index for faster queries on enrolled leads with sale price
CREATE INDEX IF NOT EXISTS idx_leads_enrolled_sale_price 
ON leads(status, sale_price) 
WHERE status = 'Enrolled' AND sale_price IS NOT NULL;

-- Create index for leads with estimated value
CREATE INDEX IF NOT EXISTS idx_leads_estimated_value 
ON leads(estimated_value) 
WHERE estimated_value IS NOT NULL;

-- Update currency based on company for existing records
UPDATE leads 
SET currency = CASE 
  WHEN company = 'IBMP' THEN 'USD'
  ELSE 'INR'
END
WHERE currency IS NULL;

-- Migrate existing data: fees -> sale_price for enrolled leads (if fees column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'fees'
  ) THEN
    UPDATE leads 
    SET sale_price = fees
    WHERE status = 'Enrolled' AND fees IS NOT NULL AND sale_price IS NULL;
  END IF;
END $$;

COMMENT ON TABLE leads IS 'CRM leads with estimated values and sale prices';

-- Show summary of changes
SELECT 
  status,
  COUNT(*) as lead_count,
  COUNT(estimated_value) as with_estimated_value,
  COUNT(sale_price) as with_sale_price,
  AVG(estimated_value) as avg_estimated,
  AVG(sale_price) as avg_sale_price,
  currency
FROM leads
GROUP BY status, currency
ORDER BY status;
