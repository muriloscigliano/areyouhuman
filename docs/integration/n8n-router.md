# 🧠 n8n Smart Lead Router — Complete Setup Guide

## 🎯 What This Does

**Smart routing based on data completeness:**

```
Lead from Telos
      ↓
Save to Supabase
      ↓
   Router Check:
   "Do we have budget + timeline?"
      ↓
   ┌──────┴──────┐
   ↓YES          ↓NO
✅ Route A       ❌ Route B
Generate PDF     Start Follow-up Journey
Send Quote       Email 1: Immediate
Mark "Quoted"    Email 2: Day 3
                 Email 3: Day 10
                 Mark "Cold"
```

---

## 📋 What You Need

- ✅ n8n instance (cloud or self-hosted)
- ✅ Supabase (already configured)
- ✅ Email service (SMTP, Resend, or SendGrid)
- 🔜 PDF generation service (optional: html2pdf.app or Puppeteer)
- 🔜 Dashboard tool (Metabase, Retool, or custom)

---

## 🚀 Step 1: Set Up n8n

### Option A: n8n Cloud (Recommended for beginners)
1. Go to https://n8n.io/cloud
2. Sign up for free plan
3. Create new workspace

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

## 📥 Step 2: Import the Smart Router Workflow

1. Open n8n dashboard
2. Click **"Workflows"** → **"Import from File"**
3. Upload: **`n8n-workflow-smart-lead-router.json`**
4. Click **"Import"**

You should see a complex flow with branching paths!

---

## ⚙️ Step 3: Configure Each Node

### 1️⃣ **Webhook Trigger**

**Node:** "Webhook — New Lead"

- **Path:** `telos-new-lead`
- **Method:** POST
- **Response Mode:** Response Node

**Copy webhook URL:**
- Click on node
- Copy "Production URL"
- Example: `https://your-n8n.app.n8n.cloud/webhook/telos-new-lead`

---

### 2️⃣ **Save to Supabase**

**Node:** "Save to Supabase"

**Configure:**
- **Credentials:** Add Supabase API
  - URL: `https://your-project.supabase.co`
  - Key: Service role key (from Supabase dashboard)
- **Table:** `leads`
- **Operation:** Insert
- **Columns:** Map these:
  - `name` → `{{ $json.name }}`
  - `email` → `{{ $json.email }}`
  - `company` → `{{ $json.company }}`
  - `project_summary` → `{{ $json.project_summary }}`
  - `budget_range` → `{{ $json.budget_range }}`
  - `timeline` → `{{ $json.timeline }}`
  - `automation_area` → `{{ $json.automation_area }}`
  - `source` → `{{ $json.source }}`
  - `quote_status` → `{{ $json.budget_range && $json.timeline ? 'ready' : 'incomplete' }}`

---

### 3️⃣ **Router — Check Data Completeness**

**Node:** "Router — Check Data Completeness"

**This is the magic! It decides which path to take.**

**Configure IF conditions:**
- **Condition 1:** `{{ $json.budget_range !== null && $json.budget_range !== '' }}` = `true`
- **Condition 2:** `{{ $json.timeline !== null && $json.timeline !== '' }}` = `true`
- **Combine:** ALL (both must be true)

**Result:**
- **True path →** Generate PDF (Route A)
- **False path →** Start follow-up emails (Route B)

---

## ✅ Route A: Complete Data → Generate Quote

### 4️⃣ **Generate PDF HTML**

**Node:** "Generate PDF HTML"

**Type:** Code node (JavaScript)

Already configured! This creates HTML for the PDF quote.

**Test it:**
- Click "Test node"
- Check output has `html` field

---

### 5️⃣ **Convert to PDF**

**Node:** "Convert to PDF"

**Option A: Use html2pdf.app**
- Sign up at https://html2pdf.app
- Get API key
- **URL:** `https://api.html2pdf.app/v1/generate`
- **Method:** POST
- **Headers:** `Authorization: Bearer YOUR_API_KEY`
- **Body:**
  ```json
  {
    "html": "{{ $json.html }}",
    "format": "A4"
  }
  ```

**Option B: Use Puppeteer (self-hosted)**
- Install Puppeteer node in n8n
- Configure HTML → PDF conversion

**Output:** PDF file (binary data)

---

### 6️⃣ **Send Quote Email**

**Node:** "Send Quote Email"

**Configure SMTP:**
- **From:** `telos@areyouhuman.studio`
- **To:** `{{ $json.email }}`
- **Subject:** "Your Custom AI Automation Proposal"
- **Attachments:** `{{ $json.pdf }}` (PDF from previous node)

**Email template:**
```html
<h2>Hey {{ $json.name }},</h2>

<p>Your custom AI automation proposal is ready! 🎉</p>

<p><strong>Project:</strong> {{ $json.automation_area }}<br>
<strong>Timeline:</strong> {{ $json.timeline }}<br>
<strong>Investment:</strong> {{ $json.budget_range }}</p>

<p>I've attached your detailed proposal as a PDF.</p>

<p><strong>Stay Human. Stay Ahead.</strong><br>— Telos</p>
```

---

### 7️⃣ **Update Lead — Quoted**

**Node:** "Update Lead — Quoted"

**Configure:**
- **Table:** `leads`
- **Operation:** Update
- **Match by:** `email`
- **Update fields:**
  - `quote_status` → `quoted`
  - `quote_url` → `{{ $json.pdf_url }}`
  - `quoted_at` → `{{ $now }}`

---

## ❌ Route B: Missing Data → Follow-up Journey

### 8️⃣ **Follow-up Email 1 (Immediate)**

**Node:** "Follow-up Email 1 (Immediate)"

**Purpose:** Politely ask for missing info

**Email template:**
```html
<h2>Hey {{ $json.name }},</h2>

<p>Thanks for chatting with me about your <strong>{{ $json.automation_area }}</strong> project!</p>

<p>To prepare your custom proposal, I just need a bit more info:</p>

<ul>
  {{ $json.budget_range ? '' : '<li>💰 What's your ballpark budget?</li>' }}
  {{ $json.timeline ? '' : '<li>🕒 When do you need this live?</li>' }}
</ul>

<p>Just hit reply and let me know — it'll take 30 seconds!</p>

<p>Or <a href="https://areyouhuman.studio/chat">continue our conversation here</a>.</p>

<p><strong>Stay Human. Stay Ahead.</strong><br>— Telos</p>
```

**Key features:**
- ✅ Conditional fields (only asks for what's missing)
- ✅ Low friction (reply or click link)
- ✅ Not pushy

---

### 9️⃣ **Update Lead — Nurturing**

**Node:** "Update Lead — Nurturing"

**Configure:**
- **Table:** `leads`
- **Match by:** `email`
- **Update:**
  - `quote_status` → `nurturing`
  - `followup_sequence` → `1`
  - `last_followup` → `{{ $now }}`

---

### 🔟 **Wait 3 Days**

**Node:** "Wait 3 Days"

**Configure:**
- **Unit:** Days
- **Amount:** 3

**This pauses the workflow for 3 days before sending Email 2!**

---

### 1️⃣1️⃣ **Follow-up Email 2 (Day 3)**

**Node:** "Follow-up Email 2 (Day 3)"

**Purpose:** Gentle reminder

**Email template:**
```html
<h2>Hey {{ $json.name }},</h2>

<p>Just checking in! I know things get busy, but I didn't want your project to slip through the cracks.</p>

<p>Your idea for <strong>{{ $json.automation_area }}</strong> at {{ $json.company }} sounded really exciting.</p>

<p>If you're still interested, just reply with:</p>

<ul>
  <li>💰 Your budget range</li>
  <li>🕒 Your ideal timeline</li>
</ul>

<p>Or let me know if now's not the right time — no pressure!</p>

<p><strong>Stay Human. Stay Ahead.</strong><br>— Telos</p>
```

**Tone:** Friendly, understanding, no pressure

---

### 1️⃣2️⃣ **Wait 7 Days**

**Node:** "Wait 7 Days"

Pauses for 7 more days (total: 10 days from start)

---

### 1️⃣3️⃣ **Follow-up Email 3 (Day 10)**

**Node:** "Follow-up Email 3 (Day 10)"

**Purpose:** Final, respectful check-in

**Email template:**
```html
<h2>Hey {{ $json.name }},</h2>

<p>This is my last follow-up (I promise! 😊)</p>

<p>I wanted to make sure you got what you needed. If you're ready to move forward with <strong>{{ $json.automation_area }}</strong>, I'm here.</p>

<p>If not right now, that's totally fine too. I'll keep your project details on file.</p>

<p><a href="https://areyouhuman.studio/chat">Chat with me anytime</a> — I'm always here.</p>

<p><strong>Stay Human. Stay Ahead.</strong><br>— Telos</p>
```

**Tone:** Graceful exit, door still open

---

### 1️⃣4️⃣ **Update Lead — Cold**

**Node:** "Update Lead — Cold"

**Configure:**
- **Table:** `leads`
- **Match by:** `email`
- **Update:**
  - `quote_status` → `cold`
  - `followup_sequence` → `3`
  - `last_followup` → `{{ $now }}`

**This marks the lead as "cold" for future dashboard tracking.**

---

## 📊 Step 4: Update Supabase Schema

Add new fields to your `leads` table for tracking:

```sql
-- Add quote status tracking
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS quote_status TEXT DEFAULT 'incomplete'
  CHECK (quote_status IN ('incomplete', 'ready', 'quoted', 'nurturing', 'cold', 'converted'));

-- Add follow-up tracking
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS followup_sequence INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_followup TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quote_url TEXT;

-- Create index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_leads_quote_status ON leads(quote_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
```

---

## 🔗 Step 5: Connect to Your Astro App

1. **Copy webhook URL** from n8n (Step 3, node 1)

2. **Add to `.env`:**
```bash
N8N_WEBHOOK_URL=https://your-n8n-url/webhook/telos-new-lead
```

3. **Restart dev server:**
```bash
npm run dev
```

---

## 🧪 Step 6: Test Both Routes

### Test Route A: Complete Data (→ PDF Quote)

**Chat sequence:**
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
Telos: "What's your budget range?"
You: "$10k-$20k"  ← CRITICAL: Provide budget
Telos: "When do you need this live?"
You: "3 months"  ← CRITICAL: Provide timeline
```

**Expected result:**
- ✅ n8n triggered
- ✅ PDF generated
- ✅ Email sent with PDF attachment
- ✅ Lead marked as "quoted"

---

### Test Route B: Missing Data (→ Follow-up)

**Chat sequence:**
```
You: "I need automation"
Telos: (asks about project)
You: "Payment processing"
Telos: "Who should I make the proposal out to?"
You: "Jane Smith"
Telos: "Where should I send your quote?"
You: "jane@test.com"
Telos: "What's your company called?"
You: "JaneCorp"
(Stop here — don't provide budget or timeline)
```

**Expected result:**
- ✅ n8n triggered
- ✅ Follow-up Email 1 sent immediately
- ✅ Lead marked as "nurturing"
- ⏳ Email 2 will send in 3 days
- ⏳ Email 3 will send in 10 days

---

## 📈 Step 7: Build Your Dashboard

### Option A: Supabase Dashboard (Quick)

Run these queries in Supabase SQL Editor:

```sql
-- Lead status overview
SELECT 
  quote_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM leads
GROUP BY quote_status
ORDER BY count DESC;

-- Recent leads
SELECT 
  name,
  email,
  company,
  automation_area,
  budget_range,
  timeline,
  quote_status,
  followup_sequence,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 20;

-- Follow-up needed today
SELECT 
  name,
  email,
  company,
  quote_status,
  last_followup,
  followup_sequence
FROM leads
WHERE quote_status = 'nurturing'
  AND last_followup < NOW() - INTERVAL '3 days'
ORDER BY last_followup ASC;

-- Conversion funnel
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE quote_status = 'quoted') as quoted,
  COUNT(*) FILTER (WHERE quote_status = 'converted') as converted,
  ROUND(
    COUNT(*) FILTER (WHERE quote_status = 'quoted') * 100.0 / COUNT(*), 1
  ) as quote_rate
FROM leads
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### Option B: Metabase (Recommended)

**Setup:**
1. Install Metabase: https://www.metabase.com/start/
2. Connect to Supabase (PostgreSQL connection)
3. Create dashboard with:
   - **Lead Status Pie Chart**
   - **Recent Leads Table**
   - **Conversion Funnel Line Chart**
   - **Follow-up Queue Table**

---

### Option C: Custom Dashboard (Advanced)

Build with Astro + Vue:

```typescript
// src/pages/dashboard.astro
---
import { supabase } from '../lib/supabase';

const { data: stats } = await supabase
  .from('leads')
  .select('quote_status')
  .then(({ data }) => {
    const counts = {};
    data?.forEach(lead => {
      counts[lead.quote_status] = (counts[lead.quote_status] || 0) + 1;
    });
    return { data: counts };
  });
---

<html>
  <body>
    <h1>Lead Dashboard</h1>
    <div class="stats">
      <div class="stat">
        <h2>{stats?.incomplete || 0}</h2>
        <p>Incomplete</p>
      </div>
      <div class="stat">
        <h2>{stats?.quoted || 0}</h2>
        <p>Quoted</p>
      </div>
      <div class="stat">
        <h2>{stats?.nurturing || 0}</h2>
        <p>Nurturing</p>
      </div>
      <div class="stat">
        <h2>{stats?.cold || 0}</h2>
        <p>Cold</p>
      </div>
    </div>
  </body>
</html>
```

---

## 🔥 Step 8: Monitor & Optimize

### Key Metrics to Track:

| Metric | Good | Bad | Action |
|--------|------|-----|--------|
| **Quote Rate** | >40% | <20% | Improve data collection |
| **Open Rate (Email 1)** | >50% | <30% | Improve subject line |
| **Reply Rate (Email 2)** | >10% | <5% | Make ask clearer |
| **Conversion Rate** | >20% | <10% | Optimize quote |

### Where to Check:

**In n8n:**
- Workflow executions (see success/failure)
- Execution time (should be <2 seconds)
- Error logs

**In Supabase:**
- Lead counts by status
- Average time to quote
- Follow-up response rate

**In Email Service:**
- Open rates
- Click rates
- Bounce rates

---

## 🚨 Troubleshooting

### Issue 1: Router not working (all leads go to follow-up)

**Check:**
```javascript
// In router node, verify conditions:
{{ $json.budget_range !== null && $json.budget_range !== '' }}
{{ $json.timeline !== null && $json.timeline !== '' }}
```

**Test:** Manually send webhook with complete data:
```bash
curl -X POST https://your-n8n-url/webhook/telos-new-lead \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "company": "TestCorp",
    "project_summary": "Test project",
    "budget_range": "$10k",
    "timeline": "3 months"
  }'
```

Should go to Route A (quote)!

---

### Issue 2: PDF generation failing

**Option 1:** Use simpler PDF service
- Try https://api.html2pdf.app
- Or use Google Docs API

**Option 2:** Skip PDF for now
- Just send email with HTML content
- Add "View online" link instead

---

### Issue 3: Follow-up emails not sending after delay

**Check:**
- Wait nodes are configured correctly
- Workflow is still active
- n8n instance is running (for self-hosted)

**Note:** n8n Cloud handles wait nodes automatically!

---

## 📊 Expected Results

After setup, here's what happens:

### For Complete Leads (Route A):
```
Telos chat → Budget + Timeline collected
              ↓
      n8n webhook triggered
              ↓
      Router: "Complete data" ✅
              ↓
       Generate PDF quote
              ↓
      Email sent with attachment
              ↓
     Lead marked "quoted"
              ↓
     Dashboard shows "1 new quote"
```

### For Incomplete Leads (Route B):
```
Telos chat → Missing budget or timeline
              ↓
      n8n webhook triggered
              ↓
      Router: "Incomplete data" ❌
              ↓
     Email 1: "Quick follow-up"
              ↓
     Lead marked "nurturing"
              ↓
       Wait 3 days
              ↓
     Email 2: "Still interested?"
              ↓
       Wait 7 days
              ↓
     Email 3: "Last check-in"
              ↓
     Lead marked "cold"
              ↓
     Dashboard shows "Follow-up complete"
```

---

## 🎯 Next Steps

**Week 1:**
- ✅ Set up basic routing
- ✅ Test both paths
- ✅ Monitor first 10 leads

**Week 2:**
- 🔜 Add PDF generation
- 🔜 Build simple dashboard
- 🔜 Track conversion rates

**Week 3:**
- 🔜 Optimize email copy based on open rates
- 🔜 Add SMS notifications (Twilio)
- 🔜 Connect CRM (HubSpot/Pipedrive)

**Week 4:**
- 🔜 A/B test follow-up sequences
- 🔜 Add lead scoring
- 🔜 Automate invoice generation

---

## 🆘 Need Help?

**Common questions:**
- "How do I test without sending real emails?" → Use mailtrap.io
- "Can I skip PDF generation?" → Yes! Just send HTML email
- "How do I pause follow-ups?" → Deactivate workflow or add "stop" condition

**Resources:**
- n8n Community: https://community.n8n.io/
- This project's docs: See `N8N_INTEGRATION_COMPLETE.md`
- Video tutorial: (coming soon!)

---

**🎉 You're ready! Import the workflow and start routing your leads intelligently!** 🚀

