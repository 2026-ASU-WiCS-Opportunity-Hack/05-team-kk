# WIAL Global Chapter Network Platform — Specification Sheet

## Product Summary

A platform that provisions, customizes, and manages branded chapter websites for WIAL's 20+ country network. Chapter leads create a website for their region, customize content through AI-powered editing, manage a local coach directory feeding into a global one, and handle membership operations. Each chapter gets an independently editable website deployed to its own subdomain within a shared monorepo. No coding knowledge required from chapter leads.

## Problem Statement

WIAL certifies Action Learning Coaches in 20+ countries through regional chapters. Each chapter currently runs its own disconnected website on different platforms (mostly WordPress). There is no unified system for provisioning new chapter sites, no shared coach directory, no centralized payment collection, and no consistent branding. A new chapter lead in Kenya or Vietnam has no easy path to launching a professional web presence without hiring a developer.

## External Systems (Do Not Build)

These systems are external to our platform. We integrate with them but do not replace them.

- **LMS (eLearning):** WIAL uses an external LMS for course delivery. We do not modify or replace it. SRD Use Cases UC6-UC9 are reference only.
- **Credly (Badges):** Digital certification badges are issued through Credly by the executive director. Our system tracks certification levels but badge issuance is external.
- **Constant Contact (Current email):** Currently used for email marketing. Replaced by our centralized email service.

---

## Users, Roles, and Flows

### Role Definitions

| Role | Access Scope |
|---|---|
| Super Admin | All chapters, global settings, template management, global directory, all users |
| Chapter Lead | Single chapter: website, coaches, content, events, testimonials, deployments, settings |
| Content Creator | Single chapter: content editing, coach directory (read-only) |
| Coach | Own profile editing, certification tracking, chapter info (read-only) |

A user can hold different roles across different chapters (e.g., coach in USA and chapter lead for Nigeria). Super Admin accounts are manually seeded. Often the Chapter Lead is also a Content Creator for their site, unless the chapter is very large with its own local board (like WIAL-USA).

### Persona Flows

**Chapter Lead / Affiliate Director**

Primary needs (SRD): create/maintain chapter website with consistent branding, collect membership dues, advertise certification event calendars globally, manage local coach directory, report to global WIAL. Some affiliates offer Action Learning as part of a broader professional development suite and may link back to their own website for other offerings.

Platform flow:
1. Receives invitation email, creates account
2. Chapter dashboard: overview of coaches, content, events, deployments
3. Customizes branding (colors, logo, font) with live preview
4. Edits content via WYSIWYG editor or AI content generation
5. Manages coach roster (add, edit, deactivate, invite)
6. Manages testimonials (add, edit, reorder, feature on landing page)
7. Manages events calendar (certification programs, workshops, meetups)
8. Manages organizational client list (logos, website links)
9. Triggers deployment — site goes live at subdomain
10. (Phase 5) Requests AI site edits via natural language, reviews preview, approves
11. (Phase 6) Views payment reports, manages dues collection, sends reminders

**Certified Coach (CALC)**

Primary needs (SRD): track CE credits for recertification (2-year cycle), access resources, maintain coaching session records (100+ hours for PALC advancement), receive automatic renewal reminders, maintain profile for client visibility.

Platform flow:
1. Receives invitation, creates account (auto-linked to coach record)
2. Edits own profile: bio, specializations, languages, photo, location, contact info, website
3. Cannot edit: certification level, hours logged, active status (managed by chapter lead)
4. Views "My Certification" dashboard: current level, hours logged, recertification due date, CE credits
5. Receives automated email reminders at 3 months, 2 months, 1 month before recertification
6. Views chapter events and resources
7. (Phase 6) Pays membership dues through the platform

**Advanced Coaches (PALC/SALC/MALC)**

Same flow as CALC plus:
- Enhanced profile visibility ("Trains New Coaches" indicator)
- Can create and manage training events on the events calendar
- Certification tracking shows advancement path (hours logged toward next level)
- SRD notes: they train and mentor new coaches, create certification courses, manage cohorts. Course delivery happens in the external LMS; our platform handles their profile, events, and directory visibility.

**WIAL Global Administrator (Super Admin)**

Primary needs (SRD): dashboard of all chapters and memberships, push template/branding updates to all chapters instantly, track global certifications, generate organization-wide reports, manage global directory.

Platform flow:
1. Logs in to global dashboard: chapter counts, coach counts, deployment status
2. Creates chapters — auto-provisions website (creates repo folder, Cloudflare project, invites chapter lead)
3. Manages all users across all chapters
4. Views global coach directory with cross-chapter semantic search
5. Updates base template — auto-deploys to all chapter sites (Cloudflare detects shared package changes)
6. Views global events calendar (aggregated from all chapters)
7. Manages certification badge approval (reviews before coaches are published — SRD requirement)
8. (Phase 6) Views global payment dashboard, organization-wide reports

**Content Creator**

Platform flow:
1. Receives invitation, creates account
2. Creates and edits content blocks (WYSIWYG, plain text, image, JSON)
3. Uses AI content generation and AI translation
4. Views coach directory (read-only)
5. Cannot manage users, settings, deployments, or payments

**General Public (No Auth)**

Experience on chapter websites:
- Browse all 10 pages (landing, about, action learning/certification, coaches, testimonials, events, resources, contact, membership)
- Search coach directory in any language (semantic search)
- AI-powered "Find a Coach" matching widget (Phase 5)
- View events calendar
- Submit contact form
- Subscribe to newsletter
- Language switcher for multi-language chapters

---

## Decisions Log

### Locked Decisions

- Monorepo: Turborepo with "Core + Tenant" architecture (shared packages + per-chapter app folders)
- Package manager: Yarn
- Backend: Supabase Cloud (PostgreSQL, Auth, RLS, Edge Functions, Realtime, Storage)
- Auth: Email + password only. No magic link, no OAuth.
- Super Admin creation: Manually seeded in the database
- Admin dashboard: Next.js 16 on Vercel, dark/light mode toggle, multi-language UI
- Chapter websites: Astro on Cloudflare Pages (static HTML, zero JS default)
- Deployment: Per-chapter folders in monorepo → GitHub → Cloudflare Pages (auto-deploy via GitHub integration)
- AI site editing: GitHub Actions + OpenCode (or equivalent) with Gemini API
- AI content generation: Gemini API
- AI embeddings: OpenAI text-embedding-3-small + pgvector
- Email service: Centralized package via Resend
- Styling: Tailwind CSS with CSS custom properties for per-chapter branding
- UI Components: shadcn/ui
- Content editing: Tiptap WYSIWYG
- Subdomain format: {slug}.wial.ashwanthbk.com
- Chapter deletion: Soft delete only (status: suspended/archived)
- Chapter website pages: 10 pages (landing, about, action learning/certification, coach directory, individual profile, testimonials, events, resources, contact, membership/join)
- Header nav with links to all pages, full footer with contact/social/newsletter/client logos

### Deferred (Will Implement — Not Now)

- Payment integration (Stripe Connect + PayPal) — full plan in Phase 6, UI mocked with sample data so dependent features work
- Full analytics dashboard — basic metrics first, detailed in Phase 6
- Email campaigns with segmentation — basic newsletters in Phase 4, full campaigns in Phase 6

### Deferred to Future

- Coach multi-chapter support (can one coach belong to multiple chapters?)
- Mobile app (SRD P2)
- Member forums (SRD P2)
- Job board (SRD P2)
- Offline support via service workers (evaluate after core is stable)

---

## Completed Work — Phases 1-3 Summary

### Phase 1 — Foundation (Complete)

All four roles authenticate and land in role-specific dashboards. Invitation-driven onboarding works end-to-end. RLS enforces chapter isolation at the database level. Chapter CRUD for Super Admins with branding configuration. User management with invitation system via Resend. Coach directory with chapter roster, global view, and coach self-edit. Content block management with Tiptap WYSIWYG, plain text, image URL, and JSON types grouped by page. Testimonials management with featured/sort/active toggles. Dark/light mode via next-themes.

Deferred from Phase 1: Multi-language admin UI (next-intl setup).

### Phase 2 — Chapter Site Creation (Complete)

Astro template generating 8 static pages with build-time Supabase data fetching. Per-chapter branding via CSS custom properties. Header navigation and full footer (social links, newsletter subscription, client logos carousel). Chapter provisioning to Cloudflare Pages with deploy hooks. Deployment pipeline with real-time status tracking via Supabase Realtime. Contact form submission via Edge Function and Resend. Accessibility baseline: semantic landmarks, heading hierarchy, focus indicators, WCAG AA contrast.

Deferred from Phase 2: Real Cloudflare Pages API provisioning (using mock).

### Phase 3 — AI Features (Complete)

Cross-lingual semantic coach search via OpenAI embeddings and pgvector. AI content generation via Gemini API with chapter context. AI translation with cultural adaptation. Multi-language content management with per-locale content blocks, language routing, and header switcher. Low-bandwidth optimization with WebP images, lazy loading, and responsive sizing.

Deferred from Phase 3: Cloudflare Worker for Save-Data header detection, multi-language admin UI.

---

## Phase 4 — Per-Chapter Architecture, Events, and Email

### 4.1 Deployment Re-Architecture

Migrate from the single-template + deploy-hook model to per-chapter folders with GitHub-based auto-deployment.

**New architecture:**
- Each chapter gets a folder: `apps/chapter-{slug}/`
- Chapter folder extends the base Astro template from shared packages (`packages/template-core/`)
- Chapter-specific content overrides and customizations live in the chapter folder
- GitHub push to main triggers Cloudflare auto-deploy
- Build watch paths per Cloudflare project: `apps/chapter-{slug}/**` + `packages/**`
- Base template or shared package changes trigger rebuild of ALL chapter sites automatically (SRD UC2: "template updates at parent level auto-deploy to all chapter sites")

**Updated chapter provisioning flow:**
1. Super Admin creates chapter in dashboard
2. Edge Function scaffolds `apps/chapter-{slug}/` from template via GitHub API
3. Commits and pushes to the monorepo
4. Creates Cloudflare Pages project pointing to that folder with build watch paths
5. Configures custom domain `{slug}.wial.ashwanthbk.com`
6. Initial build triggers automatically from the push

**Migration:** Existing chapters built with the deploy-hook model are migrated to per-chapter folders. Deploy-hook approach is retired.

### 4.2 Centralized Email Service

A shared package (`packages/email`) providing template-based transactional email for the entire platform via Resend.

**Email types supported:**
- Invitations: signup links with chapter context
- Notifications: deployment success/failure, new member joins
- Certification: renewal reminders at 3-month, 2-month, and 1-month intervals
- Contact: form submissions forwarded to chapter email
- Events: RSVP confirmations, upcoming event reminders
- Newsletter: basic chapter newsletter sending
- Payments (Phase 6): receipts, overdue dues reminders

**Implementation:**
- Resend as the single email provider
- HTML email templates per type, responsive and chapter-branded (name, colors, logo)
- Edge Functions import from the email package instead of building emails ad-hoc
- Supabase scheduled functions (pg_cron) for recurring emails (renewal reminders, dues reminders)
- Configurable per-chapter: reply-to address, chapter branding in email header

### 4.3 Events Calendar

Chapter leads and advanced coaches create events. Events display on the chapter website and aggregate into a global calendar for cross-chapter visibility (SRD: "re-establish global visibility for local certification event calendars").

**Database — Events table:** id, chapter_id, title, description (rich text), event_type (certification, workshop, meetup, webinar), start_date, end_date, location, is_virtual, virtual_link, max_attendees, registration_link (external URL or internal RSVP), is_published, created_by, created_at, updated_at.

**Admin dashboard:** Events list page per chapter with filters by type and date range. Create/edit event form. Global aggregated events view for Super Admins. Advanced coaches (SALC/MALC/PALC) can create training events for their chapter.

**Chapter website — Events page:** Upcoming events in chronological order, past events collapsed. Each event card shows title, date, type badge, location, and registration link. iCal export per event. If no events exist, shows "Events coming soon."

### 4.4 Resources & Library Page

A new chapter website page for sharing learning resources, documents, and external links.

**Content blocks:** resources_title, resources_description, resources_items (JSON array of objects with title, description, url, type).

**Chapter website:** Grid of resource cards with title, description, type badge (PDF, Video, Link, Article), and view/download link. Resources link to external URLs or files in Supabase Storage.

**Admin dashboard:** Managed through the content block editor with a structured form for the JSON resources array.

### 4.5 Certification Information

Expand the Action Learning page into "Action Learning & Certification" OR add a dedicated Certification page. Includes recertification requirements and application information (SRD: "recertification requirements and application forms need to be included in the new website design").

**New content blocks:** cert_levels_info (JSON array with level, full_name, requirements, hours_required, description per certification tier), cert_recertification_info (rich text explaining the 2-year recertification cycle), cert_application_link (URL to external LMS or application form).

**Chapter website:** Certification levels displayed with requirements, recertification process explained, link to apply. The 4 levels (CALC, SALC, MALC, PALC) each with their advancement criteria.

**Admin dashboard — Coach certification tracking:**
- New fields on coach records: recertification_due_date, ce_credits_earned
- Coach self-edit view gains "My Certification" section: current level, hours logged, recertification due date, CE credits
- Automated renewal reminder emails at 3/2/1 months before expiry via the email service
- Certification badge approval: Super Admin or executive director must approve before a coach's certification level change is published to the public site (SRD: "reviewed and approved by the executive director and are not active and published until approved")

### 4.6 Organizational Client List (Enhanced)

Upgrade from the footer_client_logos JSON to a proper managed entity (SRD P1: "allow the ability to add specific clients supported by WIAL, with links to their website and their logo").

**Database — Client Organizations table:** id, chapter_id, name, logo_url, website_url, description (optional), sort_order, is_active, created_at, updated_at.

**Admin dashboard:** CRUD management page for client organizations per chapter. Super Admins can manage global-level clients.

**Chapter website:** Client logos in the footer carousel (existing pattern from wialnigeria.org) AND optionally on a "Our Clients" section of the landing or about page.

### 4.7 Chapter Website Pages Update

Expand from 8 to 10 pages on the Astro template:

1. Landing/Hero (existing)
2. About (existing)
3. Action Learning & Certification (expanded with cert info — 4.5)
4. Coach Directory (existing)
5. Individual Coach Profile (existing)
6. Testimonials (existing)
7. Events Calendar (new — 4.3)
8. Resources & Library (new — 4.4)
9. Contact (existing)
10. Membership/Join (existing, enhanced with payment mock in Phase 6)

Header navigation updated for all 10 pages. Labels remain editable via content blocks.

### 4.8 Multi-Language Admin UI (Carried from Phase 1)

Complete the deferred next-intl setup. Translation files for English, Spanish, French, and Portuguese covering all admin dashboard static text.

### Phase 4 Completion Conditions

- Per-chapter folder architecture live, existing chapters migrated
- Base template changes auto-deploy to all chapter sites via Cloudflare GitHub integration
- Centralized email service handling all email types with branded templates
- Events calendar functional in admin dashboard and on chapter websites
- Resources & Library page live on chapter websites
- Certification information page/section live with recertification details
- Coach certification tracking with automated renewal reminders
- Certification badge approval workflow (admin approval before publishing)
- Client organizations management upgraded to managed entity
- All 10 pages rendering on chapter websites
- Multi-language admin UI complete

---

## Phase 5 — AI Editing and Smart Coach Matching

### 5.1 AI-Powered Site Editing via GitHub Actions

Chapter leads customize their website through natural language without writing code.

**Architecture:**
1. Chapter lead types an edit request in the admin dashboard (e.g., "Change the hero heading to 'Welcome to WIAL Lagos' and add a green gradient to the hero section")
2. Dashboard calls an Edge Function with the prompt and chapter slug
3. Edge Function triggers a GitHub Actions workflow via the GitHub API
4. GitHub Action creates a new branch: `ai-edit/{chapter-slug}/{timestamp}`
5. GitHub Action runs the AI coding tool (OpenCode with Gemini API, or equivalent) scoped to `apps/chapter-{slug}/`
6. AI tool edits files, commits, and pushes to the branch
7. Cloudflare automatically generates a preview URL for the branch (built-in feature for connected repos)
8. Webhook or polling notifies the dashboard with the preview URL
9. Chapter lead reviews the preview in the admin dashboard
10. On approval: Edge Function triggers squash-merge to main via GitHub API
11. Cloudflare detects the push to main and auto-deploys

**Iterative editing:** Chapter lead can send additional prompts on the same branch before approving. Each prompt triggers another GitHub Actions run on the same branch. Preview URL updates automatically. All changes accumulate until final approval.

**Scope boundaries:**
- AI CAN modify: page content, brand colors, styling, layout, navigation labels, footer info, component visibility, images — all within `apps/chapter-{slug}/`
- AI CANNOT modify: shared packages, authentication logic, database connections, other chapters' folders, security-critical configuration

**Safety:** All edits go through branch, preview, human approval, squash-merge. Every edit tracked with the prompt that caused it, the commit reference, and who approved it. Rollback = don't merge (or revert the merge).

### 5.2 Smart Coach Matching (AI-3)

A client-facing widget on chapter websites where visitors describe their needs and get intelligently matched to coaches (SRD AI-3).

**How it works:**
1. "Find a Coach" widget on the coach directory page or homepage
2. Visitor types a natural language query (e.g., "We're a mid-size manufacturing company in Brazil looking to develop our leadership team")
3. System embeds the query using the existing OpenAI embedding infrastructure from Phase 3
4. Vector similarity search finds candidate coaches
5. Gemini API reranks results and generates personalized match explanations for each coach
6. Results displayed as coach cards with "Why this coach matches your needs" descriptions

**Implementation:**
- "find-coach-match" Edge Function: embeds query, vector search, Gemini reranking
- Small inline script on the chapter website (progressive enhancement — directory still works without JS)
- Admin dashboard toggle to enable/disable the widget per chapter

### 5.3 Deployment History Enhancement

With the per-chapter folder architecture and AI editing, deployment history becomes richer:
- Every deployment logged with: who triggered it, the AI prompt (if AI-edited), commit SHA, deploy URL, preview URL, approval status, timestamp
- Chapter leads can view a timeline of all changes
- Each entry shows what changed (content edit, AI edit, template update)

### Phase 5 Completion Conditions

- AI editing workflow functional end-to-end: prompt → GitHub Actions → branch → preview → approve → squash-merge → auto-deploy
- AI edits isolated to chapter folders, cannot affect shared packages or other chapters
- Iterative editing works (multiple prompts per branch before approval)
- Smart coach matching widget live on chapter websites with personalized explanations
- Deployment history shows AI edit prompts and approval status

---

## Phase 6 — Payments and Analytics (Deferred Implementation, Fully Planned)

Payment integration is a confirmed requirement (SRD P0) but implementation is deferred until the platform is stable. UI pages are built with mock data so dependent features (navigation, dashboards, reminders) work now. Actual Stripe/PayPal API integration comes later.

### 6.1 Payment Integration

Both Stripe Connect and PayPal in platform/marketplace mode.

**Payment types (from SRD, effective January 1, 2026):**
- $50 USD per student enrolled in eLearning platform
- $30 USD per student fully certified and encoded as a coach
- Affiliates and instructors pay WIAL Global — not the students
- Chapter membership dues (amount set per chapter)
- Event registration fees (per event, optional)

**Architecture:**
- Stripe Connect: each chapter = connected account under WIAL's platform account
- PayPal for Marketplaces: same marketplace pattern
- Payment page on chapter website (Membership/Join page enhanced with payment form)
- Payment processing via Edge Functions with webhook signature verification
- Automated email reminders for unpaid dues via the centralized email service
- Payment receipts sent automatically on successful payment

**Database — Payments table:** id, chapter_id, payer_id (nullable for external payers), payment_provider (stripe/paypal), provider_transaction_id, amount, currency, payment_type (enrollment/certification/dues/event), status (pending/completed/failed/refunded), description, receipt_sent (boolean), created_at.

**Admin dashboard:**
- Chapter lead: payment history table, collected dues report, outstanding payments list, manual "send reminder" action
- Super Admin: global revenue dashboard, per-chapter revenue breakdowns, payment conversion metrics (SRD: "Global dashboard shows all chapter revenue")

**Current state (until Phase 6 implementation):** UI pages mocked with sample data. Navigation and role-based access wired. Payment sections visible and interactive but display "(Coming Soon)" badges and demo data.

### 6.2 Analytics Dashboard

**Chapter-level metrics:**
- Website traffic via Cloudflare Analytics API (free, no additional tracking scripts needed)
- Coach directory page views
- Contact form submissions count
- Event registrations count
- Payment conversion rate (SRD: "Payment conversion rate above 90%")

**Global metrics (Super Admin):**
- Total active chapters, coaches, deployments
- Membership growth over time per chapter
- Revenue by chapter (Phase 6.1)
- Most active chapters by content updates and deployments

**Implementation:** Cloudflare Analytics API for traffic, Supabase aggregate queries for business metrics, rendered as dashboard cards and charts in the admin UI.

### 6.3 Email Campaigns

Extend the Phase 4 centralized email service to support campaign-style broadcasts (SRD P1: "Built-in newsletter system, segment by chapter and certification level").

**Features:**
- Compose email campaigns in the admin dashboard
- Segment recipients by: chapter, certification level, membership status, event attendance
- Templates for common types: announcements, recertification reminders, event promotions, newsletter
- Send history with basic delivery tracking

**Implementation:** Resend's broadcast/audience features or a campaign queue using Supabase + Edge Functions.

### Phase 6 Completion Conditions

- Stripe Connect and PayPal processing real payments
- Automated dues reminders via email service
- Payment receipts sent on successful transactions
- Payment reporting dashboard live for chapter leads and super admins
- Analytics dashboard showing traffic and business metrics
- Email campaigns sendable from admin dashboard with recipient segmentation
- Payment conversion tracking meets SRD target visibility

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + Yarn workspaces |
| Admin Dashboard | Next.js 16 on Vercel |
| Chapter Websites | Astro on Cloudflare Pages |
| Backend / Database | Supabase Cloud (PostgreSQL, Auth, RLS, Edge Functions, Realtime, Storage) |
| Vector Search | pgvector in Supabase PostgreSQL |
| AI Site Editing | GitHub Actions + OpenCode (or equivalent) with Gemini API |
| AI Content Generation | Gemini API |
| AI Embeddings | OpenAI text-embedding-3-small |
| AI Coach Matching | OpenAI embeddings + Gemini for reranking and explanations |
| Deployment | Per-chapter folders → GitHub → Cloudflare Pages (auto-deploy via GitHub integration) |
| Email | Resend via centralized email package |
| Payments (Phase 6) | Stripe Connect + PayPal for Marketplaces |
| Styling | Tailwind CSS + CSS custom properties |
| UI Components | shadcn/ui (Radix primitives) |
| Content Editing | Tiptap WYSIWYG |

---

## Database Entities

### Existing (Phases 1-3, Implemented)

- **Chapters** — central tenant entity: name, slug, subdomain, status (active/suspended/archived), branding (colors, logo, font), contact info, default_language, active_languages, Cloudflare project config
- **Profiles** — extends Supabase auth.users: email, full_name, avatar_url
- **User Roles** — join table: user_id, chapter_id, role (super_admin/chapter_lead/content_creator/coach)
- **Coaches** — directory entity: full_name, bio, bio_embedding (vector), specializations (array), languages (array), certification_level, hours_logged, photo_url, city, country, contact info, is_active, user_id (optional link)
- **Content Blocks** — per-chapter, per-locale: block_key, locale, content_type (rich_text/plain_text/image_url/json), content
- **Testimonials** — per-chapter: quote, author_name, author_title, author_photo_url, is_featured, sort_order, is_active
- **Invitations** — token-based: email, role, chapter_id, token, status, expires_at
- **Deployments** — audit trail: chapter_id, triggered_by, status, deploy_url, build_log, error_message
- **Global Coaches** — materialized view aggregating active coaches from active chapters

### New (Phase 4)

- **Events** — chapter events: title, description, event_type, start_date, end_date, location, is_virtual, virtual_link, max_attendees, registration_link, is_published, created_by
- **Client Organizations** — managed client list: chapter_id, name, logo_url, website_url, description, sort_order, is_active

### Schema Updates (Phase 4)

- **Coaches** — add: recertification_due_date (timestamptz), ce_credits_earned (integer), certification_approved (boolean, default false — must be approved before public)
- **Chapters** — add: github_folder_path (text)

### New (Phase 6)

- **Payments** — transaction records: chapter_id, payer_id, payment_provider, provider_transaction_id, amount, currency, payment_type, status, description, receipt_sent

---

## Deployment Architecture

### Per-Chapter Folder Model (Phase 4+)

```
monorepo/
  apps/
    admin/                  # Next.js admin dashboard → Vercel
    template/               # Base Astro chapter template (source of truth)
    chapter-nigeria/        # Extends template → Cloudflare Pages
    chapter-usa/            # Extends template → Cloudflare Pages
    chapter-brazil/         # ...
  packages/
    ui/                     # shadcn/ui shared components
    types/                  # Shared TypeScript types (Supabase-generated)
    supabase/               # Supabase client config
    email/                  # Centralized email service (Resend)
    template-core/          # Shared Astro layouts, components, styles
  supabase/                 # Migrations, seed data, Edge Functions
```

**How builds work:**
- Push to `main` → Cloudflare detects changes via build watch paths
- Each Cloudflare Pages project watches: its chapter folder + `packages/`
- Chapter-specific edit → only that chapter rebuilds
- Shared package or template-core change → ALL chapters rebuild (SRD UC2 requirement)

**AI editing flow:**
- Edit request from dashboard → Edge Function → GitHub Actions → new branch → AI edits chapter folder → Cloudflare preview URL from branch → chapter lead reviews → approve → squash-merge to main → Cloudflare auto-deploys

**Chapter provisioning flow:**
- Super Admin creates chapter → Edge Function scaffolds folder from template → pushes to GitHub → creates Cloudflare Pages project with watch paths and custom domain → initial build triggers automatically

---

## Multi-Tenancy Strategy

Every table with chapter-specific data includes a chapter_id column. Supabase RLS enforces tenant isolation at the database level. Even if application code has a bug, the database refuses unauthorized cross-chapter access. Super Admins bypass chapter restrictions. AI editing is sandboxed to per-chapter folders — one chapter's AI edits cannot affect another chapter's code.

---

## Security Considerations

- Multi-tenant isolation at database level via RLS on every table
- Authentication via Supabase Auth (established provider, not hand-rolled)
- All secrets in environment variables, never in code or Git
- Service role key only in Edge Functions and build processes, never in browser
- Invitation tokens: single-use, cryptographically random, 7-day expiry
- All user input validated with Zod at every entry point
- AI edits sandboxed to chapter folder via GitHub Actions, reviewed before merge
- Rate limiting on Edge Functions (search, contact form, deployment, AI edits)
- Payment webhook signatures verified (Stripe + PayPal) in Phase 6
- GitHub Actions: minimal permissions, scoped to repository
- Third-party API tokens scoped to minimum required permissions
- Certification changes require admin approval before public visibility

---

## Accessibility Plan

- Zero JavaScript default on chapter websites (Astro static HTML output)
- Semantic HTML: landmarks, heading hierarchy, form labels, ARIA attributes
- Keyboard navigation with visible focus indicators
- Screen reader support: alt text, ARIA live regions, meaningful link text
- WCAG AA color contrast compliance (4.5:1 minimum)
- Responsive design, mobile-first, tested at 320px+
- Admin dashboard uses shadcn/ui (Radix primitives, WCAG compliant)
- Low-bandwidth targets (SRD): chapter landing ≤200KB, coach directory ≤500KB, image-heavy pages ≤800KB
- Image optimization: AVIF primary, WebP fallback, JPEG last resort via `<picture>` element
- System font stack recommended for bandwidth; custom fonts optional per chapter
- Target <100KB total JavaScript on content pages
- All pages served through Cloudflare CDN (330+ edge locations including 32+ African cities)

---

## Testing Criteria (Hackathon Rubric)

| Category | Points | Target |
|---|---|---|
| AI Usage | 5 | AI core to solution: semantic search, content generation, translation, smart matching, AI site editing |
| Polish | 5 | End-to-end demo, automated deployment, setup documentation |
| Scope | 5 | Multi-tenant, reusable across nonprofits, addresses real WIAL pain points from SRD |
| Accessibility | 5 | WCAG implementation, low-bandwidth optimization, multi-language support |
| Security | 5 | RLS, established auth, Zod validation, scoped API keys, AI sandboxing |

---

## Key Risks

| Risk | Mitigation |
|---|---|
| Per-chapter folder architecture adds provisioning complexity | Automated scaffolding via Edge Function + GitHub API; template is the single source of truth |
| GitHub Actions compute costs for AI editing | Efficient models, rate limit AI edits per chapter, cache common patterns |
| AI edits producing broken code | Branch-based preview with human approval required; rollback = revert merge or don't merge |
| Base template updates breaking chapter customizations | Shared packages as stable API; chapter folders override, not fork; Turborepo DAG catches breaks at build time |
| Payment integration complexity (multi-currency, 20+ countries) | Defer until stable; start with USD; expand currencies per chapter need |
| Chapters resisting centralized template | AI editing provides deep customization; gather feedback early |
| Email deliverability across 20+ countries | Use Resend (good deliverability); monitor bounce rates; per-chapter reply-to addresses |
