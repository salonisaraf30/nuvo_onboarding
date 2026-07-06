# Trade Onboarding Assistant — A Demo for Nuvo

> **Purpose**: A scrappy, few-hours demo built to show Nuvo (B2B trade network, Series A, Sequoia-backed) that I understand their core problem — turning slow, manual business onboarding into fast, structured, trustworthy decisions — and can build toward it. Written for Claude Code to build directly. Read top to bottom and implement in order.

---

## 1. The Problem This Reflects

Nuvo is a B2B trade network ("LinkedIn for B2B trade"). Their core value prop: when a business wants to trade with a new partner on credit, onboarding today is slow and manual — chasing trade references, credit history, licenses, and paperwork, often taking a week or more. Nuvo compresses that to 24–48 hours by surfacing verified trust signals and automated risk insights in one place.

This demo reflects that exact workflow at a lightweight, honest scope: it takes messy, unstructured onboarding information about a business and turns it into a clean, structured "trust profile" with organized signals and flagged items for review.

**Important honesty note for the build**: This is NOT a real credit-scoring or underwriting engine, and it must never present itself as one. It's a structuring and summarization assistant — it organizes information a human provides and flags what a reviewer should look at. It makes no real financial decisions. Keep all copy in the UI consistent with that framing (e.g., "for review," "suggested signals," never "approved" or "credit score: X").

---

## 2. What To Build

A single-page web app with one core flow:

1. User pastes in messy, unstructured onboarding info about a business — trade references, business description, years operating, notes, partial financials, etc. (free text)
2. An agent (Claude API) parses it into a structured trust profile:
   - **Business identity** (name, type, industry, years in operation — whatever's present)
   - **Trust signals** (positive indicators found: long operating history, strong references, verifiable licenses)
   - **Items to review** (gaps, inconsistencies, or missing info a human should follow up on)
   - **Suggested next steps** (what to verify before extending trade credit)
3. Output renders as a clean, scannable profile card — the kind of thing that turns "a week of back-and-forth" into "a 2-minute read."

That's the whole scope. No real credit decisioning, no external data lookups, no database.

---

## 3. Tech Stack (keep minimal)

- **Frontend**: Vite + React (fastest to scaffold; no SSR needed)
- **Styling**: Clean, minimal CSS or Tailwind — professional/trustworthy tone (this is fintech-adjacent B2B, so lean clean and credible, not playful)
- **API**: One backend route (or Vercel serverless function) calling Claude API
- **AI**: Claude API (`claude-sonnet-4-6` or latest) for the parsing/structuring
- **No database** — everything in-memory / client state

---

## 4. Agent System Prompt

```
You are an onboarding assistant for a B2B trade platform. Businesses use this
platform to decide whether to trade with a new partner on credit. Given messy,
unstructured information about a business, produce a clean, structured trust
profile to help a human reviewer make a faster decision.

IMPORTANT: You do NOT make credit decisions, assign credit scores, or approve/
reject anyone. You organize the information provided and flag what a human should
review. Never invent facts not present in the input. If something important is
missing, list it under "Items to Review" rather than guessing.

Return a JSON object (no markdown, no preamble) with this shape:
{
  "businessIdentity": {
    "name": "...",
    "industry": "...",
    "yearsOperating": "...",
    "type": "..."
  },
  "trustSignals": ["positive indicator 1", "positive indicator 2", ...],
  "itemsToReview": ["gap or inconsistency 1", "missing info 2", ...],
  "suggestedNextSteps": ["what to verify 1", "what to verify 2", ...],
  "summary": "2-3 sentence plain-language overview for the reviewer"
}

Be specific and only use what's in the input. If the input is thin, it's correct
and expected to have more items under itemsToReview.
```

---

## 5. UI Layout

**Header**: "Trade Onboarding Assistant" — subtitle: "Turn messy onboarding info into a clean trust profile in seconds."

**Input area**:
- Large textarea: "Paste business onboarding details, trade references, notes..."
- 2 example chips that autofill a realistic messy input (see Section 6)
- "Structure profile" button

**Loading state**: brief, with a message like "Structuring the trust profile..."

**Output area** (appears after generation):
- **Business Identity** card — name, industry, years operating, type (clean key-value layout)
- **Trust Signals** card — green-accented list of positive indicators
- **Items to Review** card — amber/neutral-accented list (NOT red/alarming — this is "look at these," not "rejected")
- **Suggested Next Steps** card — what to verify
- **Summary** at top or bottom — the plain-language overview
- "Structure another" button to reset

**Tone**: Professional, trustworthy, clean. This is B2B fintech-adjacent — it should look like something a serious operator would use, not a flashy consumer app. Neutral palette with restrained accent colors.

---

## 6. Example Input (for testing + as an autofill chip)

```
Talked to Redwood Building Supply about opening a trade account. They've been in
business since 2009, based in Oregon, sell lumber and building materials wholesale.
Gave two references — Cascade Contractors (worked with them 6 years, always paid on
time) and one other I couldn't reach. They mentioned annual revenue "around $4M" but
didn't share documentation. Have a state contractor license number but I haven't
verified it yet. Want net-30 terms on ~$50k initial order.
```

**Expected output shape** (roughly):
- Business Identity: Redwood Building Supply, building materials wholesale, operating since 2009 (~15 yrs), wholesale supplier
- Trust Signals: 15+ years operating history; strong verifiable reference (Cascade Contractors, 6 yrs, on-time payments); provided license number
- Items to Review: Second reference unreachable; revenue figure ($4M) undocumented; contractor license not yet verified; requesting net-30 on $50k without financial docs
- Suggested Next Steps: Verify contractor license with state board; obtain revenue documentation; reach the second reference or request an alternate; consider a lower initial credit line pending verification
- Summary: Established supplier with a solid track record and one strong reference, but several items (license, revenue docs, second reference) need verification before extending $50k net-30.

This example validates the agent is reasoning like a real onboarding reviewer, not just reformatting text.

---

## 7. Implementation Steps

1. Scaffold Vite + React
2. Set up the Claude API call (backend route or Vercel serverless function)
3. Build the input screen (textarea + 2 example chips + button)
4. Wire the API call with the Section 4 system prompt
5. Parse the JSON response and render the four cards + summary
6. Add loading + error states
7. Light styling pass — clean, professional, trustworthy (max ~1 hour)
8. Deploy to Vercel for a live shareable link

**Structured output note**: Ask Claude for strict JSON (no fences, no preamble) matching the Section 4 shape so rendering is clean and parsing doesn't break.

---

## 8. What NOT to Build

- No real credit scoring, underwriting, or approve/reject logic
- No external data lookups or API integrations (no real credit bureau calls, etc.)
- No user accounts, auth, or database
- No claims of making financial decisions anywhere in the UI
- No mobile-specific optimization — desktop-first is fine

Keep the scope tight and the framing honest: this structures and flags, it does not decide.

---

## 9. After Building

Deploy to Vercel and reference the live link in outreach to Nuvo's talent team, framed as: "I built a small tool that reflects your onboarding problem — turning messy trade info into a structured trust profile — because I wanted to actually engage with what Nuvo does, not just apply."

---

**End of spec. Build in order, keep it clean and honest, and prioritize the quality of the agent's structuring/flagging over UI polish.**
