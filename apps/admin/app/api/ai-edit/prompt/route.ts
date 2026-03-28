import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isSuperAdmin, getUserRoleForChapter } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const deploymentId = body?.deploymentId;
  const prompt = body?.prompt;

  if (!deploymentId || !prompt) {
    return NextResponse.json(
      { error: "deploymentId and prompt are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Fetch deployment
  const { data: deployment } = await supabase
    .from("deployments")
    .select("*, chapters(id, slug)")
    .eq("id", deploymentId)
    .single();

  if (!deployment) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  if (deployment.approval_status !== "pending") {
    return NextResponse.json(
      { error: "This session is no longer active" },
      { status: 409 }
    );
  }

  // Only accept prompts when session is idle (queued = no prompt yet, deploying = previous edit done)
  if (!["queued", "deploying"].includes(deployment.status)) {
    return NextResponse.json(
      { error: "An edit is already in progress. Wait for it to finish." },
      { status: 409 }
    );
  }

  // Authorization: super_admin or chapter_lead
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

  // Update deployment: store prompt, set status to building
  await supabase
    .from("deployments")
    .update({ ai_prompt: prompt, status: "building" })
    .eq("id", deploymentId);

  // Trigger GitHub Actions workflow on the existing branch
  const [owner, repo] = githubRepo.split("/");
  const chapterSlug = (deployment as any).chapters?.slug ?? "";

  try {
    const dispatchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/ai-edit.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            chapter_slug: chapterSlug,
            prompt_text: prompt,
            branch_name: deployment.commit_reference!,
            deployment_id: deployment.id,
          },
        }),
      }
    );

    if (!dispatchRes.ok) {
      const errBody = await dispatchRes.text();
      // Revert status so user can retry
      await supabase
        .from("deployments")
        .update({ status: deployment.status === "queued" ? "queued" : "deploying" })
        .eq("id", deploymentId);

      return NextResponse.json(
        { error: "Failed to trigger AI edit workflow", details: errBody },
        { status: 502 }
      );
    }
  } catch {
    await supabase
      .from("deployments")
      .update({ status: deployment.status === "queued" ? "queued" : "deploying" })
      .eq("id", deploymentId);

    return NextResponse.json(
      { error: "Network error calling GitHub API" },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
