# AI Interview Prep Kit

A full-stack AI-powered assessment and preparation workspace. Input a job description and company URL to generate customized company research briefs, role requirement matrices, categorized question banks, flashcards, and a day-by-day practice schedule.

## Repository Structure

```
AI Interview Prep Kit/
├── backend/            # Express + MongoDB REST API & AI research pipeline
│   ├── src/            # Models, routes, services, and middlewares
│   ├── tests/          # Jest unit & integration tests
│   ├── .env.example    # Environment variable template
│   └── package.json
├── frontend/           # Next.js (App Router) + TypeScript + Tailwind CSS UI
│   ├── app/            # Next.js App Router pages (/login, /register, /, /kits/new, /kits/[id], /kits/[id]/practice)
│   ├── components/     # UI components (Navbar, Toast, ProgressOverlay, QuestionBankSection, FlashcardsSection)
│   ├── store/          # Zustand state management stores (useAuthStore, useKitStore)
│   ├── lib/            # Typed API fetch client (api.ts)
│   ├── types/          # TypeScript definitions (kit.ts)
│   ├── .env.example    # Frontend environment variable template
│   └── package.json
└── README.md
```

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The backend server runs on `http://localhost:8080`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend application runs on `http://localhost:3000`.

## Features
- **Session Auth**: Cookie-based HTTP-only session security.
- **Single & Batch Kit Generation**: Generate prep kits for single job descriptions or batch uploads (CSV/JSON).
- **Interactive Workspace**: Drag-and-drop question reordering, inline prompt/answer editing, pin flags (`pinned`), and scoped category regeneration.
- **Generation Polling**: Real-time progress overlay during AI pipeline execution.
- **Flashcard Practice Mode**: Smart spaced repetition ordering (lowest confidence first) with 3D card flips and keyboard shortcuts (`Space` to reveal, `1`-`4` for ratings).
