import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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
import {
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { PaymentsClient } from "./payments-client";

const typeBadge: Record<string, string> = {
  enrollment: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  certification: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  dues: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  event: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
};

const statusBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  pending: "secondary",
  failed: "destructive",
  refunded: "outline",
};

function formatCurrency(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function PaymentsPage() {
  const t = await getTranslations("nav");
  const tui = await getTranslations("ui.payments");
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const isAdmin = isSuperAdmin(user.roles);
  const cookieStore = await cookies();
  const chapterId = isAdmin
    ? cookieStore.get("selected-chapter")?.value || undefined
    : user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined;

  if (!chapterId && !isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t("payments")}</h1>
        <p className="text-muted-foreground">{tui("selectChapter")}</p>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch chapter stripe status
  let stripeConnected = false;
  let stripeComplete = false;
  let activeChapterId = chapterId;

  if (chapterId) {
    const { data: chapter } = await supabase
      .from("chapters")
      .select("stripe_account_id, stripe_onboarding_complete")
      .eq("id", chapterId)
      .single();

    stripeConnected = !!chapter?.stripe_account_id;
    stripeComplete = chapter?.stripe_onboarding_complete ?? false;
  }

  // Fetch payment metrics via RPC
  let metrics = { total_collected: 0, outstanding: 0, this_month: 0 };
  if (chapterId) {
    const { data } = await supabase.rpc("get_chapter_payment_metrics", {
      p_chapter_id: chapterId,
    });
    if (data && data.length > 0) {
      metrics = data[0];
    }
  }

  // Fetch recent payments
  type Payment = {
    id: string;
    payer_email: string;
    payment_type: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  };

  let payments: Payment[] = [];
  if (chapterId) {
    const { data } = await supabase
      .from("payments")
      .select("id, payer_email, payment_type, amount, currency, status, created_at")
      .eq("chapter_id", chapterId)
      .order("created_at", { ascending: false })
      .limit(50);
    payments = (data as Payment[]) ?? [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("payments")}</h1>
          <p className="text-muted-foreground">{tui("description")}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tui("cards.totalCollected")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.total_collected)}</p>
            <p className="text-xs text-muted-foreground mt-1">{tui("cards.allTime")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tui("cards.outstanding")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.outstanding)}</p>
            <p className="text-xs text-muted-foreground mt-1">{tui("cards.pendingPayments")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tui("cards.thisMonth")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(metrics.this_month)}</p>
            <p className="text-xs text-muted-foreground mt-1">{tui("cards.currentMonth")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Connect / Create Payment — client component handles interactivity */}
      <PaymentsClient
        chapterId={activeChapterId ?? null}
        stripeConnected={stripeConnected}
        stripeComplete={stripeComplete}
      />

      {/* Stripe connected badge */}
      {stripeComplete && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{tui("stripeConnected")}</span>
        </div>
      )}

      {/* Payments Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tui("table.payer")}</TableHead>
              <TableHead>{tui("table.type")}</TableHead>
              <TableHead>{tui("table.amount")}</TableHead>
              <TableHead>{tui("table.status")}</TableHead>
              <TableHead>{tui("table.date")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {tui("noPayments")}
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">{p.payer_email}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeBadge[p.payment_type] ?? "bg-muted text-muted-foreground"}`}>
                      {tui(`types.${p.payment_type}`)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(p.amount, p.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[p.status] ?? "outline"} className="capitalize">
                      {tui(`status.${p.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
