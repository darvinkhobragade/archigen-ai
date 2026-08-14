# 🏛️ ArchiGen AI Studio

<div align="center">

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-archigen--ai--jet.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://archigen-ai-jet.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start_SSR-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.2-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<br />

**An AI-powered architecture & interior design studio. Generate photorealistic architectural structures, interior concepts, perform room restyling, design interactive 2D/3D floor plans, and consult an intelligent architectural AI assistant.**

[🚀 Explore Live App](https://archigen-ai-jet.vercel.app/) • [📖 Deployment Guide](DEPLOYMENT.md) • [✨ Key Features](#-features) 
</div>

---

## 🌟 Overview

**ArchiGen AI Studio** brings generative AI capabilities to architects, interior designers, real estate professionals, and homeowners. Built on **React 19**, **TanStack Start (SSR)**, **Supabase**, and modern AI models (including **Imagen 3** and **Gemini 2.5 Flash**), ArchiGen AI Studio delivers a unified, reactive workstation for architectural ideation, spatial planning, and interior remodeling.

🔗 **Live Website**: [https://archigen-ai-jet.vercel.app/](https://archigen-ai-jet.vercel.app/)

---

## ✨ Features

### 🏢 1. Generative Architecture Studio
- Transform conceptual prompts into high-resolution, photorealistic exterior architecture renders.
- Choose building types (Modern Villa, Skyscraper, Sustainable Eco-House, Brutalist, Classical, etc.).
- Configure lighting conditions (Golden Hour, Overcast, Night Illumination, Blue Hour) and camera angles.

### 🛋️ 2. Interior Design Studio
- Design bespoke interior living spaces, commercial offices, kitchens, luxury suites, and bathrooms.
- Select from various curated styles (Minimalist, Japandi, Scandinavian, Industrial, Mid-Century Modern, Art Deco).
- Fine-tune material palettes (marble, walnut wood, polished concrete, brass accents) and ambient lighting.

### 🔄 3. Room Redesign & Style Transfer
- Upload photos of existing spaces to remodel and restyle while preserving room geometry and structural integrity.
- Compare Before/After transformations seamlessly with interactive sliders.

### 📐 4. Interactive 2D & 3D Floor Plan Visualizer
- Visual 2D CAD canvas with grid-snapping, room placement, door/window cutout tools, and dimension calculations.
- Instant 3D visualizer projection with dynamic room heights and spatial preview.
- AI-assisted floor plan generation and prompt-to-layout translation.

### 🤖 5. Architectural AI Assistant
- Consult with an AI architect and zoning advisor for building codes, material specifications, acoustic engineering, and structural recommendations.
- Interactive multi-turn chat with context-aware design insights.

### 💼 6. Project Management & Gallery
- Organize generations into dedicated projects and client boards.
- High-res cloud storage powered by Supabase Storage with direct download & sharing.

### 💳 7. Credit System & Tiered Access
- Built-in PostgreSQL RLS-backed credit transactions (`spend_credits`, `refund_credits`).
- Automatic 20 welcome credits on user signup with plan upgrade tiers (Free, Pro, Enterprise).

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
|---|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TanStack Start](https://tanstack.com/start) | Full-stack React framework with SSR and streaming capabilities |
| **Routing & State** | [TanStack Router](https://tanstack.com/router) & [TanStack Query](https://tanstack.com/query) | Type-safe routing and server-state management |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + [Radix UI](https://www.radix-ui.com/) | Modern atomic styling with accessible primitives and smooth animations |
| **Icons & UI** | [Lucide React](https://lucide.dev/) + Sonner + Vaul | Crisp UI icons and responsive drawer/toast notifications |
| **Database & Auth** | [Supabase](https://supabase.com) | PostgreSQL database, Row Level Security (RLS), Auth, and Object Storage |
| **AI Models** | Google Imagen 3, Gemini 2.5 Flash, OpenRouter | State-of-the-art vision and multimodal intelligence |
| **Hosting & CDN** | [Vercel](https://vercel.com) | High-performance edge deployment and serverless compute |

---

## 📁 Project Structure

```
archigen-ai/
├── public/                # Static assets, logos, and icons
├── src/
│   ├── assets/            # Project graphics and image assets
│   ├── components/        # Reusable UI component library (Radix + Tailwind)
│   ├── hooks/             # Custom React hooks (auth, credits, theme)
│   ├── integrations/      # Supabase & third-party client integrations
│   ├── lib/               # Utility functions and API helpers
│   ├── routes/            # TanStack Start file-based routing
│   │   ├── _authenticated/# Protected routes (Dashboard, Studio, Floor Plan, etc.)
│   │   ├── auth.tsx       # Authentication & Sign in / Sign up page
│   │   ├── index.tsx      # Landing page & feature showcases
│   │   └── __root.tsx     # Root application layout & providers
│   ├── server.ts          # Server-side API endpoints & AI orchestrator
│   ├── start.ts           # TanStack Start SSR entrypoint
│   └── styles.css         # Tailwind CSS v4 design tokens and theme layers
├── supabase/
│   └── schema.sql         # Complete PostgreSQL schema, RLS, and storage rules
├── DEPLOYMENT.md          # Comprehensive production deployment walkthrough
├── package.json           # Project manifest and dependencies
└── vite.config.ts         # Vite & TanStack Router configuration
```

---

## 🌐 Production Deployment

The application is optimized for zero-config deployment on **Vercel** and **Netlify**.

### Deploy to Vercel
1. Push your repository to GitHub.
2. Import the project in [Vercel Dashboard](https://vercel.com/new).
3. Set the environment variables in project settings (see [Environment Variables Reference](#-environment-variables)).
4. Click **Deploy**.

For detailed deployment instructions and Supabase auth configuration, refer to the [Production Deployment Guide](DEPLOYMENT.md).

---

## ⚙️ Environment Variables

| Variable | Scope | Required | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Client | Yes | Supabase project API URL |
| `SUPABASE_URL` | Server | Yes | Supabase project API URL for server-side handlers |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client | Yes | Supabase Anon public key |
| `SUPABASE_PUBLISHABLE_KEY` | Server | Yes | Supabase Anon public key for server-side operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Yes | Supabase Service Role secret key for privileged tasks |
| `AI_BASE_URL` | Server | Optional | AI endpoint (default: `https://openrouter.ai/api/v1`) |
| `AI_API_KEY` | Server | Yes | API key for AI generation (OpenRouter / OpenAI / Gemini) |
| `GEMINI_API_KEY` | Server | Optional | Dedicated Google Gemini API key |
| `AI_IMAGE_MODEL` | Server | Optional | Default image generation model (`imagen-3.0-generate-002`) |
| `AI_TEXT_MODEL` | Server | Optional | Default text/chat model (`gemini-2.5-flash`) |

## 🔒 Access & Maintainer Policy

This repository is strictly maintained and authored by **[Darvin Khobragade](https://github.com/darvinkhobragade)**. 

- **Direct Commits & Push Access**: Restricted exclusively to the repository owner.
- **External Pull Requests / Contributions**: Not accepted.
- **Unauthorized Distribution**: Proprietary architecture, intellectual property, and design assets are reserved by the author.

---

## 📄 License & Rights

Copyright © 2026 [Darvin Khobragade](https://github.com/darvinkhobragade). All Rights Reserved.  
Unauthorized copying, modification, distribution, or commercial exploitation of this repository and its source code is strictly prohibited without explicit written permission from the author.

---

<div align="center">

Made with ❤️ by [Darvin Khobragade](https://github.com/darvinkhobragade) • [ArchiGen AI Live App](https://archigen-ai-jet.vercel.app/)

</div>
