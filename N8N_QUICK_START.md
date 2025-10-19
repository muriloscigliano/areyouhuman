# 🚀 n8n Quick Start — What You Need to Do

## ✅ **3-Minute Setup Checklist:**

### **Step 1: Supabase (2 minutes)**

1. Open Supabase SQL Editor
2. Copy-paste entire contents of `supabase-lead-tracking-migration.sql`
3. Click **"Run"**
4. Verify: You should see "Migration Complete!"

**What this does:**
- Adds `quote_status` field (incomplete/ready/quoted/nurturing/cold)
- Adds `followup_sequence` (0-3 tracking)
- Creates dashboard views for analytics

---

### **Step 2: n8n Setup (1 minute)**

**Option A: n8n Cloud (Easiest)**
1. Go to https://n8n.io/cloud
2. Sign up (free plan available)
3. Create new workspace

**Option B: Docker (Self-hosted)**
```bash
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
# Access: http://localhost:5678
```

---

### **Step 3: Import Workflow (1 minute)**

1. In n8n dashboard, click **"Import from File"**
2. Upload: `n8n-workflow-smart-router.json`
3. Click **"Import"**

**What you'll see:**
```
Webhook → Save → Router
             ↓         ↓
          Route A  Route B
          (Quote) (Follow-up)
```

---

### **Step 4: Configure Credentials (5 minutes)**

#### **Supabase (Required)**
- Click any Supabase node
- Add credentials:
  - **URL:** `https://your-project.supabase.co`
  - **Key:** Service role key (from Supabase dashboard → Project Settings → API)

#### **Email (Required)**
- Click any "Send Email" node
- Choose your provider:

**Option 1: Gmail/SMTP**
- Host: `smtp.gmail.com`
- Port: `587`
- User: your-email@gmail.com
- Password: App-specific password

**Option 2: Resend (Recommended)**
- Sign up at https://resend.com
- Get API key
- Use HTTP Request node instead
- POST to `https://api.resend.com/emails`

---

### **Step 5: Get Webhook URL (30 seconds)**

1. Click on **"Webhook — New Lead"** node
2. Copy the **Production URL**
3. Should look like: `https://your-n8n.app.n8n.cloud/webhook/telos-new-lead`

---

### **Step 6: Connect to Your App (30 seconds)**

1. Open your `.env` file
2. Add:
```bash
N8N_WEBHOOK_URL=https://your-n8n-url/webhook/telos-new-lead
```
3. Restart dev server:
```bash
npm run dev
```

---

### **Step 7: Test It! (2 minutes)**

**Test Route A (Complete Data → PDF Quote):**
```
1. Open: http://localhost:4321
2. Chat with Telos
3. Provide: Name, Email, Company
4. Provide: Budget ($10k) + Timeline (3 months)  ← CRITICAL!
5. Check your email for PDF quote
```

**Test Route B (Incomplete → Follow-up):**
```
1. Open: http://localhost:4321
2. Chat with Telos
3. Provide: Name, Email, Company
4. Skip budget and timeline  ← Missing data!
5. Check email for follow-up (asking for missing info)
```

---

## 🎯 **What Happens After Setup:**

### **Route A: Lead has budget + timeline**
```
Chat → n8n triggered
          ↓
    Router checks: "Budget? ✅ Timeline? ✅"
          ↓
    Generate PDF quote
          ↓
    Email sent with attachment
          ↓
    Lead marked "quoted"
    ✅ DONE!
```

### **Route B: Lead missing budget or timeline**
```
Chat → n8n triggered
          ↓
    Router checks: "Budget? ❌ or Timeline? ❌"
          ↓
    Email 1: "Quick follow-up" (Immediate)
    Lead marked "nurturing"
          ↓
    Wait 3 days
          ↓
    Email 2: "Still interested?" (Day 3)
          ↓
    Wait 7 days
          ↓
    Email 3: "Last check-in" (Day 10)
    Lead marked "cold"
    ✅ DONE!
```

---

## 📊 **View Your Dashboard:**

### **Quick Check in Supabase:**
```sql
-- Lead status breakdown
SELECT * FROM lead_status_summary;

-- Recent leads
SELECT name, email, quote_status, followup_sequence
FROM leads
ORDER BY created_at DESC
LIMIT 10;

-- Leads needing follow-up
SELECT * FROM leads_needing_followup;
```

---

## 🆘 **Quick Troubleshooting:**

**Problem:** "n8n not triggering"
**Fix:** 
- Check `N8N_WEBHOOK_URL` in `.env`
- Restart dev server
- Activate workflow in n8n (toggle switch)

**Problem:** "Router always goes to Route B"
**Fix:**
- Make sure chat collects budget AND timeline
- Check router conditions in n8n
- Test with manual webhook call (see full guide)

**Problem:** "Emails not sending"
**Fix:**
- Configure SMTP credentials in n8n
- Use Resend instead (easier)
- Test email node separately in n8n

---

## 📖 **Full Documentation:**

**For complete step-by-step instructions:**
- Read: `N8N_SMART_ROUTER_GUIDE.md`

**For initial n8n setup:**
- Read: `N8N_SETUP_GUIDE.md`

**For integration overview:**
- Read: `N8N_INTEGRATION_COMPLETE.md`

---

## 🎯 **TL;DR — The Absolute Minimum:**

1. **Run SQL:** `supabase-lead-tracking-migration.sql` in Supabase
2. **Import workflow:** `n8n-workflow-smart-router.json` into n8n
3. **Add credentials:** Supabase + Email in n8n nodes
4. **Copy webhook URL:** From n8n webhook node
5. **Add to `.env`:** `N8N_WEBHOOK_URL=your-url`
6. **Test:** Complete chat with and without budget/timeline

**That's it!** Your smart router is live! 🚀

---

## 💡 **Pro Tips:**

✅ **Start simple:** Test without PDF generation first (just send HTML emails)
✅ **Use Resend:** Easier than SMTP setup
✅ **Monitor n8n executions:** Watch for errors
✅ **Check Supabase:** Verify data is being saved
✅ **Test both routes:** Make sure routing logic works

---

**Need help?** See `N8N_SMART_ROUTER_GUIDE.md` for detailed instructions! 📚

