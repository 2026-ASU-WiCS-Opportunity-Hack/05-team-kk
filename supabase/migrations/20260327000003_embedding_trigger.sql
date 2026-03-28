-- Trigger to call generate-embedding Edge Function when coach bio/specializations change
-- Uses pg_net extension (already available in Supabase) for async HTTP calls

create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_embedding_generation()
returns trigger
language plpgsql
security definer
as $$
declare
  supabase_url text;
  service_role_key text;
begin
  -- Only trigger when bio or specializations actually change
  if tg_op = 'INSERT' or
     old.bio is distinct from new.bio or
     old.specializations is distinct from new.specializations then

    -- Read project URL and service role key from vault or config
    supabase_url := current_setting('app.settings.supabase_url', true);
    service_role_key := current_setting('app.settings.service_role_key', true);

    -- If settings not available, skip silently
    if supabase_url is not null and service_role_key is not null then
      perform extensions.http_post(
        url := supabase_url || '/functions/v1/generate-embedding',
        body := json_build_object('coach_id', new.id)::text,
        headers := json_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        )::jsonb
      );
    end if;
  end if;

  return new;
end;
$$;

-- Only create trigger if not exists
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_coaches_generate_embedding'
  ) then
    create trigger trg_coaches_generate_embedding
      after insert or update of bio, specializations on public.coaches
      for each row execute function public.trigger_embedding_generation();
  end if;
end;
$$;
