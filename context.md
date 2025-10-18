# 🚀 PROJECT SETUP PROMPT — Are You Human? Copilot (Astro + Vue + Supabase)

## 🧠 PROJECT CONTEXT

This is the **MVP for Are You Human? Copilot**, a conversational AI assistant embedded inside a landing page for the *Are You Human?* brand.

The landing page should:
- Showcase a clean, modern aesthetic (AI + human-first design).
- Include an **AI chat component** that collects user information, provides automation ideas, and stores conversations in Supabase.
- Be lightweight, fast, and easy to deploy (Vercel).

---

## 🧩 TECH STACK

| Layer | Tool | Purpose |
|--------|------|----------|
| **Frontend** | Astro + Vue 3 | Static landing with hydrated interactive chat |
| **Database** | Supabase (Postgres) | Store user leads + conversation data |
| **Backend** | Astro API routes + optional n8n webhook | Handle requests and LLM logic |
| **Animations** | GSAP | Smooth scroll + chat transitions |
| **Networking** | Axios | Chat → API communication |

---

## ⚙️ STRUCTURE

src/
 ├── components/
 │    └── AiChat.vue
 │    └── AiMessage.vue
 │    └── AiInput.vue
 ├── layouts/
 │    └── LandingLayout.astro
 ├── pages/
 │    └── index.astro
 └── styles/
      └── global.css

---

## 🧱 DATABASE SCHEMA (Supabase → Table: `leads`)

Stores core client information and source data.

create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  name text,
  email text,
  company text,
  role text,
  industry text,
  country text,
  source text, -- e.g., 'chat', 'form', 'referral'
  notes text
);

💬 TABLE: conversations

Stores chat interactions (so you can train future RAG models or re-analyze lead intent).

create table conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  created_at timestamp default now(),
  messages jsonb, -- [{role:'user', content:'...'},{role:'assistant', content:'...'}]
  summary text,   -- short AI summary of the conversation
  context_tags text[], -- e.g., ['automation', 'crm', 'gym']
  model_used text, -- 'gpt-4o-mini', 'claude-3.5-sonnet'
  status text default 'active' -- or 'archived'
);

📄 TABLE: quotes

Each quote/proposal generated from a conversation.

create table quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  conversation_id uuid references conversations (id) on delete set null,
  created_at timestamp default now(),
  project_title text,
  project_summary text,
  proposed_solution jsonb,  -- [{feature:'Automation Workflow', desc:'Connect Typeform + Notion'}]
  estimated_timeline text,
  estimated_cost text,
  roi_estimate text,
  ai_model text, -- model that generated it
  tone text, -- 'professional', 'friendly', etc.
  status text default 'draft' -- 'sent', 'viewed', 'accepted', 'rejected'
);

📎 TABLE: quote_files

Links each generated PDF file to its quote (and allows multiple versions).

create table quote_files (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes (id) on delete cascade,
  created_at timestamp default now(),
  file_url text,
  file_name text,
  sent_via text, -- 'email', 'manual', etc.
  email_status text, -- 'sent', 'opened', 'clicked'
);

📬 TABLE: emails (optional, if you want full automation tracking)

Useful for logging communications or follow-ups.

create table emails (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads (id) on delete cascade,
  quote_id uuid references quotes (id) on delete set null,
  created_at timestamp default now(),
  subject text,
  body text,
  status text default 'sent',
  recipient_email text
);
