# 🤖 Are You Human? Copilot

An AI-powered automation consulting platform that helps businesses identify and implement automation opportunities through an intelligent conversational interface.

## 🎯 Project Overview

**Are You Human? Copilot** is an MVP landing page with an embedded AI chat assistant that:
- Collects user information and business challenges
- Provides personalized automation recommendations
- Stores conversation data and leads in Supabase
- Offers a beautiful, modern user experience with smooth animations

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Astro + Vue 3 | Static landing page with hydrated interactive chat |
| **Database** | Supabase (Postgres) | Store user leads + conversation data |
| **Backend** | Astro API routes | Handle chat requests and database operations |
| **Animations** | GSAP | Smooth scroll + chat transitions |
| **Networking** | Axios | Chat → API communication |
| **Deployment** | Vercel | Fast, global deployment |

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account ([Sign up here](https://app.supabase.com))
- A Vercel account ([Sign up here](https://vercel.com))

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/muriloscigliano/areyouhuman.git
cd areyouhuman
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Supabase

#### Create a new Supabase project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Wait for the project to be ready

#### Set up the database

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql`
3. Paste and run it in the SQL Editor

This will create:
- `leads` table with all necessary columns
- Indexes for performance
- Row-level security policies
- Triggers for automatic timestamp updates
- Analytics view for lead reporting

#### Get your API credentials

1. Go to Project Settings → API
2. Copy your project URL and anon/public key

### 4. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp env.template .env
```

Update the `.env` file with your Supabase credentials:

```env
PUBLIC_SUPABASE_URL=your-project-url.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

## 📁 Project Structure

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AiChat.vue      # Main chat container component
│   │   ├── AiMessage.vue   # Individual message display
│   │   └── AiInput.vue     # Chat input with send button
│   ├── layouts/
│   │   └── LandingLayout.astro  # Base HTML layout
│   ├── pages/
│   │   ├── index.astro     # Landing page with hero + chat
│   │   └── api/
│   │       └── chat.ts     # Chat API endpoint
│   ├── lib/
│   │   └── supabase.ts     # Supabase client configuration
│   └── styles/
│       └── global.css      # Global styles and utilities
├── supabase-schema.sql     # Database schema
├── astro.config.mjs        # Astro + Vue configuration
├── vercel.json             # Vercel deployment config
├── env.template            # Environment variables template
└── package.json
```

## 💬 How the Chat Works

1. **User starts conversation** - AI asks for name
2. **Collects information** - Company, role, challenges, tools, etc.
3. **Analyzes requirements** - Urgency, budget, complexity
4. **Provides recommendations** - Automation opportunities and ROI estimates
5. **Captures lead** - Stores in Supabase for follow-up

All conversation data is stored in the `leads` table with:
- User contact information
- Problem descriptions
- Tool preferences
- Budget and urgency
- Full conversation history (JSON)
- Lead scoring and status

## 🗄️ Database Schema

The `leads` table includes:

```sql
- id (UUID)
- created_at / updated_at (timestamps)
- name, email, company, role, industry
- problem_text, tools_used[], goal
- budget_range, urgency
- tech_familiarity, automation_area, complexity
- interest_level (0-10 scoring)
- automation_idea, suggested_tools[], roi_estimate
- conversation_history (JSONB)
- status (new/contacted/qualified/converted/closed)
```

See `supabase-schema.sql` for the complete schema with indexes and policies.

## 🚀 Deployment to Vercel

### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Deploy via GitHub Integration

1. Push your code to [GitHub](https://github.com/muriloscigliano/areyouhuman)
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Add environment variables in Vercel:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
6. Deploy!

Vercel will automatically detect the Astro framework and configure the build settings using `vercel.json`.

## 🎨 Customization

### Modify the Chat Flow

Edit `src/pages/api/chat.ts` to customize the conversation flow, questions, and logic.

### Update Styles

- Global styles: `src/styles/global.css`
- Component styles: Inside each `.vue` and `.astro` file
- Colors and variables: CSS custom properties in `global.css`

### Add LLM Integration

The current implementation uses a simple rule-based flow. To integrate with OpenAI, Claude, or other LLMs:

1. Install the SDK: `npm install openai` (or your preferred provider)
2. Add API key to `.env`
3. Update `src/pages/api/chat.ts` to call the LLM API
4. Pass conversation history as context

Example OpenAI integration:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY
});

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "system", content: "You are an automation consultant..." },
    ...conversationHistory
  ]
});
```

## 📝 Available Scripts

- `npm run dev` - Start development server (port 4321)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands

## 🔗 Useful Links

- [Astro Documentation](https://docs.astro.build)
- [Vue 3 Documentation](https://vuejs.org)
- [Supabase Documentation](https://supabase.com/docs)
- [GSAP Documentation](https://greensock.com/docs/)
- [Vercel Documentation](https://vercel.com/docs)

## 🐛 Troubleshooting

### Chat not connecting to API

- Check that your Supabase credentials are correct in `.env`
- Verify the `leads` table exists in Supabase
- Check browser console for errors

### Build errors

- Make sure all dependencies are installed: `npm install`
- Clear cache: `rm -rf .astro node_modules && npm install`
- Check Node.js version (18+ required)

### Supabase connection issues

- Verify your project URL and anon key
- Check if Row Level Security policies are set up correctly
- Ensure the `leads` table has proper permissions

## 📄 License

MIT

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 👨‍💻 Author

**Murilo Scigliano**
- GitHub: [@muriloscigliano](https://github.com/muriloscigliano)

---

Built with ❤️ using Astro, Vue, Supabase, and Vercel
