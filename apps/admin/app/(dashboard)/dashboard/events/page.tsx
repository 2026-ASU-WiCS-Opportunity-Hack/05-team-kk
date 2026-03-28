import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { EventsClient } from "./events-client";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const { chapter: chapterId } = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const isAdmin = isSuperAdmin(user.roles);

  if (!chapterId && !isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Select a chapter to manage events.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("*, chapters(name)")
    .order("start_date", { ascending: false });

  if (chapterId) {
    query = query.eq("chapter_id", chapterId);
  }

  const { data: events } = await query;

  const canManage =
    isAdmin ||
    user.roles.some(
      (r) => r.chapter_id === chapterId && r.role === "chapter_lead"
    );

  return (
    <EventsClient
      events={events ?? []}
      chapterId={chapterId ?? null}
      canManage={canManage}
      userId={user.id}
      isGlobalView={isAdmin && !chapterId}
    />
  );
}
