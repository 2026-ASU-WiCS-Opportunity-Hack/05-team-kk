"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/tooltip";
import { Rocket, ExternalLink, Loader2, CheckCircle2, XCircle, Clock, Zap, Sparkles } from "lucide-react";
import type { Tables } from "@repo/types";

type Deployment = Tables<"deployments"> & {
  profiles: { full_name: string } | null;
};

type Chapter = Tables<"chapters">;

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  queued: {
    label: "Queued",
    variant: "outline",
    icon: <Clock className="h-3 w-3" />,
  },
  building: {
    label: "Building",
    variant: "secondary",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  deploying: {
    label: "Deploying",
    variant: "secondary",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  done: {
    label: "Live",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
};

function formatDuration(createdAt: string, completedAt: string | null) {
  if (!completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(createdAt).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function DeploymentsClient({
  chapter,
  initialDeployments,
}: {
  chapter: Chapter;
  initialDeployments: Deployment[];
}) {
  const router = useRouter();
  const [deployments, setDeployments] = useState<Deployment[]>(initialDeployments);
  const [isPending, startTransition] = useTransition();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  const hasInProgress = deployments.some((d) =>
    ["queued", "building", "deploying"].includes(d.status)
  );
  const latestDone = deployments.find((d) => d.status === "done");

  // Realtime subscription for live status
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`deployments:${chapter.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deployments",
          filter: `chapter_id=eq.${chapter.id}`,
        },
        () => {
          // Refresh page data on any change
          startTransition(() => router.refresh());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chapter.id, router]);

  // Sync with server refreshes
  useEffect(() => {
    setDeployments(initialDeployments);
  }, [initialDeployments]);

  async function handleDeploy() {
    if (!chapter.cloudflare_deploy_hook_url) {
      setDeployError("This chapter has no deploy hook configured. Contact a Super Admin to provision the chapter first.");
      return;
    }
    setIsDeploying(true);
    setDeployError(null);
    try {
      const res = await fetch("/api/deployments/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeployError(data.error ?? "Failed to trigger deployment.");
      } else {
        startTransition(() => router.refresh());
      }
    } catch {
      setDeployError("Network error. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Deployments</h1>
          <p className="text-muted-foreground">
            Manage and track website deployments for{" "}
            <span className="font-medium">{chapter.name}</span>.
          </p>
        </div>
        <Button
          onClick={handleDeploy}
          disabled={isDeploying || hasInProgress || isPending}
          className="gap-2"
        >
          {isDeploying || (hasInProgress && isPending) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {hasInProgress ? "Building…" : "Deploy Now"}
        </Button>
      </div>

      {deployError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {deployError}
        </div>
      )}

      {/* Live site info */}
      {latestDone && (
        <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Live</span>
          {latestDone.deploy_url ? (
            <a
              href={latestDone.deploy_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              {latestDone.deploy_url}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">
              {`${chapter.subdomain}.wial.ashwanthbk.com`}
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            Last deployed {formatRelativeTime(latestDone.completed_at ?? latestDone.created_at)}
          </span>
        </div>
      )}

      {!chapter.cloudflare_deploy_hook_url && (
        <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          This chapter has not been provisioned yet. A Super Admin must provision the Cloudflare Pages project before deploying.
        </div>
      )}

      {/* Deployment history */}
      {deployments.length > 0 ? (
        <TooltipProvider>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Triggered By</TableHead>
                  <TableHead>AI Prompt</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments.map((deployment) => {
                  const cfg = STATUS_CONFIG[deployment.status] ?? STATUS_CONFIG.queued!;
                  const isAiEdit = !!deployment.ai_prompt;
                  return (
                    <TableRow key={deployment.id}>
                      {/* Type */}
                      <TableCell>
                        {isAiEdit ? (
                          <Badge variant="secondary" className="flex w-fit items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Edit
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex w-fit items-center gap-1">
                            <Rocket className="h-3 w-3" />
                            Deploy
                          </Badge>
                        )}
                      </TableCell>
                      {/* Status + Approval */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant={cfg!.variant} className="flex w-fit items-center gap-1">
                            {cfg!.icon}
                            {cfg!.label}
                          </Badge>
                          {isAiEdit && deployment.approval_status && (
                            <Badge
                              variant={
                                deployment.approval_status === "approved"
                                  ? "default"
                                  : deployment.approval_status === "rejected"
                                    ? "destructive"
                                    : "outline"
                              }
                              className="flex w-fit items-center gap-1 text-xs"
                            >
                              {deployment.approval_status === "approved" && (
                                <CheckCircle2 className="h-2.5 w-2.5" />
                              )}
                              {deployment.approval_status === "rejected" && (
                                <XCircle className="h-2.5 w-2.5" />
                              )}
                              {deployment.approval_status}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      {/* Triggered By */}
                      <TableCell className="text-sm">
                        {deployment.profiles?.full_name ?? "System"}
                      </TableCell>
                      {/* AI Prompt */}
                      <TableCell className="max-w-[200px]">
                        {isAiEdit ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate text-sm text-muted-foreground cursor-help">
                                {deployment.ai_prompt}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-sm">
                              <p className="text-sm">{deployment.ai_prompt}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(deployment.created_at)}
                      </TableCell>
                      {/* Duration */}
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDuration(deployment.created_at, deployment.completed_at)}
                      </TableCell>
                      {/* URL */}
                      <TableCell>
                        {deployment.deploy_url ? (
                          <a
                            href={deployment.deploy_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            View site
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : isAiEdit && deployment.preview_url ? (
                          <a
                            href={deployment.preview_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-amber-600 hover:underline"
                          >
                            Preview
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : deployment.error_message ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block truncate text-xs text-destructive cursor-help max-w-[120px]">
                                {deployment.error_message.slice(0, 60)}
                                {deployment.error_message.length > 60 ? "…" : ""}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-sm">
                              <p className="text-sm">{deployment.error_message}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Rocket className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No deployments yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Click "Deploy Now" to publish your chapter website.
          </p>
        </div>
      )}
    </div>
  );
}
