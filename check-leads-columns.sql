-- Check all column names in the leads table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'leads'
    AND column_name LIKE '%update%'
ORDER BY 
    ordinal_position;

-- Also check for any 'last' columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'leads'
    AND column_name LIKE '%last%'
ORDER BY 
    ordinal_position;

-- Sample data to see actual column values
SELECT 
    id,
    "fullName",
    created_at,
    updated_at,
    status
FROM 
    leads
ORDER BY 
    created_at DESC
LIMIT 5;
