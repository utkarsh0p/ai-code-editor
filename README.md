# CodeCraft — AI-Powered Code Editor

A browser-based code editor with built-in AI assistance, multi-language support, and VSCode themes.

## Features

- Monaco Editor with syntax highlighting for 10 languages
- 5 VSCode themes (VS Dark, VS Light, GitHub Dark, Monokai, Solarized Dark)
- Code execution via Piston API
- AI assistant sidebar (Ctrl+K) — explain, debug, refactor, complete
- Custom JWT authentication (register / login)
- Rate-limited AI usage (20 requests/day on free tier)

## Tech Stack

- **Framework** — Next.js 15 (App Router)
- **Editor** — Monaco Editor
- **Auth** — Custom JWT via `jose` + bcrypt + httpOnly cookie
- **Database** — MongoDB + Mongoose
- **AI** — Google Gemini via OpenAI-compatible API
- **Execution** — Piston API

## Getting Started

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Set environment variables

Create a `.env.local` file:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret
AI_API_KEY=your_gemini_api_key
AI_API_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
AI_MODEL=gemini-2.0-flash
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register an account, and start coding.
