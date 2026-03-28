import { getAuthUser } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { CoachEditForm } from "../coaches/[id]/coach-edit-form";

export default async function ProfilePage() {
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
        <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          No coach profile is linked to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          Edit your coach profile information.
        </p>
      </div>
      <CoachEditForm coach={coach} canEdit={true} isRestricted={true} />
    </div>
  );
}
