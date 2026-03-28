import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting: max 5 requests per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

// Subscribers are stored in a content_blocks JSON block keyed "newsletter_subscribers"
// per chapter. This avoids needing a separate table while keeping data in Supabase.
// Each entry: { email: string, name: string, subscribed_at: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.json();
    const { chapter_slug, email, name } = body ?? {};

    // Validate inputs
    if (!chapter_slug || typeof chapter_slug !== "string") {
      return new Response(JSON.stringify({ error: "chapter_slug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "A valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify chapter exists and is active
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id, status")
      .eq("slug", chapter_slug)
      .single();

    if (!chapter || chapter.status !== "active") {
      return new Response(JSON.stringify({ error: "Chapter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert subscriber into a JSON content block for this chapter
    const blockKey = "newsletter_subscribers";
    const { data: existing } = await supabase
      .from("content_blocks")
      .select("id, content")
      .eq("chapter_id", chapter.id)
      .eq("block_key", blockKey)
      .eq("locale", "en")
      .single();

    const newEntry = {
      email: email.toLowerCase().trim(),
      name: name?.trim() ?? "",
      subscribed_at: new Date().toISOString(),
    };

    if (existing) {
      let subscribers: Array<{ email: string; name: string; subscribed_at: string }> = [];
      try {
        subscribers = JSON.parse(existing.content);
        if (!Array.isArray(subscribers)) subscribers = [];
      } catch {
        subscribers = [];
      }

      // Deduplicate by email
      const alreadySubscribed = subscribers.some(
        (s) => s.email === newEntry.email
      );
      if (alreadySubscribed) {
        return new Response(
          JSON.stringify({ success: true, message: "Already subscribed" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      subscribers.push(newEntry);
      await supabase
        .from("content_blocks")
        .update({ content: JSON.stringify(subscribers) })
        .eq("id", existing.id);
    } else {
      await supabase.from("content_blocks").insert({
        chapter_id: chapter.id,
        block_key: blockKey,
        locale: "en",
        content_type: "json",
        content: JSON.stringify([newEntry]),
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
