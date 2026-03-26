# LifeOS — Setup & Deployment Guide

## Quick Start (Local)

### Step 1: Install & Run
```bash
cd C:\LifeOS
setup.bat
```
Or manually:
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Step 2: Open
Go to **http://localhost:3000**

---

## Stripe Setup (For Payments)

### Test Mode (Development)
1. Go to https://dashboard.stripe.com/register and create a free account
2. Go to **Developers → API Keys**
3. Copy your **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`)
4. Open `C:\LifeOS\.env` and replace:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
```
5. Restart the dev server

### Live Mode (Production)
1. Complete Stripe account verification
2. Switch to Live mode in Stripe dashboard
3. Use live keys instead of test keys

### Test Card Numbers
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- Use any future expiry date and any 3-digit CVC

---

## Deploy to Vercel (Go Live)

### Step 1: Push to GitHub
```bash
cd C:\LifeOS
git init
git add .
git commit -m "Initial commit - LifeOS"
```
Create a repo on GitHub, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/lifeos.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to https://vercel.com and sign up with GitHub
2. Click **"New Project"**
3. Import your `lifeos` repository
4. Add these Environment Variables:
   - `DATABASE_URL` → Use a PostgreSQL URL from Supabase/Neon (see below)
   - `JWT_SECRET` → Any random long string (generate at https://randomkeygen.com)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Your Stripe publishable key
   - `STRIPE_SECRET_KEY` → Your Stripe secret key
   - `NEXT_PUBLIC_APP_URL` → Your Vercel URL (e.g., https://lifeos.vercel.app)
5. Click **Deploy**

### Step 3: Production Database
SQLite won't work on Vercel. Use PostgreSQL:

**Option A: Supabase (Free)**
1. Go to https://supabase.com → Create project
2. Go to Settings → Database → Connection string
3. Copy the connection string
4. Change `prisma/schema.prisma`:
   ```
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Set `DATABASE_URL` in Vercel to the Supabase URL

**Option B: Neon (Free)**
1. Go to https://neon.tech → Create project
2. Copy the connection string
3. Same steps as above

### Step 4: Custom Domain (Optional)
1. Buy a domain from Namecheap/GoDaddy (~₹500-800/year)
2. In Vercel → Project → Settings → Domains → Add your domain
3. Update DNS records as instructed by Vercel

---

## Folder Structure
```
C:\LifeOS\
├── prisma/
│   └── schema.prisma        # Database models
├── public/
│   └── manifest.json         # PWA config
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/         # Login, signup, guest, logout
│   │   │   ├── dashboard/    # Dashboard data API
│   │   │   ├── habits/       # Habits CRUD + toggle
│   │   │   ├── expenses/     # Expenses CRUD
│   │   │   ├── onboarding/   # Save onboarding data
│   │   │   └── stripe/       # Payment checkout + success
│   │   ├── auth/             # Login/Signup page
│   │   ├── dashboard/        # Main dashboard
│   │   ├── onboarding/       # Setup wizard
│   │   ├── pricing/          # Pricing page
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   └── globals.css       # Global styles
│   └── lib/
│       ├── auth.ts           # JWT + password helpers
│       ├── prisma.ts         # Database client
│       └── utils.ts          # Utility functions
├── .env                      # Environment variables
├── package.json
├── tailwind.config.ts
└── setup.bat                 # One-click setup
```

## Total Cost to Go Live

| Item | Cost |
|------|------|
| Vercel hosting | Free |
| Database (Supabase/Neon) | Free |
| Stripe account | Free (they take 2% per transaction) |
| Domain (optional) | ~₹500-800/year |
| **Total** | **₹0 to start** |
