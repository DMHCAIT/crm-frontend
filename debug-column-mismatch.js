#!/usr/bin/env node

/**
 * 🔍 DATABASE COLUMN NAME MISMATCH DETECTOR
 * Identifies potential camelCase vs snake_case issues with estimatedValue
 */

console.log('🔍 Database Column Name Analysis for EstimatedValue');
console.log('=' .repeat(60));

// Common patterns in the CRM system
const patterns = [
  { field: 'estimatedValue', description: 'Frontend/Backend JavaScript (camelCase)' },
  { field: 'estimated_value', description: 'Database Column (snake_case)' },
  { field: 'EstimatedValue', description: 'Pascal Case (unlikely)' },
  { field: 'estimatedvalue', description: 'All lowercase (possible)' }
];

console.log('📋 Possible Field Name Variations:');
patterns.forEach((pattern, index) => {
  console.log(`  ${index + 1}. "${pattern.field}" - ${pattern.description}`);
});

console.log('\n🎯 Analysis of Backend Code:');

// Analyze what we found in the backend
const backendFindings = [
  {
    location: 'SELECT query (line 419)',
    code: 'estimatedValue',
    issue: 'Uses camelCase in SELECT - may not match DB column'
  },
  {
    location: 'Request parsing (line 961)', 
    code: 'estimatedValue',
    issue: 'Expects camelCase from frontend'
  },
  {
    location: 'INSERT operation (line 1017)',
    code: 'estimatedValue: estimatedValue ? parseFloat(estimatedValue) || 0 : 0',
    issue: 'Inserts as camelCase - may not match DB column'
  },
  {
    location: 'UPDATE operation (line 1177)',
    code: 'cleanUpdateData.estimatedValue = parseFloat(cleanUpdateData.estimatedValue) || 0',
    issue: 'Updates as camelCase - may not match DB column'
  }
];

backendFindings.forEach((finding, index) => {
  console.log(`\n  ${index + 1}. ${finding.location}:`);
  console.log(`     Code: ${finding.code}`);
  console.log(`     Issue: ${finding.issue}`);
});

console.log('\n🚨 POTENTIAL PROBLEM IDENTIFIED:');
console.log('   The backend code consistently uses "estimatedValue" (camelCase)');
console.log('   but PostgreSQL/Supabase typically uses "estimated_value" (snake_case)');

console.log('\n💡 SOLUTION APPROACHES:');
console.log('   1. Change backend to use "estimated_value" everywhere');
console.log('   2. Ensure database column is actually "estimatedValue"');
console.log('   3. Add field mapping in Supabase queries');
console.log('   4. Check if Supabase auto-converts between cases');

console.log('\n🔧 RECOMMENDED FIXES:');
console.log('   A. Check actual database column name in Supabase dashboard');
console.log('   B. Update SELECT query to match actual column name');
console.log('   C. Update INSERT/UPDATE operations to use correct column name');
console.log('   D. Ensure consistency between SELECT, INSERT, and UPDATE operations');

console.log('\n📝 TEST QUERIES TO RUN:');
console.log('   SELECT estimatedValue FROM leads LIMIT 1; -- Test camelCase');
console.log('   SELECT estimated_value FROM leads LIMIT 1; -- Test snake_case');
console.log('   SELECT "estimatedValue" FROM leads LIMIT 1; -- Test quoted camelCase');
console.log('   \\d leads; -- Show column definitions');

console.log('\n⚠️  This mismatch would cause:');
console.log('   - SELECTs returning NULL for estimatedValue');
console.log('   - INSERTs/UPDATEs failing silently or being ignored');
console.log('   - Data not being saved/retrieved properly');