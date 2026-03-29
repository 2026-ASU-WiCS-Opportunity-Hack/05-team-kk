import { getAuthUser } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CoachEditForm } from "../coaches/[id]/coach-edit-form";
import { CoachPaymentCard } from "./coach-payment-card";

export default async function ProfilePage() {
  const tProfile = await getTranslations("profile");
  const tNav = await getTranslations("nav");
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: coach } = await supabase
    .from("coaches")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!coach) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">{tNav("myProfile")}</h1>
        <p className="text-muted-foreground">
          {tProfile("noProfileLinked")}
        </p>
      </div>
    );
  }

  // Fetch chapter Stripe status for self-service payment
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, stripe_account_id, stripe_onboarding_complete")
    .eq("id", coach.chapter_id)
    .single();

  const stripeReady = !!(chapter?.stripe_account_id && chapter?.stripe_onboarding_complete);

  // Fetch recent payments for this coach
  const { data: recentPayments } = await supabase
    .from("payments")
    .select("id, payment_type, amount, currency, status, created_at")
    .eq("chapter_id", coach.chapter_id)
    .eq("payer_email", user.email ?? "")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{tNav("myProfile")}</h1>
        <p className="text-muted-foreground">
          {tProfile("editProfileInfo")}
        </p>
      </div>
      <CoachEditForm coach={coach} canEdit={true} isRestricted={true} />
      <CoachPaymentCard
        chapterId={coach.chapter_id}
        userEmail={user.email ?? ""}
        stripeReady={stripeReady}
        recentPayments={recentPayments ?? []}
      />
    </div>
  );
}
