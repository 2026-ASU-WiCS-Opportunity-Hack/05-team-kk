# WIAL Global Chapter Network Platform — Implementation Plan

Phases 1-3 are complete and summarized for reference. This document focuses on Phase 4 (Per-Chapter Architecture, Events, Email), Phase 5 (AI Editing, Smart Matching), and Phase 6 (Payments, Analytics). No test plan is included.

---

## Table of Contents

- [0. Scope Boundaries and Active Constraints](#0-scope-boundaries-and-active-constraints)
- [1. Architecture and Systems](#1-architecture-and-systems)
- [2. Database Design — Existing Tables](#2-database-design--existing-tables)
- [3. Database Design — New Tables](#3-database-design--new-tables)
- [4. Row Level Security](#4-row-level-security)
- [5. Database Automation](#5-database-automation)
- [6. Completed Phases Summary](#6-completed-phases-summary)
- [7. Phase 4 — Per-Chapter Architecture, Events, and Email](#7-phase-4--per-chapter-architecture-events-and-email)
- [8. Phase 5 — AI Editing and Smart Coach Matching](#8-phase-5--ai-editing-and-smart-coach-matching)
- [9. Phase 6 — Payments and Analytics](#9-phase-6--payments-and-analytics)
- [10. Implementation Sequence](#10-implementation-sequence)
- [11. Coding Standards](#11-coding-standards)
- [12. Spec Alignment Traceability](#12-spec-alignment-traceability)

---

## 0. Scope Boundaries and Active Constraints

This plan covers all six phases. Phases 1-3 are complete. Phases 4-5 are active. Phase 6 is fully planned but implementation is deferred until the platform is stable.

### Decisions Log

#### Locked — Do Not Revisit

- **Auth:** Email + password only. No magic link, no OAuth providers.
- **Super Admin creation:** Manually seeded in the database. No self-serve signup.
- **Subdomain format:** `{slug}.wial.ashwanthbk.com`
- **Chapter deletion:** Soft delete only. Status transitions: active → suspended → archived. No hard deletes.
- **Package manager:** Yarn (not npm, not pnpm).
- **Admin dark/light mode:** Required from day one. Use next-themes.
- **Admin multi-language UI:** next-intl with en/es/fr/pt translation JSON files. All static text goes through i18n — no hardcoded English strings in UI.
- **Chapter website pages:** Exactly 10 — landing, about, action learning/certification, coach directory, individual coach profile, testimonials, events, resources, contact, membership/join.
- **Header + footer:** On all 10 chapter website pages. Footer includes: contact info, social links, newsletter subscribe, client logos.

#### Deferred — Will Implement (Phase 6)

- Payment integration (Stripe Connect + PayPal) — full plan in Section 9. UI mocked with sample data in earlier phases so dependent features work.
- Full analytics dashboard — basic metrics first in Phase 4, detailed charts in Phase 6.
- Email campaigns with segmentation — basic newsletter in Phase 4, full campaign composer in Phase 6.

#### Excluded — Not Building

- Coach multi-chapter support. One chapter per coach enforced.
- Mobile app, member forums, job board.
- AI-4 Knowledge Engine (journal article / webinar processing).
- LMS features — external system, do not touch.

---

### Fixed Product Rules

Monorepo with Turborepo and Yarn. Next.js 16 admin portal on Vercel. Astro chapter websites on Cloudflare Pages. Supabase Cloud backend. Email + password auth only. Super Admins manually seeded. Dark/light mode admin portal. Multi-language admin UI. Ten public chapter pages (landing/hero, about, action learning/certification, coach directory, individual coach profile, testimonials, events calendar, resources/library, contact, membership/join). Header navigation and full footer on all pages. Soft deletion only for chapters. Rich text content via Tiptap WYSIWYG. Tailwind CSS with CSS custom properties for branding. Per-chapter folders in monorepo deployed to Cloudflare Pages via GitHub integration. Gemini API for content generation, translation, coach matching reranking, and embeddings (text-embedding-004, 768 dimensions). pgvector for vector search. OpenAI dependency eliminated. GitHub Actions + OpenCode CLI (with Gemini API key) for AI site editing compute. Centralized email service via Resend.

### External Systems — Do Not Build

- **LMS:** WIAL uses an external LMS for course delivery. Do not modify or replace.
- **Credly:** Digital badges issued externally. Our system tracks certification levels but badge issuance is external.

### Deferred Decisions

- Coach multi-chapter support. Current plan enforces one chapter per coach.
- Mobile app, member forums, job board (SRD P2 items).

### Explicit Exclusions

AI-4 Knowledge Engine (journal articles/webinar processing). Phase 4 SRD payment flows are planned but not implemented until Phase 6.

---

## 0.5 Persona Flows

Reference when building role-specific screens. Each step maps to a feature in the admin dashboard.

**Chapter Lead**

1. Receives invitation email → creates account
2. Lands on chapter dashboard — coaches, content, events, deployments overview
3. Customizes branding (colors, logo, font) with live preview
4. Edits content blocks via WYSIWYG or AI generation
5. Manages coach roster (add, edit, deactivate, invite)
6. Manages testimonials (add, edit, reorder, feature on landing)
7. Manages events calendar (certification programs, workshops, meetups)
8. Manages client organizations (logos, links)
9. Triggers deployment — site goes live at subdomain
10. (Phase 5) Requests AI site edit via natural language, reviews preview, approves/rejects
11. (Phase 6) Views payment reports, manages dues collection, sends reminders

**Coach (CALC / all certification levels)**

1. Receives invitation → creates account (auto-linked to existing coach record)
2. Edits own profile: bio, specializations, languages, photo, location, contact info, website
3. Cannot edit: certification level, hours logged, is_active, certification_approved — chapter lead manages these
4. Views "My Certification" section: current level, hours logged, recertification due date, CE credits
5. Receives automated email reminders at 3 months, 2 months, 1 month before recertification due date
6. Views chapter events and resources
7. (Phase 6) Pays membership dues through the platform

**Super Admin**

1. Logs in to global dashboard — chapter count, coach count, deployment status
2. Creates chapters — auto-provisions repo folder, Cloudflare project, invites chapter lead
3. Manages all users across all chapters (invite, role-change, deactivate)
4. Views global coach directory with cross-chapter semantic search
5. Updates base template — auto-deploys to all chapter sites via shared package change
6. Views global events calendar (aggregated from all chapters)
7. Reviews and approves coach certification changes before public visibility
8. (Phase 6) Views global payment dashboard and org-wide reports

**Content Creator**

1. Receives invitation → creates account
2. Creates and edits content blocks (WYSIWYG, plain text, image URL, JSON)
3. Uses AI content generation and AI translation
4. Views coach directory read-only
5. Cannot manage users, settings, deployments, or payments

**General Public (no auth) — chapter website**

- Browse all 10 pages
- Search coach directory in any language (semantic search)
- (Phase 5) AI-powered "Find a Coach" matching widget
- View events calendar, submit contact form, subscribe to newsletter
- Language switcher for multi-language chapters

---

## 1. Architecture and Systems

The platform has four independent systems communicating through Supabase and GitHub.

**Admin Dashboard** — Next.js 16 on Vercel. Single interface for all four roles. Communicates with Supabase via browser client (gated by RLS). Calls Edge Functions for privileged operations. In Phase 5, triggers GitHub Actions for AI editing.

**Chapter Websites** — Static HTML generated by Astro, hosted on Cloudflare Pages. One Cloudflare Pages project per chapter. Each chapter has its own folder in the monorepo (`apps/chapter-{slug}/`) extending shared packages. Builds read data from Supabase at build time. Zero JavaScript by default. Served from Cloudflare's global CDN.

**Supabase Backend** — PostgreSQL (with pgvector), Auth, RLS, Edge Functions, Realtime, Storage. Edge Functions handle: invitation emails, deployment orchestration, AI content generation/translation, semantic search, contact form forwarding, certification reminders, and GitHub API calls for provisioning.

**GitHub + GitHub Actions** — The monorepo lives on GitHub. Cloudflare Pages connects to the repo for auto-deployment. GitHub Actions provides compute for AI editing (Phase 5): receives prompts, runs AI tools on chapter folders, commits to branches for preview.

### How Systems Connect

The admin dashboard reads/writes through Supabase client (RLS-gated). For privileged operations, it calls Edge Functions. Edge Functions communicate outward to: Resend (email), Cloudflare API (project management), GitHub API (provisioning, branch management), Gemini API (content gen, translation, AI editing), and OpenAI API (embeddings). The Astro build uses the service role key to read chapter data at build time. GitHub push to main triggers Cloudflare to rebuild affected chapter projects.

### Monorepo Structure

```
monorepo/
  apps/
    admin/                  # Next.js admin dashboard → Vercel
    template/               # Base Astro chapter template (source of truth)
    chapter-{slug}/         # Per-chapter Astro app extending template-core
  packages/
    ui/                     # shadcn/ui shared components
    types/                  # TypeScript types (Supabase-generated)
    supabase/               # Supabase client config (browser, server, middleware)
    email/                  # Centralized email service (Resend templates)
    template-core/          # Shared Astro layouts, components, styles, data fetchers
  supabase/                 # Migrations, seed data, Edge Functions
  .github/
    workflows/              # GitHub Actions for AI editing
```

Turborepo pipeline: shared packages build before apps. Per-chapter apps depend on `template-core`, `ui`, and `types`. Build watch paths in Cloudflare: each chapter project watches its own folder + `packages/`.

---

## 2. Database Design — Existing Tables

All tables use UUIDs as primary keys. Chapter-scoped tables include chapter_id for RLS. Timestamps are timezone-aware. These tables are implemented and in production.

### Chapters

| Column                                                         | Type        | Key Details                                            |
| -------------------------------------------------------------- | ----------- | ------------------------------------------------------ |
| id                                                             | uuid        | PK                                                     |
| name, slug, subdomain                                          | text        | All not null, slug and subdomain unique                |
| status                                                         | text        | active/suspended/archived, default "active"            |
| default_language                                               | text        | default "en"                                           |
| active_languages                                               | text[]      | default {"en"}                                         |
| brand_primary_color, brand_secondary_color, brand_accent_color | text        | Hex colors with defaults                               |
| brand_logo_url                                                 | text        | Nullable, Supabase Storage URL                         |
| brand_font                                                     | text        | default "Inter"                                        |
| contact_email, contact_phone, contact_address                  | text        | All nullable                                           |
| cloudflare_project_name, cloudflare_deploy_hook_url            | text        | Nullable, set during provisioning                      |
| github_folder_path                                             | text        | Nullable, Phase 4 — path to chapter folder in monorepo |
| created_at, updated_at                                         | timestamptz | Auto-managed                                           |

### Profiles

| Column                 | Type        | Key Details                         |
| ---------------------- | ----------- | ----------------------------------- |
| id                     | uuid        | PK, FK to auth.users cascade delete |
| email, full_name       | text        | Not null                            |
| avatar_url             | text        | Nullable                            |
| created_at, updated_at | timestamptz | Auto-managed                        |

### User Roles

| Column     | Type        | Key Details                                     |
| ---------- | ----------- | ----------------------------------------------- |
| id         | uuid        | PK                                              |
| user_id    | uuid        | FK to profiles cascade delete                   |
| chapter_id | uuid        | Nullable (null for super_admin), FK to chapters |
| role       | text        | super_admin/chapter_lead/content_creator/coach  |
| created_at | timestamptz | Auto-set                                        |

Constraints: super_admin requires null chapter_id; other roles require non-null chapter_id. Unique partial indexes prevent duplicates.

### Coaches

| Column                                | Type         | Key Details                                             |
| ------------------------------------- | ------------ | ------------------------------------------------------- |
| id                                    | uuid         | PK                                                      |
| chapter_id                            | uuid         | FK to chapters, not null                                |
| user_id                               | uuid         | Nullable FK to profiles (set-null on delete)            |
| full_name                             | text         | Not null                                                |
| bio                                   | text         | Nullable                                                |
| bio_embedding                         | vector(768)  | Nullable, Gemini text-embedding-004                     |
| specializations, languages            | text[]       | Default empty array                                     |
| certification_level                   | text         | CALC/SALC/MALC/PALC                                     |
| hours_logged                          | integer      | Default 0                                               |
| photo_url, city, country              | text         | Nullable                                                |
| contact_email, contact_phone, website | text         | Nullable                                                |
| is_active                             | boolean      | Default true                                            |
| recertification_due_date              | timestamptz  | Nullable, Phase 4                                       |
| ce_credits_earned                     | integer      | Default 0, Phase 4                                      |
| certification_approved                | boolean      | Default false, Phase 4 — must be approved before public |
| created_at, updated_at                | timestamptz  | Auto-managed                                            |

### Content Blocks

| Column                 | Type        | Key Details                         |
| ---------------------- | ----------- | ----------------------------------- |
| id                     | uuid        | PK                                  |
| chapter_id             | uuid        | FK to chapters                      |
| block_key              | text        | e.g., "hero_title", "about_body"    |
| locale                 | text        | Default "en"                        |
| content_type           | text        | rich_text/plain_text/image_url/json |
| content                | text        | HTML, plain string, URL, or JSON    |
| created_at, updated_at | timestamptz | Auto-managed                        |

Unique constraint: (chapter_id, block_key, locale).

**Standard block keys by page:**

- **Landing/Hero:** hero_title, hero_subtitle, hero_description, hero_image_url, hero_cta_text, hero_cta_link, hero_featured_testimonial (json)
- **About:** about_title, about_body, about_mission, about_image_url
- **Action Learning/Certification:** al_title, al_intro, al_solves_problems_title, al_solves_problems_body, al_solution_spheres_title, al_solution_spheres_body, al_components_title, al_components_intro, al_components (json), al_benefits_title, al_benefits_body, al_cta_text, al_cta_link, cert_levels_info (json), cert_recertification_info, cert_application_link
- **Coach Directory:** coaches_title, coaches_description
- **Testimonials:** testimonials_title, testimonials_description
- **Events:** events_title, events_description
- **Resources:** resources_title, resources_description, resources_items (json)
- **Contact:** contact_title, contact_description, contact_form_enabled, contact_map_embed_url
- **Membership/Join:** join_title, join_description, join_benefits, join_cta_text, join_cta_link
- **Navigation:** nav_home_label, nav_about_label, nav_action_learning_label, nav_coaches_label, nav_testimonials_label, nav_events_label, nav_resources_label, nav_contact_label, nav_join_label
- **Footer:** footer_description, footer_copyright, footer_social_links (json), footer_newsletter_enabled, footer_client_logos (json)

### Testimonials

| Column                         | Type        | Key Details    |
| ------------------------------ | ----------- | -------------- |
| id                             | uuid        | PK             |
| chapter_id                     | uuid        | FK to chapters |
| quote, author_name             | text        | Not null       |
| author_title, author_photo_url | text        | Nullable       |
| is_featured                    | boolean     | Default false  |
| sort_order                     | integer     | Default 0      |
| is_active                      | boolean     | Default true   |
| created_at, updated_at         | timestamptz | Auto-managed   |

### Invitations

| Column     | Type        | Key Details                        |
| ---------- | ----------- | ---------------------------------- |
| id         | uuid        | PK                                 |
| chapter_id | uuid        | FK to chapters                     |
| email      | text        | Not null                           |
| role       | text        | chapter_lead/content_creator/coach |
| invited_by | uuid        | FK to profiles                     |
| token      | text        | Unique, UUID v4                    |
| status     | text        | pending/accepted/expired           |
| expires_at | timestamptz | 7 days from creation               |
| created_at | timestamptz | Auto-set                           |

### Deployments

| Column                                                 | Type        | Key Details                                                |
| ------------------------------------------------------ | ----------- | ---------------------------------------------------------- |
| id                                                     | uuid        | PK                                                         |
| chapter_id                                             | uuid        | FK to chapters                                             |
| triggered_by                                           | uuid        | FK to profiles                                             |
| status                                                 | text        | queued/building/deploying/done/failed                      |
| deploy_url, build_log, commit_reference, error_message | text        | All nullable                                               |
| ai_prompt                                              | text        | Nullable, Phase 5 — the AI edit prompt that triggered this |
| preview_url                                            | text        | Nullable, Phase 5 — Cloudflare branch preview URL          |
| approval_status                                        | text        | Nullable, Phase 5 — pending/approved/rejected              |
| created_at                                             | timestamptz | Auto-set                                                   |
| completed_at                                           | timestamptz | Nullable                                                   |

### Global Coaches (Materialized View)

Aggregates all coaches where is_active is true AND certification_approved is true from chapters where status is "active". Includes coach fields + chapter id/name/slug. Refreshed concurrently via triggers on coaches and chapters tables.

### Indexes

chapters(slug), chapters(status), user_roles(user_id), user_roles(chapter_id), coaches(chapter_id), coaches(is_active), content_blocks(chapter_id, locale), invitations(token), invitations(email, status), HNSW index on coaches(bio_embedding).

---

## 3. Database Design — New Tables

### Events Table (Phase 4)

| Column            | Type        | Constraints                                                | Purpose                                 |
| ----------------- | ----------- | ---------------------------------------------------------- | --------------------------------------- |
| id                | uuid        | PK                                                         | Unique identifier                       |
| chapter_id        | uuid        | FK to chapters, not null                                   | Which chapter                           |
| title             | text        | Not null                                                   | Event name                              |
| description       | text        | Nullable                                                   | Rich text description                   |
| event_type        | text        | Not null, one of: certification, workshop, meetup, webinar | Categorization                          |
| start_date        | timestamptz | Not null                                                   | When it starts                          |
| end_date          | timestamptz | Nullable                                                   | When it ends (null for single-day)      |
| location          | text        | Nullable                                                   | Physical location text                  |
| is_virtual        | boolean     | Default false                                              | Virtual or in-person                    |
| virtual_link      | text        | Nullable                                                   | Video call or webinar URL               |
| max_attendees     | integer     | Nullable                                                   | Capacity limit (null = unlimited)       |
| registration_link | text        | Nullable                                                   | External registration URL               |
| is_published      | boolean     | Default false                                              | Only published events appear on website |
| created_by        | uuid        | FK to profiles, not null                                   | Who created the event                   |
| created_at        | timestamptz | Auto-set                                                   |                                         |
| updated_at        | timestamptz | Auto-updated                                               |                                         |

Indexes: events(chapter_id), events(start_date), events(is_published).

### Client Organizations Table (Phase 4)

| Column      | Type        | Constraints              | Purpose                         |
| ----------- | ----------- | ------------------------ | ------------------------------- |
| id          | uuid        | PK                       | Unique identifier               |
| chapter_id  | uuid        | FK to chapters, not null | Which chapter (null for global) |
| name        | text        | Not null                 | Organization name               |
| logo_url    | text        | Nullable                 | Logo in Supabase Storage        |
| website_url | text        | Nullable                 | Organization website            |
| description | text        | Nullable                 | Brief description               |
| sort_order  | integer     | Default 0                | Display ordering                |
| is_active   | boolean     | Default true             | Visibility toggle               |
| created_at  | timestamptz | Auto-set                 |                                 |
| updated_at  | timestamptz | Auto-updated             |                                 |

Index: client_organizations(chapter_id).

### Payments Table (Phase 6 — Schema Defined Now, Table Created Later)

| Column                  | Type        | Constraints                                                     | Purpose                                  |
| ----------------------- | ----------- | --------------------------------------------------------------- | ---------------------------------------- |
| id                      | uuid        | PK                                                              | Unique identifier                        |
| chapter_id              | uuid        | FK to chapters, not null                                        | Which chapter                            |
| payer_id                | uuid        | Nullable FK to profiles                                         | Internal user (null for external payers) |
| payer_email             | text        | Not null                                                        | Email of payer                           |
| payment_provider        | text        | Not null, one of: stripe, paypal                                | Which provider                           |
| provider_transaction_id | text        | Nullable                                                        | External transaction reference           |
| amount                  | integer     | Not null                                                        | Amount in smallest currency unit (cents) |
| currency                | text        | Not null, default "usd"                                         | ISO currency code                        |
| payment_type            | text        | Not null, one of: enrollment, certification, dues, event        | What the payment is for                  |
| status                  | text        | Default "pending", one of: pending, completed, failed, refunded | Current state                            |
| description             | text        | Nullable                                                        | Human-readable description               |
| receipt_sent            | boolean     | Default false                                                   | Whether receipt email was sent           |
| created_at              | timestamptz | Auto-set                                                        |                                          |

Indexes: payments(chapter_id), payments(payer_email), payments(status).

### Newsletter Subscribers Table (Phase 4)

| Column        | Type        | Constraints              | Purpose              |
| ------------- | ----------- | ------------------------ | -------------------- |
| id            | uuid        | PK                       | Unique identifier    |
| chapter_id    | uuid        | FK to chapters, not null | Which chapter        |
| email         | text        | Not null                 | Subscriber email     |
| name          | text        | Nullable                 | Subscriber name      |
| subscribed_at | timestamptz | Auto-set                 | When they subscribed |
| is_active     | boolean     | Default true             | Unsubscribe toggle   |

Unique constraint: (chapter_id, email). Index: newsletter_subscribers(chapter_id, is_active).

---

## 4. Row Level Security

RLS is enabled on every table. Policies are the real authorization layer.

### Helper Function

A database function `get_user_roles(user_uuid)` returns the user's roles from user_roles. All policies call this instead of repeating role-check logic.

### Existing Table Policies (Implemented)

**Chapters:** Read by any authenticated user (active only, super admins see all). Insert by super admins. Update by super admins (all fields) and chapter leads (branding/contact only). No delete.

**Profiles:** Read own, super admins read all, chapter leads read their chapter's members. Insert via trigger only. Update own (name, avatar) or super admin.

**User Roles:** Read own, super admins read all, chapter leads read their chapter. Insert by super admins (any) and chapter leads (content_creator/coach in own chapter). Delete by super admins (any) and chapter leads (content_creator/coach in own chapter).

**Coaches:** Public read (active coaches in active chapters, and certification_approved = true). Chapter leads see all in their chapter (including inactive/unapproved). Self-edit restricted fields (bio, specializations, languages, photo, location, contact — not certification_level, hours, is_active, certification_approved). Insert/delete by chapter leads and super admins.

**Content Blocks:** Public read (active chapters, build-time). Insert/update by chapter leads, content creators, super admins. Delete by chapter leads and super admins only.

**Invitations:** Read by chapter leads (own chapter) and super admins. Insert by chapter leads and super admins. Update only via Edge Function (service role). Delete pending invitations by chapter leads.

**Testimonials:** Public read (active, active chapters). Full CRUD by chapter leads and super admins.

**Deployments:** Read by chapter leads (own chapter) and super admins. Insert/update only via Edge Functions (service role).

### New Table Policies (Phase 4)

**Events:**

- Read: Published events for active chapters are publicly readable. Chapter leads and super admins see all events (including unpublished). Advanced coaches (SALC/MALC/PALC) can see events in their chapter.
- Insert: Chapter leads can create events for their chapter. Advanced coaches can create events for their chapter. Super admins can create for any chapter.
- Update: Chapter leads can update events in their chapter. Event creators can update their own events. Super admins can update any.
- Delete: Chapter leads and super admins.

**Client Organizations:**

- Read: Active client organizations for active chapters are publicly readable.
- Insert/Update/Delete: Chapter leads (own chapter) and super admins.

**Newsletter Subscribers:**

- Read: Chapter leads (own chapter) and super admins.
- Insert: Public (anyone can subscribe via the website form).
- Update/Delete: Chapter leads (own chapter) and super admins.

**Payments (Phase 6):**

- Read: Chapter leads see payments for their chapter. Super admins see all. Payers linked to a profile can see their own payments.
- Insert: Only via Edge Functions (service role) — payment creation is server-side.
- Update: Only via Edge Functions (webhook handlers).

---

## 5. Database Automation

### Existing Triggers (Implemented)

- **Profile creation:** Fires after insert on auth.users, creates profiles row.
- **Updated-at:** Fires before update on chapters, profiles, coaches, content_blocks, testimonials. Sets updated_at to now().
- **Materialized view refresh:** Fires after coach insert/update/delete and chapter status change. Refreshes global_coaches concurrently.
- **Embedding generation:** Fires after coach insert/update (when bio or specializations change). Calls "generate-embedding" Edge Function via pg_net.

### New Triggers (Phase 4)

- **Updated-at on new tables:** Attach the existing trigger function to events, client_organizations.
- **Certification reminder scheduler:** A pg_cron job runs daily, queries coaches where recertification_due_date is 90, 60, or 30 days from now, and calls the "send-certification-reminder" Edge Function for each match.
- **Event reminder scheduler:** A pg_cron job runs daily, queries published events starting within 7 days that have attendees, and calls the "send-event-reminder" Edge Function.

---

## 6. Completed Phases Summary

### Phase 1 — Foundation (Complete)

All four roles authenticate and land in role-specific dashboards. Invitation-driven onboarding works end-to-end (Resend emails). RLS enforces chapter isolation. Chapter CRUD with branding for Super Admins. User management with invitations. Coach directory with chapter roster, global view, and coach self-edit. Content block management with Tiptap WYSIWYG, plain text, image URL, and JSON types grouped by page. Testimonials management with featured/sort/active. Dark/light mode via next-themes.

Deferred from Phase 1: Multi-language admin UI (next-intl) — carried to Phase 4.

### Phase 2 — Chapter Site Creation (Complete)

Astro template generating 8 static pages with build-time Supabase data fetching. Per-chapter branding via CSS custom properties. Header nav + full footer (social links, newsletter subscription, client logos). Chapter provisioning to Cloudflare Pages with deploy hooks. Deployment pipeline with real-time status via Supabase Realtime. Contact form via Edge Function + Resend. Newsletter subscription via Edge Function. Accessibility baseline (landmarks, headings, focus, WCAG AA, 320px responsive).

Deferred from Phase 2: Real Cloudflare Pages API provisioning (using mock).

### Phase 3 — AI Features (Complete)

Cross-lingual semantic coach search (Gemini text-embedding-004 + pgvector + HNSW index, 768 dimensions). AI content generation (Gemini API with chapter context and WIAL methodology). AI translation with cultural adaptation. Multi-language content with per-locale blocks, language routing (/en/about, /fr/about), and header switcher. Low-bandwidth optimization (WebP, lazy loading, responsive images, Brotli, page weight monitoring).

Deferred from Phase 3: Cloudflare Worker for Save-Data detection, multi-language admin UI.

---

## 7. Phase 4 — Per-Chapter Architecture, Events, and Email

### 7.1 Deployment Re-Architecture

Migrate from single-template + deploy-hook model to per-chapter folders with GitHub-based auto-deployment.

**Current state (Phase 2):** One Astro template, chapter slug as env var, deploy hooks trigger builds. **New state:** Each chapter gets its own folder `apps/chapter-{slug}/` extending `packages/template-core/`. GitHub push to main triggers Cloudflare auto-deploy. Build watch paths per Cloudflare project: `apps/chapter-{slug}/**` + `packages/**`.

**The template-core package** extracts all shared Astro layouts, components, styles, and data-fetching utilities from the current `apps/template/` into `packages/template-core/`. This package becomes the "base template" that all chapter apps import from. The existing `apps/template/` becomes a reference implementation and the scaffolding source for new chapters.

**Per-chapter app structure:** Each `apps/chapter-{slug}/` contains:

- `astro.config.ts` — imports base config from template-core, sets chapter-specific env vars
- `src/pages/` — imports page components from template-core (can override individual pages)
- `src/overrides/` — chapter-specific component overrides, custom styles, additional pages
- `package.json` — depends on template-core and shared packages

By default, a newly scaffolded chapter folder has minimal content — just config and page imports. All rendering logic lives in template-core. Customizations are additive overrides in the chapter folder.

**Updated chapter provisioning flow:**

The "provision-chapter" Edge Function now:

1. Reads the new chapter record from the database.
2. Calls the GitHub API to create the chapter folder: scaffolds `apps/chapter-{slug}/` from a template directory, using the chapter's slug, name, and Supabase config as template variables.
3. Commits and pushes to a new branch `provision/{slug}`.
4. Merges the branch to main (auto-merge, no review needed for scaffolding).
5. Creates a Cloudflare Pages project pointing to `apps/chapter-{slug}/` with build watch paths including `packages/`.
6. Configures the custom domain `{slug}.wial.ashwanthbk.com`.
7. Stores the Cloudflare project name and github_folder_path in the chapter record.
8. The push to main triggers the initial build automatically.

If any step fails, the chapter record retains null cloudflare fields, and the dashboard shows "Retry Provisioning."

**Migration of existing chapters:** A one-time migration script creates `apps/chapter-{slug}/` folders for all existing active chapters, updates their chapter records with github_folder_path, and creates new Cloudflare Pages projects pointed at the folders. The old deploy-hook projects are retired.

**How base template changes propagate:** When a developer pushes changes to `packages/template-core/`, Cloudflare detects the change in the `packages/` directory via build watch paths. Every chapter project that watches `packages/` rebuilds automatically. This satisfies the SRD UC2 requirement: "template updates at parent level auto-deploy to all chapter sites."

### 7.2 Centralized Email Service

A new shared package `packages/email/` providing template-based email for the entire platform.

**Package structure:**

- `templates/` — HTML email templates (invitation, welcome, deployment-notification, certification-reminder, contact-forward, event-reminder, newsletter, payment-receipt, dues-reminder)
- `send.ts` — single function that accepts: template name, recipient, subject, template variables, and optional chapter branding (name, logo, colors for email header)
- `config.ts` — Resend API configuration

Each template is a responsive HTML email with chapter-branded header (logo + name), content area, and footer. Templates use simple string interpolation (no heavy templating engine) — variables like `{{chapter_name}}`, `{{coach_name}}`, `{{event_title}}` are replaced at send time.

**Edge Functions that send email** are refactored to import from this package instead of building emails inline. This includes: handle-invitation, accept-invitation (welcome email), contact-form-forward, deployment-notification, and the new certification-reminder, event-reminder, and newsletter Edge Functions.

**Scheduled emails via pg_cron:**

- Certification renewal reminders: daily job checks coaches with recertification_due_date at 90/60/30 days out, calls Edge Function to send reminder via the email package.
- Event reminders: daily job checks published events starting within 7 days, sends reminder to subscribers or RSVP'd attendees.

### 7.3 Events Calendar

**Admin dashboard — Events management page:**

Added to sidebar for Chapter Leads and Super Admins. Also visible to advanced coaches (SALC/MALC/PALC) who can create training events.

Events list page: table with columns for title, type (badge), date range, location, published status (toggle), registrations count, and actions (edit, delete). Filters: event type dropdown, date range picker, published/draft toggle. "Create Event" button at top.

Create/edit event form: title (required), description (rich text textarea), event_type (dropdown), start_date (datetime picker), end_date (datetime picker, optional), location (text), is_virtual toggle (shows virtual_link input when enabled), max_attendees (number, optional), registration_link (URL, optional — if not set, the event card shows "Contact chapter for details"), is_published toggle.

Global events view (Super Admin): aggregated table of all events across all chapters with a chapter column and filter.

**Chapter website — Events page:**

New page (Page 7) fetched at build time. Queries events table where chapter_id matches, is_published is true, and end_date (or start_date if no end_date) is in the future. Ordered by start_date ascending.

Each event renders as a card: title in Heading 3, date range formatted, type badge, location with map-pin icon (or "Virtual" badge), description as rich text, and a registration button (links to registration_link or shows chapter contact). Past events section (collapsed by default) shows events from the last 6 months.

iCal export: each event card has a small calendar icon link that generates an .ics file download for that event (generated at build time as a static file per event).

**Content blocks for events page:** events_title, events_description — editable labels for the page header.

**Build-time data fetching update:** Add events fetch to the chapter data loader. Query events where chapter_id matches and is_published is true.

### 7.4 Resources & Library Page

New page (Page 8) on chapter websites.

**Content blocks:** resources_title, resources_description, resources_items (json type — array of objects with title, description, url, type fields where type is one of: pdf, video, link, article).

**Admin dashboard:** The resources_items JSON block gets a structured editing UI — not raw JSON textarea, but a list of resource cards in the editor with add/edit/remove actions per item. Each item has: title input, description textarea, URL input, and type dropdown.

**Chapter website rendering:** Grid of resource cards. Each card shows: type icon (document icon for PDF, play icon for video, link icon for external, book icon for article), title, description (truncated), and a "View" or "Download" button linking to the URL. If no resources exist, the page shows "Resources coming soon."

### 7.5 Certification Information

Expand the Action Learning page to include a Certification section, OR render it as a sub-section of the same page.

**New content blocks:** cert_levels_info (json — array of objects with level, full_name, requirements, hours_required, description per certification tier: CALC, SALC, MALC, PALC), cert_recertification_info (rich text explaining the 2-year cycle and CE credit requirements), cert_application_link (URL to external LMS or application form).

**Chapter website rendering:** Below the Action Learning content, a "Certification Levels" section showing each tier as a card with: level badge (color-coded), full name, requirements text, and hours required. Below that, a "Recertification" section with the cert_recertification_info rich text and a "Apply" button linking to cert_application_link.

**Admin dashboard — Coach certification tracking:**

Add to coach records (migration):

- recertification_due_date (timestamptz, nullable)
- ce_credits_earned (integer, default 0)
- certification_approved (boolean, default false)

Chapter leads set recertification_due_date and ce_credits_earned when editing a coach. Certification_approved is managed by chapter leads or super admins — a coach's certification level change must be approved before the coach appears in the public directory.

Coach self-edit view gains a read-only "My Certification" section: current level, hours logged, recertification due date (with a colored indicator: green = >90 days, yellow = 30-90 days, red = <30 days), and CE credits earned.

**Certification badge approval workflow:** When a chapter lead changes a coach's certification_level, certification_approved is reset to false. The coach disappears from the public directory until a super admin (or the chapter lead, if they have approval authority) sets certification_approved back to true. The global_coaches materialized view only includes coaches where certification_approved is true.

**Automated reminders:** The pg_cron daily job queries coaches where recertification_due_date is 90, 60, or 30 days from now and calls the "send-certification-reminder" Edge Function. The Edge Function uses the email package to send a branded reminder to the coach's contact_email (or their linked profile email).

### 7.6 Organizational Client List (Enhanced)

Replace the footer_client_logos JSON content block approach with the client_organizations managed table.

**Admin dashboard — Client Organizations page:**

Added to sidebar for Chapter Leads (under a "Clients" or "Partners" label). Table with columns: logo thumbnail, name, website, active toggle, sort order, actions (edit, delete). "Add Client" button.

Create/edit form: name (required), logo upload (Supabase Storage), website URL, description (optional), sort_order (number), is_active toggle.

Super Admins can manage global-level client organizations (chapter_id = null or a special "global" identifier) that appear across all chapter sites.

**Chapter website update:** The footer client logos carousel now reads from the client_organizations table instead of the footer_client_logos JSON content block. The carousel shows: logo image linked to the website URL, with the name as alt text. Build-time fetch: query client_organizations where chapter_id matches and is_active is true, ordered by sort_order.

Additionally, an optional "Our Clients" section can appear on the landing page (controlled by a content block flag or by the presence of client organizations in the database).

**Migration:** Existing footer_client_logos JSON data is migrated to client_organizations rows. The footer_client_logos block key is deprecated.

### 7.7 Chapter Website Page Update

Expand the Astro template from 8 to 10 pages. The template-core package gains two new page components.

Updated page list:

1. Landing/Hero (existing)
2. About (existing)
3. Action Learning & Certification (expanded — 7.5)
4. Coach Directory (existing)
5. Individual Coach Profile (existing)
6. Testimonials (existing)
7. Events Calendar (new — 7.3)
8. Resources & Library (new — 7.4)
9. Contact (existing)
10. Membership/Join (existing)

Header navigation updated: add nav_events_label and nav_resources_label content blocks. Hamburger menu on mobile includes all 10 links.

### 7.8 Multi-Language Admin UI (Carried from Phase 1)

Complete the deferred next-intl integration. All admin dashboard static text (labels, buttons, navigation items, error messages, placeholders, empty states) sourced from translation JSON files.

Languages: English, Spanish, French, Portuguese.

Language selector in admin header. Preference stored in cookie. Locale in URL path (/en/dashboard, /es/dashboard). Middleware detects locale from URL > cookie > Accept-Language header.

### Phase 4 Completion Conditions

- Per-chapter folder architecture live, existing chapters migrated from deploy-hook model
- Base template changes (packages/template-core) auto-deploy to all chapter sites
- Centralized email service package with branded templates for all email types
- Events calendar functional in admin dashboard and on chapter websites
- Resources & Library page live on chapter websites
- Certification information section live on Action Learning page
- Coach certification tracking with recertification_due_date, ce_credits, and approval workflow
- Automated certification renewal reminders sending at 90/60/30 days
- Client organizations table replacing footer_client_logos JSON
- All 10 pages rendering on chapter websites
- Multi-language admin UI complete for en/es/fr/pt

---

## 8. Phase 5 — AI Editing and Smart Coach Matching

### 8.1 AI-Powered Site Editing via GitHub Actions

Chapter leads customize their website through natural language. Compute runs on GitHub Actions, not a dedicated server. The workflow is session-based and iterative — a session represents one branch with multiple prompts, previewed and deployed as a single unit.

**Architecture — three separate operations:**

1. **Start session** — creates a Git branch via the GitHub API (lightweight, no Actions runner). Creates a deployment record with status "queued" and approval_status "pending". Branch name pattern: `ai-edit/{slug}/{timestamp}`.
2. **Send prompt** — triggers the `ai-edit.yml` GitHub Actions workflow on the existing branch. The workflow checks out the branch, calls Gemini API to generate file edits scoped to the chapter folder, commits and pushes. Updates the deployment record with a Cloudflare branch preview URL and status "deploying". Can be repeated — each prompt adds commits to the same branch.
3. **Deploy or discard** — deploy creates a PR, squash-merges to main, deletes the branch. Discard deletes the branch. Both close the session.

**GitHub Actions workflow (`ai-edit.yml`):**

- Trigger: `workflow_dispatch` with inputs for chapter_slug, prompt_text, branch_name, and deployment_id
- Steps: checkout repo → checkout existing branch (branch already created by start operation) → set up Node.js → call Gemini 2.0 Flash API with chapter file context and prompt → apply scoped edits → commit and push → construct Cloudflare preview URL → update deployment record
- The workflow only handles AI editing. Branch creation and merge are handled by the API routes / Edge Functions.

**End-to-end flow:**

1. Chapter lead clicks "Start Editing Session" in the admin dashboard.
2. Dashboard calls `/api/ai-edit/start` with chapter_id.
3. API route reads the chapter record, checks rate limit (one active session per chapter), creates a branch via GitHub API (`POST /repos/{owner}/{repo}/git/refs` from main HEAD SHA), and creates a deployment record with status "queued".
4. Dashboard shows prompt input. Chapter lead types a change request and clicks "Send Prompt".
5. Dashboard calls `/api/ai-edit/prompt` with deployment_id and prompt text.
6. API route validates the session is in an idle state (queued or deploying), updates the deployment to status "building" with the prompt stored in ai_prompt, and dispatches the ai-edit workflow.
7. GitHub Actions runs: checks out the existing branch, calls Gemini API, applies edits, commits, pushes. Updates the deployment record with preview_url and status "deploying".
8. The admin dashboard (subscribed via Supabase Realtime) shows the preview iframe and action buttons.
9. Chapter lead can: send another prompt (repeats steps 4-8 on the same branch), deploy, or discard.

**Iterative editing:** Each "Send Prompt" triggers a separate workflow run on the same branch. New commits stack on the branch. The Cloudflare branch preview auto-rebuilds. The user can send as many follow-up prompts as needed, refining the site iteratively. The prompt input remains active alongside the preview panel.

**Deployment:**

When the chapter lead clicks "Deploy to Production":

1. Dashboard calls `/api/ai-edit/approve` with deployment_id and action "approve".
2. API route validates the session is in "deploying" state (preview exists), creates a PR on GitHub, squash-merges it to main, and deletes the branch.
3. Cloudflare detects the main push and auto-deploys the chapter site.
4. Deployment record updated: status "done", approval_status "approved".

When the chapter lead clicks "Discard":

1. Dashboard calls `/api/ai-edit/approve` with action "reject".
2. Branch is deleted via GitHub API. Allowed from any active state (queued, building, deploying).
3. Deployment record updated: status "failed", approval_status "rejected".

**API routes (Next.js admin dashboard):**

- `POST /api/ai-edit/start` — start session (create branch + deployment record)
- `POST /api/ai-edit/prompt` — send prompt to active session (trigger workflow)
- `POST /api/ai-edit/approve` — deploy (approve) or discard (reject)

**Edge Functions (Supabase — alternative entry points):**

- `trigger-ai-edit` — starts a session (create branch + deployment record)
- `approve-ai-edit` — deploy or discard

**Session detection:** AI edit sessions are identified by `approval_status IS NOT NULL` on the deployments table (regular deployments have null approval_status). Active sessions have approval_status "pending" with status in (queued, building, deploying).

**Scope isolation:** The AI tool's working directory is restricted to `apps/chapter-{slug}/`. The GitHub Actions workflow security check blocks edits outside the chapter directory. Changes to `packages/`, other chapters' folders, or root config files are not possible.

**Safety boundaries:**

- AI edits cannot modify shared packages or other chapter folders
- Human approval is always required before changes go live
- Squash-merge keeps git history clean (one commit per AI edit session, regardless of prompt count)
- If the build fails after merge, the chapter lead sees "deploy failed" and the previous live version remains
- Rate limit: one active AI edit session per chapter at a time
- Prompts only accepted when session is idle (queued or deploying), not while AI is working (building)

**Admin dashboard UI:**

The "AI Editor" page in the chapter lead sidebar uses a session-based flow:

- **No session:** "Start Editing Session" button with guidance text
- **Session queued (no prompts yet):** Prompt textarea with "Send Prompt" button. Cancel session option.
- **Session building (AI working):** Prompt input disabled. Spinner with "AI is editing your site..." status. Right panel shows waiting state.
- **Session deploying (preview ready):** Prompt input active for follow-up edits. Right panel shows preview iframe with refresh button, "Deploy to Production" and "Discard" buttons. Prompt history displayed above the input.
- **Past sessions:** Table showing last prompt, outcome badge (Deployed/Discarded/Failed), and date.
- Realtime subscription via Supabase Realtime updates the UI as the workflow progresses.

### 8.2 Smart Coach Matching (AI-3)

A client-facing "Find a Coach" widget that uses AI to match visitors with coaches based on natural language queries.

**"find-coach-match" Edge Function:**

1. Receives: query_text, optional chapter_id (if on a chapter site, scope to that chapter).
2. Embeds the query via Gemini text-embedding-004 (768 dimensions, same model as coach bio embeddings).
3. Runs vector similarity search against global_coaches materialized view (or chapter-filtered coaches), retrieving top 10 candidates.
4. Sends the candidates and the original query to the Gemini API with a prompt: "Given this query from a prospective client and these coach profiles, rank the top 5 matches and explain in 1-2 sentences why each coach is a good fit."
5. Returns the ranked results with match explanations.

**Chapter website integration:**

The coach directory page gets a "Find Your Coach" section above the standard directory grid. A prominent text input with placeholder "Describe what you're looking for..." and a "Match Me" button. On submission, a small inline script calls the Edge Function and renders results as coach cards with a "Why this coach" explanation paragraph below each card.

Progressive enhancement: if JavaScript is disabled, the "Find Your Coach" section is hidden and the standard directory remains.

**Admin dashboard toggle:** Chapter Settings gains a "Enable AI Coach Matching" toggle. When disabled, the chapter website does not render the Find Your Coach section.

### 8.3 Deployment History Enhancement

The existing deployments page is enhanced to show richer information for AI-edited deployments:

- AI prompt column (truncated, expandable)
- Preview URL column (clickable, for preview-stage deployments)
- Approval status badge (pending/approved/rejected, only for AI edits)
- Type indicator: "Content Deploy" for standard deploys, "AI Edit" for AI-triggered deploys

### Phase 5 Completion Conditions

- AI editing session-based flow functional end-to-end: start session (branch) → send prompt(s) (workflow) → preview → deploy (squash-merge) → auto-deploy
- Session start creates branch via GitHub API (no Actions runner), each prompt triggers a separate workflow run
- AI edits scoped to chapter folder only — cannot affect shared packages or other chapters
- Iterative editing works (multiple prompts per session, same branch, commits stack)
- Preview URLs generate automatically from Cloudflare branch previews
- Smart coach matching widget live on chapter websites with personalized match explanations
- AI editing rate limited to one session per chapter (detected via approval_status = "pending")
- Deployment history shows AI prompts and approval status

---

## 9. Phase 6 — Payments and Analytics (Deferred — Fully Planned)

Implementation deferred until platform is stable. UI pages are mocked with sample data so navigation, dashboards, and dependent features work.

### 9.1 Payment Integration

**Architecture:**

- Stripe Connect in platform mode: WIAL Global = platform account, each chapter = connected account
- PayPal for Marketplaces: same pattern
- Edge Functions handle all payment server-side logic (no payment processing in the browser)

**Payment types (SRD pricing effective January 1, 2026):**

- $50 USD per student enrolled in eLearning platform
- $30 USD per student fully certified and encoded as a coach
- Chapter membership dues (amount configured per chapter in a new chapter setting field)
- Event registration fees (amount set per event)

**Stripe flow:**

1. Chapter lead connects their Stripe account via the Chapter Settings page (OAuth flow to Stripe Connect)
2. Payment page on chapter website shows a Stripe Checkout button
3. Visitor clicks → redirected to Stripe-hosted checkout page (PCI compliance without handling card data)
4. Stripe webhook fires on payment completion → "handle-stripe-webhook" Edge Function verifies signature, creates payments record, sends receipt via email service
5. Dashboard shows payment in history

**PayPal flow:** Similar pattern using PayPal's hosted checkout buttons and IPN/webhooks.

**Automated dues reminders:** A pg_cron job runs weekly, queries the latest payment per coach/affiliate in the payments table, identifies those overdue by 30/60/90 days, and triggers reminder emails via the email service.

**Admin dashboard — Payment pages:**

- Chapter lead: "Payments" sidebar item → table of all payments for chapter, filters by type/status/date, summary cards (total collected, outstanding, this month)
- Super Admin (Global): "Revenue" sidebar item → global revenue dashboard, per-chapter breakdown, payment conversion metrics

**Current mock state:** UI pages built with realistic sample data. Table, filters, and summary cards all functional but reading from a mock data source. "Connect Stripe" and "Connect PayPal" buttons present but disabled with "(Coming Soon)" label.

### 9.2 Analytics Dashboard

**Chapter-level metrics:**

- Website traffic: Cloudflare Analytics API (free, no tracking scripts)
- Page views by page (which pages get the most traffic)
- Contact form submissions count (from a counter in the database)
- Event registrations count (from events or external tracking)
- Coach directory searches count

**Global metrics (Super Admin):**

- Total active chapters, coaches, deployments over time
- Membership growth trend per chapter
- Revenue by chapter (Phase 6.1)
- Most active chapters (by content updates, deployments, events)

**Implementation:** A new "Analytics" sidebar item for Chapter Leads and Super Admins. The page fetches data from: Cloudflare Analytics API (via an Edge Function proxy), Supabase aggregate queries (counts, trends), and payment summaries. Rendered as dashboard cards with numbers and simple charts (using a lightweight chart library or SVG-based sparklines).

### 9.3 Email Campaigns

Extend the Phase 4 email service to support broadcast-style campaigns.

**Admin dashboard — Campaigns page:**

- Compose: subject, body (rich text editor), audience selector (all subscribers, by chapter, by certification level, by membership status)
- Preview: see the email as it will be sent with chapter branding
- Send: queues emails and processes in batches via Edge Function
- History: list of sent campaigns with delivery counts

**Implementation:** Uses the centralized email package templates. Campaigns are stored in a campaigns table (id, chapter_id, subject, body, audience_filter, sent_at, recipient_count). Sending is handled by an Edge Function that queries the audience, batches recipients, and calls Resend's batch send API.

### Phase 6 Completion Conditions

- Stripe Connect and PayPal processing real payments
- Automated dues reminders sending via email service
- Payment receipts sent on successful transactions
- Payment reporting dashboard live for chapter leads and super admins
- Analytics dashboard showing traffic and business metrics
- Email campaigns sendable with audience segmentation

---

## 10. Implementation Sequence

Phases 1-3 are complete (steps 1-52 in the original plan). The following is the implementation order for Phases 4-6.

### Phase 4 — Per-Chapter Architecture, Events, and Email

53. Create the `packages/template-core/` package by extracting shared layouts, components, styles, and data fetchers from `apps/template/`.
54. Create the `packages/email/` package with Resend integration, HTML templates for all email types, and the send function.
55. Write database migrations for new tables: events, client_organizations, newsletter_subscribers. Add new columns to coaches (recertification_due_date, ce_credits_earned, certification_approved) and chapters (github_folder_path). Add new columns to deployments (ai_prompt, preview_url, approval_status).
56. Write and apply RLS policies for events, client_organizations, newsletter_subscribers.
57. Create pg_cron jobs: daily certification reminder check, daily event reminder check.
58. Update the global_coaches materialized view to filter on certification_approved = true.
59. Scaffold the first per-chapter folder `apps/chapter-{slug}/` from the template and verify it builds correctly by importing from template-core.
60. Rewrite the "provision-chapter" Edge Function: scaffold chapter folder via GitHub API, create Cloudflare Pages project with build watch paths, configure custom domain.
61. Migrate existing chapters from deploy-hook model to per-chapter folders.
62. Verify base template propagation: change something in template-core, confirm all chapter projects rebuild.
63. Refactor all existing email-sending Edge Functions (invitation, contact form, deployment notification) to use the email package.
64. Build the Events management page in admin dashboard: list, create/edit form, published toggle.
65. Build the Events page component in template-core and add it to the chapter website.
66. Add events data fetching to the build-time data loader.
67. Build the Resources & Library page component in template-core.
68. Add resources_items structured editor in the admin dashboard (not raw JSON).
69. Add certification information section to the Action Learning page in template-core.
70. Add certification content blocks (cert_levels_info, cert_recertification_info, cert_application_link) to the admin dashboard content editor.
71. Implement coach certification tracking: add fields to coach edit form, "My Certification" section for coach self-edit, certification_approved workflow.
72. Write the "send-certification-reminder" Edge Function.
73. Build the Client Organizations management page in admin dashboard.
74. Migrate footer_client_logos data to client_organizations table. Update footer component to read from the table.
75. Update header navigation for 10 pages (add nav_events_label, nav_resources_label).
76. Complete multi-language admin UI (next-intl): create translation JSON files for en/es/fr/pt, wire all static text.
77. Generate updated TypeScript types from the schema changes.

### Phase 5 — AI Editing and Smart Coach Matching

78. Create `.github/workflows/ai-edit.yml` GitHub Actions workflow: checkout existing branch (no branch creation), setup Node, call Gemini API scoped to chapter folder, commit, push, update deployment with preview URL.
79. Create `/api/ai-edit/start` route: creates branch via GitHub API (no Actions needed), creates deployment record with status "queued" and approval_status "pending".
80. Create `/api/ai-edit/prompt` route: validates session is idle (queued or deploying), updates deployment to "building", triggers ai-edit.yml workflow on the existing branch.
81. Update `/api/ai-edit/approve` route: approve only from "deploying" state, reject from any active state. Creates PR, squash-merges, deletes branch.
82. Update "trigger-ai-edit" Edge Function: session start only (create branch + deployment). Update "approve-ai-edit" Edge Function: session-aware status checks.
83. Build the AI Editor page in admin dashboard: session-based iterative flow — Start Session → Send Prompt(s) → Preview → Deploy/Discard. Prompt history in session, Realtime subscription, preview iframe with refresh.
84. Verify iterative editing: multiple prompts on the same branch, commits stack, preview auto-updates.
83. Write the "find-coach-match" Edge Function: embed query, vector search, Gemini reranking with explanations.
84. Add the "Find Your Coach" UI to the coach directory page in template-core: search input, inline script, result rendering.
85. Add "Enable AI Coach Matching" toggle to Chapter Settings.
86. Enhance the deployments page: AI prompt column, preview URL, approval status badge.

### Phase 6 — Payments and Analytics (Deferred)

87. Create payments table migration.
88. Write RLS policies for payments.
89. Implement Stripe Connect onboarding flow: OAuth in Chapter Settings, store connected account ID.
90. Write "create-checkout-session" Edge Function: creates Stripe checkout for the payment type.
91. Write "handle-stripe-webhook" Edge Function: verifies signature, creates payment record, triggers receipt email.
92. Implement PayPal equivalent flow.
93. Write the "send-dues-reminder" Edge Function and pg_cron weekly job.
94. Build payment reporting pages in admin dashboard: chapter-level and global views.
95. Build analytics dashboard: Cloudflare Analytics API proxy Edge Function, business metrics queries, chart rendering.
96. Build email campaigns: campaigns table, compose UI, audience selector, batch send Edge Function.

---

## 11. Coding Standards

**Validation at boundaries:** Zod validation on every form submission and Edge Function input. Schemas in the shared types package. No validation on internal trusted data flows.

**Error handling:** Supabase client returns {data, error} — always check error. Edge Functions return structured errors with HTTP status codes. Admin dashboard shows user-friendly toasts. Internal details logged server-side only.

**Security:** Secrets in environment variables only. Service role key only in Edge Functions and build processes. Anon key safe in browser (RLS-gated). Invitation tokens single-use, random, 7-day expiry. Zod validation at every entry point. RLS as primary auth layer. AI edits sandboxed to chapter folders.

**Rate limiting:** Semantic search: 10/min per IP. Contact form: 3/min per IP. AI edits: 1 concurrent session per chapter. Deployment trigger: 1 concurrent build per chapter.

**API token scoping:** Cloudflare token: Pages project management only. Resend key: single sending domain. Gemini key: project-level (covers content gen, translation, embeddings, coach matching, AI editing). GitHub token: repo read/write for monorepo only, workflow dispatch. OpenAI key no longer needed.

**Principles:**

- DRY: Shared packages (template-core, email, ui, types, supabase). One source of truth per concern.
- KISS: Use existing tools (Cloudflare build watch paths, GitHub Actions, Supabase RLS, next-themes, next-intl). Simplest approach that works.
- SOLID: Each Edge Function does one thing. Each package has one responsibility. Apps depend on package abstractions.

**No tests.** No unit, integration, or e2e tests.

**Performance budgets (chapter websites):**

- Chapter landing page: ≤200KB total (compressed)
- Coach directory page: ≤500KB
- Image-heavy pages: ≤800KB
- JavaScript: <100KB total on content pages
- Images: AVIF primary → WebP fallback → JPEG last resort, via `<picture>` element. No single image >50KB. Lazy-load all below-fold images.
- Fonts: System font stack (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`). Zero custom web fonts unless chapter explicitly requires one for branding.
- Compression: Brotli on all static assets. Pre-compress at build time.

**Standard practices:**

- Semantic, accessible HTML on public pages
- Mobile-first responsive design
- TypeScript strict mode
- kebab-case files, PascalCase components, snake_case database columns
- All DB operations through Supabase client with RLS
- Git-ignored secrets
- Feature branches merged via PR

---

## 12. Spec Alignment Traceability

### Completed (Phases 1-3)

- Admin portal setup (Spec 1.1) ✓
- Authentication and invitations (Spec 1.2) ✓
- Role-based access control (Spec 1.3) ✓
- Coach directory (Spec 1.4) ✓
- Chapter data management (Spec 2.1) ✓
- Site creation from template (Spec 2.2) ✓
- Chapter website template (Spec 2.3) ✓ — 8 of 10 pages
- Cross-lingual semantic search (Spec 3.1/AI-1) ✓
- AI content generation (Spec 3.2/AI-2) ✓
- Multi-language content management (Spec 3.3) ✓
- Low-bandwidth optimization (Spec 3.4) ✓

### Phase 4 Coverage

- Per-chapter folder architecture (Spec 4.1, 4.2) — Section 7.1
- Centralized email service (SRD: email across all features) — Section 7.2
- Events calendar (SRD P0 core page, P1 event management) — Section 7.3
- Resources & Library (SRD P0 core page) — Section 7.4
- Certification information (SRD: "recertification requirements and application forms") — Section 7.5
- Certification approval workflow (SRD: "reviewed and approved by executive director") — Section 7.5
- Organizational client list (SRD P1) — Section 7.6
- 10 chapter website pages (Spec updated) — Section 7.7
- Multi-language admin UI (Spec 1.1, carried from Phase 1) — Section 7.8

### Phase 5 Coverage

- AI-powered site editing (Spec 5.1) — Section 8.1
- Smart coach matching / AI-3 (SRD AI-3) — Section 8.2
- Deployment history with AI edit tracking (Spec 5.3) — Section 8.3

### Phase 6 Coverage

- Payment integration (SRD P0, deferred) — Section 9.1
- Analytics dashboard (SRD P1) — Section 9.2
- Email campaigns (SRD P1) — Section 9.3

### Intentionally Excluded

- AI-4 Knowledge Engine (not building)
- Coach multi-chapter support (deferred to future)
- Mobile app, forums, job board (SRD P2)
- LMS features (external system)
