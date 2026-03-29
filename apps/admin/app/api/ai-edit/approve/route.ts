import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isSuperAdmin, getUserRoleForChapter } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const deploymentId = body?.deploymentId;
  const action = body?.action as "approve" | "reject";

  if (!deploymentId || !action || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "deploymentId and action (approve|reject) are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: deployment } = await supabase
    .from("deployments")
    .select("*")
    .eq("id", deploymentId)
    .single();

  if (!deployment) {
    return NextResponse.json(
      { error: "Deployment not found" },
      { status: 404 }
    );
  }

  if (deployment.approval_status !== "pending") {
    return NextResponse.json(
      { error: `Already ${deployment.approval_status}` },
      { status: 409 }
    );
  }

  // Approve requires preview to be ready (deploying state)
  if (action === "approve" && deployment.status !== "deploying") {
    return NextResponse.json(
      { error: "Cannot deploy — no preview available yet. Send a prompt first." },
      { status: 400 }
    );
  }

  // Reject/discard is allowed from any active state (queued, building, deploying)

  // Authorization
  const role = isSuperAdmin(user.roles)
    ? "super_admin"
    : getUserRoleForChapter(user.roles, deployment.chapter_id);
  if (!role || (role !== "super_admin" && role !== "chapter_lead")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;

  if (!githubToken || !githubRepo) {
    return NextResponse.json(
      { error: "GitHub integration not configured" },
      { status: 503 }
    );
  }

  const [owner, repo] = githubRepo.split("/");
  const branchName = deployment.commit_reference;

  if (action === "approve") {
    try {
      // Create PR
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
            title: `AI Edit: ${(deployment.ai_prompt ?? "").slice(0, 60)}`,
            head: branchName,
            base: "main",
            body: `AI-generated edit.\n\n**Prompt:** ${deployment.ai_prompt}\n**Deployment:** ${deployment.id}`,
          }),
        }
      );

      if (!prRes.ok) {
        const errBody = await prRes.text();
        return NextResponse.json(
          { error: "Failed to create PR", details: errBody },
          { status: 502 }
        );
      }

      const prData = await prRes.json();

      // Squash-merge
      const mergeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prData.number}/merge`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            commit_title: `AI Edit: ${(deployment.ai_prompt ?? "").slice(0, 60)}`,
            merge_method: "squash",
          }),
        }
      );

      if (!mergeRes.ok) {
        const errBody = await mergeRes.text();
        return NextResponse.json(
          { error: "PR created but merge failed", details: errBody },
          { status: 502 }
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

      await serviceSupabase
        .from("deployments")
        .update({
          status: "done",
          approval_status: "approved",
          completed_at: new Date().toISOString(),
        })
        .eq("id", deploymentId);

      return NextResponse.json({ success: true, action: "approved" });
    } catch {
      return NextResponse.json(
        { error: "Network error during approval" },
        { status: 502 }
      );
    }
  }

  // Reject: delete branch and close session
  try {
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
  } catch {
    // Branch may already be deleted; proceed
  }

  await serviceSupabase
    .from("deployments")
    .update({
      status: "failed",
      approval_status: "rejected",
      error_message: "Session discarded by user",
      completed_at: new Date().toISOString(),
    })
    .eq("id", deploymentId);

  return NextResponse.json({ success: true, action: "rejected" });
}
