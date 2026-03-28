import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isSuperAdmin, getUserRoleForChapter } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const chapterId = body?.chapterId;

  if (!chapterId) {
    return NextResponse.json(
      { error: "chapterId is required" },
      { status: 400 }
    );
  }

  // Authorization: super_admin or chapter_lead
  const role = isSuperAdmin(user.roles)
    ? "super_admin"
    : getUserRoleForChapter(user.roles, chapterId);
  if (!role || (role !== "super_admin" && role !== "chapter_lead")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, slug, github_folder_path")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  // Rate limit: one active AI edit session per chapter
  const { data: activeEdits } = await supabase
    .from("deployments")
    .select("id")
    .eq("chapter_id", chapterId)
    .eq("approval_status", "pending")
    .in("status", ["queued", "building", "deploying"])
    .limit(1);

  if (activeEdits && activeEdits.length > 0) {
    return NextResponse.json(
      {
        error:
          "An AI edit session is already active for this chapter. Deploy or discard it first.",
      },
      { status: 409 }
    );
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
  const branchName = `ai-edit/${chapter.slug}/${Date.now()}`;

  // Create the branch via GitHub API (no Actions workflow needed)
  try {
    // Get main branch HEAD SHA
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
      return NextResponse.json(
        { error: "Failed to read main branch" },
        { status: 502 }
      );
    }

    const refData = await refRes.json();
    const mainSha = refData.object.sha;

    // Create new branch ref
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
      return NextResponse.json(
        { error: "Failed to create branch", details: errBody },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Network error creating branch" },
      { status: 502 }
    );
  }

  // Create deployment record — session is now active
  const { data: deployment, error: insertError } = await supabase
    .from("deployments")
    .insert({
      chapter_id: chapterId,
      triggered_by: user.id,
      status: "queued",
      approval_status: "pending",
      commit_reference: branchName,
    })
    .select()
    .single();

  if (insertError || !deployment) {
    return NextResponse.json(
      { error: "Failed to create session record" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    deploymentId: deployment.id,
    branchName,
  });
}
