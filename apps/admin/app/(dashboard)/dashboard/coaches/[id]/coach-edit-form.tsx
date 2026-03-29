"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { Switch } from "@repo/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui/select";
import { Badge } from "@repo/ui/badge";
import { toast } from "sonner";
import { Loader2, X, Clock, Award, AlertTriangle } from "lucide-react";
import type { Tables } from "@repo/types";
import { useTranslations } from "next-intl";

type Coach = Tables<"coaches">;

function certLevelColor(level: string): string {
  switch (level) {
    case "CALC": return "#3b82f6";
    case "SALC": return "#16a34a";
    case "MALC": return "#d97706";
    case "PALC": return "#7c3aed";
    default: return "#6b7280";
  }
}

export function CoachEditForm({
  coach,
  canEdit,
  isRestricted,
}: {
  coach: Coach;
  canEdit: boolean;
  isRestricted: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("ui.coachForm");
  const tc = useTranslations("common");
  const tCoaches = useTranslations("coaches");
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState(coach.full_name);
  const [bio, setBio] = useState(coach.bio ?? "");
  const [certLevel, setCertLevel] = useState(coach.certification_level);
  const [hoursLogged, setHoursLogged] = useState(coach.hours_logged);
  const [isActive, setIsActive] = useState(coach.is_active);
  const [city, setCity] = useState(coach.city ?? "");
  const [country, setCountry] = useState(coach.country ?? "");
  const [contactEmail, setContactEmail] = useState(coach.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(coach.contact_phone ?? "");
  const [website, setWebsite] = useState(coach.website ?? "");
  const [specializations, setSpecializations] = useState<string[]>(coach.specializations);
  const [specInput, setSpecInput] = useState("");
  const [languages, setLanguages] = useState<string[]>(coach.languages);
  const [langInput, setLangInput] = useState("");
  const [recertDate, setRecertDate] = useState(coach.recertification_due_date?.slice(0, 10) ?? "");
  const [ceCredits, setCeCredits] = useState(coach.ce_credits_earned);
  const [certApproved, setCertApproved] = useState(coach.certification_approved);

  function addTag(
    value: string,
    list: string[],
    setter: (v: string[]) => void,
    inputSetter: (v: string) => void
  ) {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
    inputSetter("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const updateData: Record<string, unknown> = {
      full_name: fullName,
      bio: bio || null,
      specializations,
      languages,
      city: city || null,
      country: country || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      website: website || null,
    };

    if (!isRestricted) {
      updateData.certification_level = certLevel;
      updateData.hours_logged = hoursLogged;
      updateData.is_active = isActive;
      updateData.recertification_due_date = recertDate ? new Date(recertDate).toISOString() : null;
      updateData.ce_credits_earned = ceCredits;
      updateData.certification_approved = certApproved;
    }

    const { error } = await supabase
      .from("coaches")
      .update(updateData)
      .eq("id", coach.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("messages.coachUpdated"));
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>{t("sections.personalInfo")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("fields.fullName")}</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!canEdit} required />
          </div>
          <div className="space-y-2">
            <Label>{t("fields.bio")}</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} disabled={!canEdit} className="min-h-[120px]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t("sections.professionalDetails")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("fields.certificationLevel")}</Label>
              <Select value={certLevel} onValueChange={setCertLevel} disabled={isRestricted || !canEdit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALC">CALC</SelectItem>
                  <SelectItem value="SALC">SALC</SelectItem>
                  <SelectItem value="MALC">MALC</SelectItem>
                  <SelectItem value="PALC">PALC</SelectItem>
                </SelectContent>
              </Select>
              {isRestricted && <p className="text-xs text-muted-foreground">{t("warnings.chapterLeadOnly")}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("fields.hoursLogged")}</Label>
              <Input type="number" value={hoursLogged} onChange={(e) => setHoursLogged(Number(e.target.value))} disabled={isRestricted || !canEdit} />
              {isRestricted && <p className="text-xs text-muted-foreground">{t("warnings.chapterLeadOnly")}</p>}
            </div>
          </div>
          {!isRestricted && canEdit && (
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>{t("fields.activeInDirectory")}</Label>
            </div>
          )}
          <div className="space-y-2">
            <Label>{t("fields.specializations")}</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {specializations.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  {canEdit && (
                    <button type="button" onClick={() => setSpecializations(specializations.filter((x) => x !== s))}>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {canEdit && (
              <Input
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(specInput, specializations, setSpecializations, setSpecInput);
                  }
                }}
                placeholder={t("fields.typeAndPressEnter")}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("fields.languages")}</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {languages.map((l) => (
                <Badge key={l} variant="secondary" className="gap-1">
                  {l}
                  {canEdit && (
                    <button type="button" onClick={() => setLanguages(languages.filter((x) => x !== l))}>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            {canEdit && (
              <Input
                value={langInput}
                onChange={(e) => setLangInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(langInput, languages, setLanguages, setLangInput);
                  }
                }}
                placeholder={t("fields.typeAndPressEnter")}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Certification Section — chapter lead / super admin only */}
      {!isRestricted && canEdit && (
        <Card>
          <CardHeader><CardTitle>{tCoaches("certification")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("fields.recertificationDueDate")}</Label>
                <Input
                  type="date"
                  value={recertDate}
                  onChange={(e) => setRecertDate(e.target.value)}
                />
                {recertDate && (() => {
                  const days = Math.ceil((new Date(recertDate).getTime() - Date.now()) / 86400000);
                  const color = days < 30 ? "text-destructive" : days < 90 ? "text-amber-600" : "text-green-600";
                  const label = days < 0 ? t("labels.overdue") : t("labels.dueInDays", { days });
                  return <p className={`text-xs font-medium ${color}`}>{label}</p>;
                })()}
              </div>
              <div className="space-y-2">
                <Label>{tCoaches("ceCredits")}</Label>
                <Input
                  type="number"
                  value={ceCredits}
                  onChange={(e) => setCeCredits(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={certApproved} onCheckedChange={setCertApproved} />
              <Label>{tCoaches("approvedForDirectory")}</Label>
            </div>
            {!certApproved && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {tCoaches("notApprovedWarning")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Certification — read-only for coaches */}
      {isRestricted && (
        <Card className="border-l-4" style={{ borderLeftColor: certLevelColor(coach.certification_level) }}>
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> {tCoaches("myCertification")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground">{tCoaches("currentLevel")}</p>
                <Badge className="mt-1" style={{ background: certLevelColor(coach.certification_level), color: "white" }}>
                  {coach.certification_level}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tCoaches("hoursLogged")}</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {coach.hours_logged}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tCoaches("recertDue")}</p>
                {coach.recertification_due_date ? (() => {
                  const days = Math.ceil((new Date(coach.recertification_due_date).getTime() - Date.now()) / 86400000);
                  const color = days < 30 ? "text-destructive" : days < 90 ? "text-amber-600" : "text-green-600";
                  return (
                    <p className={`font-medium ${color}`}>
                      {new Date(coach.recertification_due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      <span className="text-xs ml-1">({days < 0 ? t("labels.overdue") : t("labels.days", { days })})</span>
                    </p>
                  );
                })() : <p className="text-muted-foreground">{t("labels.notSet")}</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tCoaches("ceCredits")}</p>
                <p className="text-2xl font-bold">{coach.ce_credits_earned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{t("sections.locationContact")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("fields.city")}</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-2">
              <Label>{t("fields.country")}</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} disabled={!canEdit} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("fields.contactEmail")}</Label>
            <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} disabled={!canEdit} />
          </div>
          <div className="space-y-2">
            <Label>{t("fields.contactPhone")}</Label>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} disabled={!canEdit} />
          </div>
          <div className="space-y-2">
            <Label>{t("fields.website")}</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} disabled={!canEdit} placeholder={t("fields.websitePlaceholder")} />
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>{tc("cancel")}</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tc("saveChanges")}
          </Button>
        </div>
      )}
    </form>
  );
}
