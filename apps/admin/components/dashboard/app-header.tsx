"use client";

import { SidebarTrigger } from "@repo/ui/sidebar";
import { Separator } from "@repo/ui/separator";
import { ChapterSelector } from "./chapter-selector";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <ChapterSelector />
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
