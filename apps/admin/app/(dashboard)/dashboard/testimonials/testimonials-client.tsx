"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import { Switch } from "@repo/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Plus, Pencil, Trash2, Loader2, MessageSquare, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import type { Tables } from "@repo/types";
import { useTranslations } from "next-intl";

type Testimonial = Tables<"testimonials">;

export function TestimonialsClient({
  testimonials,
  chapterId,
}: {
  testimonials: Testimonial[];
  chapterId: string;
}) {
  const router = useRouter();
  const t = useTranslations("testimonials");
  const tc = useTranslations("common");
  const tui = useTranslations("ui.testimonials");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(false);

  const [quote, setQuote] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [authorPhotoUrl, setAuthorPhotoUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  function openCreate() {
    setEditing(null);
    setQuote("");
    setAuthorName("");
    setAuthorTitle("");
    setAuthorPhotoUrl("");
    setSortOrder(testimonials.length);
    setDialogOpen(true);
  }

  function openEdit(t: Testimonial) {
    setEditing(t);
    setQuote(t.quote);
    setAuthorName(t.author_name);
    setAuthorTitle(t.author_title ?? "");
    setAuthorPhotoUrl(t.author_photo_url ?? "");
    setSortOrder(t.sort_order);
    setDialogOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();

    if (editing) {
      const { error } = await supabase
        .from("testimonials")
        .update({
          quote,
          author_name: authorName,
          author_title: authorTitle || null,
          author_photo_url: authorPhotoUrl || null,
          sort_order: sortOrder,
        })
        .eq("id", editing.id);
      if (error) toast.error(error.message);
      else toast.success(tui("messages.updated"));
    } else {
      const { error } = await supabase.from("testimonials").insert({
        chapter_id: chapterId,
        quote,
        author_name: authorName,
        author_title: authorTitle || null,
        author_photo_url: authorPhotoUrl || null,
        sort_order: sortOrder,
      });
      if (error) toast.error(error.message);
      else toast.success(tui("messages.added"));
    }

    setDialogOpen(false);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(tui("messages.deleted"));
      router.refresh();
    }
  }

  async function toggleField(
    id: string,
    field: "is_featured" | "is_active",
    value: boolean
  ) {
    const supabase = createClient();
    const { error } = await supabase
      .from("testimonials")
      .update({ [field]: value })
      .eq("id", id);
    if (error) toast.error(error.message);
    else router.refresh();
  }

  async function moveTestimonial(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= testimonials.length) return;

    const current = testimonials[index]!;
    const swap = testimonials[swapIndex]!;
    const supabase = createClient();

    const [r1, r2] = await Promise.all([
      supabase.from("testimonials").update({ sort_order: swap.sort_order }).eq("id", current.id),
      supabase.from("testimonials").update({ sort_order: current.sort_order }).eq("id", swap.id),
    ]);

    if (r1.error || r2.error) toast.error(tui("errors.reorderFailed"));
    else router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addTestimonial")}
        </Button>
      </div>

      {testimonials.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">{t("noTestimonials")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noTestimonialsDesc")}
          </p>
          <Button onClick={openCreate} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            {t("addTestimonial")}
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{tui("table.quote")}</TableHead>
                  <TableHead>{tui("table.author")}</TableHead>
                  <TableHead>{tui("table.featured")}</TableHead>
                  <TableHead>{tc("active")}</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((t, idx) => {
                const initials = t.author_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex flex-col items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === 0}
                          onClick={() => moveTestimonial(idx, "up")}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={idx === testimonials.length - 1}
                          onClick={() => moveTestimonial(idx, "down")}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-sm">{t.quote}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {t.author_photo_url && (
                            <AvatarImage src={t.author_photo_url} alt={t.author_name} />
                          )}
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{t.author_name}</p>
                          {t.author_title && (
                            <p className="text-xs text-muted-foreground">
                              {t.author_title}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={t.is_featured}
                        onCheckedChange={(v) =>
                          toggleField(t.id, "is_featured", v)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={t.is_active}
                        onCheckedChange={(v) =>
                          toggleField(t.id, "is_active", v)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(t)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? tui("actions.edit") : t("addTestimonial")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{tui("fields.quoteRequired")}</Label>
              <Textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                required
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>{tui("fields.authorNameRequired")}</Label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{tui("fields.authorTitle")}</Label>
              <Input
                value={authorTitle}
                onChange={(e) => setAuthorTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{tui("fields.authorPhotoUrl")}</Label>
              <Input
                value={authorPhotoUrl}
                onChange={(e) => setAuthorPhotoUrl(e.target.value)}
                placeholder={tui("fields.urlPlaceholder")}
              />
              {authorPhotoUrl && (
                <img
                  src={authorPhotoUrl}
                  alt={tui("fields.authorPhotoPreview")}
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>{tui("fields.sortOrder")}</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !quote || !authorName}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? tc("saveChanges") : t("addTestimonial")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
