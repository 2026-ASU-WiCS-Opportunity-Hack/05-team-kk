"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@repo/ui/table";
import { Badge } from "@repo/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@repo/ui/select";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Users, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

type RoleWithProfile = {
  id: string;
  user_id: string;
  chapter_id: string | null;
  role: string;
  created_at: string;
  profiles: { full_name: string; email: string; avatar_url: string | null } | null;
};

type Invitation = {
  id: string;
  chapter_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
  inviter: { full_name: string; email: string } | null;
};

function getInitials(name: string | undefined | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const roleLabels: Record<string, string> = {
  super_admin: "super_admin",
  chapter_lead: "chapter_lead",
  content_creator: "content_creator",
  coach: "coach",
};

export function UserManagementClient({
  roles,
  invitations,
  chapterId,
  isSuperAdmin,
}: {
  roles: RoleWithProfile[];
  invitations: Invitation[];
  chapterId: string | null;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("users");
  const tui = useTranslations("ui.users");
  const tc = useTranslations("common");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("coach");
  const [inviteLoading, setInviteLoading] = useState(false);

  const roleLabel = (role: string) =>
    tui.has(`roles.${roleLabels[role] ?? role}`)
      ? tui(`roles.${roleLabels[role] ?? role}`)
      : role;

  async function handleInvite() {
    if (!chapterId) {
      toast.error(tui("errors.selectChapterFirst"));
      return;
    }
    setInviteLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: invitation, error } = await supabase.from("invitations").insert({
      chapter_id: chapterId,
      email: inviteEmail,
      role: inviteRole,
      invited_by: user!.id,
      token: crypto.randomUUID(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).select().single();

    if (error || !invitation) {
      toast.error(error?.message ?? tui("errors.createInvitationFailed"));
      setInviteLoading(false);
      return;
    }

    // Send invitation email via Edge Function
    try {
      const response = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitation_id: invitation.id }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.warning(
          `Invitation created, but email sending failed: ${payload?.error ?? `status ${response.status}`}`
        );
      }
    } catch {
      // Email sending is best-effort; the invitation record is already created
      console.warn("Failed to send invitation email");
    }

    toast.success(tui("messages.invitationSent", { email: inviteEmail }));
    setInviteOpen(false);
    setInviteEmail("");
    router.refresh();
    setInviteLoading(false);
  }

  async function handleRevokeInvitation(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("invitations").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(tui("messages.invitationRevoked"));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {tui("description")}
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("sendInvite")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{tui("inviteDialog.title")}</DialogTitle>
              <DialogDescription>
                {tui("inviteDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{tui("table.email")}</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={tui("inviteDialog.emailPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{tui("table.role")}</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coach">{tui("roles.coach")}</SelectItem>
                    <SelectItem value="content_creator">{tui("roles.contentCreator")}</SelectItem>
                    {isSuperAdmin && (
                      <SelectItem value="chapter_lead">{tui("roles.chapterLead")}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setInviteOpen(false)}>
                {tc("cancel")}
              </Button>
              <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail}>
                {inviteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {tui("inviteDialog.send")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">{t("members")}</TabsTrigger>
          <TabsTrigger value="invitations">
            {t("invitations")}
            {invitations.filter((i) => i.status === "pending").length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {invitations.filter((i) => i.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          {roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{tui("empty.noMembers")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tui("empty.noMembersDesc")}
              </p>
            </div>
          ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>{tui("table.name")}</TableHead>
                  <TableHead>{tui("table.email")}</TableHead>
                  <TableHead>{tui("table.role")}</TableHead>
                  <TableHead>{tui("table.joined")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  roles.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials((r.profiles as any)?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {(r.profiles as any)?.full_name ?? "\u2014"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(r.profiles as any)?.email ?? "\u2014"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabel(r.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </TabsContent>

        <TabsContent value="invitations">
          {invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{tui("empty.noInvitations")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tui("empty.noInvitationsDesc")}
              </p>
            </div>
          ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tui("table.email")}</TableHead>
                  <TableHead>{tui("table.role")}</TableHead>
                  <TableHead>{tui("table.invitedBy")}</TableHead>
                  <TableHead>{tui("table.sentDate")}</TableHead>
                  <TableHead>{tui("table.status")}</TableHead>
                  <TableHead>{tui("table.expires")}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabel(inv.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(inv.inviter as any)?.full_name ?? "\u2014"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inv.status === "accepted"
                              ? "default"
                              : inv.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {tui(`status.${inv.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {inv.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevokeInvitation(inv.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
