import { getAuthUser } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ContentEditor } from "./content-editor";

export default async function ContentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: block } = await supabase
    .from("content_blocks")
    .select("*")
    .eq("id", id)
    .single();

  if (!block) notFound();

  // Fetch chapter's active languages for the translate feature
  const { data: chapter } = await supabase
    .from("chapters")
    .select("active_languages")
    .eq("id", block.chapter_id)
    .single();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ContentEditor
        block={block}
        chapterId={block.chapter_id}
        activeLanguages={chapter?.active_languages ?? ["en"]}
      />
    </div>
  );
}
