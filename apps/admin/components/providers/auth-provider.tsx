"use client";

import { createContext, useContext } from "react";
import type { Tables } from "@repo/types";

export type UserRole = Tables<"user_roles">;

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  roles: UserRole[];
};

type AuthContextType = {
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextType>({ user: null });

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useIsSuperAdmin() {
  const { user } = useAuth();
  return user?.roles.some((r) => r.role === "super_admin") ?? false;
}

export function useUserRoleForChapter(chapterId: string | null) {
  const { user } = useAuth();
  if (!chapterId || !user) return null;
  return user.roles.find((r) => r.chapter_id === chapterId)?.role ?? null;
}
