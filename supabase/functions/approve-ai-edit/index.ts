import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";

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
    const githubRepo = Deno.env.get("GITHUB_REPO")!;

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

    const { deployment_id, action } = await req.json();
    if (!deployment_id || !action) {
      return new Response(
        JSON.stringify({ error: "deployment_id and action are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action must be 'approve' or 'reject'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch deployment
    const { data: deployment } = await supabase
      .from("deployments")
      .select("*, chapters(id, slug)")
      .eq("id", deployment_id)
      .single();

    if (!deployment) {
      return new Response(
        JSON.stringify({ error: "Deployment not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (deployment.approval_status === null) {
      return new Response(
        JSON.stringify({ error: "This deployment is not an AI edit session" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (deployment.approval_status !== "pending") {
      return new Response(
        JSON.stringify({
          error: `This session has already been ${deployment.approval_status}`,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Approve requires preview to be ready
    if (action === "approve" && deployment.status !== "deploying") {
      return new Response(
        JSON.stringify({
          error: "Cannot deploy — no preview available yet. Send a prompt first.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
        .eq("chapter_id", deployment.chapter_id)
        .single();

      if (!chapterRole || chapterRole.role !== "chapter_lead") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const [owner, repo] = githubRepo.split("/");
    const branchName = deployment.commit_reference;

    if (action === "approve") {
      // Create a PR and squash-merge it
      const prRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: `AI Edit: ${deployment.ai_prompt!.slice(0, 60)}`,
            head: branchName,
            base: "main",
            body: `AI-generated edit for chapter.\n\n**Prompt:** ${deployment.ai_prompt}\n\n**Deployment ID:** ${deployment.id}`,
          }),
        }
      );

      if (!prRes.ok) {
        const errBody = await prRes.text();
        return new Response(
          JSON.stringify({ error: "Failed to create PR", details: errBody }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const prData = await prRes.json();
      const prNumber = prData.number;

      // Squash-merge the PR
      const mergeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            commit_title: `AI Edit: ${deployment.ai_prompt!.slice(0, 60)}`,
            merge_method: "squash",
          }),
        }
      );

      if (!mergeRes.ok) {
        const errBody = await mergeRes.text();
        return new Response(
          JSON.stringify({
            error: "PR created but merge failed",
            pr_number: prNumber,
            details: errBody,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Delete the branch after merge
      await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branchName!)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      // Update deployment record
      await supabase
        .from("deployments")
        .update({
          status: "done",
          approval_status: "approved",
          completed_at: new Date().toISOString(),
        })
        .eq("id", deployment_id);

      return new Response(
        JSON.stringify({
          success: true,
          action: "approved",
          pr_number: prNumber,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // action === "reject"
    // Delete the branch
    await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branchName!)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    // Update deployment record
    await supabase
      .from("deployments")
      .update({
        status: "failed",
        approval_status: "rejected",
        error_message: "Session discarded by user",
        completed_at: new Date().toISOString(),
      })
      .eq("id", deployment_id);

    return new Response(
      JSON.stringify({ success: true, action: "rejected" }),
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
