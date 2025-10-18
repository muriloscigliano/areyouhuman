#!/bin/bash

# Are You Human? Copilot - Complete Setup Script
# This script helps you connect Supabase, GitHub, and Vercel

set -e

echo "🤖 Are You Human? Copilot - Setup Script"
echo "=========================================="
echo ""

# Step 1: Supabase Setup
echo "📊 STEP 1: Supabase Connection"
echo "-------------------------------"
echo ""
echo "First, let's set up your Supabase connection."
echo ""
echo "Go to: https://app.supabase.com"
echo "1. Create a new project (or use existing)"
echo "2. Go to Project Settings → API"
echo "3. Copy your Project URL and anon key"
echo ""

if [ ! -f .env ]; then
    cp env.template .env
    echo "✅ Created .env file from template"
    echo ""
    echo "📝 Please edit .env file now and add your Supabase credentials:"
    echo "   PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "   PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo ""
    echo "Press ENTER when you've added your credentials..."
    read
else
    echo "✅ .env file already exists"
fi

# Check if .env has been configured
if grep -q "your-project-url" .env 2>/dev/null; then
    echo "⚠️  Warning: .env still has placeholder values!"
    echo "Please update .env with your actual Supabase credentials."
    echo ""
fi

# Step 2: Create Supabase Table
echo ""
echo "📊 STEP 2: Create Supabase Table"
echo "--------------------------------"
echo ""
echo "Now let's create the database table:"
echo "1. Go to Supabase Dashboard → SQL Editor"
echo "2. Create New Query"
echo "3. Copy contents of: supabase-schema.sql"
echo "4. Paste and click 'Run'"
echo ""
echo "Press ENTER when table is created..."
read

# Step 3: Test Local Connection
echo ""
echo "🧪 STEP 3: Test Local Setup"
echo "---------------------------"
echo ""
echo "Let's test if everything works locally..."
echo ""
echo "Run: npm run dev"
echo "Then open: http://localhost:4321"
echo "Try the chat and verify it works!"
echo ""
echo "Press ENTER when you've tested locally..."
read

# Step 4: Git Setup
echo ""
echo "📦 STEP 4: Git & GitHub Setup"
echo "-----------------------------"
echo ""

# Check if git is already configured
if [ ! -d .git ]; then
    git init
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

# Add remote if not exists
if ! git remote | grep -q origin; then
    echo ""
    echo "Adding GitHub remote..."
    git remote add origin https://github.com/muriloscigliano/areyouhuman.git
    echo "✅ GitHub remote added"
else
    echo "✅ GitHub remote already configured"
fi

# Stage all files
echo ""
echo "Staging files for commit..."
git add .
echo "✅ Files staged"

# Commit
echo ""
echo "Creating initial commit..."
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit (already committed)"
else
    git commit -m "Initial commit: Are You Human Copilot MVP

- Astro + Vue 3 landing page
- AI chat copilot with GSAP animations
- Supabase integration for lead capture
- Full conversation tracking
- Vercel deployment ready"
    echo "✅ Changes committed"
fi

# Set main branch
git branch -M main

echo ""
echo "Ready to push to GitHub!"
echo ""
echo "⚠️  You may need to authenticate with GitHub."
echo "Options:"
echo "  1. GitHub CLI: gh auth login"
echo "  2. Personal Access Token (use as password)"
echo ""
echo "Push to GitHub? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "Pushing to GitHub..."
    git push -u origin main
    echo "✅ Code pushed to GitHub!"
else
    echo ""
    echo "Skipping push. You can push later with:"
    echo "  git push -u origin main"
fi

# Step 5: Vercel Deployment
echo ""
echo "🚀 STEP 5: Deploy to Vercel"
echo "---------------------------"
echo ""
echo "Now let's deploy to Vercel!"
echo ""
echo "Option A: Vercel Dashboard (Recommended)"
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Click 'Add New...' → 'Project'"
echo "3. Import: muriloscigliano/areyouhuman"
echo "4. Add Environment Variables:"
echo "   PUBLIC_SUPABASE_URL=<your-url>"
echo "   PUBLIC_SUPABASE_ANON_KEY=<your-key>"
echo "5. Click 'Deploy'"
echo ""
echo "Option B: Vercel CLI"
echo "1. Install: npm i -g vercel"
echo "2. Login: vercel login"
echo "3. Deploy: vercel"
echo "4. Add env vars through dashboard"
echo "5. Redeploy: vercel --prod"
echo ""
echo "Would you like to install Vercel CLI now? (y/n)"
read -r install_vercel

if [[ "$install_vercel" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "Installing Vercel CLI..."
    npm i -g vercel
    echo "✅ Vercel CLI installed"
    echo ""
    echo "Run these commands to deploy:"
    echo "  vercel login"
    echo "  vercel"
    echo "  (Add env vars in dashboard)"
    echo "  vercel --prod"
else
    echo ""
    echo "You can install Vercel CLI later with: npm i -g vercel"
fi

# Summary
echo ""
echo "=========================================="
echo "🎉 Setup Complete!"
echo "=========================================="
echo ""
echo "✅ Supabase configured locally"
echo "✅ Git repository initialized"
echo "✅ GitHub remote connected"
echo "✅ Ready for Vercel deployment"
echo ""
echo "📚 Next Steps:"
echo "1. Test locally: npm run dev"
echo "2. Check GitHub: https://github.com/muriloscigliano/areyouhuman"
echo "3. Deploy to Vercel (see options above)"
echo "4. Add Supabase env vars in Vercel dashboard"
echo ""
echo "📖 Full guide: See SETUP_GUIDE.md"
echo ""
echo "Happy automating! 🚀"

