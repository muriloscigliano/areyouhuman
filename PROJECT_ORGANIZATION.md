# 📁 Project Organization

Complete organization guide for the Are You Human? Telos AI project.

## 🗂️ Directory Structure

```
areyouhuman/
├── 📚 docs/                          # All documentation (NEW!)
│   ├── README.md                     # Documentation index
│   ├── setup/                        # Setup & installation guides
│   │   ├── quick-start.md
│   │   ├── setup-guide.md
│   │   ├── project-structure.md
│   │   └── status.md
│   ├── features/                     # Feature documentation
│   │   ├── lead-qualification.md
│   │   ├── lead-qualification-workflow.md
│   │   ├── early-extraction.md
│   │   ├── response-guardrails.md
│   │   ├── component-architecture.md
│   │   ├── entrance-ui.md
│   │   ├── webgl-implementation.md
│   │   ├── webgl-analysis.md
│   │   └── webgl-resources.md
│   ├── integration/                 # Integration guides
│   │   ├── openai.md
│   │   ├── supabase-security.md
│   │   ├── supabase-triggers.md
│   │   ├── n8n-setup.md
│   │   ├── n8n-complete.md
│   │   ├── n8n-quick-start.md
│   │   ├── n8n-router.md
│   │   ├── n8n-railway.md
│   │   └── lenis.md
│   ├── database/                     # Database documentation
│   │   ├── testing.md
│   │   ├── schema.sql
│   │   ├── schema-fixed.sql
│   │   ├── n8n-trigger.sql
│   │   ├── lead-tracking-migration.sql
│   │   ├── fix-rls.sql
│   │   └── check-chat-data.sql
│   ├── guides/                       # How-to guides
│   │   ├── deep-discovery.md
│   │   ├── email-validation.md
│   │   ├── token-optimization.md
│   │   ├── token-management.md
│   │   ├── cognitive-copy.md
│   │   ├── human-usage.md
│   │   └── smart-greetings.md
│   └── archive/                      # Deprecated files
│       ├── DATA_COLLECTION_FIX.md
│       ├── LEAD_COLLECTION_FIX.md
│       ├── QUICK_FIX_SUPABASE.md
│       └── ...
│
├── 💻 src/                           # Source code
│   ├── components/                   # Vue & Astro components
│   ├── composables/                  # Vue composition functions
│   ├── data/                         # AI prompts & context
│   │   ├── prompts/                  # System prompts
│   │   ├── context/                  # Context modules
│   │   └── examples/                 # Training data
│   ├── layouts/                      # Page layouts
│   ├── lib/                          # Core utilities
│   ├── pages/                        # Pages & API routes
│   ├── styles/                      # Global styles
│   └── utils/                        # Helper functions
│
├── 🗄️ Database Files
│   └── (moved to docs/database/)
│
├── 📄 Root Files
│   ├── README.md                     # Main project README
│   ├── PROJECT_ORGANIZATION.md       # This file
│   ├── package.json                  # Dependencies
│   ├── astro.config.mjs             # Astro config
│   ├── tsconfig.json                 # TypeScript config
│   ├── vercel.json                   # Vercel config
│   └── env.template                  # Environment template
│
└── 🧪 Test Files
    ├── test-openai.js
    ├── test-openai-simple.js
    ├── test-supabase.js
    └── test-n8n-webhook.js
```

## 📚 Documentation Categories

### Setup (`docs/setup/`)
Installation, configuration, and getting started guides.

### Features (`docs/features/`)
Feature documentation, how features work, and implementation details.

### Integration (`docs/integration/`)
Third-party service integration guides (OpenAI, Supabase, n8n, etc.).

### Database (`docs/database/`)
Database schemas, SQL scripts, and database-related documentation.

### Guides (`docs/guides/`)
How-to guides, best practices, and advanced topics.

### Archive (`docs/archive/`)
Deprecated, outdated, or superseded documentation.

## 🎯 Key Files

### Main Documentation
- **README.md** - Project overview and main documentation
- **docs/README.md** - Complete documentation index
- **PROJECT_ORGANIZATION.md** - This file

### Quick Start
- **docs/setup/quick-start.md** - 10-minute setup guide
- **docs/setup/setup-guide.md** - Complete setup instructions

### Core Features
- **docs/features/lead-qualification.md** - Lead qualification requirements
- **docs/features/early-extraction.md** - Data collection strategies
- **docs/features/response-guardrails.md** - AI response validation

### Integrations
- **docs/integration/openai.md** - OpenAI setup
- **docs/integration/supabase.md** - Supabase configuration
- **docs/integration/n8n-setup.md** - n8n automation setup

## 🔍 Finding Documentation

### By Topic
- **Setup**: `docs/setup/`
- **Features**: `docs/features/`
- **Integrations**: `docs/integration/`
- **Database**: `docs/database/`
- **Guides**: `docs/guides/`

### By File Type
- **Markdown docs**: `docs/**/*.md`
- **SQL scripts**: `docs/database/*.sql`
- **JSON workflows**: Root directory (`n8n-workflow-*.json`)

## 📝 Documentation Standards

### File Naming
- Use kebab-case: `lead-qualification.md`
- Be descriptive: `n8n-smart-router-guide.md`
- Group related: `supabase-security.md`, `supabase-triggers.md`

### Structure
- Start with title and overview
- Use clear sections with headers
- Include code examples where relevant
- Link to related documentation

### Maintenance
- Keep `docs/archive/` for deprecated files
- Update main README when adding new docs
- Keep documentation in sync with code

## 🚀 Quick Links

- [Documentation Index](./docs/README.md)
- [Quick Start](./docs/setup/quick-start.md)
- [Project Status](./docs/setup/status.md)
- [Main README](./README.md)

---

**Last Updated**: 2025-01-XX
**Maintained By**: Project Team

