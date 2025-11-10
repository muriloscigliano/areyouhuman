#!/usr/bin/env node

/**
 * Quick test script for n8n webhook
 * Replace the webhook URL with yours from Railway
 */

const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://areyouhuman.up.railway.app/webhook/telos-new-lead';

const testData = {
  leadId: 'test-' + Date.now(),
  timestamp: new Date().toISOString(),
  name: 'Test User',
  email: 'test@example.com',
  company: 'Test Corp',
  project_title: 'AI Automation Test',
  project_summary: 'Testing webhook connection from Astro app to Railway n8n',
  automation_area: 'lead-automation',
  tools_used: ['Astro', 'n8n', 'Railway'],
  budget_range: '$5k-$10k',
  timeline: '1 month',
  urgency: 'high',
  interest_level: 8,
  source: 'Manual Test Script',
  created_at: new Date().toISOString()
};

console.log('🚀 Testing n8n webhook on Railway...');
console.log('📍 Webhook URL:', WEBHOOK_URL);
console.log('📦 Payload:', JSON.stringify(testData, null, 2));
console.log('');

fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
  .then(async response => {
    console.log('📊 Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Success! n8n responded:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    console.log('🎉 Webhook is working! Check your n8n executions tab.');
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('1. Check webhook URL is correct');
    console.log('2. Verify workflow is activated in n8n');
    console.log('3. Check Railway deployment is running');
    console.log('4. Check n8n logs for errors');
  });


