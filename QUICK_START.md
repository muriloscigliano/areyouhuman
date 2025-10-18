# ⚡ Quick Start - Connect Everything in 10 Minutes

## 🎯 Overview
Connect: **Supabase** → **Local Dev** → **GitHub** → **Vercel**

---

## 1️⃣ Get Supabase Credentials (2 min)

### Go to: https://app.supabase.com

1. **Create/Select Project**
2. **Go to:** Project Settings (⚙️) → API
3. **Copy these 2 values:**

```
📋 Project URL:
https://xxxxx.supabase.co

📋 Anon/Public Key:
eyJhbGc....(long string)
```

---

## 2️⃣ Create .env File (1 min)

```bash
# Run this command:
cp env.template .env
```

Then edit `.env` and paste your values:
```env
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc....
```

---

## 3️⃣ Create Database Table (2 min)

1. **Supabase Dashboard** → SQL Editor
2. **New Query**
3. **Copy entire content** from `supabase-schema.sql`
4. **Paste & Run**
5. **Verify:** Table Editor → See "leads" table ✅

---

## 4️⃣ Test Locally (2 min)

```bash
npm run dev
```

Open: http://localhost:4321

Try the chat! Should work perfectly. ✅

---

## 5️⃣ Push to GitHub (1 min)

Already initialized! Just run:

```bash
git add .
git commit -m "Initial commit: MVP ready"
git remote add origin https://github.com/muriloscigliano/areyouhumanmandar.git
git branch -M main
git push -u origin main
```

Need auth? Use `gh auth login` or Personal Access Token

---

## 6️⃣ Deploy to Vercel (2 min)

### Go to: https://vercel.com/dashboard

1. **Click:** Add New → Project
2. **Import:** muriloscigliano/areyouhumanmandar
3. **Framework:** Astro (auto-detected)
4. **Environment Variables** (CRITICAL!):
   ```
   PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   PUBLIC_SUPABASE_ANON_KEY = eyJhbGc....
   ```
   ☝️ Use SAME values from your `.env`
5. **Click:** Deploy
6. **Wait:** ~2 minutes
7. **Done!** 🎉

---

## ✅ Verification

- [ ] Local: http://localhost:4321 works
- [ ] Chat saves to Supabase (check Table Editor)
- [ ] GitHub: https://github.com/muriloscigliano/areyouhumanmandar has code
- [ ] Vercel: Production site live
- [ ] Production chat saves to Supabase

---

## 🚨 Common Issues

**"Missing environment variables"**
→ Check `.env` exists and has correct values
→ In Vercel: Settings → Environment Variables

**Git push fails**
→ Run: `gh auth login`
→ Or create Personal Access Token on GitHub

**Chat doesn't save**
→ Verify Supabase credentials
→ Check browser console for errors
→ Ensure database table was created

---

## 🎉 You're Live!

Your site: `https://areyouhuman-xxx.vercel.app`

Every git push = Auto-deploy to Vercel!

**Architecture:**
```
User Browser
    ↓
Vercel (Production)
    ↓
Astro + Vue App
    ↓
API Routes
    ↓
Supabase Database ← All leads saved here
```

---

## 📞 Need Help?

1. Check `SETUP_GUIDE.md` for detailed instructions
2. Run automated setup: `./setup.sh`
3. Read `README.md` for full documentation

