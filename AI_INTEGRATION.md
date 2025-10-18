# 🤖 AI Integration Guide - OpenAI GPT-4o-mini

## 🎯 Overview

Your chat now supports **real AI conversations** using OpenAI's GPT-4o-mini model!

**Current Status:**
- ✅ OpenAI SDK installed
- ✅ AI module created with consultant persona
- ✅ Smart lead data extraction
- ✅ Automatic fallback to rule-based system
- ⏳ **Waiting for API key** to activate

---

## 🔑 Step 1: Get OpenAI API Key (5 minutes)

### 1.1 Create OpenAI Account
- Go to: https://platform.openai.com/signup
- Sign up with email or Google

### 1.2 Add Payment Method
- Go to: https://platform.openai.com/settings/organization/billing/overview
- Add a credit card (required for API access)
- **Cost:** ~$0.15 per 1000 messages (very cheap!)

### 1.3 Create API Key
- Go to: https://platform.openai.com/api-keys
- Click "Create new secret key"
- Name it: "Are You Human Copilot"
- **Copy the key** (starts with `sk-...`)
- ⚠️ Save it somewhere safe - you won't see it again!

---

## ⚙️ Step 2: Add to Local Environment (30 seconds)

### Update your `.env` file:

```bash
# Open .env file
nano .env

# Update the OpenAI line:
OPENAI_API_KEY=sk-your-actual-key-here

# Save and exit (Ctrl+O, Enter, Ctrl+X)
```

Or run this command (replace with your key):
```bash
cd /Users/muriloscigliano/areyouhuman
sed -i '' 's/sk-placeholder-add-your-key/sk-your-actual-key/' .env
```

---

## 🚀 Step 3: Add to Vercel (2 minutes)

### 3.1 Go to Vercel Environment Variables
https://vercel.com/murilosciglianos-projects/areyouhuman/settings/environment-variables

### 3.2 Add New Variable
```
Name: OPENAI_API_KEY
Value: sk-your-actual-key-here
```
- ✅ Check: Production
- ✅ Check: Preview
- ✅ Check: Development
- Click "Save"

### 3.3 Redeploy
- Go to Deployments tab
- Click three dots `...` on latest deployment
- Click "Redeploy"

---

## ✨ What You Get with AI

### 🎭 Intelligent Conversation
Instead of rigid if/else responses, the AI:
- **Adapts** to user's language style
- **Asks** relevant follow-up questions
- **Understands** context from entire conversation
- **Identifies** automation opportunities naturally

### 🧠 Smart Data Extraction
The AI automatically extracts:
- Name, company, role
- Industry and problems
- Budget and urgency
- Tools currently used
- Interest level (1-10 scoring)

### 💬 Natural Flow
System prompt optimized for:
```
"You are an expert automation consultant..."
- Ask thoughtful questions
- Identify automation opportunities
- Suggest practical solutions (n8n, Zapier, Make.com)
- Provide ROI estimates
- Keep responses concise (2-3 sentences)
```

---

## 🔄 How It Works

### Without API Key (Current):
```
User → Rule-Based System → Predefined Responses
```

### With API Key (After setup):
```
User → OpenAI GPT-4o-mini → Intelligent Responses
       ↓
   Automatic Lead Extraction → Supabase
```

### Architecture:
```javascript
if (isOpenAIConfigured()) {
  // Use AI-powered conversation
  reply = await getChatCompletion(messages);
  leadData = await extractLeadInfo(messages);
} else {
  // Fallback to rule-based
  reply = getRuleBased Response();
}
```

---

## 💰 Cost Estimate

**GPT-4o-mini Pricing:**
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens

**Average Conversation:**
- ~50 messages = ~10,000 tokens
- Cost: **~$0.005 (half a cent)**

**For 1000 leads:**
- Total cost: **~$5**
- Compare to: Hiring a sales rep ($50-100/hour)

**Monthly estimate (100 conversations):**
- **~$0.50/month** 🎉

---

## 🧪 Test the Integration

### Local Testing:
```bash
# Make sure dev server is running
npm run dev

# Open browser
open http://localhost:4321

# Start chatting!
# You'll see intelligent responses if API key is set
```

### Check Logs:
```bash
# Watch console for AI responses
# Should see "Using GPT-4o-mini" instead of "rule-based"
```

### Verify in Supabase:
```
Go to: Conversations table
Check: model_used column
Should show: "gpt-4o-mini" ✅
```

---

## 🎛️ Customization Options

### Change the AI Model

Edit `src/lib/openai.ts`:
```javascript
model: 'gpt-4o-mini', // Fast & cheap ($0.15/1M tokens)
// OR
model: 'gpt-4o',      // More powerful ($2.50/1M tokens)
// OR
model: 'gpt-4-turbo', // Best quality ($10/1M tokens)
```

### Adjust Response Length

```javascript
max_tokens: 300,  // Current (concise)
// OR
max_tokens: 500,  // Longer responses
// OR
max_tokens: 150,  // Very brief
```

### Change Temperature (Creativity)

```javascript
temperature: 0.7,  // Current (balanced)
// OR
temperature: 0.3,  // More focused/consistent
// OR
temperature: 0.9,  // More creative/varied
```

### Customize System Prompt

Edit the `SYSTEM_PROMPT` in `src/lib/openai.ts`:
```javascript
export const SYSTEM_PROMPT = `
You are [your custom role]...
- [Your instructions]
- [Your style]
- [Your goals]
`;
```

---

## 🔒 Security Best Practices

✅ **DO:**
- Keep API key in environment variables
- Use different keys for dev/production
- Monitor usage in OpenAI dashboard
- Set spending limits in OpenAI settings

❌ **DON'T:**
- Commit API keys to Git (already in .gitignore)
- Share keys publicly
- Use same key across multiple projects
- Forget to set rate limits

---

## 📊 Monitor Usage

### OpenAI Dashboard:
- https://platform.openai.com/usage
- See real-time usage
- Set spending alerts
- View cost breakdown

### Supabase Analytics:
```sql
-- Check which model is being used
SELECT 
  model_used,
  COUNT(*) as conversations,
  AVG(jsonb_array_length(messages)) as avg_messages
FROM conversations
GROUP BY model_used;
```

---

## 🐛 Troubleshooting

### "OpenAI is not configured" error
```bash
# Check if API key is set
cat .env | grep OPENAI

# Should show your key, not placeholder
```

### API key not working
- Verify it starts with `sk-`
- Check billing is enabled: https://platform.openai.com/settings/organization/billing
- Make sure you have credit added

### Responses still seem rule-based
- Restart dev server: Kill and run `npm run dev` again
- Clear browser cache
- Check console logs for errors

### Rate limit errors
- You hit API limits
- Upgrade plan: https://platform.openai.com/settings/organization/billing/limits
- Or wait a bit and try again

---

## 🎉 What's Next?

### Level 1: Basic Setup (Current)
- ✅ OpenAI integration
- ✅ Smart conversations
- ✅ Auto lead extraction

### Level 2: Advanced Features
- [ ] Add conversation context/tags
- [ ] Generate quotes automatically
- [ ] Email follow-ups with AI
- [ ] Multi-language support

### Level 3: Pro Features
- [ ] Voice input/output
- [ ] Screen sharing analysis
- [ ] ROI calculator integration
- [ ] CRM integration (HubSpot, Salesforce)

---

## 📚 Resources

- **OpenAI Docs:** https://platform.openai.com/docs
- **GPT-4o-mini Info:** https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/
- **Pricing:** https://openai.com/api/pricing/
- **Best Practices:** https://platform.openai.com/docs/guides/production-best-practices

---

**Ready to activate AI?** 

1. Get your API key: https://platform.openai.com/api-keys
2. Add to `.env` file
3. Add to Vercel
4. Test locally
5. Deploy! 🚀

