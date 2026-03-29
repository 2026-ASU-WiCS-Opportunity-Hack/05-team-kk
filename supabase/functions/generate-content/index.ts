import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const WIAL_METHODOLOGY = `WIAL (World Institute for Action Learning) is a global organization that certifies Action Learning Coaches in 20+ countries. Action Learning is a process that involves a small group working on real problems, taking action, and learning as individuals and as a team. The six components of Action Learning are: (1) A Problem — real, significant, and urgent; (2) An Action Learning Group or Team — 4-8 members with diverse backgrounds; (3) A Process of Insightful Questioning and Reflective Listening; (4) An Action Taken on the Problem; (5) A Commitment to Learning; (6) An Action Learning Coach — who focuses on the learning. WIAL certifies coaches at four levels: CALC (Certified Action Learning Coach), SALC (Senior), MALC (Master), and PALC (Principal).`;

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

    // Verify JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { chapter_id, content_type, custom_prompt, block_key, output_format } = await req.json();

    if (!chapter_id || !content_type) {
      return new Response(
        JSON.stringify({ error: "chapter_id and content_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch chapter context
    const { data: chapter } = await supabase
      .from("chapters")
      .select("name, slug, default_language, contact_email")
      .eq("id", chapter_id)
      .single();

    if (!chapter) {
      return new Response(JSON.stringify({ error: "Chapter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the prompt
    const contentTypeDescriptions: Record<string, string> = {
      welcome: `a hero/welcome section heading and description for the chapter's landing page. The title should be under 10 words, compelling, and welcoming. The description should be 2-3 sentences that invite visitors to learn about the chapter.`,
      about: `an About page for the chapter (200-400 words). Describe the chapter's mission, its connection to the global WIAL network, and the value it brings to its region. Make it feel authentic and locally grounded.`,
      coach_program: `a description of the Action Learning coaching program (150-300 words). Explain what Action Learning is, how coaching works, and what certification levels exist. Make it accessible to someone unfamiliar with the concept.`,
      mission: `a mission statement for the chapter (2-4 sentences). It should be inspiring, specific to the chapter's region, and connect to WIAL's global mission of spreading Action Learning.`,
      join: `a membership/join page pitch (150-250 words). Explain the benefits of joining the chapter, who should join, and what they'll gain. Include a sense of community and professional growth.`,
      custom: custom_prompt || "general content for the chapter website",
    };

    const contentDesc = contentTypeDescriptions[content_type] ?? contentTypeDescriptions.custom;
    const isRichText = output_format === "rich_text";

    const prompt = `You are a professional content writer for ${chapter.name}, a regional chapter of WIAL (World Institute for Action Learning).

ABOUT WIAL AND ACTION LEARNING:
${WIAL_METHODOLOGY}

CHAPTER CONTEXT:
- Chapter name: ${chapter.name}
- Region/Country: ${chapter.slug.replace(/-/g, " ")}
- Primary language: ${chapter.default_language}

TASK:
Generate ${contentDesc}

REQUIREMENTS:
- Write in ${chapter.default_language === "en" ? "English" : `the language with code "${chapter.default_language}"`}
- Make the content culturally relevant to the chapter's region — not generic with the country name swapped in
- Reflect local business culture, communication style, and common challenges
- Be professional yet warm and approachable
${isRichText ? "- Output clean HTML using only these tags: p, h2, h3, strong, em, ul, ol, li, a" : "- Output plain text only, no HTML tags"}
- Do NOT include any preamble, explanation, or markdown — just the content itself`;

    if (!GEMINI_API_KEY) {
      // Fallback: return a placeholder for development
      const fallback = isRichText
        ? `<h2>Welcome to ${chapter.name}</h2><p>This is AI-generated placeholder content. Configure the GEMINI_API_KEY to enable real content generation.</p>`
        : `Welcome to ${chapter.name}. This is AI-generated placeholder content.`;
      return new Response(JSON.stringify({ content: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiRes.json();
    const generatedText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: "AI returned empty content" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up: remove markdown code fences if Gemini wraps in them
    let cleaned = generatedText.trim();
    if (cleaned.startsWith("```html")) {
      cleaned = cleaned.replace(/^```html\n?/, "").replace(/\n?```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    return new Response(JSON.stringify({ content: cleaned }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-content error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
