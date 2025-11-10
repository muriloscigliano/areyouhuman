# 🎯 Lead Qualification Requirements

## To Get a Quote, You Need:

### ✅ **REQUIRED: Contact Information** (Must be collected in first 5 messages)
1. **Name** - Full name for proposal personalization
2. **Email** - Valid email address where quote will be sent
3. **Company** - Business/company name

### ✅ **REQUIRED: Project Details** (With Quality Standards)

#### 1. **Problem Description** (`problem_text`)
- **Minimum**: 20 characters
- **Must be specific** - Not vague like "automation" or "AI stuff"
- **Example Good**: "We're manually processing 200+ customer service tickets daily, which takes 4 hours. We need to automate responses for common questions."
- **Example Bad**: "automation" ❌

#### 2. **Automation Area** (`automation_area`)
- **Minimum**: 10 characters
- **Must be specific** - Not just "AI" or "automation"
- **Example Good**: "Customer service chatbot with WhatsApp integration"
- **Example Bad**: "AI" ❌

### 📊 **Quality Validation**

The system checks that:
- `problem_text` has at least 20 characters AND 3+ words
- `automation_area` has at least 10 characters AND 2+ words
- Both fields are not vague/generic responses

### 🎯 **Qualification Logic**

A lead is qualified when:
```typescript
hasRequiredData = 
  name exists AND
  email exists AND
  company exists AND
  projectValidation.isValid === true
```

Where `projectValidation.isValid` means:
- `problem_text` is present, ≥20 chars, not vague
- `automation_area` is present, ≥10 chars, not vague

### 📝 **Nice to Have** (Not Required, But Helpful)
- **Budget Range** - Helps tailor the proposal
- **Timeline** - When you need it live
- **Tools Used** - Current tech stack

### 🚀 **What Happens When Qualified**

Once all requirements are met AND Telos mentions sending/emailing the quote:
1. ✅ Lead data saved to Supabase
2. ✅ n8n workflow triggered (PDF generation, email, etc.)
3. ✅ Quote sent to your email

### ⚠️ **Common Issues**

**Problem**: "I gave all the info but no quote"
- **Check**: Is your `problem_text` specific enough? (needs 20+ chars)
- **Check**: Is your `automation_area` specific? (needs 10+ chars)
- **Check**: Did Telos say it will "send" or "email" the quote? (triggers automation)

**Problem**: "Telos didn't ask for my email"
- **Issue**: Contact info should be collected in messages 3-5
- **Fix**: Telos should ask: "Where should I send your quote?"

---

## 📋 Quick Checklist

Before expecting a quote, verify:
- [ ] Name collected
- [ ] Email collected  
- [ ] Company collected
- [ ] Problem description is specific (20+ chars)
- [ ] Automation area is specific (10+ chars)
- [ ] Telos mentioned sending/emailing the quote

---

**Source**: `src/pages/api/chat.ts` lines 163-166
**Validation**: `src/utils/projectValidator.ts`

