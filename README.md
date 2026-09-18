# CVPro 🇳🇬

> Your CV. Fixed. In 60 seconds.

CVPro helps Nigerian job seekers paste their CV + a job description and get an ATS-optimized rewritten CV in under 60 seconds. NYSC formatting, Nigerian certifications, Naira pricing, Paystack payments (Phase 2).

**Made by PrimeWeb Designs**

## Quick start

```bash
npm install
cp .env.example .env.local   # add your OpenRouter API key
npm run dev
```

Open http://localhost:3000 on your phone.

## Deploy to Vercel from your phone (Spck → GitHub → Vercel)

1. Push this repo to GitHub.
2. Go to vercel.com → Import the repo.
3. Add environment variable `OPENROUTER_API_KEY`.
4. Deploy. Done.

## Install as a PWA

Open the deployed URL in Chrome on Android → menu → "Add to Home screen".

## Phase 1 files

- `package.json` — deps & scripts
- `next.config.js` — PWA headers, strict mode
- `tailwind.config.js` — brand colors & fonts
- `app/layout.tsx` — dark shell, fonts, footer
- `app/page.tsx` — landing + form + results
- `app/api/fix/route.ts` — OpenRouter integration + rate limit
- `public/manifest.json` — PWA manifest
