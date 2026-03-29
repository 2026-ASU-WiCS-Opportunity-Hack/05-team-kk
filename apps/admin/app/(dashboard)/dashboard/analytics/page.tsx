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
  BarChart3,
  Users,
  Calendar,
  Mail,
} from "lucide-react";

const MOCK_TOP_PAGES = [
  { page: "landingPage", views: 4280 },
  { page: "coachDirectory", views: 2150 },
  { page: "about", views: 1830 },
  { page: "events", views: 1240 },
  { page: "contact", views: 980 },
  { page: "testimonials", views: 760 },
  { page: "resources", views: 520 },
  { page: "membership", views: 410 },
];

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

      {/* Website Traffic Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            {tui("traffic.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center rounded-lg border border-dashed h-[240px]">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">{tui("traffic.comingSoon")}</p>
              <p className="text-xs mt-1">{tui("traffic.poweredBy")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Pages (Cloudflare Analytics placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>{tui("topPages.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_TOP_PAGES.map((page, i) => {
              const maxViews = MOCK_TOP_PAGES[0]!.views;
              const pct = (page.views / maxViews) * 100;
              return (
                <div key={page.page} className="flex items-center gap-3">
                  <span className="w-5 text-sm text-muted-foreground text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{tui(`topPages.pages.${page.page}`)}</span>
                      <span className="text-sm text-muted-foreground">{page.views.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
