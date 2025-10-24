const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://kwlpqnecnwjwmrkrrzrd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3bHBxbmVjbndqd21ya3JyenJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2OTY1MzYsImV4cCI6MjA1MDI3MjUzNn0.kCW6RNxLJpWxKJe1jFI4eofJKbXOvJCKYH8H5A-i9M0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeadsTableSchema() {
  console.log('🔍 Checking leads table schema...');
  
  try {
    // Try to get one lead to see what columns exist
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Available columns in leads table:');
      console.log(Object.keys(data[0]).sort());
      
      // Check specifically for estimatedValue
      if ('estimatedValue' in data[0]) {
        console.log('✅ estimatedValue column EXISTS');
      } else {
        console.log('❌ estimatedValue column MISSING');
      }
    } else {
      console.log('⚠️ No leads found in table');
    }
    
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
}

checkLeadsTableSchema();