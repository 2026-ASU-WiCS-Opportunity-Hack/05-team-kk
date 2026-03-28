import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { chapter_id } = await req.json();
    if (!chapter_id) {
      return new Response(JSON.stringify({ error: "chapter_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization: super_admin or chapter_lead for this chapter
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isSuperAdmin = roles?.some((r) => r.role === "super_admin");
    if (!isSuperAdmin) {
      const { data: chapterRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("chapter_id", chapter_id)
        .single();

      if (!chapterRole || chapterRole.role !== "chapter_lead") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Read chapter
    const { data: chapter } = await supabase
      .from("chapters")
      .select("id, slug, cloudflare_deploy_hook_url")
      .eq("id", chapter_id)
      .single();

    if (!chapter) {
      return new Response(JSON.stringify({ error: "Chapter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!chapter.cloudflare_deploy_hook_url) {
      return new Response(
        JSON.stringify({ error: "Chapter has no deploy hook. Provision the chapter first." }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for in-progress deployment
    const { data: existing } = await supabase
      .from("deployments")
      .select("id")
      .eq("chapter_id", chapter_id)
      .in("status", ["queued", "building", "deploying"])
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: "A deployment is already in progress." }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create deployment record
    const { data: deployment, error: insertError } = await supabase
      .from("deployments")
      .insert({ chapter_id, triggered_by: user.id, status: "queued" })
      .select()
      .single();

    if (insertError || !deployment) {
      return new Response(
        JSON.stringify({ error: "Failed to create deployment record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Trigger Cloudflare build
    const hookRes = await fetch(chapter.cloudflare_deploy_hook_url, { method: "POST" });

    if (!hookRes.ok) {
      await supabase
        .from("deployments")
        .update({
          status: "failed",
          error_message: `Deploy hook returned HTTP ${hookRes.status}`,
          completed_at: new Date().toISOString(),
        })
        .eq("id", deployment.id);

      return new Response(
        JSON.stringify({ error: "Deploy hook call failed", deployment_id: deployment.id }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update to building
    await supabase
      .from("deployments")
      .update({ status: "building" })
      .eq("id", deployment.id);

    return new Response(
      JSON.stringify({ success: true, deployment_id: deployment.id }),
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
