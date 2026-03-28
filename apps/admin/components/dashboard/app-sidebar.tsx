"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@repo/ui/sidebar";
import { useAuth, useIsSuperAdmin } from "@/components/providers/auth-provider";
import { useChapter } from "@/components/providers/chapter-provider";
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  Settings,
  FileText,
  Quote,
  Rocket,
  UserCircle,
  Calendar,
  Building,
  BookOpen,
  Sparkles,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
};

function getNavItems(
  role: string | null,
  isSuperAdmin: boolean,
  chapterId: string | null,
  t: (key: string) => string
): NavItem[] {
  const chapterParam = chapterId ? `?chapter=${chapterId}` : "";

  if (isSuperAdmin && !chapterId) {
    return [
      { title: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
      { title: t("chapters"), href: "/dashboard/chapters", icon: Building2 },
      { title: t("coachDirectory"), href: "/dashboard/coaches", icon: Users },
      { title: t("events"), href: "/dashboard/events", icon: Calendar },
      { title: t("users"), href: "/dashboard/users", icon: UserCog },
      { title: t("settings"), href: "/dashboard/settings", icon: Settings },
    ];
  }

  if (isSuperAdmin || role === "chapter_lead") {
    return [
      { title: t("dashboard"), href: `/dashboard${chapterParam}`, icon: LayoutDashboard },
      { title: t("coaches"), href: `/dashboard/coaches${chapterParam}`, icon: Users },
      { title: t("content"), href: `/dashboard/content${chapterParam}`, icon: FileText },
      { title: t("testimonials"), href: `/dashboard/testimonials${chapterParam}`, icon: Quote },
      { title: t("events"), href: `/dashboard/events${chapterParam}`, icon: Calendar },
      { title: t("clients"), href: `/dashboard/clients${chapterParam}`, icon: Building },
      { title: t("aiEditor"), href: `/dashboard/ai-editor${chapterParam}`, icon: Sparkles },
      { title: t("users"), href: `/dashboard/users${chapterParam}`, icon: UserCog },
      { title: t("deployments"), href: `/dashboard/deployments${chapterParam}`, icon: Rocket },
      { title: t("chapterSettings"), href: `/dashboard/settings${chapterParam}`, icon: Settings },
    ];
  }

  if (role === "content_creator") {
    return [
      { title: t("dashboard"), href: `/dashboard${chapterParam}`, icon: LayoutDashboard },
      { title: t("content"), href: `/dashboard/content${chapterParam}`, icon: FileText },
      { title: t("coaches"), href: `/dashboard/coaches${chapterParam}`, icon: Users },
    ];
  }

  if (role === "coach") {
    return [
      { title: t("dashboard"), href: `/dashboard${chapterParam}`, icon: LayoutDashboard },
      { title: t("myProfile"), href: `/dashboard/profile${chapterParam}`, icon: UserCircle },
    ];
  }

  return [
    { title: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
  ];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();
  const { selectedChapterId } = useChapter();
  const t = useTranslations("nav");

  const role = user?.roles.find((r) => r.chapter_id === selectedChapterId)?.role ?? null;
  const navItems = getNavItems(role, isSuperAdmin, selectedChapterId, t);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex h-14 items-center px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold tracking-tight group-data-[collapsible=icon]:hidden">
              WIAL Admin
            </span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = pathname === item.href.split("?")[0];
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4 group-data-[collapsible=icon]:p-2">
        {user && (
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {user.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium leading-none">
                {user.fullName}
              </span>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
