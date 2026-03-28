"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  PlayCircle,
  ExternalLink,
  BookOpen,
  GripVertical,
} from "lucide-react";

interface ResourceItem {
  title: string;
  description?: string;
  url: string;
  type: "pdf" | "video" | "link" | "article";
}

const RESOURCE_TYPES = [
  { value: "pdf", label: "PDF", icon: FileText, color: "text-red-500" },
  { value: "video", label: "Video", icon: PlayCircle, color: "text-blue-500" },
  { value: "link", label: "Link", icon: ExternalLink, color: "text-teal-600" },
  { value: "article", label: "Article", icon: BookOpen, color: "text-amber-600" },
] as const;

function getTypeIcon(type: string) {
  const found = RESOURCE_TYPES.find((t) => t.value === type);
  if (!found) return { Icon: ExternalLink, color: "text-teal-600" };
  return { Icon: found.icon, color: found.color };
}

export function ResourcesEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [items, setItems] = useState<ResourceItem[]>(() => {
    try {
      return JSON.parse(value) as ResourceItem[];
    } catch {
      return [];
    }
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<string>("link");

  function sync(newItems: ResourceItem[]) {
    setItems(newItems);
    onChange(JSON.stringify(newItems, null, 2));
  }

  function openCreate() {
    setEditingIndex(null);
    setTitle("");
    setDescription("");
    setUrl("");
    setType("link");
    setDialogOpen(true);
  }

  function openEdit(idx: number) {
    const item = items[idx]!;
    setEditingIndex(idx);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setUrl(item.url);
    setType(item.type);
    setDialogOpen(true);
  }

  function handleSave() {
    const item: ResourceItem = {
      title,
      description: description || undefined,
      url,
      type: type as ResourceItem["type"],
    };

    if (editingIndex !== null) {
      const updated = [...items];
      updated[editingIndex] = item;
      sync(updated);
    } else {
      sync([...items, item]);
    }

    setDialogOpen(false);
  }

  function handleRemove(idx: number) {
    sync(items.filter((_, i) => i !== idx));
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved!);
    sync(updated);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Resources ({items.length})</Label>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add Resource
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No resources yet. Add links to documents, videos, and articles.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => {
            const { Icon, color } = getTypeIcon(item.type);
            return (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => moveItem(idx, idx - 1)}
                    disabled={idx === 0}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>
                <div className={`flex-shrink-0 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  )}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate block"
                  >
                    {item.url}
                  </a>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(idx)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Resource" : "Add Resource"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title || !url}>
              {editingIndex !== null ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
