"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { BarChart3, Eye, Globe, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface TrafficData {
  configured: boolean;
  period?: { start: string; end: string; days: number };
  totals?: {
    pageViews: number;
    requests: number;
    uniqueVisitors: number;
    bandwidth: number;
  };
  chart?: { date: string; pageViews: number; uniqueVisitors: number }[];
  topPages?: { path: string; views: number }[];
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function AnalyticsTraffic() {
  const tui = useTranslations("ui.analytics");
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/traffic")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ configured: false }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Card>
          <CardContent className="flex items-center justify-center h-[280px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </>
    );
  }

  // Not configured — show placeholder
  if (!data?.configured) {
    return (
      <>
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
                <p className="text-xs mt-2 max-w-xs">
                  {tui("traffic.configureHint")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const totals = data.totals!;
  const chart = data.chart ?? [];
  const topPages = data.topPages ?? [];
  const maxViews = chart.length > 0 ? Math.max(...chart.map((d) => d.pageViews), 1) : 1;
  const maxTopPage = topPages.length > 0 ? topPages[0]!.views : 1;

  return (
    <>
      {/* Traffic Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tui("traffic.pageViews")}
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.pageViews.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tui("traffic.last30Days")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tui("traffic.uniqueVisitors")}
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.uniqueVisitors.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tui("traffic.last30Days")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {tui("traffic.bandwidth")}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBytes(totals.bandwidth)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tui("traffic.last30Days")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            {tui("traffic.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chart.length > 0 ? (
            <div className="flex items-end gap-[2px] h-[200px]">
              {chart.map((d) => {
                const height = (d.pageViews / maxViews) * 100;
                return (
                  <div
                    key={d.date}
                    className="flex-1 min-w-0 group relative"
                  >
                    <div
                      className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors"
                      style={{ height: `${Math.max(height, 1)}%` }}
                      title={`${d.date}: ${d.pageViews} views, ${d.uniqueVisitors} visitors`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
              {tui("traffic.noData")}
            </div>
          )}
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{chart[0]?.date ?? ""}</span>
            <span>{chart[chart.length - 1]?.date ?? ""}</span>
          </div>
        </CardContent>
      </Card>

      {/* Top Pages */}
      {topPages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{tui("topPages.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPages.map((page, i) => {
                const pct = (page.views / maxTopPage) * 100;
                return (
                  <div key={page.path} className="flex items-center gap-3">
                    <span className="w-5 text-sm text-muted-foreground text-right">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {page.path}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {page.views.toLocaleString()}
                        </span>
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
      )}
    </>
  );
}
