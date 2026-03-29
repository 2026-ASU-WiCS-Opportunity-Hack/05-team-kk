-- Phase 6: Payments (Stripe Connect), Analytics RPCs, Email Campaigns

-- ============================================================
-- NEW COLUMNS ON CHAPTERS
-- ============================================================

alter table public.chapters
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_complete boolean not null default false;

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters on delete cascade,
  payer_id uuid references public.profiles on delete set null,
  payer_email text not null,
  payment_provider text not null default 'stripe' check (payment_provider in ('stripe')),
  provider_transaction_id text unique,
  stripe_checkout_session_id text unique,
  amount integer not null check (amount > 0),
  currency text not null default 'usd',
  payment_type text not null check (payment_type in ('enrollment','certification','dues','event')),
  status text not null default 'pending' check (status in ('pending','completed','failed','refunded')),
  description text,
  receipt_sent boolean not null default false,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- EMAIL CAMPAIGNS TABLE
-- ============================================================

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references public.chapters on delete cascade,
  created_by uuid not null references public.profiles on delete restrict,
  subject text not null,
  body text not null,
  audience_filter jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','sending','sent','failed')),
  recipient_count integer,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_payments_chapter_id on public.payments (chapter_id);
create index if not exists idx_payments_status on public.payments (status);
create index if not exists idx_payments_payment_type on public.payments (payment_type);
create index if not exists idx_payments_created_at on public.payments (created_at desc);
create index if not exists idx_email_campaigns_chapter_id on public.email_campaigns (chapter_id);
create index if not exists idx_email_campaigns_status on public.email_campaigns (status);

-- ============================================================
-- UPDATED-AT TRIGGERS
-- ============================================================

create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.handle_updated_at();

create trigger set_email_campaigns_updated_at
  before update on public.email_campaigns
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.payments enable row level security;
alter table public.email_campaigns enable row level security;

-- Payments: read-only for super_admin and chapter leads (own chapter)
-- NO INSERT/UPDATE via RLS — only service role (Edge Functions) can write
create policy "payments_select_admin" on public.payments
  for select using (public.is_super_admin());

create policy "payments_select_chapter_lead" on public.payments
  for select using (public.has_role_in_chapter(chapter_id, 'chapter_lead'));

-- Email campaigns: chapter leads manage own chapter, super admin manages all
create policy "campaigns_select" on public.email_campaigns
  for select using (
    public.is_super_admin()
    or chapter_id is null and public.is_super_admin()
    or public.has_role_in_chapter(chapter_id, 'chapter_lead')
  );

create policy "campaigns_insert" on public.email_campaigns
  for insert with check (
    public.is_super_admin()
    or public.has_role_in_chapter(chapter_id, 'chapter_lead')
  );

create policy "campaigns_update" on public.email_campaigns
  for update using (
    public.is_super_admin()
    or public.has_role_in_chapter(chapter_id, 'chapter_lead')
  );

-- ============================================================
-- ANALYTICS RPCs
-- ============================================================

create or replace function public.get_chapter_payment_metrics(p_chapter_id uuid)
returns table (
  total_collected bigint,
  outstanding bigint,
  this_month bigint,
  enrollment_total bigint,
  certification_total bigint,
  dues_total bigint,
  event_total bigint
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(sum(case when status = 'completed' then amount else 0 end), 0) as total_collected,
    coalesce(sum(case when status = 'pending' then amount else 0 end), 0) as outstanding,
    coalesce(sum(case when status = 'completed' and created_at >= date_trunc('month', now()) then amount else 0 end), 0) as this_month,
    coalesce(sum(case when status = 'completed' and payment_type = 'enrollment' then amount else 0 end), 0) as enrollment_total,
    coalesce(sum(case when status = 'completed' and payment_type = 'certification' then amount else 0 end), 0) as certification_total,
    coalesce(sum(case when status = 'completed' and payment_type = 'dues' then amount else 0 end), 0) as dues_total,
    coalesce(sum(case when status = 'completed' and payment_type = 'event' then amount else 0 end), 0) as event_total
  from public.payments
  where chapter_id = p_chapter_id;
$$;

create or replace function public.get_chapter_business_metrics(p_chapter_id uuid)
returns table (
  active_coaches bigint,
  upcoming_events bigint,
  active_subscribers bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.coaches where chapter_id = p_chapter_id and is_active = true and certification_approved = true) as active_coaches,
    (select count(*) from public.events where chapter_id = p_chapter_id and is_published = true and start_date > now()) as upcoming_events,
    (select count(*) from public.newsletter_subscribers where chapter_id = p_chapter_id and is_active = true) as active_subscribers;
$$;

create or replace function public.get_global_revenue_metrics()
returns table (
  chapter_id uuid,
  chapter_name text,
  chapter_status text,
  total_collected bigint,
  this_month bigint,
  active_coaches bigint
)
language sql
security definer
set search_path = public
as $$
  select
    c.id as chapter_id,
    c.name as chapter_name,
    c.status as chapter_status,
    coalesce(sum(case when p.status = 'completed' then p.amount else 0 end), 0) as total_collected,
    coalesce(sum(case when p.status = 'completed' and p.created_at >= date_trunc('month', now()) then p.amount else 0 end), 0) as this_month,
    count(distinct case when co.is_active = true and co.certification_approved = true then co.id end) as active_coaches
  from public.chapters c
  left join public.payments p on p.chapter_id = c.id
  left join public.coaches co on co.chapter_id = c.id
  group by c.id, c.name, c.status
  order by total_collected desc;
$$;

-- ============================================================
-- PG_CRON: WEEKLY DUES REMINDER (MONDAYS 09:00 UTC)
-- ============================================================

select cron.schedule(
  'dues-reminder-weekly',
  '0 9 * * 1',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-dues-reminder',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
