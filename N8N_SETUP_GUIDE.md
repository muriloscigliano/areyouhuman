# 🚀 n8n Integration Setup Guide

## 🎯 Overview

When Telos qualifies a lead (collects name, email, company, project details), it automatically triggers an **n8n workflow** that:

1. **Saves lead** to Supabase
2. **Sends email** to the lead
3. **Notifies Slack** (optional)
4. **Generates PDF quote** (optional)

---

## 📋 Prerequisites

- ✅ Telos chat working (name, email, company collection)
- ✅ Supabase configured
- ✅ n8n instance running (cloud or self-hosted)
- 🔜 Email service (SMTP, Resend, or SendGrid)
- 🔜 Slack webhook (optional)

---

## 🛠️ Step 1: Set Up n8n

### Option A: n8n Cloud (Easiest)
1. Go to https://n8n.io/cloud
2. Sign up for free
3. Create a new workflow

### Option B: Self-Hosted (Docker)
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Access at: http://localhost:5678

---

## 📥 Step 2: Import the Workflow

1. **Open n8n** dashboard
2. Click **"Workflows"** → **"Import from File"**
3. Upload: `n8n-workflow-telos-lead-pipeline.json`
4. Click **"Import"**

You should see:
```
Webhook Trigger → Save to Supabase → Send Email + Notify Slack → Respond
```

---

## ⚙️ Step 3: Configure Workflow Nodes

### 1️⃣ **Webhook Trigger Node**

- **Path**: `telos-new-lead`
- **Method**: `POST`
- **Response Mode**: `Response Node`

**Get your webhook URL:**
- Click on "Webhook Trigger" node
- Copy the **Production URL**
- Should look like: `https://your-n8n.app.n8n.cloud/webhook/telos-new-lead`

---

### 2️⃣ **Save to Supabase Node**

Click on "Save to Supabase" and configure:

**Credentials:**
- **Supabase URL**: `https://your-project.supabase.co`
- **Supabase Key**: Your service role key (from Supabase dashboard)

**Parameters:**
- **Table**: `leads`
- **Operation**: `Insert`
- **Columns**: Map incoming data:
  - `name` → `{{ $json.name }}`
  - `email` → `{{ $json.email }}`
  - `company` → `{{ $json.company }}`
  - `project_title` → `{{ $json.project_title }}`
  - `project_summary` → `{{ $json.project_summary }}`
  - `budget_range` → `{{ $json.budget_range }}`
  - `timeline` → `{{ $json.timeline }}`
  - `source` → `{{ $json.source }}`

---

### 3️⃣ **Send Email to Lead Node**

**If using SMTP:**
- **SMTP Host**: `smtp.gmail.com` (or your provider)
- **Port**: `587`
- **Username**: your-email@gmail.com
- **Password**: app-specific password

**If using Resend:**
- Use **HTTP Request** node instead
- POST to `https://api.resend.com/emails`
- Header: `Authorization: Bearer YOUR_RESEND_API_KEY`

**Email Template:**
```html
<h2>Hey {{ $json.name }},</h2>

<p>Thanks for sharing your project with me!</p>

<ul>
  <li><strong>Project:</strong> {{ $json.project_title }}</li>
  <li><strong>Summary:</strong> {{ $json.project_summary }}</li>
  <li><strong>Budget:</strong> {{ $json.budget_range }}</li>
  <li><strong>Timeline:</strong> {{ $json.timeline }}</li>
</ul>

<p>I'll follow up with your detailed proposal soon.</p>

<p><strong>Stay Human. Stay Ahead.</strong><br>— Telos</p>
```

---

### 4️⃣ **Notify Slack Node** (Optional)

1. **Create Slack Incoming Webhook:**
   - Go to https://api.slack.com/messaging/webhooks
   - Create webhook for your channel
   - Copy webhook URL

2. **Configure HTTP Request Node:**
   - **Method**: POST
   - **URL**: Your Slack webhook URL
   - **Body**: JSON
   ```json
   {
     "text": "🎯 New qualified lead from Telos",
     "blocks": [
       {
         "type": "section",
         "text": {
           "type": "mrkdwn",
           "text": "*{{ $json.name }}* from *{{ $json.company }}*\n{{ $json.project_summary }}"
         }
       }
     ]
   }
   ```

---

## 🔗 Step 4: Connect to Your Astro App

1. **Copy your n8n webhook URL** (from Step 3, node 1)

2. **Add to your `.env` file:**
```bash
N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/telos-new-lead
```

3. **Restart your dev server:**
```bash
npm run dev
```

---

## 🧪 Step 5: Test the Integration

### Test 1: Complete Chat Flow

1. Open http://localhost:4321
2. Start chat with Telos
3. Complete the 5-message sequence:
   ```
   You: "I need automation"
   Telos: (asks about project)
   You: "Payment processing"
   Telos: "Who should I make the proposal out to?"
   You: "John Doe"
   Telos: "Where should I send your quote?"
   You: "john@test.com"
   Telos: "What's your company called?"
   You: "TestCorp"
   ```

4. Continue conversation until Telos says something with "send", "email", or "proposal"

### Test 2: Check Terminal Logs

You should see:
```
🎯 Lead qualified! Triggering n8n automation workflow...
🚀 Triggering n8n webhook for lead: John Doe
✅ n8n workflow triggered successfully!
```

### Test 3: Verify in n8n

1. Go to n8n dashboard
2. Click on "Executions"
3. You should see a new execution
4. Check each node to see the data flow

### Test 4: Check Supabase

```sql
SELECT * FROM leads ORDER BY created_at DESC LIMIT 1;
```

Should show John Doe with all details!

### Test 5: Check Email

- Lead should receive email at `john@test.com`
- Check spam folder if not in inbox

---

## 🔥 Advanced: Multiple Workflows

You can trigger different workflows based on context:

### Workflow 1: New Lead (Immediate)
**Trigger**: Lead qualifies  
**Actions**: Save + Email confirmation

### Workflow 2: Quote Ready (After 1 hour)
**Trigger**: Delay node (1 hour)  
**Actions**: Generate PDF + Send with attachment

### Workflow 3: Follow-Up (After 3 days)
**Trigger**: Schedule (3 days)  
**Actions**: Send follow-up email

---

## 📊 Monitoring & Debugging

### Check if n8n is configured:
```javascript
import { isN8NConfigured } from './lib/n8nTrigger';

if (isN8NConfigured()) {
  console.log('✅ n8n is ready');
} else {
  console.log('⚠️ n8n not configured');
}
```

### Test webhook manually:
```bash
curl -X POST https://your-n8n-url/webhook/telos-new-lead \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-123",
    "name": "Test User",
    "email": "test@example.com",
    "company": "TestCorp",
    "project_title": "AI Automation",
    "project_summary": "Testing webhook integration",
    "budget_range": "$5k-$10k",
    "timeline": "2-3 months",
    "source": "Manual Test"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Lead processed",
  "workflowId": "telos-new-lead"
}
```

### Common Issues:

**Issue 1: "n8n not configured"**
- ✅ Check `.env` has `N8N_WEBHOOK_URL`
- ✅ Restart dev server after adding env var
- ✅ Webhook URL must start with `https://`

**Issue 2: "Webhook trigger failed"**
- ✅ Activate workflow in n8n (toggle switch)
- ✅ Check webhook URL is correct
- ✅ Test webhook manually with curl

**Issue 3: "Email not sending"**
- ✅ Configure SMTP credentials in n8n
- ✅ Check email template variables
- ✅ Test email node separately

---

## 🎨 Customization

### Add PDF Generation

1. Add **"Code" node** after "Save to Supabase"
2. Generate HTML:
```javascript
const html = `
  <h1>Proposal for ${items[0].json.name}</h1>
  <h2>${items[0].json.project_title}</h2>
  <p>${items[0].json.project_summary}</p>
  <p><strong>Budget:</strong> ${items[0].json.budget_range}</p>
  <p><strong>Timeline:</strong> ${items[0].json.timeline}</p>
`;
return [{ json: { html } }];
```

3. Add **"HTML to PDF" node**
4. Add **"Supabase Storage Upload" node**
5. Update email to include PDF attachment

### Add CRM Integration

Add nodes for:
- **HubSpot** (create contact + deal)
- **Pipedrive** (create person + deal)
- **Notion** (create page in database)

---

## 📈 Next Steps

1. ✅ **Set up basic workflow** (webhook → save → email)
2. 🔜 **Add PDF generation** (using html-pdf-node)
3. 🔜 **Add Slack notifications** (for team)
4. 🔜 **Add follow-up automation** (3-day delay)
5. 🔜 **Add analytics** (track conversion rates)

---

## 💡 Tips

- **Test locally first** with n8n desktop app
- **Use webhook.site** to debug payloads
- **Start simple** (just save to Supabase)
- **Add features gradually** (email, Slack, PDF)
- **Monitor executions** in n8n dashboard
- **Set up error notifications** (email on failure)

---

## 🆘 Need Help?

**n8n Community:**
- Forum: https://community.n8n.io/
- Discord: https://discord.gg/n8n
- Docs: https://docs.n8n.io/

**Are You Human? Support:**
- Check terminal logs for errors
- Test webhook with curl
- Verify Supabase RLS policies
- Check n8n execution history

---

**🎉 You're all set!** Telos will now automatically trigger your n8n workflow when leads are qualified! 🚀

