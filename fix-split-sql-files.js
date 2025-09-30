const fs = require('fs');
const path = require('path');

console.log('🔄 Fixing SQL file split - capturing complete INSERT statements...');

// Read the main SQL file
const sqlContent = fs.readFileSync('ibmp-leads-supabase.sql', 'utf8');

// Split the content into complete INSERT statements
// Each INSERT statement spans multiple lines until the VALUES clause ends with );
const insertStatements = [];
let currentStatement = '';
let inInsert = false;

const lines = sqlContent.split('\n');

for (const line of lines) {
    if (line.trim().startsWith('INSERT INTO')) {
        // Start of new INSERT statement
        if (currentStatement && inInsert) {
            insertStatements.push(currentStatement.trim());
        }
        currentStatement = line;
        inInsert = true;
    } else if (inInsert) {
        // Continue building the current INSERT statement
        currentStatement += '\n' + line;
        
        // Check if this line ends the INSERT statement
        if (line.trim().endsWith(');')) {
            insertStatements.push(currentStatement.trim());
            currentStatement = '';
            inInsert = false;
        }
    }
}

// Add the last statement if it exists
if (currentStatement && inInsert) {
    insertStatements.push(currentStatement.trim());
}

console.log(`📊 Found ${insertStatements.length} complete INSERT statements`);

// Remove existing batch files
const existingBatchFiles = fs.readdirSync('.').filter(file => file.startsWith('ibmp-leads-batch-'));
existingBatchFiles.forEach(file => {
    fs.unlinkSync(file);
    console.log(`🗑️  Removed ${file}`);
});

// Split into chunks of 100
const chunkSize = 100;
const chunks = [];

for (let i = 0; i < insertStatements.length; i += chunkSize) {
    chunks.push(insertStatements.slice(i, i + chunkSize));
}

console.log(`📁 Creating ${chunks.length} files...`);

// Create individual files with complete INSERT statements
chunks.forEach((chunk, index) => {
    const fileNumber = (index + 1).toString().padStart(2, '0');
    const fileName = `ibmp-leads-batch-${fileNumber}.sql`;
    
    const fileContent = `-- IBMP Leads Import - Batch ${fileNumber}
-- Records: ${chunk.length}
-- Generated: ${new Date().toISOString()}

${chunk.join('\n\n')}
`;

    fs.writeFileSync(fileName, fileContent);
    console.log(`✅ Created ${fileName} with ${chunk.length} complete INSERT statements`);
});

// Update the master script
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
echo "Total leads imported: ${insertStatements.length}"
`;

fs.writeFileSync('import-all-batches.sh', masterScript);
fs.chmodSync('import-all-batches.sh', 0o755);

console.log(`\n🎉 Split fixed and complete!`);
console.log(`📊 Summary:`);
console.log(`   - Total leads: ${insertStatements.length}`);
console.log(`   - Batch files: ${chunks.length}`);
console.log(`   - Leads per file: ~${chunkSize}`);
console.log(`\n📁 Files created:`);
chunks.forEach((chunk, index) => {
    const fileNumber = (index + 1).toString().padStart(2, '0');
    console.log(`   - ibmp-leads-batch-${fileNumber}.sql (${chunk.length} leads)`);
});
console.log(`   - import-all-batches.sh (master import script)`);

// Show first few lines of first batch to verify
console.log(`\n🔍 Sample from first batch:`);
const firstBatch = fs.readFileSync(`ibmp-leads-batch-01.sql`, 'utf8');
console.log(firstBatch.split('\n').slice(0, 15).join('\n'));
console.log('...');