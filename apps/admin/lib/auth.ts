import { createClient } from "@repo/supabase/server";
import type { Tables } from "@repo/types";

export type UserRole = Tables<"user_roles">;

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  roles: UserRole[];
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { data: roles } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", user.id);

  return {
    id: user.id,
    email: profile.email,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    roles: roles ?? [],
  };
}

export function isSuperAdmin(roles: UserRole[]): boolean {
  return roles.some((r) => r.role === "super_admin");
}

export function getUserRoleForChapter(
  roles: UserRole[],
  chapterId: string
): string | null {
  const role = roles.find((r) => r.chapter_id === chapterId);
  return role?.role ?? null;
}

export function getAccessibleChapterIds(roles: UserRole[]): string[] {
  if (isSuperAdmin(roles)) return []; // empty means "all" for super admin
  return roles
    .filter((r) => r.chapter_id !== null)
    .map((r) => r.chapter_id!);
}
