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

    const { coach_id } = await req.json();

    if (!coach_id) {
      return new Response(
        JSON.stringify({ error: "coach_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch coach
    const { data: coach, error: coachError } = await supabase
      .from("coaches")
      .select("id, bio, specializations")
      .eq("id", coach_id)
      .single();

    if (coachError || !coach) {
      return new Response(
        JSON.stringify({ error: "Coach not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build text to embed: bio + specializations
    const parts: string[] = [];
    if (coach.bio) parts.push(coach.bio.replace(/<[^>]*>/g, "")); // strip HTML
    if (coach.specializations?.length > 0) {
      parts.push("Specializations: " + coach.specializations.join(", "));
    }

    const textToEmbed = parts.join("\n\n");

    if (!textToEmbed.trim()) {
      // Nothing to embed — clear any existing embedding
      await supabase
        .from("coaches")
        .update({ bio_embedding: null })
        .eq("id", coach_id);

      return new Response(
        JSON.stringify({ message: "No text to embed, cleared embedding" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not set — skipping embedding generation");
      return new Response(
        JSON.stringify({ message: "Skipped — no API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Gemini text-embedding-004 (768 dimensions, multilingual)
    const embeddingRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: textToEmbed }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: 768,
        }),
      }
    );

    if (!embeddingRes.ok) {
      const errText = await embeddingRes.text();
      console.error("Gemini embedding API error:", errText);
      return new Response(
        JSON.stringify({ error: "Embedding generation failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData?.embedding?.values;

    if (!embedding || embedding.length !== 768) {
      return new Response(
        JSON.stringify({ error: "Invalid embedding response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update coach with embedding
    const { error: updateError } = await supabase
      .from("coaches")
      .update({ bio_embedding: JSON.stringify(embedding) })
      .eq("id", coach_id);

    if (updateError) {
      console.error("Failed to update embedding:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to store embedding" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh materialized view
    await supabase.rpc("refresh_global_coaches");

    return new Response(
      JSON.stringify({ message: "Embedding generated successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-embedding error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
