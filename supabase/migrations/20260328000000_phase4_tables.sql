-- Phase 4 migration: new tables, new columns, RLS, triggers, updated materialized view.

-- ============================================================
-- NEW COLUMNS ON EXISTING TABLES
-- ============================================================

-- Chapters: github folder path for per-chapter architecture
alter table public.chapters
  add column if not exists github_folder_path text;

-- Coaches: certification tracking
alter table public.coaches
  add column if not exists recertification_due_date timestamptz,
  add column if not exists ce_credits_earned integer not null default 0,
  add column if not exists certification_approved boolean not null default false;

-- Deployments: AI editing support (Phase 5 schema, created now)
alter table public.deployments
  add column if not exists ai_prompt text,
  add column if not exists preview_url text,
  add column if not exists approval_status text check (approval_status in ('pending','approved','rejected'));

-- ============================================================
-- NEW TABLES
-- ============================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters on delete cascade,
  title text not null,
  description text,
  event_type text not null check (event_type in ('certification','workshop','meetup','webinar')),
  start_date timestamptz not null,
  end_date timestamptz,
  location text,
  is_virtual boolean not null default false,
  virtual_link text,
  max_attendees integer,
  registration_link text,
  is_published boolean not null default false,
  created_by uuid not null references public.profiles,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_organizations (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters on delete cascade,
  name text not null,
  logo_url text,
  website_url text,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters on delete cascade,
  email text not null,
  name text,
  subscribed_at timestamptz not null default now(),
  is_active boolean not null default true,
  unique (chapter_id, email)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_events_chapter_id on public.events (chapter_id);
create index if not exists idx_events_start_date on public.events (start_date);
create index if not exists idx_events_is_published on public.events (is_published);
create index if not exists idx_client_organizations_chapter_id on public.client_organizations (chapter_id);
create index if not exists idx_newsletter_subscribers_chapter_active on public.newsletter_subscribers (chapter_id, is_active);

-- ============================================================
-- UPDATED-AT TRIGGERS ON NEW TABLES
-- ============================================================

do $$
declare
  t text;
begin
  for t in select unnest(array['events','client_organizations'])
  loop
    if not exists (
      select 1 from pg_trigger where tgname = 'trg_' || t || '_updated_at'
    ) then
      execute format(
        'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
        t, t
      );
    end if;
  end loop;
end;
$$;

-- ============================================================
-- UPDATED MATERIALIZED VIEW (add certification_approved filter)
-- ============================================================

drop materialized view if exists public.global_coaches;

create materialized view public.global_coaches as
select
  c.id,
  c.full_name,
  c.bio,
  c.specializations,
  c.languages,
  c.certification_level,
  c.hours_logged,
  c.photo_url,
  c.city,
  c.country,
  c.contact_email,
  c.website,
  c.recertification_due_date,
  c.ce_credits_earned,
  ch.id as chapter_id,
  ch.name as chapter_name,
  ch.slug as chapter_slug
from public.coaches c
join public.chapters ch on ch.id = c.chapter_id
where c.is_active = true
  and c.certification_approved = true
  and ch.status = 'active';

-- Recreate unique index for concurrent refresh
create unique index if not exists idx_global_coaches_id on public.global_coaches (id);

-- ============================================================
-- ROW LEVEL SECURITY ON NEW TABLES
-- ============================================================

alter table public.events enable row level security;
alter table public.client_organizations enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Helper: check if the current user is an advanced coach (SALC/MALC/PALC) in a chapter
create or replace function public.is_advanced_coach_in_chapter(_chapter_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.coaches co on co.user_id = ur.user_id and co.chapter_id = ur.chapter_id
    where ur.user_id = auth.uid()
      and ur.chapter_id = _chapter_id
      and ur.role = 'coach'
      and co.certification_level in ('SALC','MALC','PALC')
  );
$$;

-- Events policies
create policy "events_select_public" on public.events for select using (
  (is_published = true and exists (
    select 1 from public.chapters where id = events.chapter_id and status = 'active'
  ))
  or public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
  or public.is_advanced_coach_in_chapter(chapter_id)
);

create policy "events_insert" on public.events for insert with check (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
  or public.is_advanced_coach_in_chapter(chapter_id)
);

create policy "events_update" on public.events for update using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
  or (created_by = auth.uid())
);

create policy "events_delete" on public.events for delete using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

-- Client Organizations policies
create policy "client_orgs_select_public" on public.client_organizations for select using (
  (is_active = true and exists (
    select 1 from public.chapters where id = client_organizations.chapter_id and status = 'active'
  ))
  or public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

create policy "client_orgs_insert" on public.client_organizations for insert with check (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

create policy "client_orgs_update" on public.client_organizations for update using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

create policy "client_orgs_delete" on public.client_organizations for delete using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

-- Newsletter Subscribers policies
create policy "newsletter_select" on public.newsletter_subscribers for select using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

create policy "newsletter_insert" on public.newsletter_subscribers for insert with check (
  true  -- public: anyone can subscribe via the website form
);

create policy "newsletter_update" on public.newsletter_subscribers for update using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

create policy "newsletter_delete" on public.newsletter_subscribers for delete using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);
