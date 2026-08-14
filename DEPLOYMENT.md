# 🚀 ArchiGen AI Studio - Production Deployment Guide

This guide walks you through deploying **ArchiGen AI Studio** (React 19 + TanStack Start SSR + Supabase + Tailwind CSS v4) to production on **Vercel** (or Netlify), including complete database, authentication, storage, and AI engine setup.

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Step 1: Supabase Setup (Database, Auth, Storage)](#step-1-supabase-setup)
3. [Step 2: Vercel Deployment (Recommended)](#step-2-vercel-deployment)
4. [Step 3: Netlify Deployment (Alternative)](#step-3-netlify-deployment)
5. [Step 4: Environment Variables Reference](#step-4-environment-variables-reference)
6. [Step 5: Post-Deployment Verification](#step-5-post-deployment-verification)
7. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 1. Prerequisites

Before starting, ensure you have:

- A [Supabase](https://supabase.com) account (Free or Pro tier)
- A [Vercel](https://vercel.com) or [Netlify](https://netlify.com) account
- An AI API key ([OpenRouter](https://openrouter.ai), [Google AI Studio / Gemini](https://aistudio.google.com), or [OpenAI](https://platform.openai.com))
- Git repository pushed to GitHub, GitLab, or Bitbucket

---

## Step 1: Supabase Setup

### 1.1 Create a New Supabase Project

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project**, select your organization, give your project a name (e.g. `archigen-ai-studio`), set a database password, and select the region closest to your users.
3. Wait ~2 minutes for the database to provision.

### 1.2 Run the SQL Schema Migration

1. In your Supabase project dashboard, navigate to the **SQL Editor** tab (icon `>_` on the left sidebar).
2. Click **New query**.
3. Open the [`supabase/schema.sql`](supabase/schema.sql) file from this repository, copy all contents, and paste them into the SQL Editor.
4. Click **Run** (or `Ctrl + Enter`).
5. Verify that the following were created:
   - Tables: `profiles`, `projects`, `generations`, `credit_transactions`
   - Trigger: `handle_new_user` (automatically grants 20 welcome credits on signup)
   - RPC Functions: `spend_credits`, `refund_credits`
   - Storage Bucket: `renders` (private bucket with owner RLS policies)

### 1.3 Configure Authentication & Redirect URLs

1. In Supabase Dashboard, navigate to **Authentication** -> **URL Configuration**.
2. Set **Site URL** to your production URL (e.g. `https://your-archigen-app.vercel.app`).
3. Under **Redirect URLs**, add:
   - `https://your-archigen-app.vercel.app/**`
   - `http://localhost:5173/**`
   - `http://localhost:3000/**`
4. _(Optional)_ If you want users to log in immediately without waiting for email confirmation:
   - Go to **Authentication** -> **Providers** -> **Email**.
   - Toggle off **"Confirm email"** (or configure your custom SMTP for branded confirmation emails).

### 1.4 Copy Your Supabase API Keys

1. Go to **Project Settings** -> **API**.
2. Copy the following keys:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon / public key** (`eyJhbGci...`)
   - **service_role key** (secret key used for server-side admin tasks)

---

## Step 2: Vercel Deployment (Recommended)

### Method A: Deploy via Vercel Web Dashboard (Easiest)

1. **Push your code to GitHub / GitLab / Bitbucket**:

   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Import Project into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your Git repository and click **Import**.

3. **Configure Build & Project Settings**:
   - **Framework Preset**: `Other` or `Vite` (Vercel automatically detects TanStack Start / Vite)
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
   - **Output Directory**: Leave empty / default

4. **Add Environment Variables**:
   In the **Environment Variables** section on Vercel, add the following:

   | Variable Name                   | Value                          | Description                      |
   | ------------------------------- | ------------------------------ | -------------------------------- |
   | `VITE_SUPABASE_URL`             | `https://your-ref.supabase.co` | Supabase Project URL             |
   | `SUPABASE_URL`                  | `https://your-ref.supabase.co` | Supabase Project URL (Server)    |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...`                  | Supabase Anon Key                |
   | `SUPABASE_PUBLISHABLE_KEY`      | `eyJhbGci...`                  | Supabase Anon Key (Server)       |
   | `SUPABASE_SERVICE_ROLE_KEY`     | `eyJhbGci...`                  | Supabase Service Role Secret Key |
   | `AI_BASE_URL`                   | `https://openrouter.ai/api/v1` | AI Provider Endpoint             |
   | `AI_API_KEY`                    | `sk-or-v1-...`                 | Your AI API Key                  |
   | `AI_IMAGE_MODEL`                | `imagen-3.0-generate-002`      | Image generation model           |
   | `AI_TEXT_MODEL`                 | `gemini-2.5-flash`             | Text & assistant model           |

5. **Deploy**:
   - Click **Deploy**.
   - Vercel will build and assign you a live production URL (e.g. `https://archigen-ai-studio.vercel.app`).

---

### Method B: Deploy via Vercel CLI

1. Install the Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Link and deploy:

   ```bash
   vercel
   ```

3. Deploy to production:
   ```bash
   vercel --prod
   ```

---

## Step 3: Netlify Deployment (Alternative)

1. Connect your repository at [app.netlify.com](https://app.netlify.com).
2. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/client`
3. Add the same Environment Variables under **Site configuration** -> **Environment variables**.
4. Click **Deploy site**.

---

## Step 4: Environment Variables Reference

| Variable                        | Scope  | Required | Description                                |
| ------------------------------- | ------ | -------- | ------------------------------------------ |
| `VITE_SUPABASE_URL`             | Client | Yes      | Supabase Project URL                       |
| `SUPABASE_URL`                  | Server | Yes      | Supabase Project URL                       |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client | Yes      | Supabase anon/public API key               |
| `SUPABASE_PUBLISHABLE_KEY`      | Server | Yes      | Supabase anon/public API key               |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server | Yes      | Supabase service_role secret key           |
| `AI_BASE_URL`                   | Server | Optional | Defaults to `https://openrouter.ai/api/v1` |
| `AI_API_KEY`                    | Server | Yes      | OpenRouter / OpenAI / Gemini API key       |
| `GEMINI_API_KEY`                | Server | Optional | Dedicated Google Gemini API key            |
| `AI_IMAGE_MODEL`                | Server | Optional | Default: `imagen-3.0-generate-002`         |
| `AI_TEXT_MODEL`                 | Server | Optional | Default: `gemini-2.5-flash`                |

---

## Step 5: Post-Deployment Verification

After deploying, verify the complete application workflow:

1. **Sign Up / Sign In**:
   - Visit your deployed URL -> click **Sign In** -> Create a new account.
   - Confirm you are redirected to the dashboard.
2. **Credits Allocation**:
   - Check the top navbar or Settings: ensure you received **20 Welcome Credits**.
3. **Architecture / Interior Generation**:
   - Navigate to `/architecture` or `/interior`.
   - Enter a prompt (e.g., _"Modern minimalist villa with glass facade and infinity pool"_).
   - Click **Generate Design**.
   - Verify the image renders, credits are deducted (4 credits for architecture), and image saves to Supabase Storage.
4. **Floor Plan 2D/3D**:
   - Open `/floor-plan`, create rooms, and click **Generate 3D Visualizer**.
5. **AI Assistant**:
   - Open `/assistant` and ask an architectural or zoning question.

---

## Troubleshooting & FAQs

### 1. `Missing Supabase environment variable(s)`

- **Cause**: The environment variables were not added to Vercel/Netlify or were only added for "Preview" and not "Production".
- **Fix**: Go to Vercel Dashboard -> **Settings** -> **Environment Variables**, ensure all `SUPABASE_*` and `VITE_SUPABASE_*` variables are checked for **Production**, **Preview**, and **Development**, then trigger a **Redeploy**.

### 2. `Not enough credits` or `Function spend_credits does not exist`

- **Cause**: `supabase/schema.sql` was not run in the Supabase SQL Editor.
- **Fix**: Run the script in your Supabase SQL Editor to install the database tables and RPC functions.

### 3. Auth redirect goes to `localhost:5173` instead of production domain

- **Cause**: Supabase Redirect URLs don't have your production domain.
- **Fix**: Add `https://<your-vercel-domain>/**` to **Authentication** -> **URL Configuration** -> **Redirect URLs** in the Supabase Dashboard.

### 4. Storage upload failed for renders

- **Cause**: The `renders` bucket is missing or RLS policy is not configured.
- **Fix**: Re-run the Storage bucket section (Section 8) of `supabase/schema.sql` in Supabase SQL editor.
