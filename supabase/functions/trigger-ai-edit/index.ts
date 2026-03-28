import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Starts an AI editing session by creating a branch and a deployment record.
 * Prompts are sent separately via the admin dashboard API routes which
 * trigger the ai-edit.yml GitHub Actions workflow.
 */
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
    const githubToken = Deno.env.get("GITHUB_TOKEN")!;
    const githubRepo = Deno.env.get("GITHUB_REPO")!; // e.g. "owner/repo"

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

    // Authorization: super_admin or chapter_lead
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
      .select("id, slug, github_folder_path")
      .eq("id", chapter_id)
      .single();

    if (!chapter) {
      return new Response(JSON.stringify({ error: "Chapter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: one active AI edit session per chapter
    const { data: activeEdits } = await supabase
      .from("deployments")
      .select("id")
      .eq("chapter_id", chapter_id)
      .eq("approval_status", "pending")
      .in("status", ["queued", "building", "deploying"])
      .limit(1);

    if (activeEdits && activeEdits.length > 0) {
      return new Response(
        JSON.stringify({
          error:
            "An AI edit session is already active for this chapter. Deploy or discard it first.",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [owner, repo] = githubRepo.split("/");
    const branchName = `ai-edit/${chapter.slug}/${Date.now()}`;

    // Create branch via GitHub API
    const refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!refRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to read main branch" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const refData = await refRes.json();
    const mainSha = refData.object.sha;

    const createRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: mainSha,
        }),
      }
    );

    if (!createRefRes.ok) {
      const errBody = await createRefRes.text();
      return new Response(
        JSON.stringify({ error: "Failed to create branch", details: errBody }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create deployment record
    const { data: deployment, error: insertError } = await supabase
      .from("deployments")
      .insert({
        chapter_id,
        triggered_by: user.id,
        status: "queued",
        approval_status: "pending",
        commit_reference: branchName,
      })
      .select()
      .single();

    if (insertError || !deployment) {
      return new Response(
        JSON.stringify({ error: "Failed to create session record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        deployment_id: deployment.id,
        branch_name: branchName,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
