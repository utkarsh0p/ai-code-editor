# AGENTS.md — AI-Powered Code Editor

## Style Reference

All UI styling must follow **[style.md](./style.md)** — extracted from jasper.ai.
Key points: Inter for body, Playfair Display for headings, `#fa4028` flame-red as accent, `#00063d` navy as primary dark. Dark-mode surfaces use near-navy-black (`#00050f`). Buttons are pill-shaped (`border-radius: 100vw`).

---

## Project Overview

A browser-based AI-powered code editor built on top of the Monaco Editor shell. Provides multi-language support, VSCode themes, code execution via Piston API, custom JWT auth, MongoDB backend, and an AI layer powered by an external LLM API.

---

## What We Keep from the Original code-craft

- Monaco Editor integration
- Multi-language support (10 languages, all unlocked)
- VSCode theme switcher (5 themes)
- Piston API for code execution (do NOT replace with WebContainers)
- Overall UI layout and structure
- Font size controls

---

## What Was Removed

- **Clerk** — replaced with custom JWT auth
- **Convex** — replaced with MongoDB + Mongoose
- **Pro/Free pricing plans** — no payment logic, no Stripe
- **Community snippet sharing** — removed
- **User profiles and stats dashboard** — removed

---

## Auth System

- Custom JWT via `jose` (edge-runtime compatible)
- Register: email + password (hashed with bcryptjs), stored in MongoDB
- Login: verify password → sign JWT → return token in httpOnly cookie
- Protected routes via middleware that verifies JWT from cookie
- No social login

### JWT note
We use `jose` (not `jsonwebtoken`) because Next.js middleware runs on the Edge runtime and requires Web Crypto APIs. `jose` is fully compatible with both Edge and Node.js.

---

## Database — MongoDB + Mongoose

- `User` — auth data, request count, plan (default: free)
- `Snippet` — saved code snippets (future use)
- `ExecutionHistory` — per-user execution logs (future use)

Always check `/src/lib/db.ts` for the MongoDB connection before touching any data logic.

---

## AI Layer

### Trigger
- Ctrl+K inside the editor opens the AI sidebar panel
- Sidebar sends a request to `/api/ai/assist`

### API Route `/api/ai/assist`
- Method: POST
- Auth: required (JWT verified via cookie)
- Rate limit: `requestCount` in MongoDB, up to `DAILY_FREE_LIMIT` (20) free requests per day, reset daily
- Body: `{ language, code, cursorLine, cursorCol, task, error? }`
- Task types: `completion` | `explanation` | `refactor` | `debug`
- Returns: `{ result: string }`
- On limit exceeded: 429 `"Daily limit reached. Pro plan coming soon."`

### Provider abstraction
`/src/lib/ai.ts` owns the prompt building and HTTP call. Switching LLM providers only requires changing the fetch logic inside `callLLM()`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19, TailwindCSS |
| Editor | Monaco Editor |
| Auth | `jose` + `bcryptjs` + httpOnly cookie |
| Database | MongoDB + Mongoose |
| Code Execution | Piston API |
| AI | External LLM API (key via env) |

---

## Environment Variables

```
MONGODB_URI=
JWT_SECRET=
AI_API_KEY=
AI_API_URL=
```

---

## Folder Structure

```
/src
  /app
    /api
      /auth
        /register     → POST email + password → create user
        /login        → POST credentials → return JWT cookie
        /logout       → POST → clear cookie
        /me           → GET → return current user from JWT
      /ai/assist      → POST → LLM API route
    /(root)           → Main editor page (protected, URL: /)
    /login            → Login page (public)
    /register         → Register page (public)
  /components
    /ai               → AISidePanel component
  /hooks
    /useAuth.ts       → Client-side auth state hook
  /lib
    /db.ts            → MongoDB connection (singleton)
    /auth.ts          → JWT sign/verify helpers (jose)
    /ai.ts            → LLM fetch wrapper
  /models
    /User.ts
    /Snippet.ts
    /ExecutionHistory.ts
  /middleware.ts      → Verify JWT cookie, protect / and /api routes
```

---

## Rules for Agents

- Do NOT add payment, Stripe, or pricing logic
- Do NOT add community/social features unless asked
- The AI route is stateless — no conversation history, single-shot prompt per request
- All languages are unlocked for all authenticated users (no pro gating)
- Keep editor UI close to the original — only change what's listed above
- When in doubt, do less and ask
