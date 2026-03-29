import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@repo/supabase/server";

export async function GET(req: NextRequest) {
  const chapterId = req.nextUrl.searchParams.get("chapterId");

  if (!chapterId) {
    return NextResponse.redirect(new URL("/dashboard/payments", req.url));
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabase = await createClient();

  // Fetch the chapter's stripe account ID
  const { data: chapter } = await supabase
    .from("chapters")
    .select("stripe_account_id")
    .eq("id", chapterId)
    .single();

  if (chapter?.stripe_account_id && stripeKey) {
    // Check account status via Stripe API
    const accountRes = await fetch(
      `https://api.stripe.com/v1/accounts/${chapter.stripe_account_id}`,
      {
        headers: { Authorization: `Bearer ${stripeKey}` },
      }
    );

    if (accountRes.ok) {
      const account = await accountRes.json();
      const onboardingComplete =
        account.charges_enabled === true && account.details_submitted === true;

      await supabase
        .from("chapters")
        .update({ stripe_onboarding_complete: onboardingComplete })
        .eq("id", chapterId);
    }
  }

  return NextResponse.redirect(
    new URL(`/dashboard/payments?connected=true&chapterId=${chapterId}`, req.url)
  );
}
