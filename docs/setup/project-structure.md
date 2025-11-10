# 📁 Project Structure - Are You Human? Copilot

Complete file structure for the AI-powered automation quote generation system.

## 🗂️ Directory Tree

```
areyouhuman/
├── 📄 Configuration Files
│   ├── .gitignore               # Git ignore patterns
│   ├── .env                     # Environment variables (not in git)
│   ├── env.template             # Environment template
│   ├── astro.config.mjs         # Astro configuration with Vercel adapter
│   ├── tsconfig.json            # TypeScript configuration
│   ├── vercel.json              # Vercel deployment settings
│   ├── package.json             # Dependencies and scripts
│   └── package-lock.json        # Locked dependencies
│
├── 📚 Documentation
│   ├── README.md                # Project overview
│   ├── QUICK_START.md           # Quick setup guide
│   ├── SETUP_GUIDE.md           # Detailed setup instructions
│   ├── AI_INTEGRATION.md        # OpenAI integration guide
│   ├── STATUS.md                # Current project status
│   ├── context.md               # Project context
│   └── PROJECT_STRUCTURE.md     # This file
│
├── 🗄️ Database
│   └── supabase-schema.sql      # Complete database schema (5 tables)
│
├── 🎨 Public Assets
│   ├── public/
│   │   ├── favicon.svg          # Site favicon
│   │   └── quote-template.html  # Styled HTML template for PDF generation
│
├── 💻 Source Code
│   └── src/
│       │
│       ├── 🧩 Components (Vue)
│       │   ├── AiChat.vue       # Main chat interface
│       │   ├── AiInput.vue      # Chat input field
│       │   ├── AiMessage.vue    # Message display
│       │   ├── ChatMessage.vue  # Individual message component
│       │   └── LoadingDots.vue  # Loading animation
│       │
│       ├── 🎭 Layouts
│       │   └── LandingLayout.astro   # Main page layout
│       │
│       ├── 📄 Pages
│       │   ├── index.astro      # Landing page
│       │   └── api/             # API endpoints
│       │       ├── chat.ts      # OpenAI chat endpoint
│       │       ├── quote.ts     # PDF quote generation ⚠️ TODO: Install PDF library
│       │       ├── webhook.ts   # Webhook handler for n8n/Supabase
│       │       ├── debug.ts     # Debug endpoint
│       │       └── test-ai.ts   # AI testing endpoint
│       │
│       ├── 🔧 Utilities
│       │   ├── parsePrompt.js   # Load and compose markdown prompts
│       │   └── formatQuoteData.js  # Format quote data & calculate ROI
│       │
│       ├── 📚 Libraries
│       │   ├── openai.ts        # OpenAI client configuration
│       │   ├── supabase.ts      # Supabase client configuration
│       │   ├── pdfGenerator.ts  # PDF generation ⚠️ TODO: Implement
│       │   └── sendEmail.ts     # Email service ⚠️ TODO: Implement
│       │
│       ├── 🎣 Composables (Vue)
│       │   ├── useChatApi.js    # Chat API communication
│       │   └── useSupabase.js   # Supabase database operations
│       │
│       ├── 🎨 Styles
│       │   ├── global.css       # Existing global styles
│       │   └── globals.css      # New comprehensive global styles
│       │
│       └── 📊 Data
│           ├── prompts/         # AI Prompt System
│           │   ├── system.md           # System personality & role
│           │   ├── briefing.md         # Information collection guide
│           │   ├── quote-builder.md    # Quote generation guide
│           │   └── followup.md         # Follow-up email templates
│           │
│           ├── context/         # AI Context
│           │   ├── tone.md             # Brand voice & communication style
│           │   ├── knowledge.md        # Product/service knowledge base
│           │   └── faq.md              # Frequently asked questions
│           │
│           └── examples/        # Example Data
│               ├── quote-example.json      # Sample quote structure
│               ├── conversation.json       # Sample conversation
│               └── lead-example.json       # Sample lead data
│
└── 🔧 Scripts & Tests
    ├── setup.sh             # Automated setup script
    ├── test-openai.js       # OpenAI connection test
    ├── test-openai-simple.js
    └── test-supabase.js     # Supabase connection test
```

## 📦 Key Dependencies

### Core Framework
- **Astro** v5.14.6 - Static site generator with server-side rendering
- **Vue** v3.5.22 - Interactive components
- **@astrojs/vue** v5.1.1 - Vue integration for Astro
- **@astrojs/vercel** - Vercel adapter for serverless functions

### Backend Services
- **@supabase/supabase-js** v2.75.1 - Database & storage
- **openai** v4.52.7 - GPT-4o-mini API
- **axios** v1.12.2 - HTTP client

### UI/UX
- **gsap** v3.13.0 - Animations

### To Install (Optional Features)
- **html-pdf-node** - PDF generation (lightweight, Vercel-compatible)
  ```bash
  npm install html-pdf-node
  ```
- **resend** - Email service (modern, great DX)
  ```bash
  npm install resend
  ```

## 🗄️ Database Schema (Supabase)

### Tables

1. **`leads`** - Customer information
   - id, name, email, company, role, industry, etc.
   - Stores all lead data collected during chat

2. **`conversations`** - Chat messages
   - id, lead_id, role (user/assistant), message, timestamp
   - Full conversation history

3. **`quotes`** - Project proposals
   - id, lead_id, project_title, quote_data (JSONB), pdf_url, status
   - Generated quotes with all deliverables

4. **`quote_files`** - PDF storage metadata
   - id, quote_id, file_path, file_url, file_size
   - Tracks PDF uploads in Supabase Storage

5. **`emails`** - Email tracking
   - id, lead_id, quote_id, subject, status, sent_at
   - Email delivery tracking

## 🔄 Data Flow

```
1. User visits landing page
   ↓
2. Chats with AI (AiChat.vue → /api/chat → OpenAI)
   ↓
3. AI extracts lead info & project requirements
   ↓
4. Data saved to Supabase (leads, conversations tables)
   ↓
5. Quote generated (/api/quote)
   - Uses quote-template.html
   - Injects data from conversation
   - Converts HTML → PDF (pdfGenerator.ts)
   ↓
6. PDF uploaded to Supabase Storage (quote-files bucket)
   ↓
7. Quote record saved (quotes table)
   ↓
8. Email sent with PDF (sendEmail.ts)
   ↓
9. Email tracked (emails table)
```

## 🧠 AI Prompt System

### Modular Prompts
Prompts are stored as markdown files in `/src/data/prompts/`:

- **`system.md`** - Defines the AI's personality, role, and goals
- **`briefing.md`** - Guides information collection from users
- **`quote-builder.md`** - Structures quote generation
- **`followup.md`** - Creates follow-up email sequences

### Context Files
Context files in `/src/data/context/` provide additional knowledge:

- **`tone.md`** - Brand voice guidelines
- **`knowledge.md`** - Product/service details, pricing, use cases
- **`faq.md`** - Common questions and answers

### Usage
```javascript
import { buildSystemPrompt } from './src/utils/parsePrompt.js';

// Get prompt for briefing stage
const prompt = await buildSystemPrompt('briefing', {
  client_name: 'Sarah',
  industry: 'SaaS'
});
```

## 🎯 API Endpoints

### `/api/chat` (POST)
Handles AI conversations
- **Input**: `{ message, conversation_id, lead_id, history }`
- **Output**: `{ response, conversation_id }`
- **Uses**: OpenAI GPT-4o-mini

### `/api/quote` (POST)
Generates PDF quotes
- **Input**: `{ lead_id, client_name, project_title, deliverables, etc. }`
- **Output**: `{ success, quote_id, pdf_url }`
- **Uses**: pdfGenerator, Supabase Storage

### `/api/webhook` (POST)
Receives external webhooks
- **Input**: `{ event, data }`
- **Output**: `{ success, received }`
- **Uses**: Supabase updates, workflow triggers

### `/api/debug` (GET)
Environment debugging
- **Output**: Environment status (Supabase, OpenAI)

### `/api/test-ai` (POST)
AI connection testing
- **Input**: `{ message }`
- **Output**: AI response

## 🚀 Deployment

### Environment Variables Required

```env
# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Optional: Email
RESEND_API_KEY=re_...

# Optional: Webhooks
WEBHOOK_SECRET=your-secret
```

### Vercel Setup
1. Project is configured for Vercel serverless
2. Push to GitHub triggers auto-deploy
3. Add environment variables in Vercel dashboard
4. Vercel builds with `output: 'server'` mode

## ✅ What's Complete

- ✅ Astro + Vue + GSAP setup
- ✅ Supabase database schema (5 tables)
- ✅ OpenAI GPT-4o-mini integration
- ✅ Chat API endpoint working
- ✅ Vercel adapter configured
- ✅ Component structure
- ✅ Composables for API/DB
- ✅ Prompt system architecture
- ✅ Quote template (HTML)
- ✅ Utility functions
- ✅ Global styles

## ⚠️ TODO - Pending Implementation

1. **PDF Generation**
   ```bash
   npm install html-pdf-node
   ```
   - Implement in `src/lib/pdfGenerator.ts`
   - Test PDF output locally

2. **Email Service**
   ```bash
   npm install resend
   ```
   - Add RESEND_API_KEY to .env
   - Implement in `src/lib/sendEmail.ts`
   - Test email delivery

3. **Supabase Storage Setup**
   - Create `quote-files` bucket in Supabase dashboard
   - Set public access policy for PDF downloads

4. **AI Quote Extraction**
   - Enhance `/api/chat` to detect when ready for quote
   - Auto-trigger quote generation
   - Extract structured data from conversation

5. **Testing**
   - Test full flow: chat → quote → PDF → email
   - Error handling for each step
   - Monitoring and logging

## 📖 Quick Commands

```bash
# Development
npm run dev              # Start dev server (localhost:4321)

# Build & Deploy
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
node test-openai.js      # Test OpenAI connection
node test-supabase.js    # Test Supabase connection

# Git
git add .
git commit -m "message"
git push                 # Auto-deploys to Vercel
```

## 🎨 Design System

Color variables and utilities are defined in `/src/styles/globals.css`:
- Primary: `--color-primary` (#6366f1)
- Gradients: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`
- Utilities: `.btn`, `.card`, `.container`, etc.

## 📚 Resources

- **Astro Docs**: https://docs.astro.build
- **Supabase Docs**: https://supabase.com/docs
- **OpenAI API**: https://platform.openai.com/docs
- **Vercel Docs**: https://vercel.com/docs

---

**Last Updated**: 2025-10-19
**Status**: Core infrastructure complete, PDF/Email features pending

