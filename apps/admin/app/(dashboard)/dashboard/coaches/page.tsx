import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@repo/ui/table";
import { Badge } from "@repo/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { CoachSearch } from "./coach-search";

const certColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CALC: "default",
  SALC: "secondary",
  MALC: "outline",
  PALC: "destructive",
};

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const { chapter: chapterId } = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const isAdmin = isSuperAdmin(user.roles);

  let query = supabase
    .from("coaches")
    .select("*, chapters(name)")
    .order("full_name");

  if (chapterId) {
    query = query.eq("chapter_id", chapterId);
  }

  const { data: coaches } = await query;

  const canAdd = isAdmin || user.roles.some(
    (r) => r.chapter_id === chapterId && r.role === "chapter_lead"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Coaches</h1>
          <p className="text-muted-foreground">
            {chapterId ? "Manage your chapter's coach roster." : "View coaches across all chapters."}
          </p>
        </div>
        {canAdd && chapterId && (
          <Button asChild>
            <Link href={`/dashboard/coaches/new?chapter=${chapterId}`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coach
            </Link>
          </Button>
        )}
      </div>

      {/* Semantic Search */}
      <CoachSearch chapterId={chapterId} />

      {coaches && coaches.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Certification</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Languages</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Active</TableHead>
                {!chapterId && <TableHead>Chapter</TableHead>}
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches.map((coach) => (
                <TableRow key={coach.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/coaches/${coach.id}?chapter=${chapterId ?? coach.chapter_id}`}
                      className="hover:underline"
                    >
                      {coach.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={certColors[coach.certification_level] ?? "outline"}>
                      {coach.certification_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {coach.specializations.slice(0, 3).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                      {coach.specializations.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{coach.specializations.length - 3}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {coach.languages.join(", ")}
                  </TableCell>
                  <TableCell className="text-right">{coach.hours_logged}</TableCell>
                  <TableCell>
                    <span className={`inline-block h-2 w-2 rounded-full ${coach.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                  </TableCell>
                  {!chapterId && (
                    <TableCell className="text-muted-foreground">
                      {(coach.chapters as any)?.name ?? "\u2014"}
                    </TableCell>
                  )}
                  <TableCell>
                    {canAdd && (
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/coaches/${coach.id}?chapter=${chapterId ?? coach.chapter_id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No coaches yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first coach to start building the directory.
          </p>
          {canAdd && chapterId && (
            <Button asChild className="mt-4">
              <Link href={`/dashboard/coaches/new?chapter=${chapterId}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Coach
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
