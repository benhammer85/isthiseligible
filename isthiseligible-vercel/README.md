# Is This Eligible? — Vercel Starter

A Vercel-ready Next.js app that checks whether a purchase is eligible under a bike benefit policy using the Gemini API.

## What this app does

- Accepts receipt text, a product URL, notes, and an optional image or PDF.
- Sends the inputs to Gemini.
- Returns a structured decision:
  - `eligible`
  - `ineligible`
  - `review`
- Explains the reasons and extracts key purchase facts.

## Stack

- Next.js App Router
- Vercel
- Google GenAI SDK (`@google/genai`)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Gemini API key to `.env.local`:

   ```bash
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-3-flash-preview
   ```

4. Run locally:

   ```bash
   npm run dev
   ```

## Deploy to Vercel

1. Push this project to GitHub.
2. Import the repo into Vercel.
3. In **Project Settings > Environment Variables**, add:

   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (optional)

4. Redeploy.

## Notes

- The starter policy is editable in the UI. Replace it with your real reimbursement rules.
- The app intentionally returns `review` for ambiguous cases.
- Inline uploads should stay below 20 MB.
