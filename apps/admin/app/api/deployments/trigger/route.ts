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
    return NextResponse.json({ error: "chapterId is required" }, { status: 400 });
  }

  // Authorization
  const role = isSuperAdmin(user.roles)
    ? "super_admin"
    : getUserRoleForChapter(user.roles, chapterId);
  if (!role || (role !== "super_admin" && role !== "chapter_lead")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, name, cloudflare_deploy_hook_url")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  if (!chapter.cloudflare_deploy_hook_url) {
    return NextResponse.json(
      { error: "Chapter has no deploy hook. Provision the chapter first." },
      { status: 422 }
    );
  }

  // Check no build is already in progress
  const { data: existing } = await supabase
    .from("deployments")
    .select("id")
    .eq("chapter_id", chapterId)
    .in("status", ["queued", "building", "deploying"])
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "A deployment is already in progress. Wait for it to finish." },
      { status: 409 }
    );
  }

  // Create deployment record
  const { data: deployment, error: insertError } = await supabase
    .from("deployments")
    .insert({
      chapter_id: chapterId,
      triggered_by: user.id,
      status: "queued",
    })
    .select()
    .single();

  if (insertError || !deployment) {
    return NextResponse.json({ error: "Failed to create deployment record" }, { status: 500 });
  }

  // Fire the Cloudflare deploy hook
  try {
    const hookRes = await fetch(chapter.cloudflare_deploy_hook_url, { method: "POST" });
    if (!hookRes.ok) {
      await supabase
        .from("deployments")
        .update({ status: "failed", error_message: `Deploy hook returned ${hookRes.status}`, completed_at: new Date().toISOString() })
        .eq("id", deployment.id);
      return NextResponse.json({ error: "Deploy hook failed" }, { status: 502 });
    }

    // Move to building
    await supabase
      .from("deployments")
      .update({ status: "building" })
      .eq("id", deployment.id);
  } catch (err) {
    await supabase
      .from("deployments")
      .update({ status: "failed", error_message: "Network error calling deploy hook", completed_at: new Date().toISOString() })
      .eq("id", deployment.id);
    return NextResponse.json({ error: "Failed to call deploy hook" }, { status: 502 });
  }

  return NextResponse.json({ deploymentId: deployment.id });
}
