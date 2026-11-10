# 🏛️ ArchiGen AI Studio

<div align="center">

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-archigen--ai--jet.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://archigen-ai-jet.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start_SSR-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.2-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests Passing](https://img.shields.io/badge/Vitest-34%2F34_Passed-success?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)

<br />

**From a brief to a building concept. An end-to-end generative AI design ecosystem for architecture exterior renders, interior concepts, photo room redesigns, and interactive 2D CAD / 3D axonometric floor plans.**

[🚀 Explore Live App](https://archigen-ai-jet.vercel.app/) • [✨ Features](#-key-features) • [📐 Vastu Space Planner](#4--interactive-floor-plan-studio--vastu-space-planner) • [🛠️ Tech Stack](#️-technology-stack) • [💳 Pricing & Credits](#-credit-system--plans) • [📖 Deployment](DEPLOYMENT.md)

</div>

---

## 🌟 Overview

**ArchiGen AI Studio** brings generative artificial intelligence directly into the conceptualization workflows of architects, interior designers, spatial planners, real estate developers, and homeowners. 

Built on **React 19**, **TanStack Start (SSR)**, **Supabase PostgreSQL 15**, and modern vision/multimodal AI models (**Google Imagen 3** and **Gemini 2.5 Flash**), ArchiGen AI transforms short textual briefs and room photographs into production-ready architectural concepts, structured vector floor plans, and presentation sheets in under 15 seconds.

🔗 **Production Website**: [https://archigen-ai-jet.vercel.app/](https://archigen-ai-jet.vercel.app/)

> [!NOTE]
> **Conceptual Notice**: All generated renders and spatial layouts are conceptual design explorations and ideation aids. They are not certified structural engineering, architectural, or municipal construction drawings.

---

## ✨ Key Features

```
                                 ┌─────────────────────────────────────────┐
                                 │           ArchiGen AI Studio            │
                                 └────────────────────┬────────────────────┘
                                                      │
      ┌──────────────────────┬────────────────────────┼────────────────────────┬──────────────────────┐
      │                      │                        │                        │                      │
┌─────┴─────────────┐  ┌─────┴──────────────┐  ┌──────┴─────────────┐  ┌───────┴────────────┐  ┌──────┴───────────┐
│   Architecture    │  │   Interior Design  │  │   Room Redesign    │  │     Floor Plan     │  │   AI Assistant   │
│     Generator     │  │        Studio      │  │  (Style Transfer)  │  │   Studio (2D/3D)   │  │    (Co-Pilot)    │
│    (4 Credits)    │  │     (3 Credits)    │  │    (3 Credits)     │  │   (4–5 Credits)    │  │    (1 Credit)    │
└───────────────────┘  └────────────────────┘  └────────────────────┘  └────────────────────┘  └──────────────────┘
```

### 1. 🏢 Architecture Generator
* **Prompt-to-Facade Synthesis**: Generate photorealistic exterior concepts from plot dimensions, building typology, and architectural styles.
* **Building Typologies**: Residential villas, contemporary homes, commercial office towers, and mixed-use complexes.
* **Style Library**: Contemporary, Minimalist, Tropical Modern, Traditional Indian, Brutalist, Biophilic, Scandinavian, and Luxury Penthouse.
* **Material & Landscaping Controls**: Specify exterior materials (exposed brick, board-formed concrete, teak louvres, travertine stone) and adjust landscaping greenery density (0–100%).
* **Deterministic Negative Guardrails**: Enforces negative prompt filters preventing distorted perspectives, warped walls, curved columns, and CGI plastic looks.
* **Precision Controls**: 11 style presets, 6 lighting moods (Daylight, Golden Hour, Blue Hour, Foggy Morning), 6 camera perspectives (Eye-level 35mm, Tilt-shift 24mm wide with zero keystoning, Isometric axonometric, Aerial drone), and multi-aspect ratio support (`1:1`, `16:9`, `4:3`, `9:16`, `3:2`).

---

### 2. 🛋️ Interior Design Studio
* **Room-by-Room Concepts**: Generate tailored spaces for Living Rooms, Master Bedrooms, Modular Kitchens, Home Offices, and Luxury Bathrooms.
* **Style Palettes**: Warm Minimal, Scandinavian, Industrial, Modern Luxury, and Japandi Wabi-Sabi.
* **Curated Decor Elements**: One-click decor injection (*Modern Wall Clock*, *Plush Sofa & Cushions*, *Coffee Table & Rug*, *Potted Indoor Plants*, *Framed Canvas Art*, *Pendant Floor Lamp*).
* **Budget Level Calibration**: Fine-tune luxury density and material grade using the budget slider (0–100%).

---

### 3. 🔄 Room Redesign & Style Transfer
* **Photo-to-Design Remodel**: Upload a photo of any real room (JPG/PNG/WebP up to 10 MB) to restyle it while preserving the room's geometry, window placement, and structural boundaries.
* **Transformation Strength**: Adjust styling intensity from 0% (subtle cosmetic refresh) to 100% (complete overhaul).
* **"Keep Unchanged" Structural Lock**: Specify architectural elements to lock (e.g., *"window position, hardwood flooring, ceiling height, doorway openings"*).
* **Interactive Before/After Comparison Slider**: Compare the original photo with the AI redesign using a responsive split-screen comparison slider with touch/drag support.

---

### 4. 📐 Interactive Floor Plan Studio & Vastu Space Planner
* **Structured 2D CAD Canvas**: Interactive SVG canvas with zoom, pan, room drag-and-drop, dimension auto-calculations, and real-time square footage tracking.
* **Plot Presets & Custom Boundaries**: Standard plot presets (30'×50', 30'×40', 40'×50', 40'×60', 20'×40', 50'×80') or exact custom width, depth, and built-up area targets.
* **Vastu Shastra Compliance Engine**: Built-in Vastu orientation evaluator calculating cardinal placements:
  * **North-East (*Ishanya*)**: Pooja / Meditation room, open porch, sacred entry.
  * **South-East (*Agneya*)**: Fire quadrant allocated for Modular Kitchens.
  * **South-West (*Nairutya*)**: Earth quadrant reserved for Master Bedroom Suite.
  * **North-West (*Vayavya*)**: Air quadrant for Guest Bedrooms, bathrooms, and parking.
  * **Center (*Brahmasthan*)**: Structural clearance check ensuring light, open circulation.
* **3D Isometric Cutaway Visualizer**: Project 2D room layouts into full 3D axonometric isometric cutaways rendered in 6 curated architectural material palettes:
  - *Travertine & Light Oak*
  - *Microcement & Walnut*
  - *Shou Sugi Ban & Slate*
  - *Exposed Terracotta & Brass*
  - *Nordic Birch & White Marble*
  - *Board-Formed Concrete & Corten Steel*
* **Vector & Asset Export**: Export floor plans directly as scalable vector graphics (`.svg`) or high-resolution presentation renders.

---

### 5. 🤖 Architectural AI Assistant (Co-Pilot)
* **Spatial Design Consultant**: Real-time consultation on room clearances, Vastu compliance, corridor widths, acoustic treatments, and material specifications.
* **Construction Economics (INR)**: Up-to-date civil and structural cost benchmarks (Basic RCC ₹1,600–₹1,900/sqft, Standard ₹2,000–₹2,600/sqft, Luxury ₹2,800–₹4,200+/sqft) and modular interior estimates.
* **One-Click Visualizer Prompt Export**: Automatically outputs high-yield prompts formatted for direct execution in ArchiGen's render generators.
* **Multi-Turn Chat**: Context-aware conversation powered by Gemini 2.5 Flash / OpenRouter.

---

### 6. 📑 Client Presentation Sheet Generator
* **One-Click Presentation Boards**: Generate formatted, print-ready client presentation boards directly from any render or floor plan.
* **Specifier Details**: Automatically populates project title, author name, creation timestamp, design prompt, aspect ratio, seed, and disclaimer notice.
* **Print & PDF Export**: Instant browser print trigger formatted for A4/A3 architectural presentation documents.

---

### 7. 📁 Project Workspace & Asset Management
* **Organized Workspaces**: Group generations, floor plans, and redesigns into designated projects (e.g., *Coastal Villa*, *Urban Facade*, *3 BHK Layout*).
* **Favorites & Filtering**: Filter by typology (Architecture, Interior, Redesign, Floor Plan), search by project title, and bookmark favorites.
* **Cloud Storage**: Secure private object storage backed by Supabase Storage with signed temporary URLs.

---

### 8. ⚡ AI Prompt Enhancer
* Built-in prompt engineering director on all generator forms.
* Automatically expands brief, single-sentence descriptions into detailed, high-yield architectural prompts with material, lighting, and textural specifications.

---

## 💳 Credit System & Plans

ArchiGen AI operates on a credit-based model backed by PostgreSQL Row Level Security (RLS) and cryptographic transactions.

### Per-Action Credit Costs
| Action | Credits | Description |
|---|:---:|---|
| **Architecture Exterior Render** | `4` | High-resolution exterior building concept |
| **Interior Design Render** | `3` | Tailored room interior concept |
| **Room Redesign** | `3` | Photo-based restyling with structural lock |
| **Floor Plan Layout (AI)** | `5` | Automated 2D space planning from brief |
| **3D Isometric Cutaway Render** | `4` | 3D visual projection of 2D floor plan |
| **AI Assistant Reply** | `1` | Contextual architectural advice query |

### Plans & Pricing Tiers
| Tier | Price | Monthly Credits | Key Inclusions |
|---|:---:|:---:|---|
| **Starter** | `₹0` / forever | `20 credits` | Welcome bonus on sign-up, all 4 generators, 3 saved projects |
| **Studio** *(Popular)* | `₹499` / month | `600 credits/mo` | High-res downloads, unlimited projects, editable floor plans, priority queue |
| **Practice** | `₹1,999` / month | `3,000 credits/mo` | 5 team seats, client sharing links, custom brand presets, priority support |

### Credit Top-Up Packs
- **100 Credits**: `₹99`
- **500 Credits**: `₹399`
- **1,500 Credits**: `₹999`

> [!TIP]
> **Razorpay Integration**: Supports online payment processing via Razorpay with HMAC SHA-256 signature verification and simulated sandbox test checkout mode when keys are omitted.

---

## 🛠️ Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND                                 │
│  React 19.2 • TanStack Start (SSR) • TanStack Router • TanStack Query │
│       Tailwind CSS v4.2 • Radix UI Primitives • Lucide React           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│                          SERVER & APIS                                 │
│    TanStack Server Functions (RPC) • Vite 8 • Nitro Server Engine      │
│          Razorpay Payments API • OpenRouter / Google Gemini API        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴─────────────────────────────────────┐
│                       DATABASE & INFRASTRUCTURE                        │
│   Supabase PostgreSQL • Row Level Security (RLS) • Supabase Storage    │
│              Supabase Auth (JWT) • Vercel Edge Hosting                 │
└────────────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | [React 19.2](https://react.dev/) + [TanStack Start](https://tanstack.com/start) | Server-Side Rendering (SSR), streaming hydration, and isomorphic data loading |
| **Routing & State** | [TanStack Router](https://tanstack.com/router) & [TanStack Query v5](https://tanstack.com/query) | 100% type-safe file-based routing and cached server-state synchronization |
| **Styling & UI** | [Tailwind CSS v4.2](https://tailwindcss.com) + [Radix UI](https://www.radix-ui.com/) | Atomic CSS, dark/light theme tokens, accessible headless UI primitives |
| **Components & Icons** | [Lucide React](https://lucide.dev/) + [Sonner](https://sonner.emilkowal.ski/) | Responsive dialogs, drawers, toasts, and modern iconography |
| **Database & Auth** | [Supabase](https://supabase.com) | PostgreSQL 15 with RLS, auth triggers, database functions, and bucket storage |
| **AI Models** | Google Imagen 3, Gemini 2.5 Flash, OpenRouter | Text-to-image generation, photo style transfer, space layout generation, and chat |
| **Payments** | [Razorpay](https://razorpay.com/) | Instant checkout with server-side HMAC SHA-256 signature verification |
| **Build & Deploy** | [Vite 8](https://vite.dev/) + [Vercel](https://vercel.com) | Optimized modern bundling and serverless edge deployment |

---

## 📁 Project Structure

```
archigen-ai/
├── public/                     # Static assets, favicon, robots.txt, sitemap.xml
├── src/
│   ├── assets/                 # Hero villa, sample exterior/interior/plan image assets
│   ├── components/
│   │   ├── archigen/           # Studio components (Generator, PresentationSheet, ThemeToggle)
│   │   └── ui/                 # Radix UI + Tailwind component library (Button, Dialog, Slider, etc.)
│   ├── hooks/                  # React hooks (useProfile, useProjects, useCredits, useFloorPlans)
│   ├── integrations/
│   │   └── supabase/           # Supabase browser client, types & auth middleware
│   ├── lib/
│   │   ├── ai/                 # AI prompt builders, presets, and server handlers
│   │   │   ├── archigen.server.ts # Model invocation & image generation pipeline
│   │   │   ├── floor-plan-generator.ts # Space planning algorithmic parser
│   │   │   └── prompts.ts      # Architectural presets, Vastu guidelines & system prompts
│   │   ├── archigen-data.ts    # Tools, plans, pricing packs, and project mocks
│   │   ├── archigen.functions.ts # TanStack Start Server Functions (RPC endpoints)
│   │   └── query-keys.ts       # Centralized query key factory for caching
│   ├── routes/                 # File-based TanStack routes
│   │   ├── _authenticated/     # Protected studio routes
│   │   │   ├── architecture.tsx# Exterior architecture generator
│   │   │   ├── assistant.tsx   # AI architectural co-pilot chat
│   │   │   ├── dashboard.tsx   # User studio overview & recent projects
│   │   │   ├── floor-plan.tsx  # 2D CAD canvas & 3D space planner
│   │   │   ├── interior.tsx    # Interior design generator
│   │   │   ├── pricing.tsx     # Credit balance, plans & checkout
│   │   │   ├── projects.tsx    # Project library & manager
│   │   │   ├── redesign.tsx    # Room photo restyling & comparison slider
│   │   │   ├── route.tsx       # Authenticated shell layout (Navbar, UserMenu)
│   │   │   └── settings.tsx    # Profile, watermark & notification settings
│   │   ├── auth.tsx            # Sign in / Sign up page
│   │   ├── index.tsx           # Public landing page & feature showcases
│   │   └── __root.tsx          # Root layout & query/theme providers
│   ├── server.ts               # SSR request entrypoint & error handler
│   ├── start.ts                # TanStack Start entrypoint
│   └── styles.css              # Tailwind CSS v4 design tokens and theme layers
├── supabase/
│   ├── migrations/             # Timestamped SQL migration scripts
│   └── schema.sql              # Complete PostgreSQL schema, RLS policies, triggers & RPCs
├── DEPLOYMENT.md               # Detailed production deployment guide
├── package.json                # Dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite & TanStack Router configuration
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (or configure them in your Vercel dashboard):

| Variable | Scope | Required | Description | Default / Example |
|---|:---:|:---:|---|---|
| `VITE_SUPABASE_URL` | Client | **Yes** | Supabase project API URL | `https://xyz.supabase.co` |
| `SUPABASE_URL` | Server | **Yes** | Supabase project API URL (Server) | `https://xyz.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client | **Yes** | Supabase Anon public key | `eyJhbGci...` |
| `SUPABASE_PUBLISHABLE_KEY` | Server | **Yes** | Supabase Anon public key (Server) | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | **Yes** | Supabase Service Role key (Secret) | `eyJhbGci...` |
| `AI_API_KEY` | Server | **Yes** | API key for AI generation (OpenRouter / Gemini) | `sk-or-v1-...` |
| `AI_BASE_URL` | Server | No | Custom AI endpoint URL | `https://openrouter.ai/api/v1` |
| `GEMINI_API_KEY` | Server | No | Dedicated Google Gemini API key | `AIzaSy...` |
| `AI_IMAGE_MODEL` | Server | No | Model ID for image generation | `imagen-3.0-generate-002` |
| `AI_TEXT_MODEL` | Server | No | Model ID for text generation | `gemini-2.5-flash` |
| `RAZORPAY_KEY_ID` | Server | No | Razorpay Key ID for payments | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Server | No | Razorpay Secret for webhook signature verification | `secret_...` |

---

## 🚀 Quickstart & Local Development

### 1. Clone the Repository
```bash
git clone https://github.com/darvinkhobragade/archigen-ai.git
cd archigen-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase and execute the entire [`supabase/schema.sql`](supabase/schema.sql) file.
3. In **Authentication -> URL Configuration**, set `http://localhost:5173/**` as an allowed redirect URL.

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase and AI keys:
```bash
cp .env.example .env
```

### 5. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Run Unit Tests
```bash
npm test
```
Executes the Vitest suite verifying query keys, relative time formatting, schema validations, and floor plan generation:
```
 ✓ src/lib/__tests__/floor-plan-generator.test.ts (5 tests)
 ✓ src/lib/__tests__/query-keys.test.ts (10 tests)
 ✓ src/lib/__tests__/generator-schemas.test.ts (6 tests)
 ✓ src/lib/__tests__/archigen-data.test.ts (10 tests)
 ✓ src/lib/__tests__/relative-time.test.ts (3 tests)

Test Files  5 passed (5)
     Tests  34 passed (34)
```

---

## 🌐 Production Deployment

The project is configured for zero-config edge deployment on **Vercel**.

1. Push your repository to GitHub.
2. Import the project in the [Vercel Dashboard](https://vercel.com/new).
3. Set the Environment Variables listed in the table above.
4. Click **Deploy**.

For in-depth setup steps and troubleshooting, see the [Production Deployment Guide](DEPLOYMENT.md).

---

## 🔒 Access & Maintainer Policy

This repository is authored and maintained by **[Darvin Khobragade](https://github.com/darvinkhobragade)**.

- **Intellectual Property**: Proprietary architectural workflows, spatial algorithms, and UI designs are reserved by the author.

---

## 📄 License & Rights

Copyright © 2026 [Darvin Khobragade](https://github.com/darvinkhobragade). All Rights Reserved.  
Unauthorized copying, distribution, or commercial exploitation of this repository and its source code is prohibited without prior written permission.

---

<div align="center">

Made with ❤️ by [Darvin Khobragade](https://github.com/darvinkhobragade) • [ArchiGen AI Live App](https://archigen-ai-jet.vercel.app/)

</div>
