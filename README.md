# ArchiGen AI Studio

AI-assisted architecture, interior design, room redesign, and interactive floor plan generator built with TanStack Start, React, Tailwind CSS, and Supabase.

## Setup & Development

### 1. Environment Variables

Create a `.env` file with your Supabase credentials and AI API credentials:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_URL=your-supabase-url
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key

AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=your-ai-api-key
```

### 2. Local Development

```sh
npm install
npm run dev
```

## Stack

- **Frontend Framework**: React 19 + TanStack Start + TanStack Router
- **Styling**: Tailwind CSS v4
- **Backend / Database**: Supabase (Auth, Postgres RLS, Storage)
- **AI Renders & Chat**: Standard AI API (OpenAI / Gemini / OpenRouter)
