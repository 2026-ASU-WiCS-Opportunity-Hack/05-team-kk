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
import {
  Users,
  Calendar,
  Mail,
} from "lucide-react";
import { AnalyticsTraffic } from "./analytics-traffic";

export default async function AnalyticsPage() {
  const t = await getTranslations("nav");
  const tui = await getTranslations("ui.analytics");
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const isAdmin = isSuperAdmin(user.roles);
  const cookieStore = await cookies();
  const chapterId = isAdmin
    ? cookieStore.get("selected-chapter")?.value || undefined
    : user.roles.find((r) => r.chapter_id)?.chapter_id ?? undefined;

  // Fetch real business metrics via RPC
  type BusinessMetrics = {
    active_coaches: number;
    upcoming_events: number;
    active_subscribers: number;
  };

  let metrics: BusinessMetrics = { active_coaches: 0, upcoming_events: 0, active_subscribers: 0 };

  if (chapterId) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_chapter_business_metrics", {
      p_chapter_id: chapterId,
    });
    if (data && data.length > 0) {
      metrics = data[0];
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("analytics")}</h1>
        <p className="text-muted-foreground">
          {isAdmin && !chapterId
            ? tui("descriptionGlobal")
            : tui("descriptionChapter")}
        </p>
      </div>

      {/* Business Metric Cards — real data */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tui("cards.activeCoaches")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.active_coaches}</p>
            <p className="text-xs text-muted-foreground mt-1">{tui("cards.approvedActive")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tui("cards.upcomingEvents")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.upcoming_events}</p>
            <p className="text-xs text-muted-foreground mt-1">{tui("cards.published")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{tui("cards.subscribers")}</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics.active_subscribers}</p>
            <p className="text-xs text-muted-foreground mt-1">{tui("cards.newsletterSubscribers")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Website Traffic — Cloudflare Analytics (real data when configured, placeholder otherwise) */}
      <AnalyticsTraffic />
    </div>
  );
}
