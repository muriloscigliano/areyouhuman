# 🔧 n8n Router Logic Fix — Check for COMPLETE Data

## ❌ **The Problem:**

Current router only checks:
```javascript
budget_range !== null && timeline !== null
```

**This is WRONG!** You can't give a quote without knowing:
- What to build (problem/idea)
- What features they need
- What scope/complexity

---

## ✅ **The Solution:**

Router should check for **8 REQUIRED fields:**

```javascript
// REQUIRED FOR QUOTE:
1. name         ✅ Contact info
2. email        ✅ Contact info  
3. company      ✅ Contact info
4. problem_text ✅ WHAT they need
5. automation_area ✅ TYPE of solution
6. tools_used   ✅ Context/integration needs
7. budget_range ✅ Budget constraints
8. timeline     ✅ Time constraints
```

---

## 🛠️ **Updated Router Conditions (n8n):**

### Open your n8n workflow:
1. Click on **"Router — Check Data Completeness"** node
2. Replace the conditions with this:

### **New Conditions (ALL must be true):**

```javascript
// Condition 1: Has name
{{ $json.name !== null && $json.name !== '' }}

// Condition 2: Has email  
{{ $json.email !== null && $json.email !== '' }}

// Condition 3: Has company
{{ $json.company !== null && $json.company !== '' }}

// Condition 4: Has problem description
{{ $json.problem_text !== null && $json.problem_text !== '' }}

// Condition 5: Has automation area (what type of solution)
{{ $json.automation_area !== null && $json.automation_area !== '' }}

// Condition 6: Has budget
{{ $json.budget_range !== null && $json.budget_range !== '' }}

// Condition 7: Has timeline
{{ $json.timeline !== null && $json.timeline !== '' }}

// Condition 8: Has tools or features context (at least one)
{{ 
  ($json.tools_used && $json.tools_used.length > 0) || 
  ($json.automation_area && $json.automation_area !== '')
}}
```

### **Combine setting:**
- **Combine:** ALL (every condition must be true)

---

## 📝 **Update Follow-up Email 1 (Route B):**

When data is missing, tell them **exactly** what you need:

```html
<h2>Hey {{ $json.name }},</h2>

<p>Thanks for chatting with me about your project!</p>

<p>To prepare your custom AI automation proposal, I need a few more details:</p>

<ul style="margin: 20px 0;">
  {{ $json.name ? '' : '<li>👤 Your full name</li>' }}
  {{ $json.email ? '' : '<li>📧 Your email address</li>' }}
  {{ $json.company ? '' : '<li>🏢 Your company/business name</li>' }}
  {{ $json.problem_text ? '' : '<li>🎯 What problem you're trying to solve</li>' }}
  {{ $json.automation_area ? '' : '<li>🔧 What type of automation (e.g., payment processing, CRM, chatbot)</li>' }}
  {{ ($json.tools_used && $json.tools_used.length > 0) ? '' : '<li>🛠️ What tools/systems you're currently using</li>' }}
  {{ $json.budget_range ? '' : '<li>💰 Your budget range (even a rough estimate)</li>' }}
  {{ $json.timeline ? '' : '<li>🕒 When you need this live (e.g., 3 months, ASAP)</li>' }}
</ul>

<p>Just hit reply with these details — or <a href="https://areyouhuman.studio/chat">continue our chat here</a>.</p>

<p>This helps me create an accurate, tailored proposal just for you!</p>

<p><strong>Stay Human. Stay Ahead.</strong><br>— Telos</p>
```

---

## 🤔 **What About Optional "Nice-to-Have" Data?**

Some fields are **helpful but not required** for a quote:

### Optional (not blocking):
- `role` - Their job title
- `industry` - Their business sector  
- `interest_level` - How excited they are (1-10)
- `desired_features` - Specific feature requests

**These can be collected but won't block the quote!**

---

## 🎯 **Decision Tree:**

```
Lead qualified (name, email, company collected)
              ↓
      Router checks 8 fields:
              ↓
   ┌──────────┴──────────┐
   ↓                     ↓
   
ALL 8 FIELDS? ✅        MISSING ANY? ❌
              ↓                     ↓
        Route A                Route B
    Generate PDF            Follow-up Email
    Send Quote              (listing what's missing)
```

---

## 📊 **Examples:**

### Example 1: COMPLETE (→ Route A, send quote)
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "company": "TechCorp",
  "problem_text": "Need to automate payment processing",
  "automation_area": "payment processing",
  "tools_used": ["Stripe", "PayPal"],
  "budget_range": "$10k-$20k",
  "timeline": "3 months"
}
```
**Result:** ✅ All 8 fields → Generate PDF quote immediately!

---

### Example 2: INCOMPLETE - Missing budget (→ Route B, follow-up)
```json
{
  "name": "Jane Smith",
  "email": "jane@startup.com",
  "company": "StartupX",
  "problem_text": "Build AI chatbot",
  "automation_area": "chatbot",
  "tools_used": ["Zendesk"],
  "budget_range": null,  ← MISSING!
  "timeline": "2 months"
}
```
**Result:** ❌ Missing budget → Send follow-up email asking for budget

---

### Example 3: INCOMPLETE - Missing project details (→ Route B, follow-up)
```json
{
  "name": "Bob Wilson",
  "email": "bob@business.com",
  "company": "BobCo",
  "problem_text": null,  ← MISSING!
  "automation_area": null,  ← MISSING!
  "tools_used": [],
  "budget_range": "$5k",
  "timeline": "1 month"
}
```
**Result:** ❌ Missing project description → Can't quote without knowing what to build!

---

## 🔧 **How to Update Your n8n Workflow:**

### Step 1: Open n8n workflow
1. Go to n8n dashboard
2. Open "Telos — Smart Lead Router"

### Step 2: Update Router node
1. Click **"Router — Check Data Completeness"**
2. Delete old conditions
3. Add 8 new conditions (listed above)
4. Set **Combine:** ALL
5. Click **Save**

### Step 3: Update Follow-up Email 1
1. Click **"Follow-up Email 1 (Immediate)"**
2. Update HTML to show missing fields
3. Use conditional logic (shown above)
4. Click **Save**

### Step 4: Test it!
**Test A: Complete data**
- Provide ALL 8 fields
- Should go to Route A (quote)

**Test B: Missing budget**
- Provide 7 fields, skip budget
- Should go to Route B (follow-up)

**Test C: Missing project description**
- Provide contact + budget, skip problem/automation area
- Should go to Route B (follow-up asking for project details)

---

## 💡 **Pro Tip: Update Telos to Collect More Data**

Make sure Telos asks these questions in chat:

### Current sequence (good):
1. What's your challenge? → `problem_text`
2. Who should I make proposal out to? → `name`
3. Where should I send quote? → `email`
4. What's your company? → `company`

### ADD these questions:
5. What tools are you using? → `tools_used`
6. What's your budget range? → `budget_range`
7. When do you need this? → `timeline`
8. What's the main automation area? → `automation_area`

**This ensures you collect all 8 fields before triggering n8n!**

---

## ✅ **Updated Decision Matrix:**

| Field | Required? | Why? | If Missing → |
|-------|-----------|------|--------------|
| `name` | ✅ YES | Who to address | Follow-up |
| `email` | ✅ YES | Where to send | Follow-up |
| `company` | ✅ YES | Professional context | Follow-up |
| `problem_text` | ✅ YES | **WHAT to build** | Follow-up |
| `automation_area` | ✅ YES | **TYPE of solution** | Follow-up |
| `tools_used` | ✅ YES | Integration needs | Follow-up |
| `budget_range` | ✅ YES | Cost constraints | Follow-up |
| `timeline` | ✅ YES | Time constraints | Follow-up |
| `role` | ⚪ Optional | Nice to have | Can quote without |
| `industry` | ⚪ Optional | Context | Can quote without |
| `desired_features` | ⚪ Optional | Bonus details | Can quote without |

---

## 🎉 **Result:**

After this fix:
- ✅ Route A only triggers when you have **COMPLETE** information
- ✅ Follow-up emails **list exactly** what's missing
- ✅ No more "empty quotes" without project details
- ✅ Better quality leads in "quoted" status

---

**🚀 Update your n8n workflow now to fix the router logic!**

