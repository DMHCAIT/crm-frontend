#!/bin/bash

# IBMP Leads Import - All Batches
# Replace [YOUR-PASSWORD] with your actual database password

echo "🚀 IBMP Leads Import - Batch Processing"
echo "======================================"
echo

DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.cyzbdpsfquetmftlaswk.supabase.co:5432/postgres"

echo "⚠️  Make sure to replace [YOUR-PASSWORD] with your actual password"
echo

for i in {01..12}; do
    echo "📥 Importing batch $i..."
    psql "$DB_URL" -f "ibmp-leads-batch-$i.sql"
    
    if [ $? -eq 0 ]; then
        echo "✅ Batch $i completed successfully"
    else
        echo "❌ Batch $i failed"
        exit 1
    fi
    
    echo "⏳ Waiting 2 seconds..."
    sleep 2
    echo
done

echo "🎉 All batches imported successfully!"
echo "Total leads imported: 1156"
