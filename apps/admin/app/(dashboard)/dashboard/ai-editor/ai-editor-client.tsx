"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Textarea } from "@repo/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Play,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import type { Tables } from "@repo/types";

type Deployment = Tables<"deployments"> & {
  profiles: { full_name: string } | null;
};

type Chapter = Tables<"chapters">;

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

export function AiEditorClient({
  chapter,
  initialDeployments,
}: {
  chapter: Chapter;
  initialDeployments: Deployment[];
}) {
  const router = useRouter();
  const [deployments, setDeployments] =
    useState<Deployment[]>(initialDeployments);
  const [prompt, setPrompt] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [previewKey, setPreviewKey] = useState(0);

  // Active session: has pending approval_status and is in an active state
  const activeSession = deployments.find(
    (d) =>
      d.approval_status === "pending" &&
      ["queued", "building", "deploying"].includes(d.status)
  );

  // Past sessions
  const pastSessions = deployments.filter(
    (d) =>
      d.approval_status !== null &&
      !["queued", "building", "deploying"].includes(d.status)
  );

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`ai-edits:${chapter.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deployments",
          filter: `chapter_id=eq.${chapter.id}`,
        },
        () => {
          startTransition(() => router.refresh());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chapter.id, router]);

  useEffect(() => {
    setDeployments(initialDeployments);
  }, [initialDeployments]);

  // Clear prompt history when session ends
  useEffect(() => {
    if (!activeSession) {
      setPromptHistory([]);
    }
  }, [activeSession]);

  const handleStartSession = useCallback(async () => {
    setIsStarting(true);
    setError(null);

    try {
      const res = await fetch("/api/ai-edit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: chapter.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start session.");
      } else {
        startTransition(() => router.refresh());
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }, [chapter.id, router]);

  const handleSendPrompt = useCallback(async () => {
    if (!prompt.trim() || !activeSession) return;
    setIsSubmitting(true);
    setError(null);

    const promptText = prompt.trim();

    try {
      const res = await fetch("/api/ai-edit/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deploymentId: activeSession.id,
          prompt: promptText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send prompt.");
      } else {
        setPromptHistory((prev) => [...prev, promptText]);
        setPrompt("");
        startTransition(() => router.refresh());
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [prompt, activeSession, router]);

  const handleApproval = useCallback(
    async (action: "approve" | "reject") => {
      if (!activeSession) return;
      setIsApproving(true);
      setError(null);

      try {
        const res = await fetch("/api/ai-edit/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deploymentId: activeSession.id, action }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? `Failed to ${action} edit.`);
        } else {
          startTransition(() => router.refresh());
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsApproving(false);
      }
    },
    [activeSession, router]
  );

  // Can accept a new prompt when session is idle (queued or deploying)
  const canSendPrompt =
    activeSession &&
    ["queued", "deploying"].includes(activeSession.status) &&
    !isSubmitting;

  // Has a preview to show
  const hasPreview =
    activeSession?.preview_url && activeSession.status === "deploying";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">AI Editor</h1>
        <p className="text-muted-foreground">
          Start an editing session, send prompts to iterate on changes, then
          deploy when you're happy with the preview.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* No active session — show start button */}
      {!activeSession && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Ready to edit</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Start a session to create an isolated branch. You can then send
              multiple prompts, preview changes, and deploy when ready.
            </p>
            <Button
              onClick={handleStartSession}
              disabled={isStarting || isPending}
              className="mt-6 gap-2"
              size="lg"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start Editing Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active session */}
      {activeSession && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column: Prompt + History */}
          <div className="space-y-6 lg:col-span-3">
            {/* Session status bar */}
            <Card>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {activeSession.status === "queued" && (
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Session started — enter your first edit below
                      </span>
                    </>
                  )}
                  {activeSession.status === "building" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                      <span className="text-sm font-medium text-amber-500">
                        AI is editing your site...
                      </span>
                    </>
                  )}
                  {activeSession.status === "deploying" && (
                    <>
                      <Eye className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">
                        Preview ready — review, send more edits, or deploy
                      </span>
                    </>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  Started {formatRelativeTime(activeSession.created_at)}
                </span>
              </CardContent>
            </Card>

            {/* Prompt history */}
            {promptHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Prompt History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {promptHistory.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-md bg-muted px-3 py-2 text-sm"
                    >
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        #{i + 1}
                      </span>
                      {p}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Prompt input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {activeSession.status === "queued"
                    ? "First Edit"
                    : "Follow-up Edit"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {activeSession.status === "queued"
                    ? "Describe what you'd like to change on your website."
                    : "Describe additional changes or refinements."}
                </p>
                <Textarea
                  placeholder="e.g., Change the hero title to 'Welcome to WIAL Nigeria' and make the CTA button green..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={!canSendPrompt}
                  className="min-h-[120px] resize-y"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSendPrompt();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Ctrl+Enter to send
                  </span>
                  <Button
                    onClick={handleSendPrompt}
                    disabled={!prompt.trim() || !canSendPrompt || isPending}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error from AI */}
            {activeSession.error_message && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {activeSession.error_message}
              </div>
            )}
          </div>

          {/* Right column: Preview + Actions */}
          <div className="space-y-6 lg:col-span-2">
            {hasPreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Preview
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewKey((k) => k + 1)}
                        className="text-sm font-normal text-muted-foreground hover:text-primary"
                        title="Refresh preview"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={activeSession.preview_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-normal text-primary hover:underline"
                      >
                        <ExternalLink className="mr-1 inline h-3 w-3" />
                        Open in new tab
                      </a>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-hidden rounded-md border">
                    <iframe
                      key={previewKey}
                      src={activeSession.preview_url!}
                      className="h-[400px] w-full"
                      title="AI Edit Preview"
                    />
                  </div>

                  <p className="truncate text-xs text-muted-foreground">
                    {activeSession.preview_url}
                  </p>

                  {/* Deploy / Discard */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApproval("approve")}
                      disabled={isApproving || isPending}
                      className="flex-1 gap-2"
                    >
                      {isApproving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                      Deploy to Production
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleApproval("reject")}
                      disabled={isApproving || isPending}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Discard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Building state — waiting for preview */}
            {activeSession.status === "building" && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    AI is editing your site files...
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Preview will appear here when ready
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Queued state — no prompt yet */}
            {activeSession.status === "queued" && (
              <Card>
                <CardContent className="space-y-4 py-6">
                  <p className="text-sm text-muted-foreground">
                    Session is ready. Enter a prompt to start editing.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApproval("reject")}
                    disabled={isApproving || isPending}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Cancel Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Past sessions */}
      {pastSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Last Prompt</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="max-w-xs truncate text-sm">
                        {session.ai_prompt ?? "No prompts sent"}
                      </TableCell>
                      <TableCell>
                        {session.approval_status === "approved" ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Deployed
                          </Badge>
                        ) : session.approval_status === "rejected" ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Discarded
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            {session.status === "failed" ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            {session.status === "failed" ? "Failed" : "Done"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeTime(session.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
