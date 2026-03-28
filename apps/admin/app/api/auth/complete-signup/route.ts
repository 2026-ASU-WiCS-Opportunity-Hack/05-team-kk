import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/auth/complete-signup
 * Uses the service-role key to:
 *  1. Validate the invitation token
 *  2. Create the auth user
 *  3. Create the user_roles entry
 *  4. Create a coaches entry if role is "coach"
 *  5. Mark the invitation as accepted
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.token || !body?.fullName || !body?.password) {
    return NextResponse.json(
      { error: "token, fullName, and password are required" },
      { status: 400 }
    );
  }

  const { token, fullName, password } = body;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing service role key" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Validate invitation
  const { data: invitation, error: invError } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (invError || !invitation) {
    return NextResponse.json(
      { error: "Invalid invitation token" },
      { status: 400 }
    );
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from("invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);
    return NextResponse.json(
      { error: "This invitation has expired" },
      { status: 400 }
    );
  }

  // 2. Create the auth user (triggers profile creation via DB trigger)
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Failed to create user" },
      { status: 400 }
    );
  }

  const userId = authData.user.id;

  // 3. Create user_roles entry
  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: userId,
    chapter_id: invitation.chapter_id,
    role: invitation.role,
  });

  if (roleError) {
    return NextResponse.json(
      { error: "Failed to assign role: " + roleError.message },
      { status: 500 }
    );
  }

  // 4. If role is coach, create a coaches entry linked to the new user
  if (invitation.role === "coach") {
    // Check if there's already an unlinked coach entry for this email
    const { data: existingCoach } = await supabase
      .from("coaches")
      .select("id")
      .eq("chapter_id", invitation.chapter_id)
      .eq("contact_email", invitation.email)
      .is("user_id", null)
      .maybeSingle();

    if (existingCoach) {
      // Link existing coach entry to the new user
      await supabase
        .from("coaches")
        .update({ user_id: userId })
        .eq("id", existingCoach.id);
    } else {
      // Create a new coach entry
      await supabase.from("coaches").insert({
        chapter_id: invitation.chapter_id,
        user_id: userId,
        full_name: fullName,
        contact_email: invitation.email,
        certification_level: "CALC",
      });
    }
  }

  // 5. Mark invitation as accepted
  await supabase
    .from("invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);

  return NextResponse.json({ success: true });
}
