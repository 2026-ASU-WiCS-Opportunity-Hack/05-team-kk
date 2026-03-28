"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { Badge } from "@repo/ui/badge";
import { toast } from "sonner";
import { Switch } from "@repo/ui/switch";
import { Loader2, Plus, X } from "lucide-react";
import type { Tables } from "@repo/types";

type Chapter = Tables<"chapters">;

const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Espa\u00f1ol" },
  { code: "fr", name: "Fran\u00e7ais" },
  { code: "pt", name: "Portugu\u00eas" },
  { code: "de", name: "Deutsch" },
  { code: "yo", name: "Yor\u00f9b\u00e1" },
  { code: "vi", name: "Ti\u1ebfng Vi\u1ec7t" },
  { code: "ko", name: "\ud55c\uad6d\uc5b4" },
  { code: "ja", name: "\u65e5\u672c\u8a9e" },
  { code: "zh", name: "\u4e2d\u6587" },
  { code: "ar", name: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  { code: "hi", name: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { code: "sw", name: "Kiswahili" },
  { code: "tl", name: "Filipino" },
];

export function SettingsClient({
  chapter,
  canEditBranding,
  aiCoachMatchingEnabled = false,
}: {
  chapter: Chapter;
  canEditBranding: boolean;
  aiCoachMatchingEnabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Branding state
  const [primaryColor, setPrimaryColor] = useState(chapter.brand_primary_color);
  const [secondaryColor, setSecondaryColor] = useState(chapter.brand_secondary_color);
  const [accentColor, setAccentColor] = useState(chapter.brand_accent_color);
  const [font, setFont] = useState(chapter.brand_font);

  // Contact state
  const [contactEmail, setContactEmail] = useState(chapter.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(chapter.contact_phone ?? "");
  const [contactAddress, setContactAddress] = useState(chapter.contact_address ?? "");

  // Languages state
  const [activeLanguages, setActiveLanguages] = useState<string[]>(
    chapter.active_languages
  );

  // AI Coach Matching state
  const [aiMatching, setAiMatching] = useState(aiCoachMatchingEnabled);

  async function handleSaveBranding() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("chapters")
      .update({
        brand_primary_color: primaryColor,
        brand_secondary_color: secondaryColor,
        brand_accent_color: accentColor,
        brand_font: font,
      })
      .eq("id", chapter.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Branding saved.");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSaveContact() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("chapters")
      .update({
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        contact_address: contactAddress || null,
      })
      .eq("id", chapter.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Contact information saved.");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSaveLanguages() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("chapters")
      .update({ active_languages: activeLanguages })
      .eq("id", chapter.id);

    if (error) toast.error(error.message);
    else {
      toast.success("Languages updated.");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSaveAiMatching(enabled: boolean) {
    setLoading(true);
    setAiMatching(enabled);
    const supabase = createClient();

    // Upsert the content block for ai_coach_matching_enabled
    const { error } = await supabase
      .from("content_blocks")
      .upsert(
        {
          chapter_id: chapter.id,
          block_key: "ai_coach_matching_enabled",
          locale: chapter.default_language,
          content_type: "plain_text",
          content: enabled ? "true" : "false",
        },
        { onConflict: "chapter_id,block_key,locale" }
      );

    if (error) {
      toast.error(error.message);
      setAiMatching(!enabled); // revert
    } else {
      toast.success(
        enabled
          ? "AI Coach Matching enabled."
          : "AI Coach Matching disabled."
      );
      router.refresh();
    }
    setLoading(false);
  }

  function addLanguage(code: string) {
    if (!activeLanguages.includes(code)) {
      setActiveLanguages([...activeLanguages, code]);
    }
  }

  function removeLanguage(code: string) {
    if (code === chapter.default_language) {
      toast.error("Cannot remove the default language.");
      return;
    }
    setActiveLanguages(activeLanguages.filter((l) => l !== code));
  }

  const availableToAdd = AVAILABLE_LANGUAGES.filter(
    (l) => !activeLanguages.includes(l.code)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Chapter Settings
        </h1>
        <p className="text-muted-foreground">
          Configure {chapter.name}'s branding, contact info, and languages.
        </p>
      </div>

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI Features</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Primary", value: primaryColor, set: setPrimaryColor },
                  { label: "Secondary", value: secondaryColor, set: setSecondaryColor },
                  { label: "Accent", value: accentColor, set: setAccentColor },
                ].map((c) => (
                  <div key={c.label} className="space-y-2">
                    <Label>{c.label}</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={c.value}
                        onChange={(e) => c.set(e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded border"
                        disabled={!canEditBranding}
                      />
                      <Input
                        value={c.value}
                        onChange={(e) => c.set(e.target.value)}
                        disabled={!canEditBranding}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Input
                  value={font}
                  onChange={(e) => setFont(e.target.value)}
                  disabled={!canEditBranding}
                />
              </div>
              {canEditBranding && (
                <div className="flex justify-end">
                  <Button onClick={handleSaveBranding} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Branding
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveContact} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Contact Info
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Languages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage the languages your chapter publishes content in.
                Translated content can be created using AI translation or
                written manually.
              </p>
              <div className="flex flex-wrap gap-2">
                {activeLanguages.map((code) => {
                  const lang = AVAILABLE_LANGUAGES.find((l) => l.code === code);
                  const isDefault = code === chapter.default_language;
                  return (
                    <Badge
                      key={code}
                      variant="secondary"
                      className="gap-1 py-1.5 pl-3 pr-1.5 text-sm"
                    >
                      {lang?.name ?? code.toUpperCase()}
                      {isDefault && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (default)
                        </span>
                      )}
                      {!isDefault && (
                        <button
                          onClick={() => removeLanguage(code)}
                          className="ml-1 rounded p-0.5 hover:bg-destructive/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  );
                })}
              </div>
              {availableToAdd.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    id="add-language"
                    className="rounded-md border bg-transparent px-3 py-2 text-sm"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addLanguage(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>
                      Add a language...
                    </option>
                    {availableToAdd.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSaveLanguages} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Languages
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Chapter Name</Label>
                <Input value={chapter.name} disabled />
                <p className="text-xs text-muted-foreground">
                  Contact a Super Admin to change the chapter name.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={chapter.slug} disabled />
              </div>
              <div className="space-y-2">
                <Label>Subdomain</Label>
                <Input
                  value={`${chapter.subdomain}.wial.ashwanthbk.com`}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Badge
                  variant={
                    chapter.status === "active"
                      ? "default"
                      : chapter.status === "suspended"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {chapter.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Coach Matching</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                When enabled, your chapter's coach directory page shows a "Find
                Your Coach" widget that uses AI to match visitors with the right
                coach based on their needs.
              </p>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Enable AI Coach Matching widget</Label>
                  <p className="text-xs text-muted-foreground">
                    Visitors can describe what they need and get personalized
                    coach recommendations.
                  </p>
                </div>
                <Switch
                  checked={aiMatching}
                  onCheckedChange={(checked) => handleSaveAiMatching(checked)}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
