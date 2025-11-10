# Complete Automation Workflow - Telos AI

**Status**: ✅ Fully Implemented

This document explains the complete automation workflow from lead capture to conversion, including all integrations between Astro, Supabase, and n8n.

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER INTERACTS WITH TELOS CHAT                              │
│    - Visitor opens chat modal                                   │
│    - Telos asks questions (5-message sequence)                  │
│    - GPT-4o-mini extracts structured data                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SAVE TO SUPABASE                                             │
│    - Lead saved with all collected data                         │
│    - Conversation saved as JSONB                                │
│    - Lead score calculated automatically (0-100)                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. SUPABASE DATABASE TRIGGER FIRES (AUTOMATIC)                  │
│    - Function: notify_n8n_webhook()                             │
│    - Sends POST request to n8n webhook                          │
│    - Includes: leadId, name, email, company, score, etc.        │
│    - Logged in webhook_logs table                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. N8N SMART LEAD ROUTER (AI-POWERED)                           │
│    - Analyzes lead quality with GPT-4                           │
│    - Scores based on: budget, problem clarity, urgency          │
│    - Routes to appropriate workflow                             │
└────────────┬───────────┬────────────────────────────────────────┘
             │           │
      ┌──────▼──────┐   └──────────┐
      │ Score ≥ 70  │              │ Score < 70
      │ QUALIFIED   │              │ NURTURE
      └──────┬──────┘              └──────┬──────────────────────┐
             │                             │                      │
             ▼                             ▼                      ▼
┌─────────────────────────┐  ┌──────────────────────┐  ┌────────────────┐
│ 5A. QUOTE GENERATION    │  │ 5B. NURTURE WORKFLOW │  │ 5C. SPAM/LOW   │
│  - Calculate pricing    │  │  - Drip email seq.   │  │  - Archive     │
│  - Generate PDF         │  │  - Follow-up reminders│ │  - No action   │
│  - Send quote email     │  │  - Educational content│ │                │
│  - Notify team (Slack)  │  │  - Re-engagement     │  │                │
└────────┬────────────────┘  └──────┬───────────────┘  └────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────────────┐  ┌──────────────────────┐
│ 6A. WEBHOOK: lead.created│ │ 6B. Long-term nurture│
│  - Send welcome email   │  │  - Weekly emails     │
│  - Update status        │  │  - Re-qualification  │
└────────┬────────────────┘  └──────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. LEAD RESPONDS TO QUOTE                                       │
└────────────┬────────────────────┬───────────────────────────────┘
             │                    │
      ┌──────▼──────┐      ┌──────▼──────┐
      │  ACCEPTED   │      │  DECLINED   │
      └──────┬──────┘      └──────┬──────┘
             │                    │
             ▼                    ▼
┌──────────────────────┐  ┌───────────────────────┐
│ 8A. ONBOARDING       │  │ 8B. FEEDBACK REQUEST  │
│  - Acceptance email  │  │  - Ask why declined   │
│  - Mark as converted │  │  - Move to nurture    │
│  - Create in PM tool │  │  - Long-term follow-up│
│  - Team notification │  │                       │
└──────────────────────┘  └───────────────────────┘
```

---

## 📊 Data Flow

### Step 1: Chat API (`/api/chat.ts`)

**What Happens:**
1. User sends message
2. GPT-4o-mini generates response
3. Extracts structured lead data every 3 messages
4. Validates email format and project quality
5. Saves to Supabase when sufficient data collected

**Key Files:**
- [src/pages/api/chat.ts](src/pages/api/chat.ts:188-221) - Main chat logic
- [src/lib/openai.ts](src/lib/openai.ts:144-236) - Data extraction
- [src/utils/emailValidator.ts](src/utils/emailValidator.ts) - Email validation
- [src/utils/projectValidator.ts](src/utils/projectValidator.ts) - Project quality check

**Data Extracted:**
```typescript
{
  name: string,
  email: string,
  company: string,
  problem_text: string,
  automation_area: string,
  tools_used: string[],
  budget_range: string,
  timeline: string,
  urgency: string,
  interest_level: number (1-10),
  lead_score: number (0-100, auto-calculated)
}
```

---

### Step 2: Supabase Storage

**What Happens:**
1. Lead inserted into `leads` table
2. Conversation saved to `conversations` table
3. Lead score auto-calculated by database trigger
4. Database trigger fires `notify_n8n_webhook()` function

**Key Tables:**
- `leads` - All lead data with calculated score
- `conversations` - Full chat history as JSONB
- `webhook_logs` - Debug logs for n8n triggers

**Database Trigger:**
```sql
CREATE TRIGGER notify_n8n_on_lead_insert
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_n8n_webhook();
```

---

### Step 3: N8N Webhook (Automatic)

**What Happens:**
1. Supabase sends POST to n8n webhook URL
2. Payload includes all lead data + lead_score
3. n8n receives and processes webhook
4. Routes to appropriate workflow

**Webhook Payload:**
```json
{
  "event": "lead.created",
  "data": {
    "leadId": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Corp",
    "problem_text": "Need to automate customer support",
    "automation_area": "Customer Service",
    "budget_range": "$5k-$20k",
    "interest_level": 8,
    "lead_score": 85,
    "source": "Telos Chat"
  }
}
```

**Configuration:**
```sql
-- Set in Supabase Vault or via SQL
ALTER DATABASE postgres
SET app.settings.n8n_webhook_url = 'https://your-n8n.com/webhook/telos-lead';
```

---

### Step 4: N8N Smart Router

**Workflow Logic:**

```javascript
// n8n uses GPT-4 to analyze lead quality
const analysis = await ai.analyze({
  budget: lead.budget_range,
  problem: lead.problem_text,
  score: lead.lead_score,
  urgency: lead.urgency
});

if (analysis.score >= 70) {
  // Route to quote generation
  trigger('quote-generator');
} else if (analysis.score >= 40) {
  // Route to nurture workflow
  trigger('follow-up-automation');
} else {
  // Archive as spam/low-quality
  trigger('archive');
}
```

---

### Step 5: Bidirectional Webhooks

The app receives webhooks BACK from n8n after processing:

#### A. Lead Created Handler

**When:** n8n finishes processing a new lead
**Endpoint:** `POST /api/webhook` with `event: "lead.created"`

**What It Does:**
1. Sends welcome email to lead
2. Updates lead status to `contacted`
3. Logs team notification

**Code:** [src/pages/api/webhook.ts:109-226](src/pages/api/webhook.ts)

**Email Template:**
- 🎉 Thanks for connecting
- Explains what happens next
- Sets expectations (24hr proposal)
- Includes their challenge/problem

---

#### B. Quote Accepted Handler

**When:** Lead accepts a quote (via email link or dashboard)
**Endpoint:** `POST /api/webhook` with `event: "quote.accepted"`

**What It Does:**
1. Updates quote status to `accepted`
2. Sends onboarding email
3. Updates lead status to `converted`
4. Triggers project creation workflow

**Code:** [src/pages/api/webhook.ts:231-370](src/pages/api/webhook.ts)

**Email Template:**
- 🎉 Welcome aboard
- Kickoff call scheduling
- Project dashboard access
- Team introduction

---

#### C. Quote Declined Handler

**When:** Lead declines a quote
**Endpoint:** `POST /api/webhook` with `event: "quote.declined"`

**What It Does:**
1. Updates quote status to `declined`
2. Sends feedback request email
3. Updates lead status to `nurture`
4. Adds to long-term drip campaign

**Code:** [src/pages/api/webhook.ts:375-521](src/pages/api/webhook.ts)

**Email Template:**
- 💭 Thanks for considering us
- Asks for honest feedback
- Leaves door open for future
- Professional + empathetic

---

#### D. Conversation Completed Handler

**When:** Chat conversation ends successfully
**Endpoint:** `POST /api/webhook` with `event: "conversation.completed"`

**What It Does:**
1. Marks conversation as `completed`
2. Checks lead_score for qualification
3. If score ≥ 70: triggers quote generation
4. If score < 70: moves to nurture workflow

**Code:** [src/pages/api/webhook.ts:526-618](src/pages/api/webhook.ts)

---

## 🔐 Security

### Webhook Signature Verification

```typescript
// In /api/webhook.ts
const signature = request.headers.get('x-webhook-signature');
const webhookSecret = import.meta.env.WEBHOOK_SECRET;

if (webhookSecret && signature !== webhookSecret) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401
  });
}
```

**Setup:**
1. Generate a secret: `openssl rand -hex 32`
2. Add to `.env`: `WEBHOOK_SECRET=your_generated_secret`
3. Configure in n8n: Add header `x-webhook-signature: your_generated_secret`

### Row-Level Security (RLS)

All Supabase tables have RLS enabled:
- Anonymous users: Can INSERT leads/conversations
- Service role: Full access (for API routes)
- Authenticated users: Future feature (read own data)

---

## 📧 Email Configuration

### Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Add to `.env`:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```
4. Verify domain (or use `onboarding@resend.dev` for testing)

### Email Templates

All emails are in [src/pages/api/webhook.ts](src/pages/api/webhook.ts) with:
- Responsive HTML
- Brand colors (#fb6400 orange gradient)
- Mobile-optimized
- Fallback text content

---

## 🧪 Testing the Complete Flow

### 1. Test Chat → Supabase

```bash
# Start dev server
npm run dev

# Open http://localhost:4322
# Open chat modal
# Have a conversation with Telos
# Provide: name, email, company, project details
```

**Verify:**
```sql
-- Check lead was created
SELECT * FROM leads ORDER BY created_at DESC LIMIT 1;

-- Check conversation saved
SELECT * FROM conversations ORDER BY started_at DESC LIMIT 1;

-- Check webhook attempt
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 1;
```

---

### 2. Test Supabase → n8n Webhook

**Manual trigger test:**
```sql
-- Insert test lead (will trigger n8n webhook)
INSERT INTO leads (name, email, company, problem_text, automation_area, interest_level)
VALUES (
  'Test User',
  'test@example.com',
  'Test Co',
  'Need automation for customer support workflows',
  'Customer Service',
  8
);

-- Check webhook log
SELECT * FROM webhook_logs
WHERE event_type = 'lead.created'
ORDER BY created_at DESC
LIMIT 1;
```

**Check n8n received it:**
- Go to n8n workflow execution history
- Look for incoming webhook with matching leadId
- Verify all data fields present

---

### 3. Test n8n → Webhook Callbacks

**Test lead.created:**
```bash
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: YOUR_SECRET" \
  -d '{
    "event": "lead.created",
    "data": {
      "leadId": "test-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Corp",
      "problem_text": "Need automation",
      "automation_area": "Sales"
    }
  }'
```

**Check:**
- Email sent to john@example.com
- Lead status updated to `contacted` in Supabase

**Test quote.accepted:**
```bash
curl -X POST https://your-app.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: YOUR_SECRET" \
  -d '{
    "event": "quote.accepted",
    "data": {
      "quote_id": "existing-quote-uuid"
    }
  }'
```

---

## 📊 Monitoring & Debugging

### Check Webhook Logs

```sql
-- Recent webhook attempts
SELECT
  event_type,
  status_code,
  error,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;

-- Failed webhooks only
SELECT * FROM webhook_logs
WHERE error IS NOT NULL OR status_code >= 400
ORDER BY created_at DESC;
```

### Check Lead Pipeline

```sql
-- Lead status distribution
SELECT status, COUNT(*) as count
FROM leads
GROUP BY status
ORDER BY count DESC;

-- High-quality leads
SELECT * FROM high_quality_leads LIMIT 10;

-- Leads needing follow-up
SELECT * FROM leads_needing_followup LIMIT 10;
```

### Check Conversion Funnel

```sql
SELECT * FROM conversion_funnel;
```

---

## 🚀 Deployment Checklist

### Supabase
- [ ] Run `supabase/schema.sql`
- [ ] Configure n8n webhook URL in Vault or SQL
- [ ] Verify RLS policies enabled
- [ ] Test database trigger fires

### n8n
- [ ] Import workflow JSON files
- [ ] Configure Supabase credentials
- [ ] Set webhook secret
- [ ] Configure email/Slack nodes
- [ ] Test each workflow independently

### Vercel
- [ ] Add environment variables:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
  - `RESEND_API_KEY`
  - `N8N_WEBHOOK_URL` (optional)
  - `WEBHOOK_SECRET`
- [ ] Deploy to production
- [ ] Test webhook endpoint accessible

---

## 🔧 Environment Variables Reference

```env
# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key (optional, for admin operations)

# OpenAI
OPENAI_API_KEY=sk-your-api-key

# Resend (Email)
RESEND_API_KEY=re_your_api_key

# n8n (Optional - database trigger handles it)
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/telos-lead

# Webhook Security
WEBHOOK_SECRET=your-generated-secret-key
```

---

## 🎯 Key Improvements from Original Code

### 1. **Fixed n8n Trigger Bug** ✅
- **Before**: Manual trigger in chat.ts with undefined `currentLeadId`
- **After**: Automatic database trigger with real leadId
- **Benefit**: n8n gets complete data, no race conditions

### 2. **Implemented All Webhook Handlers** ✅
- **Before**: TODOs only
- **After**: Full bidirectional communication
- **Benefit**: Complete automation loop

### 3. **Email Integration** ✅
- **Before**: Stubbed
- **After**: Production-ready Resend integration
- **Benefit**: Automated lead nurturing

### 4. **Database Schema** ✅
- **Before**: Missing
- **After**: Complete with triggers, RLS, analytics
- **Benefit**: Scalable foundation

---

## 📚 Additional Resources

- [Supabase Setup Guide](supabase/SETUP_GUIDE.md)
- [Database Schema](supabase/schema.sql)
- [n8n Workflow JSON](n8n-workflow-smart-lead-router.json)
- [Email Templates](src/lib/sendEmail.ts)
- [Webhook Handler](src/pages/api/webhook.ts)

---

**🎉 Status: Production Ready**

This automation system is now fully functional and ready to handle real leads from qualification to conversion.
