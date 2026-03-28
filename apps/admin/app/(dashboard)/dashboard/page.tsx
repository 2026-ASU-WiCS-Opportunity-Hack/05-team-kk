import type React from "react";
import { getAuthUser, isSuperAdmin } from "@/lib/auth";
import { createClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { Building2, Users, FileText, Rocket, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { chapter: chapterId } = await searchParams;
  const supabase = await createClient();
  const isAdmin = isSuperAdmin(user.roles);

  // Fetch stats
  const { count: chapterCount } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true });

  const { count: coachCount } = await supabase
    .from("coaches")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: deploymentCount } = await supabase
    .from("deployments")
    .select("*", { count: "exact", head: true });

  const stats = [
    { title: "Total Chapters", value: chapterCount ?? 0, icon: Building2 },
    { title: "Active Coaches", value: coachCount ?? 0, icon: Users },
    { title: "Total Users", value: userCount ?? 0, icon: FileText },
    { title: "Deployments", value: deploymentCount ?? 0, icon: Rocket },
  ];

  // Latest deployment for the selected chapter (or most recent across all if super admin / no chapter)
  const deploymentQuery = supabase
    .from("deployments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  const resolvedChapterId =
    chapterId ?? (!isAdmin ? user.roles.find((r) => r.chapter_id)?.chapter_id : undefined);

  if (resolvedChapterId) {
    deploymentQuery.eq("chapter_id", resolvedChapterId);
  }

  const { data: latestDeployments } = await deploymentQuery;
  const latestDeployment = latestDeployments?.[0] ?? null;

  type DeployStatus = "done" | "failed" | "building" | "deploying" | "queued";
  const statusMap: Record<DeployStatus, { dot: string; label: string; icon: React.ReactNode; badge: "default" | "secondary" | "destructive" | "outline" }> = {
    done: {
          dot: "bg-green-500",
          label: "Live",
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          badge: "default" as const,
        },
        failed: {
          dot: "bg-destructive",
          label: "Last deploy failed",
          icon: <XCircle className="h-4 w-4 text-destructive" />,
          badge: "destructive" as const,
        },
        building: {
          dot: "bg-blue-500",
          label: "Building",
          icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
          badge: "secondary" as const,
        },
        deploying: {
          dot: "bg-blue-500",
          label: "Deploying",
          icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
          badge: "secondary" as const,
        },
        queued: {
          dot: "bg-amber-500",
          label: "Queued",
          icon: <Loader2 className="h-4 w-4 animate-spin text-amber-500" />,
          badge: "outline" as const,
        },
  };
  const deployStatusConfig = latestDeployment
    ? (statusMap[latestDeployment.status as DeployStatus] ?? {
        dot: "bg-muted-foreground",
        label: latestDeployment.status,
        icon: <Rocket className="h-4 w-4 text-muted-foreground" />,
        badge: "outline" as const,
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome back, {user.fullName}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Here's an overview of the WIAL global network."
            : "Here's an overview of your chapter."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deployment status card */}
      {latestDeployment && deployStatusConfig && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Latest Deployment
            </CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {deployStatusConfig.icon}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={deployStatusConfig.badge}>
                    {deployStatusConfig.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatRelativeTime(
                      latestDeployment.completed_at ?? latestDeployment.created_at
                    )}
                  </span>
                </div>
                {latestDeployment.error_message && (
                  <p className="mt-1 text-xs text-destructive">
                    {latestDeployment.error_message.slice(0, 100)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {latestDeployment.deploy_url && (
                  <a
                    href={latestDeployment.deploy_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View site
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Link
                  href={`/dashboard/deployments${resolvedChapterId ? `?chapter=${resolvedChapterId}` : ""}`}
                  className="text-sm text-primary hover:underline"
                >
                  All deployments →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
