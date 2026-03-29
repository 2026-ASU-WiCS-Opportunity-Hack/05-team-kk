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

    const { query, chapter_id } = await req.json();

    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(
        JSON.stringify({ error: "query is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Coach matching unavailable — no API key" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Embed the query using Gemini text-embedding-004
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
      console.error("Gemini embedding error:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to process search query" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const embeddingData = await embeddingRes.json();
    const queryEmbedding = embeddingData?.embedding?.values;

    if (!queryEmbedding || queryEmbedding.length !== 768) {
      return new Response(
        JSON.stringify({ error: "Invalid embedding response" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Vector similarity search against coaches
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    const { data: candidates, error: searchError } = await supabase.rpc(
      "search_coaches_by_embedding",
      {
        query_embedding: embeddingStr,
        filter_chapter_id: chapter_id || null,
        filter_certification: null,
        filter_language: null,
        match_limit: 10,
      }
    );

    let coachProfiles = candidates ?? [];

    // Fallback if RPC fails: text-based search
    if (searchError) {
      console.error("Vector search RPC error:", searchError);
      let fallbackQuery = supabase
        .from("coaches")
        .select("*, chapters(name, slug)")
        .eq("is_active", true)
        .eq("certification_approved", true)
        .limit(10);

      if (chapter_id) {
        fallbackQuery = fallbackQuery.eq("chapter_id", chapter_id);
      }

      const { data: fallbackResults } = await fallbackQuery;
      coachProfiles = fallbackResults ?? [];
    }

    if (coachProfiles.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], mode: "no_results" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 3: Send candidates to Gemini for reranking with match explanations
    if (!GEMINI_API_KEY) {
      // Without Gemini, return raw vector search results with no explanations
      return new Response(
        JSON.stringify({
          matches: coachProfiles.slice(0, 5).map((c: any) => ({
            coach: c,
            reason: null,
          })),
          mode: "vector_only",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const profileSummaries = coachProfiles.map((c: any, i: number) => {
      const specs = Array.isArray(c.specializations)
        ? c.specializations.join(", ")
        : "";
      const langs = Array.isArray(c.languages)
        ? c.languages.join(", ")
        : "";
      return `Coach ${i + 1}: ${c.full_name}
  Certification: ${c.certification_level}
  Specializations: ${specs || "Not specified"}
  Languages: ${langs || "Not specified"}
  Bio: ${(c.bio || "No bio available").slice(0, 300)}
  Location: ${[c.city, c.country].filter(Boolean).join(", ") || "Not specified"}
  Hours logged: ${c.hours_logged ?? 0}`;
    });

    const geminiPrompt = `You are a coach matching assistant for WIAL (World Institute for Action Learning).

A prospective client is looking for a coach. Their query:
"${query}"

Here are ${coachProfiles.length} candidate coaches from the directory:

${profileSummaries.join("\n\n")}

Rank the top 5 best matches. For each, provide a brief explanation (1-2 sentences) of why this coach is a good fit for the client's needs. Consider: specialization relevance, language match, experience level, and geographic proximity if mentioned.

Respond with a JSON array of objects. Each object has:
- "index": the coach number (1-based, matching the list above)
- "reason": a 1-2 sentence explanation of the match

Return valid JSON only. No markdown, no extra text.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      console.error("Gemini reranking error:", await geminiRes.text());
      // Fall back to vector order without explanations
      return new Response(
        JSON.stringify({
          matches: coachProfiles.slice(0, 5).map((c: any) => ({
            coach: c,
            reason: null,
          })),
          mode: "vector_only",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const geminiData = await geminiRes.json();
    const rankingText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let rankings: Array<{ index: number; reason: string }> = [];
    try {
      // Clean markdown fences if present
      let cleaned = rankingText.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      }
      rankings = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini ranking:", rankingText);
      // Fall back to vector order
      return new Response(
        JSON.stringify({
          matches: coachProfiles.slice(0, 5).map((c: any) => ({
            coach: c,
            reason: null,
          })),
          mode: "vector_only",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Map rankings to coach profiles
    const matches = rankings
      .filter((r) => r.index >= 1 && r.index <= coachProfiles.length)
      .slice(0, 5)
      .map((r) => ({
        coach: coachProfiles[r.index - 1],
        reason: r.reason,
      }));

    return new Response(
      JSON.stringify({ matches, mode: "ai_ranked" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("find-coach-match error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
