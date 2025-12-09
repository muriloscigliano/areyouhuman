# Quick Test - Run Your Workflow Now

## Step 1: Get Your Webhook URL from n8n

1. Open your n8n workflow
2. Find the **Webhook** node (should be the first node)
3. Click on it to open settings
4. Click **Execute Node** button (this activates the webhook)
5. **Copy the Webhook URL** - it will look like:
   ```
   https://your-n8n-instance.com/webhook/good-lead
   ```

## Step 2: Run the Test

### Option A: Using the Test Script (Recommended)

**Default (uses good-lead webhook):**
```bash
node test-n8n-trigger.js
```

**Or with custom URL:**
```bash
node test-n8n-trigger.js YOUR_WEBHOOK_URL_HERE
```

**Example:**
```bash
node test-n8n-trigger.js https://areyouhuman.up.railway.app/webhook-test/good-lead
```

### Option B: Using curl (Quick Test)

**Default (uses good-lead webhook):**
```bash
./run-test.sh
```

**Or with custom URL:**
```bash
curl -X POST YOUR_WEBHOOK_URL_HERE \
  -H "Content-Type: application/json" \
  -d @n8n-test-good-lead.json
```

**Example:**
```bash
curl -X POST https://areyouhuman.up.railway.app/webhook-test/good-lead \
  -H "Content-Type: application/json" \
  -d @n8n-test-good-lead.json
```

### Option C: Using Environment Variable

```bash
export N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/good-lead"
node test-n8n-trigger.js
```

## Step 3: Check Results

After running the test, check:

1. ✅ **Script output** - Should show "SUCCESS!"
2. ✅ **n8n workflow** - Check execution logs
3. ✅ **Email inbox** - Check `sarah.chen@techstartup.com` (or your test email)
4. ✅ **All nodes** - Verify all 12 nodes executed successfully

## What to Look For

### ✅ Success Indicators:
- Script shows "SUCCESS! Workflow triggered successfully!"
- n8n shows workflow executed without errors
- All nodes show green checkmarks
- Email received with PDF attachment

### ❌ Common Issues:

**"404 Not Found"**
- Webhook not activated - Click "Execute Node" in n8n
- Wrong URL - Double-check the webhook URL

**"Connection refused"**
- n8n instance not running
- Wrong domain/URL

**"Workflow failed"**
- Check n8n execution logs
- Verify all nodes are configured correctly
- Check API keys are set

## Quick Test Command (Copy & Paste)

Replace `YOUR_WEBHOOK_URL` with your actual webhook URL:

```bash
node test-n8n-trigger.js YOUR_WEBHOOK_URL
```

Or if you want to test with curl:

```bash
curl -X POST YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-001",
    "name": "Sarah Chen",
    "email": "sarah.chen@techstartup.com",
    "company": "TechStartup Solutions",
    "project_summary": "We need an AI-powered chatbot for customer service that integrates with WhatsApp Business.",
    "automation_area": "Customer service chatbot with WhatsApp integration",
    "budget_range": "$8,000 - $12,000 AUD",
    "timeline": "4-6 weeks",
    "urgency": "Medium",
    "interest_level": 8,
    "source": "Telos Chat"
  }'
```

## Need Help?

If the test fails:
1. Check webhook URL is correct
2. Verify webhook node is activated in n8n
3. Check n8n execution logs for errors
4. Verify all required fields are in the JSON

