import { getAuthUser, isSuperAdmin, getUserRoleForChapter } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const tui = await getTranslations("ui.pageState");
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const isAdmin = isSuperAdmin(user.roles);
  const cookieStore = await cookies();
  const selectedChapterCookie = cookieStore.get("selected-chapter")?.value;
  const resolvedChapterId = isAdmin
    ? selectedChapterCookie || undefined
    : user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined;

  if (!resolvedChapterId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {tui("selectChapterToManage", { subject: t("title").toLowerCase() })}
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", resolvedChapterId)
    .single();

  if (!chapter) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{tui("chapterNotFound")}</p>
      </div>
    );
  }

  const isLead = getUserRoleForChapter(user.roles, resolvedChapterId) === "chapter_lead";

  // Fetch AI coach matching setting
  const { data: aiMatchBlock } = await supabase
    .from("content_blocks")
    .select("content")
    .eq("chapter_id", resolvedChapterId)
    .eq("block_key", "ai_coach_matching_enabled")
    .eq("locale", chapter.default_language)
    .single();

  const aiCoachMatchingEnabled = aiMatchBlock?.content === "true";

  return (
    <SettingsClient
      chapter={chapter}
      canEditBranding={isAdmin || isLead}
      aiCoachMatchingEnabled={aiCoachMatchingEnabled}
    />
  );
}
