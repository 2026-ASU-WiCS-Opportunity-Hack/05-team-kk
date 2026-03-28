-- Enable pgvector extension and add bio_embedding column to coaches table

create extension if not exists vector with schema extensions;

alter table public.coaches
  add column if not exists bio_embedding vector(1536);

-- Create HNSW index for fast approximate nearest-neighbor search
create index if not exists idx_coaches_bio_embedding
  on public.coaches
  using hnsw (bio_embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Add bio_embedding to the materialized view
drop materialized view if exists public.global_coaches;

create materialized view public.global_coaches as
select
  c.id,
  c.full_name,
  c.bio,
  c.bio_embedding,
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

-- Create unique index for concurrent refresh
create unique index if not exists idx_global_coaches_id on public.global_coaches (id);

-- HNSW index on the materialized view for semantic search
create index if not exists idx_global_coaches_embedding
  on public.global_coaches
  using hnsw (bio_embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);
