"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { CreditCard, Plus, Loader2 } from "lucide-react";
import { createClient } from "@repo/supabase/client";
import { invokeEdgeFunctionWithAuth } from "@/lib/edge-functions";

interface PaymentsClientProps {
  chapterId: string | null;
  stripeConnected: boolean;
  stripeComplete: boolean;
}

const DEFAULT_AMOUNTS: Record<string, number> = {
  enrollment: 5000,
  certification: 3000,
};

export function PaymentsClient({
  chapterId,
  stripeConnected,
  stripeComplete,
}: PaymentsClientProps) {
  const tui = useTranslations("ui.payments");
  const router = useRouter();

  const [connectingStripe, setConnectingStripe] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [paymentType, setPaymentType] = useState("enrollment");
  const [payerEmail, setPayerEmail] = useState("");
  const [amount, setAmount] = useState<number | "">(5000);
  const [description, setDescription] = useState("");

  function handleTypeChange(type: string) {
    setPaymentType(type);
    if (DEFAULT_AMOUNTS[type]) {
      setAmount(DEFAULT_AMOUNTS[type]);
    } else {
      setAmount("");
    }
  }

  async function handleConnectStripe() {
    if (!chapterId) return;
    setConnectingStripe(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No redirect URL returned", data);
      }
    } catch (err) {
      console.error("Connect Stripe error:", err);
    } finally {
      setConnectingStripe(false);
    }
  }

  async function handleCreatePayment() {
    if (!chapterId || !payerEmail || !paymentType) return;
    if ((paymentType === "dues" || paymentType === "event") && !amount) return;

    setCreating(true);
    setCreateError(null);

    try {
      const supabase = createClient();
      const { data, error } = await invokeEdgeFunctionWithAuth(supabase, "create-checkout", {
        chapter_id: chapterId,
        payment_type: paymentType,
        payer_email: payerEmail,
        amount: typeof amount === "number" ? amount : undefined,
        description: description || undefined,
      });

      if (error) {
        setCreateError(error.message ?? "Failed to create payment session");
        return;
      }

      if (data?.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
        setCreateDialogOpen(false);
        setPayerEmail("");
        setDescription("");
        setPaymentType("enrollment");
        setAmount(5000);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }

  const needsAmount = paymentType === "dues" || paymentType === "event";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {!stripeComplete && chapterId && (
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleConnectStripe}
          disabled={connectingStripe}
        >
          {connectingStripe ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          {stripeConnected ? tui("actions.resumeStripeOnboarding") : tui("actions.connectStripe")}
        </Button>
      )}

      {stripeComplete && chapterId && (
        <Button
          className="gap-2"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {tui("actions.createPayment")}
        </Button>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tui("createDialog.title")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="payment-type">{tui("table.type")}</Label>
              <Select value={paymentType} onValueChange={handleTypeChange}>
                <SelectTrigger id="payment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enrollment">{tui("types.enrollment")} ($50)</SelectItem>
                  <SelectItem value="certification">{tui("types.certification")} ($30)</SelectItem>
                  <SelectItem value="dues">{tui("types.dues")}</SelectItem>
                  <SelectItem value="event">{tui("types.event")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="payer-email">{tui("createDialog.payerEmail")}</Label>
              <Input
                id="payer-email"
                type="email"
                value={payerEmail}
                onChange={(e) => setPayerEmail(e.target.value)}
                placeholder="coach@example.com"
              />
            </div>

            {needsAmount && (
              <div className="space-y-1.5">
                <Label htmlFor="amount">{tui("createDialog.amountCents")}</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  step={100}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? parseInt(e.target.value, 10) : "")}
                  placeholder="e.g. 10000 for $100.00"
                />
                <p className="text-xs text-muted-foreground">{tui("createDialog.amountHint")}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="description">{tui("createDialog.description")}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={tui("createDialog.descriptionPlaceholder")}
              />
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePayment}
              disabled={creating || !payerEmail || (needsAmount && !amount)}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {tui("createDialog.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
