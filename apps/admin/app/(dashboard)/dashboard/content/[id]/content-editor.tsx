"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Textarea } from "@repo/ui/textarea";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Badge } from "@repo/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, Languages, ChevronRight, CheckCircle2, Replace, Trash2 } from "lucide-react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { ResourcesEditor } from "@/components/resources-editor";
import type { Tables } from "@repo/types";
import { useTranslations } from "next-intl";

type ContentBlock = Tables<"content_blocks">;

function humanizeKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

const pageGroups: Record<string, string> = {
  hero: "landingPage",
  about: "aboutPage",
  al: "actionLearningPage",
  cert: "certification",
  coaches: "coachDirectory",
  testimonials: "testimonialsPage",
  events: "eventsPage",
  resources: "resourcesPage",
  contact: "contactPage",
  join: "membershipPage",
  nav: "headerNavigation",
  footer: "footer",
};

function getPageGroup(blockKey: string): string {
  const prefix = blockKey.split("_")[0]!;
  return pageGroups[prefix] ?? "other";
}

const contentTypeOptions = [
  "welcome",
  "about",
  "coach_program",
  "mission",
  "join",
  "custom",
];

async function getFreshAccessToken(supabase: ReturnType<typeof createClient>) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isSessionValid =
    !!session?.access_token &&
    (!session.expires_at || session.expires_at * 1000 > Date.now() + 60_000);

  if (isSessionValid) {
    return session!.access_token;
  }

  const { data, error } = await supabase.auth.refreshSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

export function ContentEditor({
  block,
  chapterId,
  activeLanguages,
}: {
  block: ContentBlock;
  chapterId: string;
  activeLanguages: string[];
}) {
  const router = useRouter();
  const tContent = useTranslations("content");
  const tc = useTranslations("common");
  const t = useTranslations("ui.contentEditor");
  const [content, setContent] = useState(block.content);
  const [loading, setLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonValid, setJsonValid] = useState(false);

  // Track unsaved changes
  const hasChanges = content !== block.content;

  // Warn on navigate away with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  // AI Generate state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateType, setGenerateType] = useState("welcome");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");

  // Translate state
  const [translateOpen, setTranslateOpen] = useState(false);
  const [targetLocale, setTargetLocale] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState("");

  const handleValidateJson = useCallback(() => {
    try {
      JSON.parse(content);
      setJsonError(null);
      setJsonValid(true);
      setTimeout(() => setJsonValid(false), 2000);
    } catch (err) {
      setJsonError((err as Error).message);
      setJsonValid(false);
    }
  }, [content]);

  async function handleSave() {
    if (block.content_type === "json") {
      try {
        JSON.parse(content);
        setJsonError(null);
      } catch (err) {
        setJsonError((err as Error).message);
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("content_blocks")
      .update({ content })
      .eq("id", block.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("messages.contentSaved"));
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGeneratedContent("");

    const supabase = createClient();
    const accessToken = await getFreshAccessToken(supabase);
    if (!accessToken) {
      toast.error("Session expired. Please sign in again.");
      setGenerating(false);
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/generate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
          },
          body: JSON.stringify({
            chapter_id: chapterId,
            content_type: generateType,
            custom_prompt: generateType === "custom" ? customPrompt : undefined,
            block_key: block.block_key,
            output_format: block.content_type,
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.content) {
        setGeneratedContent(data.content);
      } else {
        toast.error(data.error ?? t("errors.generationFailed"));
      }
    } catch {
      toast.error(t("errors.networkGeneration"));
    }

    setGenerating(false);
  }

  function useGeneratedContent() {
    setContent(generatedContent);
    setGenerateOpen(false);
    setGeneratedContent("");
    toast.success(t("messages.generatedApplied"));
  }

  async function handleTranslate() {
    setTranslating(true);
    setTranslatedContent("");

    const supabase = createClient();
    const accessToken = await getFreshAccessToken(supabase);
    if (!accessToken) {
      toast.error("Session expired. Please sign in again.");
      setTranslating(false);
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/translate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
          },
          body: JSON.stringify({
            chapter_id: chapterId,
            source_content: content,
            source_locale: block.locale,
            target_locale: targetLocale,
            content_type: block.content_type,
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.content) {
        setTranslatedContent(data.content);
      } else {
        toast.error(data.error ?? t("errors.translationFailed"));
      }
    } catch {
      toast.error(t("errors.networkTranslation"));
    }

    setTranslating(false);
  }

  async function saveTranslation() {
    const supabase = createClient();
    const { error } = await supabase.from("content_blocks").upsert(
      {
        chapter_id: chapterId,
        block_key: block.block_key,
        locale: targetLocale,
        content_type: block.content_type,
        content: translatedContent,
      },
      { onConflict: "chapter_id,block_key,locale" }
    );

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        t("messages.translationSaved", { locale: targetLocale.toUpperCase() })
      );
      setTranslateOpen(false);
      setTranslatedContent("");
      router.refresh();
    }
  }

  const otherLocales = activeLanguages.filter((l) => l !== block.locale);
  const pageGroup = getPageGroup(block.block_key);
  const pageGroupLabel = t.has(`groups.${pageGroup}`)
    ? t(`groups.${pageGroup}`)
    : pageGroup;

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
        <Link href="/dashboard/content" className="text-primary hover:underline">
          {tContent("title")}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{pageGroupLabel}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{humanizeKey(block.block_key)}</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {humanizeKey(block.block_key)}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline">
              {block.content_type.replace("_", " ")}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {block.locale.toUpperCase()}
            </span>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">{t("labels.unsavedChanges")}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setGenerateOpen(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {tContent("aiGenerate")}
          </Button>
          {otherLocales.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setTargetLocale(otherLocales[0]!);
                setTranslateOpen(true);
              }}
              className="gap-2"
            >
              <Languages className="h-4 w-4" />
              {tContent("translate")}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tContent("editor")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {block.content_type === "rich_text" && (
            <TiptapEditor content={content} onChange={setContent} />
          )}

          {block.content_type === "plain_text" && (
            <div className="space-y-2">
              <Label>{t("labels.plainText")}</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length} characters
              </p>
            </div>
          )}

          {block.content_type === "image_url" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("labels.imageUrl")}</Label>
                <Input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("labels.urlPlaceholder")}
                />
              </div>
              {content && (
                <div className="relative rounded-md border p-4">
                  <img
                    src={content}
                    alt={t("labels.imagePreview")}
                    className="max-h-[400px] max-w-full rounded object-contain"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        const url = prompt(t("labels.enterNewImageUrl"));
                        if (url) setContent(url);
                      }}
                    >
                      <Replace className="h-3 w-3" />
                      {t("actions.replace")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => setContent("")}
                    >
                      <Trash2 className="h-3 w-3" />
                      {tc("remove")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {block.content_type === "json" && block.block_key === "resources_items" && (
            <ResourcesEditor value={content} onChange={setContent} />
          )}

          {block.content_type === "json" && block.block_key !== "resources_items" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("labels.json")}</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidateJson}
                  className="gap-1"
                >
                  {jsonValid ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : null}
                  {t("actions.validateJson")}
                </Button>
              </div>
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setJsonError(null);
                  setJsonValid(false);
                }}
                className="min-h-[300px] font-mono text-sm"
              />
              {jsonError && (
                <p className="text-sm text-destructive">{jsonError}</p>
              )}
              {jsonValid && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t("labels.validJson")}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky save footer */}
      <div className="sticky bottom-0 z-10 -mx-6 border-t bg-background/95 backdrop-blur-sm px-6 py-3 flex items-center justify-end gap-3">
        <Button
          variant="ghost"
          onClick={() => {
            if (hasChanges) {
              if (confirm(t("labels.confirmDiscard"))) {
                router.back();
              }
            } else {
              router.back();
            }
          }}
        >
          {tContent("discardChanges")}
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tc("save")}
        </Button>
      </div>

      {/* AI Generate Dialog — side-by-side comparison */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {t("dialogs.aiTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("dialogs.contentType")}</Label>
              <Select value={generateType} onValueChange={setGenerateType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {t(`contentTypes.${opt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {generateType === "custom" && (
              <div className="space-y-2">
                <Label>{t("dialogs.describeNeed")}</Label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={t("dialogs.customPromptPlaceholder")}
                  className="min-h-[80px]"
                />
              </div>
            )}
            {generatedContent && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("dialogs.currentContent")}</Label>
                  <div
                    className="prose prose-sm dark:prose-invert max-h-[300px] overflow-auto rounded-md border bg-muted/30 p-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">{t("dialogs.aiGenerated")}</Label>
                  <div
                    className="prose prose-sm dark:prose-invert max-h-[300px] overflow-auto rounded-md border border-primary/30 bg-primary/5 p-4"
                    dangerouslySetInnerHTML={{ __html: generatedContent }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {generatedContent ? (
              <>
                <Button variant="ghost" onClick={handleGenerate}>
                  {generating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("actions.regenerate")}
                </Button>
                <Button onClick={useGeneratedContent}>{t("actions.useThis")}</Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setGenerateOpen(false)}
                >
                  {tc("cancel")}
                </Button>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("actions.generate")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Translate Dialog */}
      <Dialog open={translateOpen} onOpenChange={setTranslateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              {t("dialogs.translateTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("dialogs.sourceLanguage")}</Label>
                <Input
                  value={block.locale.toUpperCase()}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dialogs.targetLanguage")}</Label>
                <Select value={targetLocale} onValueChange={setTargetLocale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {otherLocales.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {translatedContent && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">{t("dialogs.original", { locale: block.locale.toUpperCase() })}</Label>
                  <div
                    className="prose prose-sm dark:prose-invert max-h-[300px] overflow-auto rounded-md border bg-muted/30 p-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-primary">{t("dialogs.translation", { locale: targetLocale.toUpperCase() })}</Label>
                  <div
                    className="prose prose-sm dark:prose-invert max-h-[300px] overflow-auto rounded-md border border-primary/30 bg-primary/5 p-4"
                    dangerouslySetInnerHTML={{ __html: translatedContent }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {translatedContent ? (
              <>
                <Button variant="ghost" onClick={handleTranslate}>
                  {translating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("actions.retranslate")}
                </Button>
                <Button onClick={saveTranslation}>
                  {t("actions.saveAs", { locale: targetLocale.toUpperCase() })}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setTranslateOpen(false)}
                >
                  {tc("cancel")}
                </Button>
                <Button
                  onClick={handleTranslate}
                  disabled={translating || !targetLocale}
                >
                  {translating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {tContent("translate")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
