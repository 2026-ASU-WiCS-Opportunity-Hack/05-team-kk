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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Tables } from "@repo/types";

type Testimonial = Tables<"testimonials">;

export function TestimonialsClient({
  testimonials,
  chapterId,
}: {
  testimonials: Testimonial[];
  chapterId: string;
}) {
  const router = useRouter();
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
      else toast.success("Testimonial updated.");
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
      else toast.success("Testimonial added.");
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
      toast.success("Testimonial deleted.");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Testimonials
          </h1>
          <p className="text-muted-foreground">
            Manage client testimonials for your chapter.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Testimonial
        </Button>
      </div>

      {testimonials.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No testimonials yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first testimonial to showcase on your chapter website.
          </p>
          <Button onClick={openCreate} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add Testimonial
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonials.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-xs">
                    <p className="line-clamp-2 text-sm">{t.quote}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{t.author_name}</p>
                      {t.author_title && (
                        <p className="text-xs text-muted-foreground">
                          {t.author_title}
                        </p>
                      )}
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
                  <TableCell className="text-muted-foreground">
                    {t.sort_order}
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quote *</Label>
              <Textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                required
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Author Name *</Label>
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Author Title / Organization</Label>
              <Input
                value={authorTitle}
                onChange={(e) => setAuthorTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Author Photo URL</Label>
              <Input
                value={authorPhotoUrl}
                onChange={(e) => setAuthorPhotoUrl(e.target.value)}
                placeholder="https://..."
              />
              {authorPhotoUrl && (
                <img
                  src={authorPhotoUrl}
                  alt="Author photo preview"
                  className="h-16 w-16 rounded-full object-cover"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !quote || !authorName}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save Changes" : "Add Testimonial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
