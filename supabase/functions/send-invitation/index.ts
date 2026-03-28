import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_URL =
  Deno.env.get("ADMIN_DASHBOARD_URL") ?? "https://wial-admin.vercel.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Verify the caller's JWT
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invitation_id } = await req.json();
    if (!invitation_id) {
      return new Response(
        JSON.stringify({ error: "invitation_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch invitation with chapter info
    const { data: invitation, error: invError } = await supabase
      .from("invitations")
      .select("*, chapters(name)")
      .eq("id", invitation_id)
      .single();

    if (invError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invitation not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify caller has permission for this chapter
    const { data: callerRoles } = await supabase
      .from("user_roles")
      .select("role, chapter_id")
      .eq("user_id", user.id);

    const isSuperAdmin = callerRoles?.some((r) => r.role === "super_admin");
    const isChapterLead = callerRoles?.some(
      (r) =>
        r.chapter_id === invitation.chapter_id && r.role === "chapter_lead"
    );

    if (!isSuperAdmin && !isChapterLead) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chapterName =
      (invitation.chapters as { name: string } | null)?.name ?? "WIAL";
    const roleLabel =
      invitation.role === "chapter_lead"
        ? "Chapter Lead"
        : invitation.role === "content_creator"
          ? "Content Creator"
          : "Coach";

    const signupUrl = `${ADMIN_URL}/signup?token=${invitation.token}`;

    // Send email via Resend
    if (RESEND_API_KEY) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "WIAL Platform <noreply@wial.ashwanthbk.com>",
          to: [invitation.email],
          subject: `You're invited to join ${chapterName}`,
          html: `
            <div style="font-family: 'Source Sans 3', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
              <h1 style="font-family: Lexend, sans-serif; color: #1A7A8A; font-size: 24px; margin-bottom: 16px;">
                You've been invited to ${chapterName}
              </h1>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                You've been invited to join <strong>${chapterName}</strong> as a <strong>${roleLabel}</strong>
                on the WIAL Global Chapter Network Platform.
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Click the button below to create your account. This invitation expires in 7 days.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${signupUrl}"
                   style="display: inline-block; background-color: #1A7A8A; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Create Your Account
                </a>
              </div>
              <p style="color: #6B7280; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${signupUrl}" style="color: #1A7A8A;">${signupUrl}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
              <p style="color: #9CA3AF; font-size: 12px;">
                WIAL Global Chapter Network Platform
              </p>
            </div>
          `,
        }),
      });

      if (!emailRes.ok) {
        const errBody = await emailRes.text();
        console.error("Resend error:", errBody);
        return new Response(
          JSON.stringify({ error: "Failed to send email", details: errBody }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // No Resend key — log the signup URL for development
      console.log(`[DEV] Invitation email for ${invitation.email}:`);
      console.log(`[DEV] Signup URL: ${signupUrl}`);
    }

    return new Response(JSON.stringify({ success: true, signupUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-invitation error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
