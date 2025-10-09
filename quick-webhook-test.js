#!/usr/bin/env node

/**
 * Quick Webhook Test - Direct API Call
 * Test the webhook endpoint without complex authentication flow
 */

async function quickWebhookTest() {
  console.log('🚀 Quick Webhook Test for CRM Lead Integration\n');

  const webhookUrl = 'https://crm-backend-main-6i64.onrender.com/api/webhook-leads';
  
  const testLead = {
    verify_token: 'dmhca-webhook-secure-2024',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    source: 'Website Contact Form',
    message: 'Interested in DMHCA programs'
  };

  try {
    console.log('📍 Testing webhook endpoint:', webhookUrl);
    console.log('📋 Test lead data:', JSON.stringify(testLead, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testLead)
    });

    console.log('\n📊 Response Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Webhook working!');
      console.log('📈 Response:', JSON.stringify(data, null, 2));
      console.log('\n🎯 WEBSITE INTEGRATION READY!');
      console.log('🔗 Webhook URL: ' + webhookUrl);
      console.log('🔑 Verify Token: dmhca-webhook-secure-2024');
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED:', errorText);
      
      if (response.status === 404) {
        console.log('💡 Endpoint not found - deployment may still be in progress');
      }
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('💡 This could mean deployment is still in progress');
  }

  console.log('\n🏁 Quick test completed!');
}

quickWebhookTest().catch(console.error);