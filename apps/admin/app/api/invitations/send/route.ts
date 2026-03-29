import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";
import { getAuthUser, getUserRoleForChapter, isSuperAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const invitationId = body?.invitation_id as string | undefined;
  if (!invitationId) {
    return NextResponse.json(
      { error: "invitation_id is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .select("id, chapter_id")
    .eq("id", invitationId)
    .single();

  if (invitationError || !invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const role = isSuperAdmin(user.roles)
    ? "super_admin"
    : getUserRoleForChapter(user.roles, invitation.chapter_id);

  if (!role || (role !== "super_admin" && role !== "chapter_lead")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase environment is not configured" },
      { status: 500 }
    );
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ invitation_id: invitationId }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage =
      payload?.error ??
      payload?.errors?.[0]?.message ??
      `Send invitation failed with status ${response.status}`;
    return NextResponse.json(
      { error: errorMessage, details: payload },
      { status: response.status }
    );
  }

  return NextResponse.json(payload ?? { success: true });
}
