import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { ClientOrgsClient } from "./clients-client";

export default async function ClientOrgsPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const { chapter: chapterId } = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  if (!chapterId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Client Organizations
        </h1>
        <p className="text-muted-foreground">
          Select a chapter to manage client organizations.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("client_organizations")
    .select("*")
    .eq("chapter_id", chapterId)
    .order("sort_order");

  const canManage =
    isSuperAdmin(user.roles) ||
    user.roles.some(
      (r) => r.chapter_id === chapterId && r.role === "chapter_lead"
    );

  return (
    <ClientOrgsClient
      clients={clients ?? []}
      chapterId={chapterId}
      canManage={canManage}
    />
  );
}
