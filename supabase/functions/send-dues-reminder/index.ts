import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendEmail, emailLayout, escapeHtml } from "../_shared/email.ts";

const ADMIN_URL =
  Deno.env.get("ADMIN_DASHBOARD_URL") ?? "https://wial-admin.vercel.app";

Deno.serve(async (req) => {
  // Called by pg_cron with service role key — no CORS needed
  if (req.method === "OPTIONS") {
    return new Response("ok");
  }

  // Verify service role authorization
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authHeader || !serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch chapters with Stripe connected and their chapter leads
  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, name, stripe_account_id, stripe_onboarding_complete")
    .eq("stripe_onboarding_complete", true)
    .eq("status", "active");

  if (error) {
    console.error("Failed to fetch chapters:", error);
    return new Response(JSON.stringify({ error: "DB error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!chapters || chapters.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let sent = 0;

  for (const chapter of chapters) {
    // Find chapter leads for this chapter
    const { data: leads } = await supabase
      .from("user_roles")
      .select("user_id, profiles(email, full_name)")
      .eq("chapter_id", chapter.id)
      .eq("role", "chapter_lead");

    if (!leads || leads.length === 0) continue;

    for (const lead of leads) {
      const profile = lead.profiles as { email: string; full_name: string } | null;
      if (!profile?.email) continue;

      const reminderBody = `
        <h1 style="font-family:Lexend,sans-serif;color:#1A7A8A;font-size:24px;margin:0 0 16px;">
          Weekly Dues Collection Reminder
        </h1>
        <p>Hello ${escapeHtml(profile.full_name)},</p>
        <p>This is your weekly reminder to collect outstanding dues for <strong>${escapeHtml(chapter.name)}</strong>.</p>
        <p>WIAL Global requires payment for:</p>
        <ul>
          <li><strong>$50</strong> per student enrolled in the eLearning platform</li>
          <li><strong>$30</strong> per student fully certified as a coach</li>
        </ul>
        <p>Use the Payments section in your chapter dashboard to create payment requests and track collections.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${ADMIN_URL}/dashboard/payments" style="display:inline-block;background-color:#1A7A8A;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
            View Payments Dashboard
          </a>
        </div>`;

      const result = await sendEmail({
        to: profile.email,
        subject: `[${escapeHtml(chapter.name)}] Weekly dues collection reminder`,
        html: emailLayout(reminderBody, { chapterName: chapter.name }),
      });

      if (result.success) sent++;
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
