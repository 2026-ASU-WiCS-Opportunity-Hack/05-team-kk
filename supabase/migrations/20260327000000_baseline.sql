-- Baseline migration: captures the existing schema already in the live database.
-- This file is for version-control documentation only.

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  subdomain text not null unique,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  default_language text not null default 'en',
  active_languages text[] not null default '{en}',
  brand_primary_color text not null default '#1a365d',
  brand_secondary_color text not null default '#2b6cb0',
  brand_accent_color text not null default '#ed8936',
  brand_logo_url text,
  brand_font text not null default 'Inter',
  contact_email text,
  contact_phone text,
  contact_address text,
  cloudflare_project_name text,
  cloudflare_deploy_hook_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  chapter_id uuid references public.chapters on delete cascade,
  role text not null check (role in ('super_admin','chapter_lead','content_creator','coach')),
  created_at timestamptz not null default now(),
  constraint role_chapter_check check (
    (role = 'super_admin' and chapter_id is null) or
    (role <> 'super_admin' and chapter_id is not null)
  )
);

create unique index if not exists user_roles_super_admin_unique
  on public.user_roles (user_id, role) where role = 'super_admin';
create unique index if not exists user_roles_chapter_role_unique
  on public.user_roles (user_id, chapter_id, role) where role <> 'super_admin';

create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters on delete cascade,
  user_id uuid references public.profiles on delete set null,
  full_name text not null,
  bio text,
  specializations text[] not null default '{}',
  languages text[] not null default '{}',
  certification_level text not null check (certification_level in ('CALC','SALC','MALC','PALC')),
  hours_logged integer not null default 0,
  photo_url text,
  city text,
  country text,
  contact_email text,
  contact_phone text,
  website text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters on delete cascade,
  block_key text not null,
  locale text not null default 'en',
  content_type text not null default 'rich_text' check (content_type in ('rich_text','plain_text','image_url','json')),
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chapter_id, block_key, locale)
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters on delete cascade,
  quote text not null,
  author_name text not null,
  author_title text,
  author_photo_url text,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters on delete cascade,
  email text not null,
  role text not null check (role in ('chapter_lead','content_creator','coach')),
  invited_by uuid not null references public.profiles,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending','accepted','expired')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters on delete cascade,
  triggered_by uuid not null references public.profiles,
  status text not null default 'queued' check (status in ('queued','building','deploying','done','failed')),
  deploy_url text,
  build_log text,
  commit_reference text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_chapters_slug on public.chapters (slug);
create index if not exists idx_chapters_status on public.chapters (status);
create index if not exists idx_user_roles_user_id on public.user_roles (user_id);
create index if not exists idx_user_roles_chapter_id on public.user_roles (chapter_id);
create index if not exists idx_coaches_chapter_id on public.coaches (chapter_id);
create index if not exists idx_coaches_is_active on public.coaches (is_active);
create index if not exists idx_content_blocks_chapter_locale on public.content_blocks (chapter_id, locale);
create index if not exists idx_invitations_token on public.invitations (token);
create index if not exists idx_invitations_email_status on public.invitations (email, status);

-- ============================================================
-- MATERIALIZED VIEW
-- ============================================================

create materialized view if not exists public.global_coaches as
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
  ch.id as chapter_id,
  ch.name as chapter_name,
  ch.slug as chapter_slug
from public.coaches c
join public.chapters ch on ch.id = c.chapter_id
where c.is_active = true and ch.status = 'active';

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.has_role_in_chapter(_chapter_id uuid, _role text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and chapter_id = _chapter_id
      and role = _role
  );
$$;

create or replace function public.has_any_role_in_chapter(_chapter_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and chapter_id = _chapter_id
  );
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

-- trigger on auth.users — only create if not exists
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in select unnest(array['chapters','profiles','coaches','content_blocks','testimonials'])
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

create or replace function public.refresh_global_coaches()
returns trigger
language plpgsql
security definer
as $$
begin
  refresh materialized view concurrently public.global_coaches;
  return null;
exception when others then
  return null;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_coaches_refresh_view') then
    create trigger trg_coaches_refresh_view
      after insert or update or delete on public.coaches
      for each statement execute function public.refresh_global_coaches();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_chapters_refresh_view') then
    create trigger trg_chapters_refresh_view
      after update of status on public.chapters
      for each statement execute function public.refresh_global_coaches();
  end if;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.chapters enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.coaches enable row level security;
alter table public.content_blocks enable row level security;
alter table public.testimonials enable row level security;
alter table public.invitations enable row level security;
alter table public.deployments enable row level security;

-- Chapters
create policy "chapters_select" on public.chapters for select using (
  status = 'active' or public.is_super_admin()
);
create policy "chapters_insert" on public.chapters for insert with check (
  public.is_super_admin()
);
create policy "chapters_update" on public.chapters for update using (
  public.is_super_admin() or public.has_role_in_chapter(id, 'chapter_lead')
);

-- Profiles
create policy "profiles_select" on public.profiles for select using (
  id = auth.uid()
  or public.is_super_admin()
  or exists (
    select 1 from public.user_roles ur1
    join public.user_roles ur2 on ur1.chapter_id = ur2.chapter_id
    where ur1.user_id = auth.uid() and ur1.role = 'chapter_lead'
      and ur2.user_id = profiles.id
  )
);
create policy "profiles_update" on public.profiles for update using (
  id = auth.uid() or public.is_super_admin()
);

-- User Roles
create policy "user_roles_select" on public.user_roles for select using (
  user_id = auth.uid()
  or public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);
create policy "user_roles_insert" on public.user_roles for insert with check (
  public.is_super_admin()
  or (
    public.has_role_in_chapter(chapter_id, 'chapter_lead')
    and role in ('content_creator','coach')
  )
);
create policy "user_roles_update" on public.user_roles for update using (
  public.is_super_admin()
);
create policy "user_roles_delete" on public.user_roles for delete using (
  public.is_super_admin()
  or (
    public.has_role_in_chapter(chapter_id, 'chapter_lead')
    and role in ('content_creator','coach')
  )
);

-- Coaches
create policy "coaches_select_public" on public.coaches for select using (
  (is_active = true and exists (
    select 1 from public.chapters where id = coaches.chapter_id and status = 'active'
  ))
  or public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);
create policy "coaches_insert" on public.coaches for insert with check (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);
create policy "coaches_update" on public.coaches for update using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
  or (user_id = auth.uid())
);
create policy "coaches_delete" on public.coaches for delete using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

-- Content Blocks
create policy "content_blocks_select" on public.content_blocks for select using (
  exists (
    select 1 from public.chapters where id = content_blocks.chapter_id and status = 'active'
  )
  or public.is_super_admin()
  or public.has_any_role_in_chapter(chapter_id)
);
create policy "content_blocks_insert" on public.content_blocks for insert with check (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
  or public.has_role_in_chapter(chapter_id, 'content_creator')
);
create policy "content_blocks_update" on public.content_blocks for update using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
  or public.has_role_in_chapter(chapter_id, 'content_creator')
);
create policy "content_blocks_delete" on public.content_blocks for delete using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

-- Testimonials
create policy "testimonials_select" on public.testimonials for select using (
  (is_active = true and exists (
    select 1 from public.chapters where id = testimonials.chapter_id and status = 'active'
  ))
  or public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);
create policy "testimonials_insert" on public.testimonials for insert with check (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);
create policy "testimonials_update" on public.testimonials for update using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);
create policy "testimonials_delete" on public.testimonials for delete using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

-- Invitations
create policy "invitations_select" on public.invitations for select using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);
create policy "invitations_insert" on public.invitations for insert with check (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);
create policy "invitations_delete" on public.invitations for delete using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);

-- Deployments
create policy "deployments_select" on public.deployments for select using (
  public.is_super_admin()
  or public.has_role_in_chapter(chapter_id, 'chapter_lead')
);
