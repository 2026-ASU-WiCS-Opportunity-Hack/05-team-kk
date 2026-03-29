"use client";

import { useState } from "react";
import { createClient } from "@repo/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { toast } from "sonner";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

interface Payment {
  id: string;
  payment_type: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export function CoachPaymentCard({
  chapterId,
  userEmail,
  stripeReady,
  recentPayments,
}: {
  chapterId: string;
  userEmail: string;
  stripeReady: boolean;
  recentPayments: Payment[];
}) {
  const t = useTranslations("payments");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState<string | null>(null);
  const [duesAmount, setDuesAmount] = useState("");

  async function handlePayment(paymentType: "certification" | "dues") {
    setLoading(paymentType);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Not authenticated");
      setLoading(null);
      return;
    }

    const body: Record<string, unknown> = {
      chapter_id: chapterId,
      payment_type: paymentType,
      payer_email: userEmail,
    };

    if (paymentType === "dues") {
      const cents = Math.round(parseFloat(duesAmount) * 100);
      if (!cents || cents <= 0) {
        toast.error(t("enterValidAmount"));
        setLoading(null);
        return;
      }
      body.amount = cents;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Failed to create payment");
      setLoading(null);
      return;
    }

    if (data.checkoutUrl) {
      window.open(data.checkoutUrl, "_blank");
    }

    setLoading(null);
  }

  function statusColor(status: string) {
    switch (status) {
      case "completed": return "bg-green-600";
      case "pending": return "bg-amber-500";
      case "failed": return "bg-destructive";
      case "refunded": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  }

  if (!stripeReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> {t("payments")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("stripeNotReady")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" /> {t("payments")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Payment Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="font-medium text-sm">{t("certificationPayment")}</p>
              <p className="text-xs text-muted-foreground">{t("certificationPaymentDesc")}</p>
            </div>
            <p className="text-2xl font-bold">$30.00</p>
            <Button
              onClick={() => handlePayment("certification")}
              disabled={loading !== null}
              className="w-full"
              size="sm"
            >
              {loading === "certification" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              {t("payNow")}
            </Button>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="font-medium text-sm">{t("duesPayment")}</p>
              <p className="text-xs text-muted-foreground">{t("duesPaymentDesc")}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("amount")}</Label>
              <Input
                type="number"
                placeholder="50.00"
                value={duesAmount}
                onChange={(e) => setDuesAmount(e.target.value)}
                min="1"
                step="0.01"
              />
            </div>
            <Button
              onClick={() => handlePayment("dues")}
              disabled={loading !== null}
              className="w-full"
              size="sm"
            >
              {loading === "dues" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              {t("payNow")}
            </Button>
          </div>
        </div>

        {/* Recent Payments */}
        {recentPayments.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("recentPayments")}</p>
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Badge className={`text-white ${statusColor(p.status)}`}>
                      {p.status}
                    </Badge>
                    <span className="text-sm capitalize">{p.payment_type}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
