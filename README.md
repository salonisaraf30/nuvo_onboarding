# Trade Onboarding Assistant

A small demo built for [Nuvo](https://www.nuvo.com) — it takes messy, unstructured
onboarding notes about a business and structures them into a clean **trust profile**:
business identity, trust signals, items to review, and suggested next steps.

**Honest framing**: this is a structuring and summarization assistant. It organizes
information a human provides and flags what a reviewer should verify. It does **not**
score credit, approve, reject, or make any financial decision.

## How it works

- **Frontend**: Vite + React single-page app. Paste intake notes (or load an example),
  hit "Structure profile," and the structured file renders as a credit-memo-style sheet.
- **Backend**: one serverless function (`api/structure.js`) that calls Claude
  (`anthropic/claude-sonnet-4-6`) through the Merge AI gateway with a strict
  JSON-output system prompt, validates the shape, and returns the profile.
- No database, no auth — everything is in-memory client state.

## Run locally

```bash
npm install
cp .env.example .env   # then put your Merge gateway key in .env
npm run dev
```

The dev server serves the same serverless handler at `/api/structure` that Vercel
runs in production, so the full flow works locally.

## Deploy

Deployed on Vercel. Set `MERGE_API_KEY` in the Vercel project's environment
variables; the `api/` directory is picked up automatically as serverless functions.

## Spec

Built from [`nuvo-onboarding-demo-spec.md`](./nuvo-onboarding-demo-spec.md).
