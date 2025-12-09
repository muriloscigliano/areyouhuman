/**
 * Test Script for N8N Workflow Trigger
 * Run this to test if your workflow works with good lead data
 * 
 * Usage:
 *   node test-n8n-trigger.js
 * 
 * Or with custom webhook URL:
 *   N8N_WEBHOOK_URL=https://your-n8n.com/webhook/good-lead node test-n8n-trigger.js
 */

const testLeadData = {
  leadId: "test-lead-001",
  timestamp: new Date().toISOString(),
  name: "Sarah Chen",
  email: "sarah.chen@techstartup.com",
  company: "TechStartup Solutions",
  project_title: "Customer Service Automation System",
  project_summary: "We're manually processing 200+ customer service tickets daily, which takes our team 4 hours every day. We need an AI-powered chatbot that can handle common questions, integrate with our WhatsApp Business account, and escalate complex issues to human agents. The system should also provide analytics on common issues and response times.",
  automation_area: "Customer service chatbot with WhatsApp integration and intelligent routing",
  problem_text: "We're manually processing 200+ customer service tickets daily, which takes our team 4 hours every day. We need an AI-powered chatbot that can handle common questions, integrate with our WhatsApp Business account, and escalate complex issues to human agents.",
  tools_used: ["WhatsApp Business API", "Stripe", "Notion", "Zendesk"],
  budget_range: "$8,000 - $12,000 AUD",
  timeline: "4-6 weeks",
  urgency: "Medium - would like to launch before Q1 2026",
  interest_level: 8,
  source: "Telos Chat",
  created_at: new Date().toISOString()
};

// Get webhook URL from environment, command line, or use default
const webhookUrl = process.env.N8N_WEBHOOK_URL || process.argv[2] || 'https://areyouhuman.up.railway.app/webhook-test/good-lead';

if (!process.env.N8N_WEBHOOK_URL && !process.argv[2]) {
  console.log("ℹ️  Using default webhook URL:", webhookUrl);
  console.log("   (Override with: node test-n8n-trigger.js YOUR_URL)");
  console.log("");
}

async function testWorkflow() {
  console.log("🚀 Testing N8N Workflow Trigger...\n");
  console.log("📋 Webhook URL:", webhookUrl);
  console.log("📦 Sending test lead data...\n");
  console.log("Lead:", testLeadData.name);
  console.log("Company:", testLeadData.company);
  console.log("Email:", testLeadData.email);
  console.log("Project:", testLeadData.project_title);
  console.log("\n" + "=".repeat(50) + "\n");

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testLeadData),
    });

    console.log("📡 Response Status:", response.status, response.statusText);
    console.log("📡 Response Headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
      console.log("📄 Response Body (JSON):");
      console.log(JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log("📄 Response Body (Text):");
      console.log(responseText.substring(0, 500)); // First 500 chars
    }

    console.log("\n" + "=".repeat(50) + "\n");

    if (response.ok) {
      console.log("✅ SUCCESS! Workflow triggered successfully!");
      console.log("\nNext steps:");
      console.log("1. Check your n8n workflow execution logs");
      console.log("2. Verify all nodes executed without errors");
      console.log("3. Check if email was sent to:", testLeadData.email);
      console.log("4. Verify PDF was generated");
    } else {
      console.log("⚠️  WARNING: Request completed but with non-200 status");
      console.log("Check your n8n workflow for errors");
    }
  } catch (error) {
    console.log("\n" + "=".repeat(50) + "\n");
    console.error("❌ ERROR: Failed to trigger workflow");
    console.error("Error:", error.message);
    console.log("\nTroubleshooting:");
    console.log("1. Verify webhook URL is correct");
    console.log("2. Check if webhook node is activated in n8n");
    console.log("3. Verify n8n instance is accessible");
    console.log("4. Check network connectivity");
    process.exit(1);
  }
}

// Run the test
testWorkflow();

