-- Diagnostic query to find all VARCHAR(20) columns in the database
SELECT table_schema, table_name, column_name, character_maximum_length
FROM information_schema.columns
WHERE data_type = 'character varying'
  AND character_maximum_length = 20
ORDER BY table_schema, table_name, column_name;

-- Check specifically the leads table columns
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads'
  AND data_type = 'character varying'
ORDER BY column_name;

-- Check all columns in leads table with their constraints
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads'
ORDER BY ordinal_position;
