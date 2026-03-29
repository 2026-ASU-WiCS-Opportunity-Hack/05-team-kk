import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_BATCH_URL = "https://api.resend.com/emails/batch";
const DEFAULT_FROM =
  Deno.env.get("RESEND_FROM_EMAIL") ?? "WIAL Platform <onboarding@resend.dev>";

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

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
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

  let body: { campaign_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { campaign_id } = body;
  if (!campaign_id) {
    return new Response(JSON.stringify({ error: "campaign_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch campaign
  const { data: campaign } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (!campaign) {
    return new Response(JSON.stringify({ error: "Campaign not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Authorization check
  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role, chapter_id")
    .eq("user_id", user.id);

  const isSuperAdmin = callerRoles?.some((r) => r.role === "super_admin");
  const isChapterLead = campaign.chapter_id && callerRoles?.some(
    (r) => r.chapter_id === campaign.chapter_id && r.role === "chapter_lead"
  );

  if (!isSuperAdmin && !isChapterLead) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (campaign.status === "sent" || campaign.status === "sending") {
    return new Response(
      JSON.stringify({ error: "Campaign has already been sent or is currently sending" }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Mark as sending
  await supabase
    .from("email_campaigns")
    .update({ status: "sending" })
    .eq("id", campaign_id);

  // Fetch recipients from newsletter_subscribers based on audience_filter
  let subscribersQuery = supabase
    .from("newsletter_subscribers")
    .select("email, name")
    .eq("is_active", true);

  const filter = campaign.audience_filter as { chapter_id?: string };

  if (campaign.chapter_id) {
    // Chapter-scoped campaign
    subscribersQuery = subscribersQuery.eq("chapter_id", campaign.chapter_id);
  } else if (filter?.chapter_id) {
    // Global campaign filtered to a specific chapter
    subscribersQuery = subscribersQuery.eq("chapter_id", filter.chapter_id);
  }
  // else: global campaign — all active subscribers

  const { data: subscribers, error: subError } = await subscribersQuery;

  if (subError) {
    console.error("Failed to fetch subscribers:", subError);
    await supabase
      .from("email_campaigns")
      .update({ status: "failed" })
      .eq("id", campaign_id);

    return new Response(JSON.stringify({ error: "Failed to fetch recipients" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!subscribers || subscribers.length === 0) {
    await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        recipient_count: 0,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign_id);

    return new Response(JSON.stringify({ sent: 0, message: "No active subscribers found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");

  if (!apiKey) {
    // Dev mode: just mark as sent
    console.log(`[DEV] Would send campaign "${campaign.subject}" to ${subscribers.length} recipients`);
    await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        recipient_count: subscribers.length,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign_id);

    return new Response(JSON.stringify({ sent: subscribers.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Send via Resend batch API (max 100 per batch)
  const BATCH_SIZE = 100;
  let totalSent = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    const emails = batch.map((sub) => ({
      from: DEFAULT_FROM,
      to: [sub.email],
      subject: campaign.subject,
      html: campaign.body,
    }));

    const res = await fetch(RESEND_BATCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emails),
    });

    if (res.ok) {
      totalSent += batch.length;
    } else {
      const errBody = await res.text();
      console.error("Resend batch error:", errBody);
    }
  }

  const finalStatus = totalSent > 0 ? "sent" : "failed";

  await supabase
    .from("email_campaigns")
    .update({
      status: finalStatus,
      recipient_count: totalSent,
      sent_at: totalSent > 0 ? new Date().toISOString() : null,
    })
    .eq("id", campaign_id);

  return new Response(JSON.stringify({ sent: totalSent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
