import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { query, chapter_id, certification_level, language, limit = 20 } =
      await req.json();

    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(
        JSON.stringify({ error: "query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Search unavailable — no API key configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Embed the search query using Gemini text-embedding-004
    const embeddingRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: query.trim() }] },
          taskType: "RETRIEVAL_QUERY",
          outputDimensionality: 768,
        }),
      }
    );

    if (!embeddingRes.ok) {
      const errText = await embeddingRes.text();
      console.error("Gemini embedding API error:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to process search query" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const embeddingData = await embeddingRes.json();
    const queryEmbedding = embeddingData?.embedding?.values;

    if (!queryEmbedding || queryEmbedding.length !== 768) {
      return new Response(
        JSON.stringify({ error: "Invalid embedding response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the SQL query for vector similarity search
    // Using the global_coaches materialized view for cross-chapter search,
    // or coaches table when filtered to a specific chapter
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Use RPC for vector similarity search
    // We'll query directly with a raw SQL approach via RPC
    const { data: results, error: searchError } = await supabase.rpc(
      "search_coaches_by_embedding",
      {
        query_embedding: embeddingStr,
        filter_chapter_id: chapter_id || null,
        filter_certification: certification_level || null,
        filter_language: language || null,
        match_limit: Math.min(limit, 50),
      }
    );

    if (searchError) {
      console.error("Search RPC error:", searchError);

      // Fallback: text-based search if RPC doesn't exist yet
      let fallbackQuery = supabase
        .from("coaches")
        .select("*")
        .eq("is_active", true)
        .ilike("full_name", `%${query}%`)
        .limit(limit);

      if (chapter_id) fallbackQuery = fallbackQuery.eq("chapter_id", chapter_id);
      if (certification_level) fallbackQuery = fallbackQuery.eq("certification_level", certification_level);

      const { data: fallbackResults } = await fallbackQuery;

      return new Response(
        JSON.stringify({
          coaches: (fallbackResults ?? []).map((c) => ({ ...c, similarity: 0 })),
          mode: "text_fallback",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ coaches: results ?? [], mode: "semantic" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("semantic-search error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
