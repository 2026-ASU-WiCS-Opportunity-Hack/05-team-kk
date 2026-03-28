"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@repo/supabase/client";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Badge } from "@repo/ui/badge";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

type InvitationData = {
  email: string;
  role: string;
  chapter_name: string;
  chapter_id: string;
};

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("No invitation token provided.");
        setValidating(false);
        return;
      }

      const supabase = createClient();
      const { data: inv, error: fetchError } = await supabase
        .from("invitations")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .maybeSingle();

      if (fetchError || !inv || new Date(inv.expires_at) < new Date()) {
        setError("This invitation has expired or is no longer valid.");
        setValidating(false);
        return;
      }

      const { data: chapter } = await supabase
        .from("chapters")
        .select("name")
        .eq("id", inv.chapter_id)
        .maybeSingle();

      setInvitation({
        email: inv.email,
        role: inv.role,
        chapter_name: chapter?.name ?? "Unknown Chapter",
        chapter_id: inv.chapter_id,
      });
      setValidating(false);
    }

    validateToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fullName, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to create account");
        setLoading(false);
        return;
      }

      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <Card className="w-full max-w-[420px]">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">
            Validating your invitation...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-[420px]">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <p className="text-center font-medium">{error}</p>
          <p className="text-center text-sm text-muted-foreground">
            Please contact the person who invited you for a new link.
          </p>
        </CardContent>
      </Card>
    );
  }

  const roleLabel =
    invitation!.role === "chapter_lead"
      ? "Chapter Lead"
      : invitation!.role === "content_creator"
        ? "Content Creator"
        : "Coach";

  return (
    <Card className="w-full max-w-[420px]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          Join {invitation!.chapter_name}
        </CardTitle>
        <CardDescription className="flex items-center justify-center gap-2">
          as a <Badge variant="secondary">{roleLabel}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Email</Label>
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              {invitation!.email}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
