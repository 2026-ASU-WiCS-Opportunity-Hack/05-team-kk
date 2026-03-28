import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { sendEmail, emailLayout, escapeHtml } from "../_shared/email.ts";

const ADMIN_URL =
  Deno.env.get("ADMIN_DASHBOARD_URL") ?? "https://wial-admin.vercel.app";

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

    // Find coaches with recertification due in 90, 60, or 30 days
    const now = new Date();
    const targets = [90, 60, 30].map((days) => {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return { days, date: d.toISOString().split("T")[0] };
    });

    let totalSent = 0;

    for (const target of targets) {
      const { data: coaches } = await supabase
        .from("coaches")
        .select("*, chapters(name, brand_primary_color, brand_logo_url)")
        .gte("recertification_due_date", `${target.date}T00:00:00Z`)
        .lt("recertification_due_date", `${target.date}T23:59:59Z`)
        .eq("is_active", true);

      if (!coaches || coaches.length === 0) continue;

      for (const coach of coaches) {
        const email = coach.contact_email || coach.user_id
          ? (await supabase.from("profiles").select("email").eq("id", coach.user_id!).single()).data?.email
          : null;

        if (!email) continue;

        const chapter = coach.chapters as { name: string; brand_primary_color: string; brand_logo_url: string | null } | null;
        const primary = chapter?.brand_primary_color || "#1A7A8A";
        const urgencyColor = target.days <= 30 ? "#dc2626" : target.days <= 60 ? "#d97706" : "#16a34a";

        const body = `
          <h1 style="font-family:Lexend,sans-serif;color:${primary};font-size:24px;margin:0 0 16px;">
            Certification Renewal Reminder
          </h1>
          <p>Hello ${escapeHtml(coach.full_name)},</p>
          <p>Your <strong>${escapeHtml(coach.certification_level)}</strong> certification with <strong>${escapeHtml(chapter?.name || "WIAL")}</strong> is due for renewal on <strong>${target.date}</strong>.</p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
            <p style="margin:0;font-size:14px;color:#6b7280;">Time Remaining</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:${urgencyColor};">${target.days} days</p>
          </div>
          <p>Please ensure your continuing education credits are up to date and contact your chapter lead if you have questions.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${ADMIN_URL}/dashboard/profile" style="display:inline-block;background-color:${primary};color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
              View My Certification
            </a>
          </div>`;

        await sendEmail({
          to: email,
          subject: `Certification renewal in ${target.days} days — ${chapter?.name || "WIAL"}`,
          html: emailLayout(body, {
            chapterName: chapter?.name,
            primaryColor: primary,
            logoUrl: chapter?.brand_logo_url || undefined,
          }),
        });

        totalSent++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-certification-reminder error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
