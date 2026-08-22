# Interview Prep Template

A self-service dashboard: someone uploads a resume, cover letter and job
description (PDF, Word, or plain text), and it generates a fit assessment,
a 180-day roadmap, 8 STAR flashcards, a 90-second pitch, and an optional
two-host podcast script — all live, via the Claude API.

This version is meant to be deployed on your own domain, outside of any
Claude.ai preview sandbox, so the file upload button behaves like a normal
web page (because it is one).

## How it's built

- `index.html` — the whole frontend: upload UI, PDF/DOCX text extraction
  (via pdf.js and Mammoth.js, loaded from cdnjs), and the dashboard.
- `api/generate.js` — a small serverless function that calls the Anthropic
  API on the server side, so your API key is never exposed to visitors'
  browsers.

The browser never talks to `api.anthropic.com` directly. It calls
`/api/generate` on your own domain, and that function calls Anthropic with
your key attached server-side.

## Before you deploy: this needs a live server

Double-clicking `index.html` and opening it in Chrome as a local file
(`file:///...`) will not work. "Generate my prep pack" calls `/api/generate`,
which is a serverless function — there's no server to answer that request
when the page is just a file on disk. You'll see it fail silently or with
a network error in Chrome's DevTools (F12 → Network tab → look for the
`generate` request).

To test it before making it public:

```
npm i -g vercel
cd interview-prep-template
vercel login
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
vercel dev
```

`vercel dev` starts a local server (usually `http://localhost:3000`) that
runs both the static page and the `/api/generate` function together —
that's the URL to open in Chrome, not the raw `index.html` file.

## Deploy it for real (Vercel — free tier works)

1. Create a new GitHub repo and push these files to it (`index.html`,
   `api/generate.js`, `package.json`, `.gitignore`).
2. Go to [vercel.com/new](https://vercel.com/new) and import that repo.
   Vercel auto-detects `index.html` as the static site and `api/generate.js`
   as a serverless function — no build configuration needed.
3. Before deploying, add an environment variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: an API key from [console.anthropic.com](https://console.anthropic.com)
     (Settings → API Keys)
4. Deploy. You'll get a live URL like `your-project.vercel.app` — share
   that link with anyone; they don't need a Vercel or Anthropic account to
   use it.

### Alternative: Vercel CLI

```
npm i -g vercel
cd interview-prep-template
vercel
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

### Alternative: Netlify

The same split (static `index.html` + one serverless function) works on
Netlify too — put `api/generate.js` in a `netlify/functions/` folder
instead, adjust the frontend's fetch path to `/.netlify/functions/generate`,
and set `ANTHROPIC_API_KEY` under Site settings → Environment variables.

## Costs and limits to know about

- Once this is live and public, anyone with the link can trigger real,
  billed API calls against your key. There's no login wall.
- Consider adding a request cap (e.g. via Vercel's rate limiting, or a
  simple shared passphrase check in `api/generate.js`) before sharing the
  link widely.
- Each full "Generate my prep pack" run makes 3 API calls (fit + roadmap,
  STAR flashcards, pitch); the podcast script is a 4th, on demand.

## What's different from the Claude.ai artifact version

- File upload (PDF/DOCX/TXT) works normally — there's no sandbox around a
  self-hosted page restricting the native file picker.
- The API key lives server-side in `api/generate.js`, not inline in the
  page, so it's safe to make this link public.
- Anyone with the URL can use it without a Claude.ai account.
