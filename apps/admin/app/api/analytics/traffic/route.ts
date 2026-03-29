import { NextResponse } from "next/server";
import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { cookies } from "next/headers";

const CF_API_URL = "https://api.cloudflare.com/client/v4/graphql";

interface CfZoneAnalytics {
  sum: {
    requests: number;
    pageViews: number;
    bytes: number;
  };
  uniq: {
    uniques: number;
  };
  dimensions: {
    date: string;
  };
}

interface CfTopPath {
  count: number;
  dimensions: {
    metric: string;
  };
}

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!cfApiToken || !cfAccountId) {
    return NextResponse.json({
      error: "Cloudflare Analytics not configured",
      configured: false,
    }, { status: 503 });
  }

  // Determine which chapter's site to query
  const isAdmin = isSuperAdmin(user.roles);
  const cookieStore = await cookies();
  const chapterId = isAdmin
    ? cookieStore.get("selected-chapter")?.value
    : user.roles.find((r) => r.chapter_id)?.chapter_id;

  if (!chapterId) {
    return NextResponse.json({ error: "No chapter selected" }, { status: 400 });
  }

  // Get chapter's Cloudflare project name
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from("chapters")
    .select("cloudflare_project_name, slug")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  // Cloudflare zone tag — in practice this would be the zone for the chapter's subdomain
  // For Cloudflare Pages, we use the Pages project analytics
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  // Query Cloudflare GraphQL Analytics API for Pages project
  const hostname = `${chapter.slug}.wial.ashwanthbk.com`;

  try {
    // Query zone-level HTTP analytics filtered by hostname
    const query = `
      query {
        viewer {
          accounts(filter: { accountTag: "${cfAccountId}" }) {
            httpRequests1dGroups(
              filter: {
                date_geq: "${startDate}"
                date_leq: "${endDate}"
                clientRequestHTTPHost: "${hostname}"
              }
              orderBy: [date_ASC]
              limit: 100
            ) {
              sum {
                requests
                pageViews
                bytes
              }
              uniq {
                uniques
              }
              dimensions {
                date
              }
            }
            httpRequestsAdaptiveGroups(
              filter: {
                date_geq: "${startDate}"
                date_leq: "${endDate}"
                clientRequestHTTPHost: "${hostname}"
                requestSource: "eyeball"
              }
              orderBy: [count_DESC]
              limit: 10
            ) {
              count
              dimensions {
                metric: clientRequestPath
              }
            }
          }
        }
      }
    `;

    const res = await fetch(CF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Cloudflare API error:", errText);
      return NextResponse.json({
        error: "Cloudflare API error",
        configured: true,
      }, { status: 502 });
    }

    const cfData = await res.json();
    const accounts = cfData?.data?.viewer?.accounts?.[0];

    const dailyData: CfZoneAnalytics[] = accounts?.httpRequests1dGroups ?? [];
    const topPaths: CfTopPath[] = accounts?.httpRequestsAdaptiveGroups ?? [];

    // Aggregate totals
    const totals = dailyData.reduce(
      (acc, d) => ({
        pageViews: acc.pageViews + (d.sum?.pageViews ?? 0),
        requests: acc.requests + (d.sum?.requests ?? 0),
        uniqueVisitors: acc.uniqueVisitors + (d.uniq?.uniques ?? 0),
        bandwidth: acc.bandwidth + (d.sum?.bytes ?? 0),
      }),
      { pageViews: 0, requests: 0, uniqueVisitors: 0, bandwidth: 0 }
    );

    // Format daily chart data
    const chart = dailyData.map((d) => ({
      date: d.dimensions.date,
      pageViews: d.sum?.pageViews ?? 0,
      uniqueVisitors: d.uniq?.uniques ?? 0,
    }));

    // Format top pages
    const topPages = topPaths.map((p) => ({
      path: p.dimensions.metric,
      views: p.count,
    }));

    return NextResponse.json({
      configured: true,
      period: { start: startDate, end: endDate, days },
      totals,
      chart,
      topPages,
    });
  } catch (err) {
    console.error("Cloudflare analytics fetch error:", err);
    return NextResponse.json({
      error: "Failed to fetch analytics",
      configured: true,
    }, { status: 500 });
  }
}
