import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  de: "German",
  yo: "Yoruba",
  vi: "Vietnamese",
  ko: "Korean",
  ja: "Japanese",
  zh: "Chinese",
  ar: "Arabic",
  hi: "Hindi",
  sw: "Swahili",
  tl: "Filipino/Tagalog",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { chapter_id, source_content, source_locale, target_locale, content_type } =
      await req.json();

    if (!chapter_id || !source_content || !source_locale || !target_locale) {
      return new Response(
        JSON.stringify({ error: "chapter_id, source_content, source_locale, and target_locale are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch chapter for regional context
    const { data: chapter } = await supabase
      .from("chapters")
      .select("name, slug")
      .eq("id", chapter_id)
      .single();

    if (!chapter) {
      return new Response(JSON.stringify({ error: "Chapter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceLang = LANGUAGE_NAMES[source_locale] ?? source_locale;
    const targetLang = LANGUAGE_NAMES[target_locale] ?? target_locale;
    const isRichText = content_type === "rich_text";

    const prompt = `You are a professional translator performing cultural adaptation, not literal translation.

CONTEXT:
- Organization: ${chapter.name} (a WIAL Action Learning chapter)
- Region: ${chapter.slug.replace(/-/g, " ")}
- Source language: ${sourceLang} (${source_locale})
- Target language: ${targetLang} (${target_locale})

SOURCE CONTENT:
${source_content}

TASK:
Translate the above content from ${sourceLang} to ${targetLang} with cultural adaptation.

REQUIREMENTS:
- Perform cultural adaptation, not just literal word-for-word translation
- Adjust idioms, metaphors, and references to feel natural in ${targetLang} and the target culture
- Maintain the same tone: professional yet warm and approachable
- Preserve the same meaning and intent
${isRichText ? "- Maintain the exact same HTML structure (tags, nesting). Only translate the text content within the tags." : "- Output plain text only"}
- Do NOT include any preamble, explanation, or markdown code fences — output only the translated content`;

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ content: `[${targetLang} translation placeholder] ${source_content}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: "Translation failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const translatedText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!translatedText) {
      return new Response(
        JSON.stringify({ error: "AI returned empty translation" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleaned = translatedText.trim();
    if (cleaned.startsWith("```html")) {
      cleaned = cleaned.replace(/^```html\n?/, "").replace(/\n?```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    return new Response(JSON.stringify({ content: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("translate-content error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
