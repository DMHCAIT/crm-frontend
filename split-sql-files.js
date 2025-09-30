const fs = require('fs');
const path = require('path');

console.log('🔄 Splitting SQL file into 10 files with 100 leads each...');

// Read the main SQL file
const sqlContent = fs.readFileSync('ibmp-leads-supabase.sql', 'utf8');

// Split into lines and find INSERT statements
const lines = sqlContent.split('\n');
const insertLines = lines.filter(line => line.trim().startsWith('INSERT INTO'));

console.log(`📊 Found ${insertLines.length} INSERT statements`);

// Split into chunks of 100
const chunkSize = 100;
const chunks = [];

for (let i = 0; i < insertLines.length; i += chunkSize) {
    chunks.push(insertLines.slice(i, i + chunkSize));
}

console.log(`📁 Creating ${chunks.length} files...`);

// Create individual files
chunks.forEach((chunk, index) => {
    const fileNumber = (index + 1).toString().padStart(2, '0');
    const fileName = `ibmp-leads-batch-${fileNumber}.sql`;
    
    const fileContent = `-- IBMP Leads Import - Batch ${fileNumber}
-- Records: ${chunk.length}
-- Generated: ${new Date().toISOString()}

${chunk.join('\n')}
`;

    fs.writeFileSync(fileName, fileContent);
    console.log(`✅ Created ${fileName} with ${chunk.length} leads`);
});

// Create a master script to run all files
const masterScript = `#!/bin/bash

# IBMP Leads Import - All Batches
# Replace [YOUR-PASSWORD] with your actual database password

echo "🚀 IBMP Leads Import - Batch Processing"
echo "======================================"
echo

DB_URL="postgresql://postgres:[YOUR-PASSWORD]@db.cyzbdpsfquetmftlaswk.supabase.co:5432/postgres"

echo "⚠️  Make sure to replace [YOUR-PASSWORD] with your actual password"
echo

for i in {01..${chunks.length.toString().padStart(2, '0')}}; do
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
echo "Total leads imported: ${insertLines.length}"
`;

fs.writeFileSync('import-all-batches.sh', masterScript);
fs.chmodSync('import-all-batches.sh', 0o755);

console.log(`\n🎉 Split complete!`);
console.log(`📊 Summary:`);
console.log(`   - Total leads: ${insertLines.length}`);
console.log(`   - Batch files: ${chunks.length}`);
console.log(`   - Leads per file: ~${chunkSize}`);
console.log(`\n📁 Files created:`);
chunks.forEach((chunk, index) => {
    const fileNumber = (index + 1).toString().padStart(2, '0');
    console.log(`   - ibmp-leads-batch-${fileNumber}.sql (${chunk.length} leads)`);
});
console.log(`   - import-all-batches.sh (master import script)`);