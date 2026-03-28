-- RPC function for semantic coach search via pgvector
-- Used by the semantic-search Edge Function

CREATE OR REPLACE FUNCTION search_coaches_by_embedding(
  query_embedding vector(1536),
  filter_chapter_id uuid DEFAULT NULL,
  filter_certification text DEFAULT NULL,
  filter_language text DEFAULT NULL,
  match_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  chapter_id uuid,
  full_name text,
  bio text,
  specializations text[],
  languages text[],
  certification_level text,
  hours_logged int,
  photo_url text,
  city text,
  country text,
  contact_email text,
  contact_phone text,
  website text,
  is_active boolean,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.chapter_id,
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
    c.contact_phone,
    c.website,
    c.is_active,
    1 - (c.bio_embedding <=> query_embedding) AS similarity
  FROM coaches c
  INNER JOIN chapters ch ON ch.id = c.chapter_id
  WHERE c.is_active = true
    AND ch.status = 'active'
    AND c.bio_embedding IS NOT NULL
    AND (filter_chapter_id IS NULL OR c.chapter_id = filter_chapter_id)
    AND (filter_certification IS NULL OR c.certification_level = filter_certification)
    AND (filter_language IS NULL OR filter_language = ANY(c.languages))
  ORDER BY c.bio_embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;
