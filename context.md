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

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  name text,
  email text,
  company text,
  role text,
  industry text,
  problem_text text,
  tools_used text[],
  goal text,
  budget_range text,
  urgency text,
  tech_familiarity text,
  automation_area text,
  complexity text,
  interest_level int,
  automation_idea text,
  suggested_tools text[],
  roi_estimate text,
  next_step text
);