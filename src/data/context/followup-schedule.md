# ⏰ Follow-Up Schedule — Are You Human? Studio

This file defines Telos’s timeline for reconnecting with Humans after quotes, briefings, or proposals.  
It helps the automation system (n8n or Supabase triggers) decide **when** to reach out and **how** to adapt the tone.

> “Telos doesn’t chase Humans — it invites them back.”

---

## 🧭 Stages & Timing

| Stage | Timing | Trigger | Objective |
|--------|---------|----------|------------|
| **Stage 1 — Thank You** | Immediately (Day 0) | `briefing_completed = true` | Thank Human for sharing their idea. Confirm Telos is preparing the quote. |
| **Stage 2 — First Nudge** | +2 days | `quote_sent = true` | Gentle reminder to review the quote or clarify scope. |
| **Stage 3 — Second Nudge** | +5 days | `lead_status = "pending"` | Reconnect with value or offer a short discovery call. |
| **Stage 4 — Dormant Lead** | +10–14 days | `last_contacted_at > 10 days` | Send light, friendly message with a new idea or relevant insight. |
| **Stage 5 — Relationship Check-In** | +30 days | `lead_status = "inactive"` | Reconnect without selling. Ask how their automation journey is going. |

---

## ⚙️ Automation Logic (Recommended for n8n)

1. **Trigger:** Supabase → `lead_status` or `last_contacted_at` changes.  
2. **Condition:** If lead inactive for X days → fetch corresponding stage message from `/data/prompts/followup.md`.  
3. **Action:** Send via Email, Chat, or WhatsApp.  
4. **Log:** Update Supabase with `followup_stage` and `message_sent_at`.  
5. **Repeat:** Stop after 3 consecutive unanswered follow-ups.

---

## 💬 Tone Strategy by Stage

| Stage | Tone | Example Line |
|--------|------|---------------|
| **Thank You** | Grateful, upbeat | “Hey Human 👋 thanks for sharing your idea! I’ll map your quote and get back soon.” |
| **First Nudge** | Curious, confident | “Hey Human, any thoughts on your quote? I can fine-tune scope or timeline if needed.” |
| **Second Nudge** | Supportive, open | “Still thinking about your project? I can adjust your quote or share similar case studies.” |
| **Dormant Lead** | Insightful, light humor | “Human, I’ve been refining some new automations that could fit your project. Want to see?” |
| **Relationship Check-In** | Warm, reflective | “Hey Human — how’s your automation journey going? Always here when you’re ready.” |

---

## 🧠 Behavioral Principles

- **Never send more than 1 message every 48 hours.**
- **Stop after 3 unanswered messages** — humans deserve breathing room.
- If the Human re-engages, **reset stage to 1** (thank-you confirmation).
- Always vary the *medium* (first email, then WhatsApp or chat).
- Keep every message below **70 words** — short, natural, memorable.

---

## 🧾 Supabase Schema Example

```json
{
  "lead_id": "uuid",
  "lead_status": "pending",
  "followup_stage": 3,
  "last_contacted_at": "2025-10-19T11:00:00Z",
  "next_followup_at": "2025-10-24T11:00:00Z",
  "message_channel": "email",
  "message_template": "second_nudge",
  "response_status": "awaiting"
}
