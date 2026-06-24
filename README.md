# Munakasa (مناقصة)

[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-006A67?style=flat-square)](https://github.com/Open2Loop/Mudrik-Engine)
[![GitHub stars](https://img.shields.io/github/stars/Open2Loop/Mudrik-Engine?style=flat-square)](https://github.com/Open2Loop/Mudrik-Engine)

**Munakasa** (Arabic: **مناقصة**) is an open-source platform for Saudi government tender and RFP analysis, technical proposal drafting, and compliance-aware export. It helps consultants and contractors ingest tender documents (كراسات الشروط), extract requirements, generate structured technical proposals, and prepare submission-ready Word documents aligned with local standards.

**Repository:** [https://github.com/Open2Loop/Mudrik-Engine](https://github.com/Open2Loop/Mudrik-Engine)

---

## Features

| Module | Description |
|--------|-------------|
| **Generation Engine** | Analyze tender documents, extract requirements, generate multi-section technical drafts, and estimate WBS / BOQ with AI assistance. |
| **Vault** | Upload and store tender PDFs and attachments with text indexing and semantic search across past projects. |
| **Archive** | Version and reuse approved proposals and generated drafts for future tenders. |
| **Company Profile** | Maintain capabilities, certifications, and past experience for automatic injection into proposals. |
| **Compliance** | Map requirements to SBC, SASO, local content (LCGPA), and gap analysis workflows. |
| **DOCX Export** | Export polished technical proposals to Word for review and Etimad / government portal submission. |

---

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, RLS, SSR)
- **AI:** Google [Gemini](https://ai.google.dev/) via AI SDK; optional OpenAI-compatible endpoints
- **Documents:** `pdf-parse`, `mammoth`, `docx`, `docxtemplater`
- **UI:** React 18, Tailwind CSS, Framer Motion, Lucide icons
- **Testing:** Vitest

---

## Quick Start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project
- A Gemini API key (or OpenAI-compatible provider configured in settings)

### 1. Clone the repository

```bash
git clone https://github.com/Open2Loop/Mudrik-Engine.git
cd Mudrik-Engine
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables (see `.env.example` for the full list):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `GEMINI_API_KEY` | Google Gemini API key for the generation engine |
| `EMBEDDING_VECTOR_DIMENSIONS` | Embedding dimension (default `3072`) |

Optional: `MODEL_API_BASE`, `OPENAI_API_KEY` for OpenAI-compatible providers.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production build

```bash
npm run build
npm start
```

---

## Deploy on Vercel

1. Push this repository to GitHub: [Open2Loop/Mudrik-Engine](https://github.com/Open2Loop/Mudrik-Engine).
2. Import the project in [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in the Vercel project settings.
4. Deploy. Vercel will detect Next.js and run `npm run build` automatically.

For CLI deployment (requires Vercel login and linked project):

```bash
npx vercel --prod
```

---

## Project Structure (overview)

```
app/
  command-center/   # Main generation engine UI
  vault/            # Document vault
  archive/          # Proposal archive
  company-profile/  # Company capabilities
  api/engine/       # Analysis, WBS, BOQ, generation APIs
lib/
  brand.ts          # Brand constants and GitHub URL
  supabase/         # Supabase client helpers
```

---

## Contributing

Contributions are welcome. Please open issues and pull requests on the official repository:

**[https://github.com/Open2Loop/Mudrik-Engine](https://github.com/Open2Loop/Mudrik-Engine)**

If this project helps your tender workflow, consider giving it a star on GitHub — it helps others discover the platform.

---

## License

This repository does **not** include a separate `LICENSE` file. Source files contain proprietary copyright notices (`© 2026 All Rights Reserved`). Review those headers before redistribution or commercial use. Contact the maintainers via the GitHub repository for licensing questions.

---

<p align="center">
  <strong>Munakasa · مناقصة</strong><br>
  Open-source tender intelligence for Saudi government procurement.<br>
  <a href="https://github.com/Open2Loop/Mudrik-Engine">⭐ Star us on GitHub</a>
</p>
