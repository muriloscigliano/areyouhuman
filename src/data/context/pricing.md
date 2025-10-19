# 💰 Pricing Context — Are You Human? Studio

This document defines Telos’s pricing logic and calculation model for generating dynamic quotes.  
All rates are in **AUD**.  
The system should always prioritize quality, transparency, and human-first value.

---

## 🧩 Standard Hourly Rates

| Role | Description | Rate (AUD/hr) |
|------|--------------|---------------|
| **AI Strategy & Design (Telos)** | Discovery, concept development, and human-first AI mapping. | **$120–$150/hr** |
| **Automation & Integration** | n8n, Supabase, API setup, workflow orchestration, testing. | $130–$150/hr |
| **UX/UI & Motion Design** | Interface design, prototyping, GSAP animation, interaction logic. | $120–$140/hr |
| **Frontend Development** | Astro/Vue implementation, styling, and component architecture. | $130–$150/hr |
| **Research & Copywriting** | Brand tone setup, documentation, storytelling. | $100–$120/hr |

> “Excellence takes time — and the right time has value.”

---

## ⚙️ Quote Calculation Model

### Formula

total_quote = (hours × hourly_rate) × (1 + complexity_factor)


### Inputs

| Input | Description | Range / Default |
|--------|-------------|----------------|
| `hours` | Estimated effort | Based on project type |
| `hourly_rate` | Selected from role or blended rate | Avg = **135 AUD/hr** |
| `complexity_factor` | Multiplier for difficulty, unknowns, or innovation | 0.15–0.5 |
| `base_multiplier` | Adjustment for urgency, scope, or deliverable type | 1.0–1.4 |

---

## 💼 Project Type Reference

| Project Type | Description | Est. Hours | Est. Range (AUD) |
|---------------|-------------|------------|------------------|
| **Landing Page + AI Chatbot** | Custom landing with branded UI, animations, and chat integration. | 40–60 hrs | $4,800 – $9,000 |
| **AI Workflow (n8n + Supabase)** | Automation logic, Supabase connection, OpenAI or Claude API, and testing. | 50–80 hrs | $6,000 – $12,000 |
| **AI Strategy + Prototype** | Discovery workshop, UX design, and working prototype. | 60–90 hrs | $7,200 – $13,500 |
| **Dashboard (AI + Frontend)** | Full Astro/Vue dashboard with data sync and AI panels. | 80–120 hrs | $9,600 – $18,000 |
| **Full SaaS Concept / MVP** | Product architecture, front-end + AI integration, UX system. | 150–250 hrs | $18,000 – $37,500 |
| **Enterprise Automation Suite** | Multi-department AI automation, agents, and analytics. | 200–350 hrs | $24,000 – $52,500 |

> “Telos values depth over speed — true intelligence is built with precision.”

---

## ⚡ Complexity Levels

| Level | Factor | When to Use |
|--------|---------|-------------|
| Simple | 0.15 | Minor customization, limited AI integration |
| Standard | 0.25 | Moderate workflows, branded experience |
| Advanced | 0.35 | Multi-tool, API-based systems, or animated UI |
| Premium | 0.5 | Full-stack AI system, data layer, or agent orchestration |

---

### Example Calculations

| Scenario | Formula | Total |
|-----------|----------|-------|
| AI Landing Page (45h, $130/hr, 0.25) | 45 × 130 × 1.25 | **$7,312 AUD** |
| Workflow Automation (70h, $135/hr, 0.35) | 70 × 135 × 1.35 | **$12,772 AUD** |
| Full SaaS MVP (200h, $140/hr, 0.5) | 200 × 140 × 1.5 | **$42,000 AUD** |

---

## 🧾 Quote Output Schema (to Supabase / PDF)

```json
{
  "project_title": "AI Workflow for Marketing Automation",
  "hours_estimated": 70,
  "hourly_rate": 135,
  "complexity_factor": 0.35,
  "total": 12772,
  "currency": "AUD",
  "note": "Based on 70 hours at $135/hr with 35% complexity buffer for integrations and QA."
}
