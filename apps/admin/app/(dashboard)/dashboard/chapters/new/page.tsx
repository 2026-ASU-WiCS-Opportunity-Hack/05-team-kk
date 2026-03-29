"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CreateChapterPage() {
  const router = useRouter();
  const t = useTranslations("ui.chapterForm");
  const tc = useTranslations("common");
  const tChapters = useTranslations("chapters");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [primaryColor, setPrimaryColor] = useState("#1a365d");
  const [secondaryColor, setSecondaryColor] = useState("#2b6cb0");
  const [accentColor, setAccentColor] = useState("#ed8936");
  const [font, setFont] = useState("Lexend");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [leadEmail, setLeadEmail] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Create chapter record
    const { data: chapter, error } = await supabase
      .from("chapters")
      .insert({
        name,
        slug,
        subdomain: slug,
        default_language: defaultLanguage,
        brand_primary_color: primaryColor,
        brand_secondary_color: secondaryColor,
        brand_accent_color: accentColor,
        brand_font: font,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        contact_address: contactAddress || null,
      })
      .select()
      .single();

    if (error || !chapter) {
      toast.error(error?.message ?? t("errors.createChapterFailed"));
      setLoading(false);
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const accessToken = session?.access_token ?? "";

    // 2. Call provision-chapter Edge Function (best-effort)
    try {
      const provRes = await fetch(
        `${supabaseUrl}/functions/v1/provision-chapter`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ chapter_id: chapter.id }),
        }
      );
      if (!provRes.ok) {
        const data = await provRes.json().catch(() => ({}));
        console.warn("Provisioning warning:", data);
        toast.warning(
          t("warnings.provisioningFailed")
        );
      }
    } catch {
      toast.warning(
        t("warnings.provisioningFailed")
      );
    }

    // 3. Create invitation for Chapter Lead if email provided
    if (leadEmail) {
      const { data: invitation } = await supabase
        .from("invitations")
        .insert({
          chapter_id: chapter.id,
          email: leadEmail,
          role: "chapter_lead",
          invited_by: user!.id,
          token: crypto.randomUUID(),
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .select()
        .single();

      if (invitation) {
        // Send invitation email (best-effort)
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-invitation`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ invitation_id: invitation.id }),
          });
        } catch {
          console.warn("Failed to send lead invitation email");
        }
      }
    }

    toast.success(t("messages.chapterCreated", { name }));
    router.push("/dashboard/chapters");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("titles.createChapter")}
        </h1>
        <p className="text-muted-foreground">
          {t("intro")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("sections.basicInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("fields.chapterNameRequired")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t("fields.chapterNamePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">{t("fields.slug")}</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {slug}.wial.ashwanthbk.com
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t("fields.defaultLanguage")}</Label>
              <Input
                id="language"
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                placeholder="en"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sections.branding")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">{t("fields.primaryColor")}</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">{t("fields.secondaryColor")}</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">{t("fields.accentColor")}</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="font">{t("fields.font")}</Label>
              <Input
                id="font"
                value={font}
                onChange={(e) => setFont(e.target.value)}
                placeholder="Lexend"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sections.contactInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">{t("fields.contactEmail")}</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">{t("fields.contactPhone")}</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactAddress">{t("fields.contactAddress")}</Label>
              <Input
                id="contactAddress"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sections.chapterLead")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leadEmail">{t("fields.chapterLeadEmail")}</Label>
              <Input
                id="leadEmail"
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder={t("fields.chapterLeadEmailPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {t("fields.chapterLeadHint")}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            {tc("cancel")}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {tChapters("createNew")}
          </Button>
        </div>
      </form>
    </div>
  );
}
