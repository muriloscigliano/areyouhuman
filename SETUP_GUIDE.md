# 🚀 Complete Deployment Guide

## Step 1: Connect to Supabase Locally (5 minutes)

### 1.1 Create your Supabase project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - Name: `areyouhuman`
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Wait for project to initialize (~2 minutes)

### 1.2 Create the database table
1. In Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New Query"
3. Open the file `supabase-schema.sql` from your project
4. Copy all contents and paste into SQL Editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. Verify: Go to "Table Editor" → You should see "leads" table

### 1.3 Get your Supabase credentials
1. In Supabase dashboard, go to "Project Settings" (gear icon)
2. Click "API" in the left menu
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### 1.4 Create .env file locally
```bash
# Run this in your terminal:
cp env.template .env
```

Then edit `.env` file and add your credentials:
```env
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-long-key-here
```

### 1.5 Test local connection
```bash
npm run dev
```
Open http://localhost:4321 and test the chat!

---

## Step 2: Push to GitHub (3 minutes)

### 2.1 Initialize Git
```bash
git init
git add .
git commit -m "Initial commit: Are You Human Copilot MVP"
```

### 2.2 Connect to GitHub
Your repo already exists at: https://github.com/muriloscigliano/areyouhuman

```bash
git remote add origin https://github.com/muriloscigliano/areyouhuman.git
git branch -M main
git push -u origin main
```

If you need authentication:
- Use GitHub Personal Access Token (not password)
- Or use GitHub CLI: `gh auth login`

---

## Step 3: Deploy to Vercel (5 minutes)

### Option A: Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Repository**
   - Click "Import Git Repository"
   - Select `muriloscigliano/areyouhuman`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: **Astro** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (auto-filled)
   - Output Directory: `dist` (auto-filled)

4. **Add Environment Variables** ⚠️ CRITICAL STEP
   - Click "Environment Variables"
   - Add these two variables:
   
   ```
   Name: PUBLIC_SUPABASE_URL
   Value: https://YOUR_PROJECT_ID.supabase.co
   ```
   
   ```
   Name: PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGc...your-long-key-here
   ```
   
   - Use the SAME values from your `.env` file!

5. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes
   - Your site will be live at: `https://areyouhuman-xxx.vercel.app`

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Add environment variables
vercel env add PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add PUBLIC_SUPABASE_ANON_KEY
# Paste your anon key when prompted

# Deploy to production
vercel --prod
```

---

## Step 4: Verify Everything Works

### ✅ Checklist

1. **Local Development**
   - [ ] `npm run dev` runs without errors
   - [ ] Chat appears on http://localhost:4321
   - [ ] Can send messages in chat
   - [ ] No console errors

2. **Supabase Connection**
   - [ ] Table `leads` exists in Supabase
   - [ ] Chat messages save to database
   - [ ] Check in Table Editor → leads → you see new rows

3. **GitHub**
   - [ ] Code pushed to https://github.com/muriloscigliano/areyouhuman
   - [ ] All files visible in repository
   - [ ] `.env` is NOT in GitHub (it's in .gitignore)

4. **Vercel Deployment**
   - [ ] Site is live
   - [ ] Chat works on production site
   - [ ] Environment variables are set in Vercel dashboard
   - [ ] Leads save to Supabase from production

---

## 🔧 Troubleshooting

### "Missing Supabase environment variables" error

**Problem:** `.env` not loaded or Vercel missing env vars

**Fix:**
1. Local: Check `.env` file exists and has correct values
2. Vercel: Go to Settings → Environment Variables → Add both vars
3. Redeploy: Vercel needs redeployment after adding env vars

### Git push fails

**Problem:** Authentication required

**Fix:**
```bash
# Use GitHub CLI
gh auth login

# Or create Personal Access Token
# GitHub → Settings → Developer settings → Personal access tokens
# Use token as password when pushing
```

### Chat not saving to Supabase

**Problem:** RLS policies or wrong credentials

**Fix:**
1. Verify credentials in Supabase → Project Settings → API
2. Check RLS policies exist (run `supabase-schema.sql` again)
3. Check browser console for errors
4. Test connection:
   - Open browser DevTools → Network tab
   - Send chat message
   - Look for `/api/chat` request - check response

### Vercel build fails

**Problem:** Missing dependencies or build errors

**Fix:**
1. Check build logs in Vercel dashboard
2. Test locally: `npm run build`
3. Ensure all dependencies installed: `npm install`

---

## 🎉 Success!

Once all checkboxes are complete, you have:

✅ **Local Development** → Working with Supabase
✅ **GitHub** → Source control and backup
✅ **Vercel** → Production deployment
✅ **Auto-deploy** → Every git push deploys to Vercel
✅ **Database** → All leads save to Supabase

Your architecture:
```
User → Vercel (Production)
         ↓
    Astro + Vue App
         ↓
    API Routes
         ↓
    Supabase Database
```

---

## 📱 Share Your Live Site

Your site will be at:
- **Production:** `https://areyouhuman.vercel.app` (or custom domain)
- **GitHub:** https://github.com/muriloscigliano/areyouhuman

To add custom domain:
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `areyouhuman.com`)
3. Update DNS records as Vercel instructs

