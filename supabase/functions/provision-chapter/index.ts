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
    const cloudflareAccountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID")!;
    const cloudflareApiToken = Deno.env.get("CLOUDFLARE_API_TOKEN")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is authenticated and is a super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Verify user is a super_admin
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .limit(1);

    if (rolesError || !roles || roles.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Forbidden: only super admins can provision chapters",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { chapter_id } = await req.json();
    if (!chapter_id) {
      return new Response(
        JSON.stringify({ error: "chapter_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Read the chapter record
    const { data: chapter, error: chapterError } = await supabase
      .from("chapters")
      .select("*")
      .eq("id", chapter_id)
      .single();

    if (chapterError || !chapter) {
      return new Response(
        JSON.stringify({ error: "Chapter not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (chapter.cloudflare_project_name) {
      return new Response(
        JSON.stringify({
          error: "Chapter already has a Cloudflare project provisioned",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const projectName = `wial-${chapter.slug}`;
    const cfBaseUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/pages/projects`;
    const cfHeaders = {
      Authorization: `Bearer ${cloudflareApiToken}`,
      "Content-Type": "application/json",
    };

    // Step 1: Create the Cloudflare Pages project
    const createProjectRes = await fetch(cfBaseUrl, {
      method: "POST",
      headers: cfHeaders,
      body: JSON.stringify({
        name: projectName,
        production_branch: "main",
        build_config: {
          build_command:
            "cd apps/chapter-template && npx astro build",
          destination_dir: "apps/chapter-template/dist",
          root_dir: "",
        },
        deployment_configs: {
          production: {
            environment_variables: {
              SUPABASE_URL: { value: supabaseUrl, type: "plain_text" },
              SUPABASE_SERVICE_ROLE_KEY: {
                value: serviceRoleKey,
                type: "secret_text",
              },
              CHAPTER_SLUG: { value: chapter.slug, type: "plain_text" },
            },
          },
        },
      }),
    });

    const createProjectData = await createProjectRes.json();

    if (!createProjectRes.ok) {
      const errorMsg =
        createProjectData?.errors?.[0]?.message ||
        "Failed to create Cloudflare Pages project";
      return new Response(
        JSON.stringify({ error: errorMsg, details: createProjectData }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Create a deploy hook for the project
    const deployHookRes = await fetch(
      `${cfBaseUrl}/${projectName}/deploy_hooks`,
      {
        method: "POST",
        headers: cfHeaders,
        body: JSON.stringify({
          name: `deploy-${chapter.slug}`,
          branch: "main",
        }),
      }
    );

    const deployHookData = await deployHookRes.json();

    if (!deployHookRes.ok) {
      // Project was created but deploy hook failed -- still record the project name
      await supabase
        .from("chapters")
        .update({ cloudflare_project_name: projectName })
        .eq("id", chapter_id);

      return new Response(
        JSON.stringify({
          error: "Project created but deploy hook creation failed",
          details: deployHookData,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const deployHookUrl = deployHookData?.result?.hook_url;

    // Step 3: Add custom domain to the project
    const customDomain = `${chapter.slug}.wial.ashwanthbk.com`;
    const domainRes = await fetch(
      `${cfBaseUrl}/${projectName}/domains`,
      {
        method: "POST",
        headers: cfHeaders,
        body: JSON.stringify({ name: customDomain }),
      }
    );

    // Domain configuration may require DNS setup; log but do not block
    const domainData = await domainRes.json();
    const domainWarning = !domainRes.ok
      ? `Custom domain setup needs attention: ${domainData?.errors?.[0]?.message || "unknown error"}`
      : null;

    // Step 4: Update the chapter record with Cloudflare details
    const { error: updateError } = await supabase
      .from("chapters")
      .update({
        cloudflare_project_name: projectName,
        cloudflare_deploy_hook_url: deployHookUrl,
      })
      .eq("id", chapter_id);

    if (updateError) {
      return new Response(
        JSON.stringify({
          error: "Cloudflare project created but failed to update chapter record",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 5: Trigger the initial deployment by POSTing to the deploy hook
    let initialDeployTriggered = false;
    if (deployHookUrl) {
      const triggerRes = await fetch(deployHookUrl, { method: "POST" });
      initialDeployTriggered = triggerRes.ok;
    }

    return new Response(
      JSON.stringify({
        success: true,
        project_name: projectName,
        deploy_hook_url: deployHookUrl,
        custom_domain: customDomain,
        domain_warning: domainWarning,
        initial_deploy_triggered: initialDeployTriggered,
      }),
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
