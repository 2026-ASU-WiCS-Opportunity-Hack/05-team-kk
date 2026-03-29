"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
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
import { Loader2, AlertTriangle } from "lucide-react";
import type { Tables } from "@repo/types";
import { useTranslations } from "next-intl";
import { invokeEdgeFunctionWithAuth } from "@/lib/edge-functions";

type Chapter = Tables<"chapters">;

export function ChapterEditForm({ chapter }: { chapter: Chapter }) {
  const router = useRouter();
  const t = useTranslations("ui.chapterForm");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  async function handleRetryProvision() {
    setProvisioning(true);
    const supabase = createClient();

    try {
      const { error } = await invokeEdgeFunctionWithAuth(
        supabase,
        "provision-chapter",
        { chapter_id: chapter.id }
      );
      if (error) {
        toast.error(error.message ?? t("errors.provisioningFailed"));
      } else {
        toast.success(t("messages.provisionSuccess"));
        router.refresh();
      }
    } catch {
      toast.error(t("errors.networkProvisioning"));
    }
    setProvisioning(false);
  }

  const [name, setName] = useState(chapter.name);
  const [status, setStatus] = useState(chapter.status);
  const [defaultLanguage, setDefaultLanguage] = useState(chapter.default_language);
  const [primaryColor, setPrimaryColor] = useState(chapter.brand_primary_color);
  const [secondaryColor, setSecondaryColor] = useState(chapter.brand_secondary_color);
  const [accentColor, setAccentColor] = useState(chapter.brand_accent_color);
  const [font, setFont] = useState(chapter.brand_font);
  const [contactEmail, setContactEmail] = useState(chapter.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(chapter.contact_phone ?? "");
  const [contactAddress, setContactAddress] = useState(chapter.contact_address ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("chapters")
      .update({
        name,
        status,
        default_language: defaultLanguage,
        brand_primary_color: primaryColor,
        brand_secondary_color: secondaryColor,
        brand_accent_color: accentColor,
        brand_font: font,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        contact_address: contactAddress || null,
      })
      .eq("id", chapter.id);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(t("messages.chapterUpdated"));
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("sections.basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("fields.chapterName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t("fields.slug")}</Label>
            <Input value={chapter.slug} disabled />
            <p className="text-xs text-muted-foreground">
              {chapter.subdomain}.wial.ashwanthbk.com
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">{t("fields.status")}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="suspended">{t("status.suspended")}</SelectItem>
                <SelectItem value="archived">{t("status.archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">{t("fields.defaultLanguage")}</Label>
            <Input
              id="language"
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
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
              <Label>{t("fields.primaryColor")}</Label>
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
              <Label>{t("fields.secondaryColor")}</Label>
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
              <Label>{t("fields.accentColor")}</Label>
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
            <Label>{t("fields.font")}</Label>
            <Input
              value={font}
              onChange={(e) => setFont(e.target.value)}
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
            <Label>{t("fields.contactEmail")}</Label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("fields.contactPhone")}</Label>
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("fields.contactAddress")}</Label>
            <Input
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {!chapter.cloudflare_project_name && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {t("warnings.provisionTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("warnings.provisionDescription")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleRetryProvision}
              disabled={provisioning}
            >
              {provisioning && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("actions.provisionSite")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tc("saveChanges")}
        </Button>
      </div>
    </form>
  );
}
