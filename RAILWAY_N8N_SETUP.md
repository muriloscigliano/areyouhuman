# 🚂 Railway n8n → Astro App Connection Guide

You already have n8n running on Railway! Let's connect it.

## 🔍 Your n8n Instance

**URL:** `https://areyouhuman.up.railway.app`

---

## ✅ Step-by-Step Setup

### 1️⃣ Find Your Webhook URL in n8n

1. Open your Railway n8n: `https://areyouhuman.up.railway.app`
2. Go to your workflow (ID: `37cmWAauZL8NBg09`)
3. Click on the **Webhook node** (usually the first node)
4. Look for "Webhook URLs" section
5. Copy the **Production URL**

It should look like:
```
https://areyouhuman.up.railway.app/webhook/telos-new-lead
```

Or if you used a different path:
```
https://areyouhuman.up.railway.app/webhook/lead-intake
https://areyouhuman.up.railway.app/webhook/chat-lead
```

---

### 2️⃣ Configure Your `.env` File

1. Open or create `.env` in your project root
2. Add the webhook URL:

```bash
# n8n on Railway
N8N_WEBHOOK_URL=https://areyouhuman.up.railway.app/webhook/telos-new-lead
```

**Important:** Replace `telos-new-lead` with your actual webhook path from step 1.

---

### 3️⃣ Test the Connection

Run the test script:

```bash
# Option 1: Using environment variable
N8N_WEBHOOK_URL=https://areyouhuman.up.railway.app/webhook/YOUR-PATH node test-n8n-webhook.js

# Option 2: If .env is already configured
node test-n8n-webhook.js
```

**Expected output:**
```
🚀 Testing n8n webhook on Railway...
📍 Webhook URL: https://areyouhuman.up.railway.app/webhook/telos-new-lead
📦 Payload: {...}

📊 Response Status: 200 OK
✅ Success! n8n responded:
{
  "success": true,
  "message": "Lead processed"
}

🎉 Webhook is working! Check your n8n executions tab.
```

---

### 4️⃣ Check n8n Execution

1. Go to your n8n dashboard
2. Click **"Executions"** tab
3. You should see a new execution from the test
4. Status should be **"Success"** ✅

---

### 5️⃣ Restart Your Dev Server

```bash
npm run dev
```

Now your chat will automatically trigger n8n workflows!

---

## 🎯 What Your Workflow Should Have

### Minimum Required Nodes:

```
1. Webhook Trigger
   ↓
2. Save to Supabase (or other action)
   ↓
3. Respond to Webhook
```

### Recommended Smart Router Setup:

```
1. Webhook Trigger
   ↓
2. Save to Supabase
   ↓
3. Router (Check if budget + timeline exist)
   ↓
├─ Route A (Complete) → Generate PDF → Send Email
└─ Route B (Incomplete) → Follow-up Email Sequence
```

---

## 📦 Import Pre-Built Workflow (Optional)

If you want to use the smart router:

1. Download: `n8n-workflow-smart-lead-router.json`
2. In n8n, go to **Workflows** → **Import from File**
3. Upload the JSON file
4. Configure credentials (Supabase, Email)
5. Activate workflow

---

## 🔧 Workflow Configuration

### Webhook Node Setup:

**Path:** `telos-new-lead` (or your custom path)
**Method:** POST
**Response Mode:** Response Node or "Respond to Webhook" node

### Expected Data from Chat:

```json
{
  "leadId": "uuid",
  "timestamp": "2025-11-02T...",
  "name": "John Doe",
  "email": "john@company.com",
  "company": "Company Inc",
  "project_title": "AI Automation",
  "project_summary": "Need to automate...",
  "automation_area": "sales",
  "tools_used": ["Salesforce", "Slack"],
  "budget_range": "$10k-$20k",
  "timeline": "3 months",
  "urgency": "high",
  "interest_level": 8,
  "source": "Telos Chat",
  "created_at": "2025-11-02T..."
}
```

---

## ✨ When Does It Trigger?

The webhook triggers when:

1. ✅ Lead has **name**, **email**, **company**
2. ✅ Project data has **enough detail**
3. ✅ Telos says: "send", "email", "inbox", or "proposal"

Example conversation that triggers:
```
User: "I need automation"
Telos: "Tell me about your project..."
User: [provides details]
Telos: "What's your name?"
User: "John Doe"
Telos: "Email?"
User: "john@example.com"
Telos: "Company?"
User: "Acme Inc"
Telos: "I'll send your proposal shortly" ← TRIGGERS HERE
```

---

## 🐛 Troubleshooting

### Issue: "n8n not configured" in logs

**Solution:**
```bash
# Check your .env file has:
N8N_WEBHOOK_URL=https://areyouhuman.up.railway.app/webhook/YOUR-PATH

# Restart dev server
npm run dev
```

---

### Issue: Webhook returns 404

**Check:**
1. Workflow is **activated** (toggle in n8n)
2. Webhook path matches exactly
3. Railway deployment is running

---

### Issue: Webhook returns 500

**Check:**
1. Open n8n **Executions** tab
2. Find the failed execution
3. Look at error message
4. Usually: missing credentials or node configuration

---

### Issue: No execution appears in n8n

**Check:**
1. Workflow is **activated**
2. Railway app is running (check Railway logs)
3. Webhook URL is correct
4. Test with curl:

```bash
curl -X POST https://areyouhuman.up.railway.app/webhook/telos-new-lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","company":"Test Co"}'
```

---

## 🎉 You're Ready!

Once configured:

1. **Chat with Telos** → Collects lead info
2. **Lead qualified** → Triggers Railway n8n
3. **n8n processes** → Saves, emails, notifies
4. **All automated!** ✨

---

## 📚 Related Files

- **Trigger code:** `src/lib/n8nTrigger.ts`
- **Chat API:** `src/pages/api/chat.ts`
- **Workflow JSON:** `n8n-workflow-smart-lead-router.json`
- **Test script:** `test-n8n-webhook.js`

---

## 🆘 Still Having Issues?

1. Check Railway logs: `railway logs`
2. Check n8n executions tab
3. Check your Astro dev server logs
4. Run test script: `node test-n8n-webhook.js`

---

**Your n8n is already deployed! Just connect it and you're done.** 🚀


