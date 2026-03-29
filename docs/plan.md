# WIAL Global Chapter Network Platform — Plan

Consolidated reference for the platform. Phases 1-6 are complete.

---

## Architecture

Four systems communicating through Supabase and GitHub:

- **Admin Dashboard** — Next.js 16 on Vercel. Single interface for all roles (Super Admin, Chapter Lead, Content Creator, Coach). Supabase client with RLS. Calls Edge Functions for privileged ops. Dark/light mode, multi-language UI (en/es/fr/pt).
- **Chapter Websites** — Static Astro sites on Cloudflare Pages. Per-chapter folders (`apps/chapter-{slug}/`) extending `packages/template-core/`. Zero JS by default. Cloudflare CDN (330+ edges).
- **Supabase Backend** — PostgreSQL (pgvector), Auth, RLS, Edge Functions, Realtime, Storage. Edge Functions handle: invitations, deployments, AI content gen/translation, semantic search, contact forms, certification reminders, GitHub API calls.
- **GitHub + Actions** — Monorepo on GitHub. Cloudflare Pages auto-deploys via GitHub integration. GitHub Actions provides AI editing compute (Phase 5).

### Monorepo Structure

```
apps/admin/                  → Next.js admin → Vercel
apps/template/               → Base Astro template (scaffolding source)
apps/chapter-{slug}/         → Per-chapter Astro app → Cloudflare Pages
packages/ui/                 → shadcn/ui shared components
packages/types/              → TypeScript types (Supabase-generated)
packages/supabase/           → Supabase client config
packages/email/              → Centralized email (Resend templates)
packages/template-core/      → Shared Astro layouts, components, styles, data fetchers
supabase/                    → Migrations, seed data, Edge Functions
.github/workflows/           → AI editing workflow
```

### Tech Stack

| Layer           | Technology                                                                    |
| --------------- | ----------------------------------------------------------------------------- |
| Monorepo        | Turborepo + Yarn                                                              |
| Admin           | Next.js 16 on Vercel                                                          |
| Chapter Sites   | Astro on Cloudflare Pages                                                     |
| Backend         | Supabase Cloud (PostgreSQL, Auth, RLS, Edge Functions, Realtime, Storage)     |
| Vector Search   | pgvector (768 dim, Gemini text-embedding-004)                                 |
| AI              | Gemini API (content gen, translation, embeddings, coach matching, AI editing) |
| Deployment      | Per-chapter folders → GitHub → Cloudflare Pages auto-deploy                   |
| Email           | Resend via `packages/email/`                                                  |
| Styling         | Tailwind CSS + CSS custom properties                                          |
| UI Components   | shadcn/ui (Radix)                                                             |
| Content Editing | Tiptap WYSIWYG                                                                |
| i18n            | next-intl (admin), locale routes (chapter sites)                              |

---

## Completed Phases Summary

### Phase 1 — Foundation

Auth (email+password), invitation-driven onboarding, RLS chapter isolation, chapter CRUD with branding, user management, coach directory (chapter + global + self-edit), content blocks (Tiptap WYSIWYG, plain text, image URL, JSON), testimonials management, dark/light mode.

### Phase 2 — Chapter Site Creation

Astro template (8 pages), per-chapter branding via CSS custom properties, header nav + full footer, chapter provisioning to Cloudflare Pages, deployment pipeline with Realtime status, contact form via Edge Function + Resend, accessibility baseline (WCAG AA).

### Phase 3 — AI Features

Cross-lingual semantic search (Gemini embeddings + pgvector + HNSW), AI content generation (Gemini), AI translation with cultural adaptation, multi-language content (per-locale blocks, language routing, header switcher), low-bandwidth optimization (WebP, lazy loading, responsive images).

### Phase 4 — Per-Chapter Architecture, Events, Email

Per-chapter folder architecture, base template propagation via Cloudflare build watch paths, centralized email service (`packages/email/`), events calendar (admin + chapter sites), resources & library page, certification info section, coach certification tracking (recertification dates, CE credits, approval workflow), automated certification reminders (pg_cron at 90/60/30 days), client organizations table, 10-page chapter sites, multi-language admin UI (next-intl en/es/fr/pt).

### Phase 5 — AI Editing & Smart Coach Matching

Session-based AI editing: start session (GitHub branch) → send prompt(s) (GitHub Actions + Gemini) → Cloudflare branch preview → deploy (squash-merge) or discard. Scoped to chapter folders only. Smart coach matching: "Find a Coach" widget with Gemini embedding + vector search + reranking with explanations. Enhanced deployment history with AI prompt column, preview URL, approval status.

### Phase 6 — Payments, Analytics, Email Campaigns

Stripe Connect (Express accounts, no PayPal): chapter leads connect Stripe → create checkout sessions for enrollment ($50), certification ($30), dues, events → webhook updates payment status + sends receipts. Real analytics via SQL RPCs (`get_chapter_payment_metrics`, `get_chapter_business_metrics`, `get_global_revenue_metrics`) replacing all mock data. Email campaigns: draft → send to newsletter subscribers via Resend batch API. Weekly dues reminder via pg_cron. Campaigns page added to sidebar for super_admin + chapter_lead.

---

## Database Schema

### Tables

**Chapters** — id, name, slug, subdomain, status (active/suspended/archived), brand colors (primary/secondary/accent), brand_logo_url, brand_font, contact info, default_language, active_languages[], cloudflare_project_name, cloudflare_deploy_hook_url, github_folder_path, stripe_account_id, stripe_onboarding_complete, timestamps.

**Profiles** — id (FK auth.users), email, full_name, avatar_url, timestamps.

**User Roles** — id, user_id (FK profiles), chapter_id (nullable for super_admin), role (super_admin/chapter_lead/content_creator/coach), created_at. Super admin = null chapter_id.

**Coaches** — id, chapter_id, user_id (nullable), full_name, bio, bio_embedding (vector 768), specializations[], languages[], certification_level (CALC/SALC/MALC/PALC), hours_logged, photo_url, city, country, contact info, is_active, recertification_due_date, ce_credits_earned, certification_approved (default false), timestamps.

**Content Blocks** — id, chapter_id, block_key, locale, content_type (rich_text/plain_text/image_url/json), content, timestamps. Unique: (chapter_id, block_key, locale).

**Testimonials** — id, chapter_id, quote, author_name, author_title, author_photo_url, is_featured, sort_order, is_active, timestamps.

**Invitations** — id, chapter_id, email, role, invited_by, token (unique UUID), status (pending/accepted/expired), expires_at (7 days), created_at.

**Deployments** — id, chapter_id, triggered_by, status (queued/building/deploying/done/failed), deploy_url, build_log, commit_reference, error_message, ai_prompt, preview_url, approval_status (pending/approved/rejected), created_at, completed_at.

**Events** — id, chapter_id, title, description, event_type (certification/workshop/meetup/webinar), start_date, end_date, location, is_virtual, virtual_link, max_attendees, registration_link, is_published, created_by, timestamps.

**Client Organizations** — id, chapter_id, name, logo_url, website_url, description, sort_order, is_active, timestamps.

**Newsletter Subscribers** — id, chapter_id, email, name, subscribed_at, is_active. Unique: (chapter_id, email).

**Payments** — id, chapter_id, payer_id (nullable FK profiles), payer_email, payment_provider (stripe only), provider_transaction_id (unique), stripe_checkout_session_id (unique), amount (cents, >0), currency, payment_type (enrollment/certification/dues/event), status (pending/completed/failed/refunded), description, receipt_sent, idempotency_key (unique), timestamps. No RLS insert/update — service role only.

**Email Campaigns** — id, chapter_id (nullable = global), created_by (FK profiles), subject, body, audience_filter (jsonb), status (draft/sending/sent/failed), recipient_count, sent_at, timestamps.

**Global Coaches** — materialized view of active + approved coaches from active chapters. Refreshed via triggers.

### Key RLS Patterns

- Chapters: authenticated read (active only, super admins see all). Super admin insert/update. Chapter leads update branding/contact only.
- Coaches: public read (active + approved in active chapters). Self-edit restricted fields. Chapter leads/super admins full CRUD.
- Content Blocks: public read (active chapters). Chapter leads, content creators, super admins edit.
- Events: published publicly readable. Chapter leads + advanced coaches create/edit. Super admins full access.
- Deployments: read by chapter leads (own) + super admins. Insert/update via Edge Functions only.

### Automation

- Updated-at triggers on all mutable tables
- Profile creation trigger on auth.users insert
- Materialized view refresh on coach/chapter changes
- Embedding generation on coach bio/specialization changes (pg_net → Edge Function)
- pg_cron: daily certification reminders (90/60/30 days), daily event reminders (7 days out), weekly dues reminders (Mondays 09:00 UTC)

---

## Content Block Keys

**Landing:** hero_title, hero_subtitle, hero_description, hero_image_url, hero_cta_text, hero_cta_link, hero_featured_testimonial (json)
**About:** about_title, about_body, about_mission, about_image_url
**Action Learning/Cert:** al_title, al_intro, al_solves_problems_title/body, al_solution_spheres_title/body, al_components_title/intro/items(json), al_benefits_title/body, al_cta_text/link, cert_levels_info(json), cert_recertification_info, cert_application_link
**Coaches:** coaches_title, coaches_description
**Testimonials:** testimonials_title, testimonials_description
**Events:** events_title, events_description
**Resources:** resources_title, resources_description, resources_items(json)
**Contact:** contact_title, contact_description, contact_form_enabled, contact_map_embed_url
**Membership:** join_title, join_description, join_benefits, join_cta_text, join_cta_link
**Nav:** nav_home_label, nav_about_label, nav_action_learning_label, nav_coaches_label, nav_testimonials_label, nav_events_label, nav_resources_label, nav_contact_label, nav_join_label
**Footer:** footer_description, footer_copyright, footer_social_links(json), footer_newsletter_enabled, footer_client_logos(json — deprecated, use client_organizations table)

---

## AI Editing Flow (Phase 5)

1. Chapter lead clicks "Start Editing Session" → `/api/ai-edit/start` creates branch via GitHub API (`ai-edit/{slug}/{timestamp}`), creates deployment record (status: queued, approval_status: pending).
2. Chapter lead types prompt → `/api/ai-edit/prompt` triggers `ai-edit.yml` workflow on the branch. Workflow: checkout → Gemini API edits chapter folder → commit → push → update deployment with preview URL.
3. Iterative: more prompts add commits to same branch. Cloudflare branch preview auto-rebuilds.
4. Deploy: `/api/ai-edit/approve` (action: approve) → creates PR → squash-merge → delete branch → Cloudflare auto-deploys.
5. Discard: `/api/ai-edit/approve` (action: reject) → delete branch.

Rate limit: 1 active session per chapter. Scope: `apps/chapter-{slug}/` only.

---

## Smart Coach Matching (Phase 5)

`find-coach-match` Edge Function: embed query (Gemini text-embedding-004) → vector search (global_coaches or chapter-filtered) → Gemini reranks top 5 with explanations. Controlled by `ai_coach_matching_enabled` content block per chapter.

---

## Phase 6 — Payments, Analytics, Email Campaigns (Completed)

### 6.1 Payments

- **Stripe Connect Express** (no PayPal): WIAL Global = platform, each chapter = connected account
- Chapter lead clicks "Connect Stripe" → `/api/stripe/connect` POST → creates Express account + Account Link → Stripe hosted onboarding → callback at `/api/stripe/connect/callback` updates `stripe_onboarding_complete`
- Payment types: enrollment ($50 fixed), certification ($30 fixed), dues (custom amount), event (custom amount)
- `create-checkout` Edge Function: validates role + chapter Stripe status → Stripe Checkout Session REST API → inserts pending payment record → returns hosted checkout URL
- `stripe-connect-webhook` Edge Function: HMAC-SHA256 signature verification + 5-min replay protection → handles `checkout.session.completed` (update status + send receipt), `payment_intent.payment_failed`, `charge.refunded`, `account.updated`
- Automated dues reminders: pg_cron weekly (Mondays 09:00 UTC) → `send-dues-reminder` Edge Function → emails all chapter leads with Stripe connected
- Rate limit: 10 checkout creations/hour/chapter

### 6.2 Analytics

- Business metrics via SQL RPCs (real data, no mock):
  - `get_chapter_payment_metrics(chapter_id)` → total collected, outstanding, this month, by type
  - `get_chapter_business_metrics(chapter_id)` → active coaches, upcoming events, newsletter subscribers
  - `get_global_revenue_metrics()` → per-chapter revenue breakdown for super admin revenue page
- Cloudflare Analytics traffic chart: placeholder (Cloudflare Analytics API integration deferred — no tracking scripts needed)

### 6.3 Email Campaigns

- Campaigns page (`/dashboard/campaigns`) for chapter_lead + super_admin
- Create campaign (subject + HTML body) → saved as draft → "Send" calls `send-campaign` Edge Function
- `send-campaign`: fetches active `newsletter_subscribers` filtered by `audience_filter` → Resend batch API (100 emails/batch) → updates status/count/sent_at
- Audience filter: chapter-scoped (chapter_lead campaigns) or global (super_admin)

### Required Env Vars (Production)

| Variable | Where |
|---|---|
| `STRIPE_SECRET_KEY` | Vercel + Supabase secrets |
| `STRIPE_WEBHOOK_SECRET` | Supabase secrets only |
| `ADMIN_DASHBOARD_URL` | Supabase secrets (email links + Stripe redirect) |
| `NEXT_PUBLIC_ADMIN_URL` | Vercel (Stripe callback redirect) |
| `RESEND_API_KEY` | Supabase secrets (already set) |

Webhook endpoint: `https://gknwmdskojzpzzwuixhl.supabase.co/functions/v1/stripe-connect-webhook`
Events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`

---

## Design System (Quick Reference)

### Colors

- **Admin palette (fixed):** Warm ivory bg, deep teal primary (~#1A7A8A), WIAL golden yellow secondary (~#D4A900), WIAL crimson accent (~#C8102E), warm charcoal text
- **Chapter defaults:** Deep teal primary, lighter teal secondary, golden yellow accent. Header always white.
- **Certification levels:** CALC = blue, SALC = green, MALC = amber, PALC = plum-purple
- **Dark mode:** Admin only. Warm charcoal surfaces, never pure black. Chapter sites light-only.

### Typography

- Headings: Lexend. Body: Source Sans 3. Monospace: JetBrains Mono (admin logs only).
- System font stack recommended for low-bandwidth chapters.

### Key Design Rules

- WIAL logo always on white/light background
- Header always white on chapter sites
- Sidebar always dark charcoal with light logo zone at top
- Active sidebar item: golden yellow left bar
- All spacing base-4 scale (4px increments)
- Border radius: 4px (tags) → 8px (buttons/inputs) → 12px (cards) → 16px (hero images) → pill (badges)
- Lucide icons only, always with text labels in nav
- No emojis as functional icons
- Reduced motion: instant state changes, no animations

### Chapter Website Pages (10)

1. Landing/Hero
2. About
3. Action Learning & Certification
4. Coach Directory
5. Individual Coach Profile
6. Testimonials
7. Events Calendar
8. Resources & Library
9. Contact
10. Membership/Join

### Performance Budgets

- Landing: ≤200KB, Directory: ≤500KB, Image-heavy: ≤800KB
- JS: <100KB on content pages
- Images: AVIF → WebP → JPEG, no single image >50KB, lazy-load below fold
- Fonts: system stack default, optional Google Fonts
- Brotli compression, pre-compressed at build time

---

## Coding Standards

- Zod validation at boundaries (forms, Edge Functions). No internal validation.
- Supabase {data, error} — always check error.
- Secrets in env vars only. Service role key only in Edge Functions/builds.
- Rate limits: semantic search 10/min/IP, contact form 3/min/IP, AI edits 1 session/chapter, deploys 1 concurrent/chapter.
- DRY via shared packages. KISS with existing tools. SOLID per-function responsibility.
- No tests (hackathon scope).
- TypeScript strict, kebab-case files, PascalCase components, snake_case DB columns.
- All DB ops through Supabase client with RLS. Feature branches merged via PR.

---

## Locked Decisions

- Auth: email + password only
- Super Admin: manually seeded
- Subdomain: `{slug}.wial.ashwanthbk.com`
- Chapter deletion: soft delete only (active → suspended → archived)
- Package manager: Yarn
- Dark/light mode: admin required, chapter sites light-only
- Multi-language admin: next-intl en/es/fr/pt
- Chapter pages: exactly 10
- Header + footer on all pages
- All AI uses Gemini API only (OpenAI eliminated)

## Excluded

- AI-4 Knowledge Engine (journal/webinar processing)
- Coach multi-chapter support
- Mobile app, member forums, job board (SRD P2)
- LMS features (external system)
- Offline service workers
