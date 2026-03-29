import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { sendEmail } from "../_shared/email.ts";

// Rate limit: 5 registrations per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { event_id?: string; name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { event_id, name, email } = body;

  if (!event_id || !name?.trim() || !email?.trim()) {
    return new Response(
      JSON.stringify({ error: "event_id, name, and email are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch the event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*, chapters(name, contact_email)")
    .eq("id", event_id)
    .eq("is_published", true)
    .single();

  if (eventError || !event) {
    return new Response(JSON.stringify({ error: "Event not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check capacity
  if (event.max_attendees) {
    const { count } = await supabase
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event_id)
      .eq("status", "confirmed");

    if (count !== null && count >= event.max_attendees) {
      // Register as waitlisted
      const { error: insertError } = await supabase
        .from("event_registrations")
        .upsert(
          { event_id, name: name.trim(), email: email.trim().toLowerCase(), status: "waitlisted" },
          { onConflict: "event_id,email" }
        );

      if (insertError) {
        if (insertError.code === "23505") {
          return new Response(JSON.stringify({ error: "Already registered" }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Registration failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ status: "waitlisted", message: "Event is full. You have been added to the waitlist." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // Register
  const { error: insertError } = await supabase
    .from("event_registrations")
    .upsert(
      { event_id, name: name.trim(), email: email.trim().toLowerCase(), status: "confirmed" },
      { onConflict: "event_id,email" }
    );

  if (insertError) {
    if (insertError.code === "23505") {
      return new Response(JSON.stringify({ error: "Already registered" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("Registration error:", insertError);
    return new Response(JSON.stringify({ error: "Registration failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Send confirmation email
  const eventDate = new Date(event.start_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const locationText = event.is_virtual ? "Virtual Event" : event.location ?? "TBD";

  await sendEmail({
    to: email.trim().toLowerCase(),
    subject: `Registration Confirmed: ${event.title}`,
    html: `
      <h2>You're registered!</h2>
      <p>Hi ${escapeHtml(name.trim())},</p>
      <p>Your registration for <strong>${escapeHtml(event.title)}</strong> has been confirmed.</p>
      <table style="margin:16px 0;border-collapse:collapse;">
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Date</td><td style="padding:4px 0;font-weight:600;">${eventDate}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666;">Location</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(locationText)}</td></tr>
        ${event.is_virtual && event.virtual_link ? `<tr><td style="padding:4px 16px 4px 0;color:#666;">Link</td><td style="padding:4px 0;"><a href="${escapeHtml(event.virtual_link)}">Join Event</a></td></tr>` : ""}
      </table>
      <p style="color:#666;font-size:14px;">Organized by ${escapeHtml((event.chapters as any)?.name ?? "WIAL")}</p>
    `,
  });

  return new Response(
    JSON.stringify({ status: "confirmed", message: "Registration successful!" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
