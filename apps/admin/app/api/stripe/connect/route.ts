import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, isSuperAdmin, getUserRoleForChapter } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const chapterId = body?.chapterId as string | undefined;

  if (!chapterId) {
    return NextResponse.json({ error: "chapterId is required" }, { status: 400 });
  }

  const role = isSuperAdmin(user.roles)
    ? "super_admin"
    : getUserRoleForChapter(user.roles, chapterId);

  if (!role || (role !== "super_admin" && role !== "chapter_lead")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, name, stripe_account_id")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  let stripeAccountId = chapter.stripe_account_id;

  // Create Express account if one doesn't exist yet
  if (!stripeAccountId) {
    const createRes = await fetch("https://api.stripe.com/v1/accounts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        type: "express",
        "metadata[chapter_id]": chapterId,
        "metadata[chapter_name]": chapter.name,
      }).toString(),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("Stripe create account error:", err);
      return NextResponse.json({ error: "Failed to create Stripe account" }, { status: 502 });
    }

    const account = await createRes.json();
    stripeAccountId = account.id;

    // Save the account ID
    const { error: updateError } = await supabase
      .from("chapters")
      .update({ stripe_account_id: stripeAccountId })
      .eq("id", chapterId);

    if (updateError) {
      console.error("Failed to save stripe_account_id:", updateError);
      return NextResponse.json({ error: "Failed to save Stripe account" }, { status: 500 });
    }
  }

  // Create Account Link for onboarding
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://wial-admin.vercel.app";
  const refreshUrl = `${adminUrl}/api/stripe/connect?chapterId=${chapterId}`;
  const returnUrl = `${adminUrl}/api/stripe/connect/callback?chapterId=${chapterId}`;

  const linkRes = await fetch("https://api.stripe.com/v1/account_links", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    }).toString(),
  });

  if (!linkRes.ok) {
    const err = await linkRes.text();
    console.error("Stripe account link error:", err);
    return NextResponse.json({ error: "Failed to create onboarding link" }, { status: 502 });
  }

  const link = await linkRes.json();
  return NextResponse.json({ url: link.url });
}
