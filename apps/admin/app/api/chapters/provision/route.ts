import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isSuperAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSuperAdmin(user.roles)) {
    return NextResponse.json(
      { error: "Forbidden: only super admins can provision chapters" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const chapterId = body?.chapter_id as string | undefined;
  if (!chapterId) {
    return NextResponse.json(
      { error: "chapter_id is required" },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase environment is not configured" },
      { status: 500 }
    );
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/provision-chapter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ chapter_id: chapterId }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage =
      payload?.error ??
      payload?.errors?.[0]?.message ??
      `Provisioning failed with status ${response.status}`;
    return NextResponse.json(
      { error: errorMessage, details: payload },
      { status: response.status }
    );
  }

  return NextResponse.json(payload ?? { success: true });
}
