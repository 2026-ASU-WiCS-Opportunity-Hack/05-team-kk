"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { useChapter } from "@/components/providers/chapter-provider";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NewContentBlockPage() {
  const router = useRouter();
  const { selectedChapterId } = useChapter();
  const tContent = useTranslations("content");
  const t = useTranslations("ui.contentNew");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);

  const [blockKey, setBlockKey] = useState("");
  const [contentType, setContentType] = useState("rich_text");
  const [locale, setLocale] = useState("en");
  const [content, setContent] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChapterId) {
      toast.error(t("errors.noChapterSelected"));
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("content_blocks")
      .insert({
        chapter_id: selectedChapterId,
        block_key: blockKey,
        content_type: contentType,
        locale,
        content: content || (contentType === "rich_text" ? "<p></p>" : ""),
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(t("messages.blockCreated"));
    router.push(`/dashboard/content/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {tContent("newBlock")}
        </h1>
        <p className="text-muted-foreground">
          {t("intro")}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("sections.blockSettings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("fields.blockKeyRequired")}</Label>
              <Input
                value={blockKey}
                onChange={(e) => setBlockKey(e.target.value)}
                placeholder={t("fields.blockKeyPlaceholder")}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("fields.blockKeyHint")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t("fields.contentType")}</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rich_text">{t("types.richText")}</SelectItem>
                  <SelectItem value="plain_text">{t("types.plainText")}</SelectItem>
                  <SelectItem value="image_url">{t("types.imageUrl")}</SelectItem>
                  <SelectItem value="json">{t("types.json")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("fields.locale")}</Label>
              <Input
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("fields.initialContent")}</Label>
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("fields.initialContentPlaceholder")}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {tc("cancel")}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("actions.createBlock")}
          </Button>
        </div>
      </form>
    </div>
  );
}
