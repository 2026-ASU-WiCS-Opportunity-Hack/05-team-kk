-- Event Registrations table for RSVP tracking
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  email text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'waitlisted')),
  registered_at timestamptz not null default now()
);

-- Prevent duplicate registrations for the same event+email
create unique index idx_event_registrations_unique
  on public.event_registrations (event_id, email);

-- Index for querying registrations by event
create index idx_event_registrations_event
  on public.event_registrations (event_id);

-- RLS
alter table public.event_registrations enable row level security;

-- Public can register (insert)
create policy "Anyone can register for events"
  on public.event_registrations for insert
  to anon, authenticated
  with check (true);

-- Chapter leads and super admins can read registrations
create policy "Chapter leads and super admins can read registrations"
  on public.event_registrations for select
  to authenticated
  using (
    exists (
      select 1 from public.events e
      join public.user_roles ur on ur.user_id = auth.uid()
      where e.id = event_registrations.event_id
        and (
          ur.role = 'super_admin'
          or (ur.role = 'chapter_lead' and ur.chapter_id = e.chapter_id)
        )
    )
  );

-- RPC to get registration count for an event (public)
create or replace function public.get_event_registration_count(p_event_id uuid)
returns integer
language sql
stable
security definer
as $$
  select count(*)::integer
  from public.event_registrations
  where event_id = p_event_id and status = 'confirmed';
$$;
