"use client";

import {
  createContext,
  useContext,
  useCallback,
} from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Tables } from "@repo/types";

export type Chapter = Tables<"chapters">;

type ChapterContextType = {
  selectedChapterId: string | null;
  selectedChapter: Chapter | null;
  chapters: Chapter[];
  setSelectedChapterId: (id: string | null) => void;
};

const ChapterContext = createContext<ChapterContextType>({
  selectedChapterId: null,
  selectedChapter: null,
  chapters: [],
  setSelectedChapterId: () => {},
});

export function ChapterProvider({
  chapters,
  children,
}: {
  chapters: Chapter[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedChapterId = searchParams.get("chapter") ?? null;
  const selectedChapter =
    chapters.find((c) => c.id === selectedChapterId) ?? null;

  const setSelectedChapterId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("chapter", id);
      } else {
        params.delete("chapter");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <ChapterContext.Provider
      value={{
        selectedChapterId,
        selectedChapter,
        chapters,
        setSelectedChapterId,
      }}
    >
      {children}
    </ChapterContext.Provider>
  );
}

export function useChapter() {
  return useContext(ChapterContext);
}
