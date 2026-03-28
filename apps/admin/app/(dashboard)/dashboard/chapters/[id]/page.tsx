import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ChapterEditForm } from "./chapter-edit-form";

export default async function EditChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user || !isSuperAdmin(user.roles)) redirect("/dashboard");

  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", id)
    .single();

  if (!chapter) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Edit {chapter.name}
        </h1>
        <p className="text-muted-foreground">
          Update chapter settings, branding, and contact info.
        </p>
      </div>
      <ChapterEditForm chapter={chapter} />
    </div>
  );
}
