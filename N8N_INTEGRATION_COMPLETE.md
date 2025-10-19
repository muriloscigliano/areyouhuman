# ✅ n8n Integration — COMPLETE!

## 🎉 **What's Been Implemented:**

Your **Telos chat** now automatically triggers **n8n workflows** when leads are qualified!

---

## 📊 **The Flow:**

```
User chats with Telos
       ↓
Collects: Name, Email, Company, Project Details
       ↓
Lead Qualified (has all required data)
       ↓
🚀 Triggers n8n Webhook
       ↓
n8n Workflow Executes:
  1. Saves lead to Supabase
  2. Sends email to lead
  3. Notifies your Slack (optional)
  4. Can generate PDF quote (optional)
       ↓
✅ Lead is processed automatically!
```

---

## 🗂️ **Files Created:**

### 1. `src/lib/n8nTrigger.ts`
**Purpose:** Webhook trigger utility

**Functions:**
- `triggerN8NWebhook(leadData)` - Sends data to n8n
- `isN8NConfigured()` - Checks if n8n is set up
- `notifySlack(leadData)` - Optional Slack integration

**Usage:**
```typescript
import { triggerN8NWebhook } from './lib/n8nTrigger';

const result = await triggerN8NWebhook({
  leadId: 'abc123',
  name: 'John Doe',
  email: 'john@example.com',
  company: 'TestCorp',
  project_summary: 'Need payment automation',
  budget_range: '$10k-$20k',
  timeline: '3 months',
  source: 'Telos Chat'
});

if (result.success) {
  console.log('✅ n8n triggered!');
}
```

---

### 2. `n8n-workflow-telos-lead-pipeline.json`
**Purpose:** Ready-to-import n8n workflow

**Nodes included:**
1. **Webhook Trigger** - Receives data from your app
2. **Save to Supabase** - Stores lead in database
3. **Send Email** - Confirmation email to lead
4. **Notify Slack** - Team notification (optional)
5. **Respond to Webhook** - Confirms success

**How to use:**
1. Open n8n dashboard
2. Import this JSON file
3. Configure credentials
4. Activate workflow
5. Done!

---

### 3. `N8N_SETUP_GUIDE.md`
**Purpose:** Complete setup instructions

**Contents:**
- Prerequisites checklist
- n8n setup (cloud vs self-hosted)
- Workflow import instructions
- Node configuration (Supabase, email, Slack)
- Testing guide
- Debugging tips
- Advanced features (PDF, CRM, follow-ups)

---

## 🔧 **Files Modified:**

### 1. `src/pages/api/chat.ts`
**Added:**
- Import of `triggerN8NWebhook`
- Qualification check (name + email + company + project)
- Automatic trigger when Telos says "send", "email", "inbox", or "proposal"
- Error handling (won't break chat if n8n fails)

**Code snippet:**
```typescript
if (hasRequiredData && reply.includes('send')) {
  console.log('🎯 Lead qualified! Triggering n8n...');
  
  const result = await triggerN8NWebhook({
    leadId: currentLeadId,
    name: leadData.name,
    email: leadData.email,
    company: leadData.company,
    project_summary: leadData.problem_text,
    budget_range: leadData.budget_range,
    // ... more fields
  });
  
  if (result.success) {
    console.log('✅ n8n triggered!');
  }
}
```

### 2. `env.template`
**Added:**
```bash
# n8n Webhook Configuration (Optional)
N8N_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/telos-new-lead
N8N_BASE_URL=
N8N_SLACK_WEBHOOK=
```

---

## 🚀 **How to Set It Up:**

### Quick Start (5 minutes):

**Step 1: Set up n8n**
```bash
# Option A: Use n8n Cloud (easiest)
# Go to: https://n8n.io/cloud
# Sign up → Create workspace

# Option B: Run locally with Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  n8nio/n8n

# Access at: http://localhost:5678
```

**Step 2: Import workflow**
1. In n8n dashboard, click "Import"
2. Upload `n8n-workflow-telos-lead-pipeline.json`
3. Click "Import"

**Step 3: Configure nodes**

**Webhook node:**
- Already configured
- Copy the webhook URL

**Supabase node:**
- Add credentials (URL + service role key)
- Table: `leads`

**Email node:**
- Add SMTP credentials
- Or use HTTP Request for Resend

**Step 4: Add to .env**
```bash
# Copy webhook URL from n8n
N8N_WEBHOOK_URL=https://your-n8n-url/webhook/telos-new-lead
```

**Step 5: Restart dev server**
```bash
npm run dev
```

**Step 6: Test it!**
1. Open chat: http://localhost:4321
2. Complete 5-message sequence (name, email, company)
3. Watch terminal logs:
   ```
   🎯 Lead qualified! Triggering n8n...
   🚀 Triggering n8n webhook for lead: John Doe
   ✅ n8n workflow triggered successfully!
   ```
4. Check n8n "Executions" tab
5. Verify email was sent
6. Check Supabase for new lead

---

## 📋 **Testing Checklist:**

- [ ] n8n workflow imported and activated
- [ ] Supabase credentials configured
- [ ] Email credentials configured (SMTP or Resend)
- [ ] `N8N_WEBHOOK_URL` added to `.env`
- [ ] Dev server restarted
- [ ] Complete chat conversation with Telos
- [ ] Terminal shows "🎯 Lead qualified! Triggering n8n..."
- [ ] Terminal shows "✅ n8n workflow triggered successfully!"
- [ ] n8n execution appears in dashboard
- [ ] Lead saved in Supabase `leads` table
- [ ] Email received by test user
- [ ] (Optional) Slack notification received

---

## 🎯 **What Happens Now:**

### When a user chats with Telos:

**Message 1-2:** Project discovery
```
User: "I need automation"
Telos: "What's the main challenge?" (with examples)
User: "Payment processing"
```

**Message 3-5:** Contact collection (CRITICAL!)
```
Telos: "Who should I make the proposal out to?"
User: "John Doe"

Telos: "Where should I send your quote?"
User: "john@example.com"

Telos: "What's your company called?"
User: "TestCorp"
```

**Message 6+:** Project details
```
Telos: "What's your budget range?"
User: "$10k-$20k"

Telos: "When do you need this live?"
User: "3 months"
```

**Message 10+:** Qualification complete
```
Telos: "Perfect! I'll email your custom proposal shortly."
                    ↓
            🚀 n8n TRIGGERED
                    ↓
    Email sent + Slack notified + Lead saved
```

---

## 💡 **What You Can Do Now:**

### Immediate:
- ✅ Automatic lead capture in Supabase
- ✅ Email confirmation to every lead
- ✅ Team notifications via Slack
- ✅ Full audit trail in n8n

### Next Steps (Optional):
- 🔜 Generate PDF quotes (using html-pdf-node)
- 🔜 Attach PDF to email
- 🔜 Add 3-day follow-up automation
- 🔜 Integrate with CRM (HubSpot, Pipedrive)
- 🔜 Create analytics dashboard
- 🔜 Add SMS notifications (Twilio)

---

## 🔍 **Debugging:**

### Terminal logs to watch for:

**Success:**
```bash
🎯 Lead qualified! Triggering n8n automation workflow...
🚀 Triggering n8n webhook for lead: John Doe
✅ n8n workflow triggered successfully!
```

**n8n not configured (expected if not set up yet):**
```bash
⚠️ n8n not configured, skipping automation
```

**n8n failed (check webhook URL):**
```bash
❌ Failed to trigger n8n webhook: Failed to fetch
```

### Test manually:
```bash
curl -X POST https://your-n8n-url/webhook/telos-new-lead \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-123",
    "name": "Test User",
    "email": "test@example.com",
    "company": "TestCorp",
    "project_title": "AI Automation Test",
    "project_summary": "Testing webhook",
    "budget_range": "$5k",
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

---

## 📊 **Current Status:**

| Component | Status |
|-----------|--------|
| Data collection | ✅ Working (name, email, company) |
| Supabase save | ✅ Working (RLS fixed) |
| Lead extraction | ✅ Working (every message 2-10) |
| n8n trigger code | ✅ Implemented |
| n8n workflow template | ✅ Created |
| Setup documentation | ✅ Complete |
| **READY TO USE** | ✅ **YES!** |

---

## 🎉 **Next Action:**

**If you want to use n8n:**
1. Read `N8N_SETUP_GUIDE.md`
2. Set up n8n (cloud or Docker)
3. Import the workflow JSON
4. Configure credentials
5. Add webhook URL to `.env`
6. Test it!

**If you don't need n8n yet:**
- Everything still works!
- Leads are saved to Supabase
- Chat functions normally
- n8n is completely optional

---

## 🆘 **Need Help?**

Check these files:
- **Setup:** `N8N_SETUP_GUIDE.md` (complete walkthrough)
- **Code:** `src/lib/n8nTrigger.ts` (trigger utility)
- **Workflow:** `n8n-workflow-telos-lead-pipeline.json` (importable)
- **Example:** Terminal logs show each step

---

**🚀 You're all set! n8n integration is ready to go!**

Just follow `N8N_SETUP_GUIDE.md` when you're ready to activate it! 🎊

