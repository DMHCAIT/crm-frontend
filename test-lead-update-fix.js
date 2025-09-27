#!/usr/bin/env node

/**
 * Test script to verify the assignedCounselor database schema fix
 * Tests that lead updates no longer fail with the camelCase column error
 */

const fetch = require('node-fetch');

// Configuration
const API_BASE = 'http://localhost:3001';
const TEST_LEAD_ID = 'eeb01744-efb4-437f-91e3-66b25247aaab'; // The failing lead ID from the error

// Sample JWT token for testing (replace with actual token)
const JWT_TOKEN = 'your-jwt-token-here';

async function testLeadUpdate() {
  console.log('🧪 Testing Lead Update Fix...\n');

  try {
    // Test 1: Check if we can fetch the lead first
    console.log('📋 Step 1: Fetching existing lead...');
    const fetchResponse = await fetch(`${API_BASE}/api/leads?id=${TEST_LEAD_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!fetchResponse.ok) {
      console.log(`⚠️ Could not fetch lead (${fetchResponse.status}): ${fetchResponse.statusText}`);
      console.log('This might be expected if the lead doesn\'t exist or token is invalid');
    } else {
      const leadData = await fetchResponse.json();
      console.log('✅ Lead fetch successful');
      console.log('📊 Lead data structure:', Object.keys(leadData.data || leadData));
    }

    // Test 2: Attempt lead update with various assignment field formats
    console.log('\n📝 Step 2: Testing lead update...');
    
    const updateData = {
      // Test the problematic assignment field formats
      assignedTo: 'test-user@example.com',
      // Note: We intentionally DO NOT include assignedCounselor (camelCase)
      // as our fix should prevent this from being sent to the database
      
      // Add some other safe fields
      status: 'In Progress',
      updated_at: new Date().toISOString()
    };

    console.log('📤 Update payload:', JSON.stringify(updateData, null, 2));

    const updateResponse = await fetch(`${API_BASE}/api/leads?id=${TEST_LEAD_ID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const responseText = await updateResponse.text();
    console.log(`\n📡 Response Status: ${updateResponse.status}`);
    console.log(`📡 Response Text: ${responseText}`);

    if (updateResponse.ok) {
      console.log('✅ SUCCESS: Lead update completed without database schema errors!');
      const result = JSON.parse(responseText);
      if (result.data) {
        console.log('📊 Updated lead assignment fields:');
        console.log(`   - assigned_to: ${result.data.assigned_to}`);
        console.log(`   - assignedcounselor: ${result.data.assignedcounselor}`);
        console.log(`   - assignedTo: ${result.data.assignedTo}`);
      }
    } else {
      console.log('❌ FAILURE: Lead update still failing');
      try {
        const errorData = JSON.parse(responseText);
        console.log('💥 Error details:', errorData);
        
        // Check if it's still the schema error
        if (errorData.details && errorData.details.includes('assignedCounselor')) {
          console.log('🚨 CRITICAL: The camelCase assignedCounselor error still exists!');
          console.log('    The fix may not have been applied correctly.');
        } else {
          console.log('ℹ️ Different error - this might be expected (auth, validation, etc.)');
        }
      } catch (e) {
        console.log('Could not parse error response as JSON');
      }
    }

  } catch (error) {
    console.error('💥 Test failed with exception:', error.message);
  }
}

// Run the test
if (require.main === module) {
  console.log('🔧 Lead Update Database Schema Fix Test');
  console.log('=====================================\n');
  
  console.log('ℹ️ This test verifies that the assignedCounselor camelCase column error is fixed');
  console.log('ℹ️ Make sure the backend server is running on port 3001\n');
  
  testLeadUpdate().then(() => {
    console.log('\n✅ Test completed');
  }).catch(err => {
    console.error('\n💥 Test failed:', err);
    process.exit(1);
  });
}

module.exports = { testLeadUpdate };