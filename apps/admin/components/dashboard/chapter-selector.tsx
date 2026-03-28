"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { useChapter } from "@/components/providers/chapter-provider";
import { useIsSuperAdmin } from "@/components/providers/auth-provider";
import { Badge } from "@repo/ui/badge";

export function ChapterSelector() {
  const { chapters, selectedChapterId, setSelectedChapterId } = useChapter();
  const isSuperAdmin = useIsSuperAdmin();

  // If user has only one chapter, don't show the selector
  if (!isSuperAdmin && chapters.length <= 1) return null;

  return (
    <Select
      value={selectedChapterId ?? "global"}
      onValueChange={(value) =>
        setSelectedChapterId(value === "global" ? null : value)
      }
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select chapter" />
      </SelectTrigger>
      <SelectContent>
        {isSuperAdmin && (
          <SelectItem value="global">
            <span className="flex items-center gap-2">
              Global
            </span>
          </SelectItem>
        )}
        {chapters.map((chapter) => (
          <SelectItem key={chapter.id} value={chapter.id}>
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    chapter.status === "active"
                      ? "var(--color-green-500, #22c55e)"
                      : chapter.status === "suspended"
                        ? "var(--color-amber-500, #f59e0b)"
                        : "var(--color-gray-400, #9ca3af)",
                }}
              />
              {chapter.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
