import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@repo/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import { DollarSign, TrendingUp, Building2 } from "lucide-react";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function RevenuePage() {
  const t = await getTranslations("nav");
  const tui = await getTranslations("ui.revenue");
  const user = await getAuthUser();
  if (!user) redirect("/login");

  if (!isSuperAdmin(user.roles)) redirect("/dashboard");

  const supabase = await createClient();

  type RevenueRow = {
    chapter_id: string;
    chapter_name: string;
    chapter_status: string;
    total_collected: number;
    this_month: number;
    active_coaches: number;
  };

  const { data: rows } = await supabase.rpc("get_global_revenue_metrics");
  const chapterRevenue: RevenueRow[] = (rows as RevenueRow[]) ?? [];

  const totalRevenue = chapterRevenue.reduce((s, c) => s + (c.total_collected ?? 0), 0);
  const monthlyRevenue = chapterRevenue.reduce((s, c) => s + (c.this_month ?? 0), 0);
  const totalCoaches = chapterRevenue.reduce((s, c) => s + Number(c.active_coaches ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("revenue")}</h1>
        <p className="text-muted-foreground">{tui("description")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tui("cards.totalRevenue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tui("cards.acrossChapters", { count: chapterRevenue.length })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tui("cards.thisMonth")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-1">{tui("cards.currentMonth")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tui("cards.activeCoaches")}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalCoaches}</p>
            <p className="text-xs text-muted-foreground mt-1">{tui("cards.generatingRevenue")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Chapter Breakdown */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tui("table.chapter")}</TableHead>
              <TableHead>{tui("table.status")}</TableHead>
              <TableHead>{tui("table.coaches")}</TableHead>
              <TableHead className="text-right">{tui("table.thisMonth")}</TableHead>
              <TableHead className="text-right">{tui("table.totalRevenue")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chapterRevenue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No revenue data yet
                </TableCell>
              </TableRow>
            ) : (
              chapterRevenue.map((c) => (
                <TableRow key={c.chapter_id}>
                  <TableCell className="font-medium">{c.chapter_name}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="capitalize">
                      {tui(`status.${c.chapter_status}`) || c.chapter_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.active_coaches}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.this_month)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(c.total_collected)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
