#!/bin/bash

# Quick test script for n8n workflow
# Usage: ./run-test.sh YOUR_WEBHOOK_URL

# Use provided URL or default to good-lead webhook
WEBHOOK_URL="${1:-https://areyouhuman.up.railway.app/webhook-test/good-lead}"

if [ -z "$1" ]; then
  echo "ℹ️  Using default webhook URL: $WEBHOOK_URL"
  echo "   (You can override by providing URL as argument)"
  echo ""
fi

echo "🚀 Testing N8N Workflow..."
echo "📋 Webhook URL: $WEBHOOK_URL"
echo "📦 Sending test lead data..."
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d @n8n-test-good-lead.json \
  -w "\n\n📡 HTTP Status: %{http_code}\n" \
  -v

echo ""
echo "✅ Test completed!"
echo ""
echo "Next steps:"
echo "1. Check your n8n workflow execution logs"
echo "2. Verify all nodes executed successfully"
echo "3. Check if email was sent to: sarah.chen@techstartup.com"

