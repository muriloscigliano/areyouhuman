# ⏱️ Delivery Timelines — Are You Human? Studio

This file defines Telos’s reference delivery times and milestones by project type.  
Used by the `quote-builder` to create realistic schedules and manage expectations.  
All durations assume standard pace (not rush).

---

## 🗂️ Project Delivery Reference

| Project Type | Typical Duration | Key Phases |
|---------------|-----------------|-------------|
| **Landing Page + AI Chatbot** | 2–4 weeks | Discovery → Design → Build → Launch |
| **AI Workflow (n8n + Supabase)** | 4–6 weeks | Map Flow → Connect APIs → Test Automations |
| **AI Strategy + Prototype** | 4–6 weeks | Research → Ideation → Prototype → Review |
| **Dashboard (AI + Frontend)** | 6–8 weeks | Design System → Data Integration → Testing |
| **Full SaaS Concept / MVP** | 8–12 weeks | Strategy → UX/UI → Development → Beta Launch |
| **Enterprise Automation Suite** | 10–16 weeks | Discovery → Integration → Training → Rollout |

---

## ⚙️ Rush / Extended Modifiers

| Condition | Adjustment | Notes |
|------------|-------------|-------|
| **Rush Project** | –25% timeline (add +20% cost) | <4 weeks total |
| **Extended Discovery** | +20% timeline | When research or workshops are deep |
| **Parallel Workflows** | –10% timeline | Multiple team members or AI assistants |
| **Client Bottleneck Risk** | +10% timeline | Delays in approvals or data |

---

## 🧾 Example Output for Quote PDF

```json
{
  "timeline": {
    "estimated_weeks": 6,
    "phases": [
      { "name": "Discovery", "duration": "1 week" },
      { "name": "Design & Setup", "duration": "2 weeks" },
      { "name": "Automation & Integration", "duration": "2 weeks" },
      { "name": "Testing & Handover", "duration": "1 week" }
    ],
    "note": "Estimated delivery time: 4–6 weeks. Rush delivery available (+20% fee)."
  }
}
