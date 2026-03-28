import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import { Badge } from "@repo/ui/badge";
import { Plus, Pencil } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  suspended: "secondary",
  archived: "destructive",
};

export default async function ChaptersPage() {
  const user = await getAuthUser();
  if (!user || !isSuperAdmin(user.roles)) redirect("/dashboard");

  const supabase = await createClient();
  const { data: chapters } = await supabase
    .from("chapters")
    .select("*, coaches(count)")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Chapters</h1>
          <p className="text-muted-foreground">
            Manage all WIAL chapters across the global network.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/chapters/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Chapter
          </Link>
        </Button>
      </div>

      {chapters && chapters.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Language</TableHead>
                <TableHead className="text-right">Coaches</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {chapters.map((chapter) => (
                <TableRow key={chapter.id}>
                  <TableCell>
                    <Badge variant={statusVariant[chapter.status] ?? "outline"}>
                      {chapter.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/chapters/${chapter.id}`}
                      className="hover:underline"
                    >
                      {chapter.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {chapter.slug}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {chapter.subdomain}.wial.ashwanthbk.com
                  </TableCell>
                  <TableCell>{chapter.default_language.toUpperCase()}</TableCell>
                  <TableCell className="text-right">
                    {(chapter.coaches as any)?.[0]?.count ?? 0}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/chapters/${chapter.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">No chapters yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first chapter to start building the global network.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/chapters/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Chapter
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
