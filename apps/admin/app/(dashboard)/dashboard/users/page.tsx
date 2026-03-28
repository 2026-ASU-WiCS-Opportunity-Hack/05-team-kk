import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@repo/ui/table";
import { Badge } from "@repo/ui/badge";
import { UserManagementClient } from "./user-management-client";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const { chapter: chapterId } = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const isAdmin = isSuperAdmin(user.roles);

  // Fetch users with roles
  let query = supabase
    .from("user_roles")
    .select("*, profiles(full_name, email, avatar_url)")
    .order("created_at", { ascending: false });

  if (chapterId) {
    query = query.eq("chapter_id", chapterId);
  }

  const { data: roles } = await query;

  // Fetch invitations
  let invQuery = supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false });

  if (chapterId) {
    invQuery = invQuery.eq("chapter_id", chapterId);
  }

  const { data: invitations } = await invQuery;

  return (
    <UserManagementClient
      roles={roles ?? []}
      invitations={invitations ?? []}
      chapterId={chapterId ?? null}
      isSuperAdmin={isAdmin}
    />
  );
}
