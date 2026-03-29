# WIAL Global Chapter Network Platform

## Team "Team KK"

- [Ashwanth Balakrishnan](https://github.com/ashwanthbk)
- [Keerthana Jayaraman](https://github.com/keerthanajayaraman)

**Slack:** [#team-05-team-kk](https://opportunity-hack.slack.com/app_redirect?channel=team-05-team-kk)

---

## The Nonprofit

**[World Institute for Action Learning (WIAL)](https://wial.org)** is a global nonprofit that certifies Action Learning Coaches and helps organizations solve real business challenges while developing leaders. They operate 20+ chapters across the USA, Nigeria, Brazil, Philippines, and more — each chapter runs independently but needs to feel like part of one global brand.

---

## The Problem

WIAL came to us with three overlapping problems they hadn't been able to solve together:

- **No chapter infrastructure** — each affiliate manages its own website independently, with no shared template, inconsistent branding, and no way for global HQ to push updates
- **No payment system** — WIAL wants to collect dues from coaches and affiliates starting January 2026 ($50/enrollment, $30/certification) but has no mechanism to do it
- **Coaches can't be found across languages** — a client in Lagos searching "team dynamics in manufacturing" can't find a coach whose profile is written in Portuguese. A keyword filter can't solve that.

---

## What We Built

A multi-tenant chapter management platform with three layers:

1. **Admin Dashboard** — a single interface where WIAL Global and chapter leads manage everything: coaches, events, payments, content, deployments, email campaigns
2. **Chapter Websites** — static Astro sites on Cloudflare's CDN (330+ edge locations), provisioned from a shared template with per-chapter branding. Template updates at the base level propagate to all chapters automatically
3. **AI Coach Directory** — cross-lingual semantic search powered by Gemini embeddings and pgvector, so a query in any language finds coaches across all language profiles

---

## Live Links

|                       | URL                                |
| --------------------- | ---------------------------------- |
| Admin Dashboard       | https://admin.wial.ashwanthbk.com  |
| Chapter Site — Brazil | https://brazil.wial.ashwanthbk.com |
| Chapter Site — India  | https://india.wial.ashwanthbk.com  |

**Demo credentials:**

| Role                   | Email                      | Password      |
| ---------------------- | -------------------------- | ------------- |
| Super Admin            | admin@wial-test.com        | TestAdmin123! |
| Chapter Lead — USA     | usa-lead@wial-demo.com     | Demo1234!     |
| Chapter Lead — Nigeria | nigeria-lead@wial-demo.com | Demo1234!     |
| Chapter Lead — Brazil  | brazil-lead@wial-demo.com  | Demo1234!     |
| Chapter Lead — India   | india-lead@wial-demo.com   | Demo1234!     |

---

## Tech Stack

|               |                                                                                       |
| ------------- | ------------------------------------------------------------------------------------- |
| Admin         | Next.js 16, Tailwind CSS, shadcn/ui, next-intl (en/es/fr/pt)                          |
| Chapter Sites | Astro 6 (static, zero JS by default)                                                  |
| Backend       | Supabase — PostgreSQL, Auth, Row Level Security, Edge Functions, Realtime             |
| AI            | Gemini API — `text-embedding-004` (768-dim), Gemini Flash for reranking + content gen |
| Vector Search | pgvector with HNSW index                                                              |
| Payments      | Stripe Connect Express                                                                |
| Email         | Resend                                                                                |
| Deployment    | Vercel (admin) + Cloudflare Pages (chapters)                                          |
| Monorepo      | Turborepo + Yarn                                                                      |

---

## AI — Cross-Lingual Semantic Coach Search

This is the feature we're most proud of, and it's the one that makes the directory genuinely useful for a global audience.

Every coach profile (bio + specializations) gets embedded at save time via a Supabase trigger calling the `generate-embedding` Edge Function. Those 768-dimensional vectors are stored in pgvector with an HNSW index. When someone searches the directory, we embed their query in the same space — regardless of language — and retrieve by cosine similarity. Gemini Flash then reranks the top results and writes a short explanation for why each coach is a good match.

The practical result: type "desenvolvimento de liderança em manufatura" (Portuguese) and you get back English-speaking coaches who specialize in manufacturing leadership development — results no keyword search would return.

We also built:

- **AI content generation** — chapter leads provide their roster, events, and a target language; Gemini generates culturally-adapted copy for all 10 chapter pages (~60 seconds)
- **AI site editing** — chapter lead starts a session → a GitHub branch is created via the API → each prompt triggers `ai-edit.yml` (Gemini edits the chapter's Astro folder, commits, pushes) → Cloudflare builds a branch preview → approve to squash-merge to main

---

## Features

- One-click chapter provisioning via `scaffold-chapter` script → Cloudflare Pages auto-deploys on push
- Role-based access: Super Admin, Chapter Lead, Content Creator, Coach — enforced through Supabase RLS on every table
- Coach directory: CALC / PALC / SALC / MALC certification levels, Credly badge display, self-edit profiles, executive director approval workflow
- Events calendar: chapter-level and global rollup
- Stripe Connect: chapter leads connect their own Stripe account → enrollment ($50), certification ($30), dues, and event payments with automated receipts
- Email campaigns: compose → send to newsletter subscribers via Resend batch API
- Certification tracking: recertification due dates, CE credits, automated reminders at 90/60/30 days via pg_cron
- Analytics: real SQL RPCs for payment and business metrics (no mock data)
- 10 chapter pages: Landing, About, Action Learning & Certification, Coach Directory, Coach Profile, Testimonials, Events, Resources & Library, Contact, Membership
- Chapter sites load in 4s on slow 3G — static HTML, system font stack, AVIF/WebP images, no page over 200KB on landing

---

## Architecture

```
apps/
  admin/              → Next.js 16 → Vercel
  chapter-template/   → Astro 6 base template
  chapter-{slug}/     → Per-chapter Astro app → Cloudflare Pages (provisioned via script)
packages/
  template-core/      → Shared Astro layouts, components, data fetchers
  email/              → Resend email templates
  ui/                 → shadcn/ui components
  types/              → Supabase-generated TypeScript types
supabase/
  functions/          → 19 Edge Functions (AI, payments, email, search, deployments)
  migrations/         → 9 PostgreSQL migrations
.github/workflows/
  ai-edit.yml                    → AI editing compute (Gemini API)
  deploy-supabase-functions.yml  → Edge Function deployment
scripts/
  scaffold-chapter.ts  → Provisions a new chapter app from template
  seed-demo.ts         → Seeds demo data (coaches, events, chapters)
  clean-db.ts          → Clears demo data
```

Template propagation: any change to `packages/template-core/` triggers a rebuild of every chapter site via Cloudflare Pages build watch paths. Chapter-specific content is never touched.

---

## Running Locally

**Prerequisites:** Node 18+, Yarn, Supabase CLI

```bash
git clone https://github.com/2026-ASU-WiCS-Opportunity-Hack/05-team-kk.git
cd 05-team-kk
yarn install
```

Create `apps/admin/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_ADMIN_URL=http://localhost:3000
```

Create `apps/chapter-template/.env`:

```
PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CHAPTER_SLUG=usa
```

```bash
# Start local Supabase
supabase start
supabase db push

# Seed demo data
yarn seed-demo

# Run admin dashboard
yarn workspace @wial/admin dev

# Run a chapter site
yarn workspace @wial/chapter-template dev
```

To scaffold a new chapter:

```bash
yarn scaffold-chapter --slug=kenya --name="WIAL Kenya"
```

---

## What's Next

- Cloudflare Analytics API for real traffic charts per chapter
- PayPal Connect as a second payment option
- AI Knowledge Engine — summarize WIAL journal articles into multilingual, searchable snippets

---

## Links

- [Hackathon](https://www.ohack.dev/hack/2026_spring_wics_asu)
- [DevPost](https://wics-ohack-sp26-hackathon.devpost.com/)
- [Team Slack](https://opportunity-hack.slack.com/app_redirect?channel=team-05-team-kk)
- [WIAL](https://wial.org) · [WIAL-USA](https://wial-usa.org) · [WIAL Nigeria](https://wialnigeria.org)
