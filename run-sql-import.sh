#!/bin/bash

# IBMP Leads Import Script for Supabase
# Replace [YOUR-PASSWORD] with your actual database password

echo "🚀 IBMP Leads Import to Supabase"
echo "================================"
echo
echo "Option 1: Run with psql (if you have it installed)"
echo "psql 'postgresql://postgres:[YOUR-PASSWORD]@db.cyzbdpsfquetmftlaswk.supabase.co:5432/postgres' -f ibmp-leads-supabase.sql"
echo
echo "Option 2: Copy the SQL content and paste in Supabase Dashboard"
echo "File: ibmp-leads-supabase.sql"
echo "Size: $(ls -lh ibmp-leads-supabase.sql | awk '{print $5}')"
echo "Records: $(grep -c 'INSERT INTO' ibmp-leads-supabase.sql)"
echo
echo "📋 Steps for Supabase Dashboard:"
echo "1. Open https://supabase.com/dashboard"
echo "2. Go to your project (cyzbdpsfquetmftlaswk)"
echo "3. Click 'SQL Editor' in sidebar"
echo "4. Copy content from ibmp-leads-supabase.sql"
echo "5. Paste and click 'Run'"
echo
echo "⚠️  Important: Replace [YOUR-PASSWORD] with your actual password"
