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

type Chapter = Tables<"chapters">;

export function ChapterEditForm({ chapter }: { chapter: Chapter }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  async function handleRetryProvision() {
    setProvisioning(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/provision-chapter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ chapter_id: chapter.id }),
      });
      if (res.ok) {
        toast.success("Cloudflare project provisioned successfully.");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Provisioning failed");
      }
    } catch {
      toast.error("Network error during provisioning");
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

    toast.success("Chapter updated successfully.");
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Chapter Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={chapter.slug} disabled />
            <p className="text-xs text-muted-foreground">
              {chapter.subdomain}.wial.ashwanthbk.com
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Default Language</Label>
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
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
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
              <Label>Secondary Color</Label>
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
              <Label>Accent Color</Label>
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
            <Label>Font</Label>
            <Input
              value={font}
              onChange={(e) => setFont(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

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
        </CardContent>
      </Card>

      {!chapter.cloudflare_project_name && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                Cloudflare project not provisioned
              </p>
              <p className="text-xs text-muted-foreground">
                This chapter does not have a live website yet. Provision a
                Cloudflare Pages project to deploy the site.
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
              Provision Site
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
