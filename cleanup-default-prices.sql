-- Clean up default estimated values that were auto-populated
-- This will set estimated_value to NULL for leads that don't have real price data

-- Clear estimated_value where it's exactly 50000 (DMHCA default) or 2000 (IBMP default)
-- These are obviously default values, not real estimates
UPDATE leads 
SET estimated_value = NULL
WHERE estimated_value IN (50000, 2000);

-- Also clear any other round numbers that look like defaults (40000, 8000, etc.)
-- Only if they appear to be system defaults (you can remove this if you have real round numbers)
UPDATE leads 
SET estimated_value = NULL
WHERE estimated_value IN (40000, 8000) 
AND status NOT IN ('Enrolled', 'Hot', 'Warm');

-- Verify the cleanup
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
