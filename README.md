# Munakasa (مناقصة)

[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-006A67?style=flat-square)](https://github.com/Open2Loop/munaqasa)
[![GitHub stars](https://img.shields.io/github/stars/Open2Loop/munaqasa?style=flat-square)](https://github.com/Open2Loop/munaqasa/stargazers)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

**Munakasa** (Arabic: **مناقصة**) is an open-source platform for Saudi government tender and RFP analysis, technical proposal drafting, and compliance-aware export. Consultants and contractors use it to ingest tender documents (كراسات الشروط), extract requirements, generate structured technical proposals, and prepare submission-ready Word documents aligned with local standards (SBC, SASO, LCGPA, Etimad).

**Live demo:** [https://mudrik.vercel.app](https://mudrik.vercel.app)  
**Repository:** [https://github.com/Open2Loop/munaqasa](https://github.com/Open2Loop/munaqasa)

---

## Why Munakasa

| Principle | How it works |
|-----------|--------------|
| **BYOK (Bring Your Own Key)** | Each user adds their own Gemini or OpenAI API key in Settings. The server does **not** ship shared `GEMINI_API_KEY` or `OPENAI_API_KEY` — you control cost, quotas, and data residency. |
| **No login required** | Supabase **Anonymous Sign-ins** create a session on first visit. Upload, analyze, and generate without email/password; data is scoped to that anonymous user via Row Level Security (RLS). |
| **Open source** | Full Next.js + Supabase codebase for self-hosting, auditing, and extending tender workflows. |

---

## Features

| Module | Route | Description |
|--------|-------|-------------|
| **Generation Engine** | `/command-center` | Analyze tender documents, extract requirements, generate multi-section technical drafts, and estimate WBS / BOQ with AI assistance. |
| **Vault** | `/vault` | Upload and store tender PDFs and attachments with text indexing and semantic search across past projects. |
| **Archive** | `/archive` | Version and reuse approved proposals and generated drafts for future tenders. |
| **Company Profile** | `/company-profile` | Maintain capabilities, certifications, and past experience for automatic injection into proposals. |
| **Compliance** | (engine + APIs) | Map requirements to SBC, SASO, local content (LCGPA), and gap analysis workflows. |
| **DOCX Export** | (engine) | Export polished technical proposals to Word for review and Etimad / government portal submission. |
| **Settings (BYOK)** | `/settings` | Configure Gemini or OpenAI keys and generation engine preferences per user. |

---

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, RLS, SSR, anonymous auth)
- **AI:** Google [Gemini](https://ai.google.dev/) via AI SDK; optional OpenAI-compatible endpoints (user keys only)
- **Documents:** `pdf-parse`, `mammoth`, `docx`, `docxtemplater`
- **UI:** React 18, Tailwind CSS, Framer Motion, Lucide icons
- **Testing:** Vitest

---

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project with **Anonymous Sign-ins** enabled (see below)
- A personal Gemini API key (or OpenAI-compatible provider) — added in the app UI, not in server env

### 1. Clone the repository

```bash
git clone https://github.com/Open2Loop/munaqasa.git
cd munaqasa
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Required variables (see `.env.example` for the full list):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `EMBEDDING_VECTOR_DIMENSIONS` | Embedding dimension (default `3072`) |

Optional:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for SEO (default `https://mudrik.vercel.app`) |
| `MODEL_API_BASE` | OpenAI-compatible API base when user selects OpenAI in Settings |

**Important — BYOK:** Do **not** set `GEMINI_API_KEY` or `OPENAI_API_KEY` on Vercel or in `.env.local` for production. Users enter keys in **Settings** (`/settings`); keys are stored per user in Supabase (`user_settings`).

### 3. Enable Supabase Anonymous Sign-ins

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Providers**.
2. Enable **Anonymous Sign-ins**.
3. Apply database migrations in `supabase/migrations/` if you have not already (RLS policies expect an authenticated anonymous user).

Without anonymous auth, the app cannot create a session and engine/vault APIs will reject requests.

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first load, an anonymous session is created automatically. Add your Gemini key under **Settings**, then open **Command Center** to analyze a tender.

### 5. Production build

```bash
npm run build
npm start
```

---

## Deploy on Vercel

1. Push this repository to GitHub: [Open2Loop/munaqasa](https://github.com/Open2Loop/munaqasa).
2. Import the project in [Vercel](https://vercel.com/new).
3. Set environment variables (at minimum `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `EMBEDDING_VECTOR_DIMENSIONS`). Optionally set `NEXT_PUBLIC_SITE_URL` to your production domain.
4. **Remove** any shared `GEMINI_API_KEY` / `OPENAI_API_KEY` from Vercel project settings if present.
5. Deploy. Vercel detects Next.js and runs `npm run build`.

CLI deployment (requires Vercel login and linked project):

```bash
npx vercel --prod
```

---

## Project Structure (overview)

```
app/
  command-center/   # Generation engine UI
  vault/            # Document vault
  archive/          # Proposal archive
  company-profile/  # Company capabilities
  settings/         # BYOK API keys
  api/engine/       # Analysis, WBS, BOQ, generation APIs
  robots.ts         # SEO robots.txt
  sitemap.ts        # SEO sitemap
  manifest.ts       # PWA-lite web manifest
lib/
  brand.ts          # Brand constants and GitHub URL
  site.ts           # Canonical SITE_URL and public routes
  supabase/         # Supabase client helpers
```

---

## Contributing

Issues and pull requests are welcome on the official repository:

**[https://github.com/Open2Loop/munaqasa](https://github.com/Open2Loop/munaqasa)**

If Munakasa helps your tender workflow, **star the repo** — it helps other consultants and contractors discover the platform.

---

## License

This repository does **not** include a separate `LICENSE` file. Source files contain proprietary copyright notices (`© 2026 All Rights Reserved`, author Al-Baraa). Review those headers before redistribution or commercial use. Contact maintainers via GitHub for licensing questions.

---

<p align="center">
  <strong>Munakasa · مناقصة</strong><br>
  Open-source tender intelligence for Saudi government procurement.<br>
  <a href="https://github.com/Open2Loop/munaqasa">⭐ Star us on GitHub</a>
</p>
