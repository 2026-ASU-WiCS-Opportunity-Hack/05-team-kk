import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyStripeWebhook } from "../_shared/stripe-verify.ts";
import { sendEmail, emailLayout, escapeHtml } from "../_shared/email.ts";

const ADMIN_URL =
  Deno.env.get("ADMIN_DASHBOARD_URL") ?? "https://wial-admin.vercel.app";

Deno.serve(async (req) => {
  // Webhooks are POST-only with no CORS (not browser-called)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  try {
    await verifyStripeWebhook(rawBody, signatureHeader, webhookSecret);
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const obj = event.data.object;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sessionId = obj["id"] as string;
        const paymentIntent = obj["payment_intent"] as string | null;
        const metadata = (obj["metadata"] as Record<string, string>) ?? {};
        const chapterId = metadata["chapter_id"];
        const payerEmail = metadata["payer_email"] ?? (obj["customer_email"] as string | null) ?? "";

        if (!sessionId) break;

        // Idempotent: check if already processed
        const { data: existing } = await supabase
          .from("payments")
          .select("id, status")
          .eq("stripe_checkout_session_id", sessionId)
          .single();

        if (existing?.status === "completed") {
          // Already processed
          break;
        }

        if (existing) {
          // Update existing payment row to completed
          await supabase
            .from("payments")
            .update({
              status: "completed",
              provider_transaction_id: paymentIntent,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_checkout_session_id", sessionId);

          // Send receipt email
          if (payerEmail && chapterId) {
            const { data: chapter } = await supabase
              .from("chapters")
              .select("name")
              .eq("id", chapterId)
              .single();

            const amount = (obj["amount_total"] as number | null) ?? 0;
            const currency = ((obj["currency"] as string | null) ?? "usd").toUpperCase();
            const paymentType = metadata["payment_type"] ?? "payment";

            const receiptBody = `
              <h1 style="font-family:Lexend,sans-serif;color:#1A7A8A;font-size:24px;margin:0 0 16px;">
                Payment Receipt
              </h1>
              <p>Thank you for your payment to <strong>${escapeHtml(chapter?.name ?? "WIAL")}</strong>.</p>
              <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:14px;">Type</td>
                    <td style="padding:6px 0;font-weight:600;text-align:right;text-transform:capitalize;">${escapeHtml(paymentType)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:14px;">Amount</td>
                    <td style="padding:6px 0;font-weight:600;text-align:right;">${(amount / 100).toFixed(2)} ${currency}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;font-size:14px;">Reference</td>
                    <td style="padding:6px 0;font-family:monospace;font-size:12px;text-align:right;">${escapeHtml(sessionId.slice(-12))}</td>
                  </tr>
                </table>
              </div>
              <p>If you have any questions, please contact your chapter lead.</p>`;

            await sendEmail({
              to: payerEmail,
              subject: `Payment receipt from ${chapter?.name ?? "WIAL"}`,
              html: emailLayout(receiptBody, { chapterName: chapter?.name }),
            });

            // Mark receipt sent
            await supabase
              .from("payments")
              .update({ receipt_sent: true })
              .eq("stripe_checkout_session_id", sessionId);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntentId = obj["id"] as string;
        if (!paymentIntentId) break;

        await supabase
          .from("payments")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("provider_transaction_id", paymentIntentId);
        break;
      }

      case "charge.refunded": {
        const paymentIntentId = obj["payment_intent"] as string | null;
        if (!paymentIntentId) break;

        await supabase
          .from("payments")
          .update({ status: "refunded", updated_at: new Date().toISOString() })
          .eq("provider_transaction_id", paymentIntentId);
        break;
      }

      case "account.updated": {
        const accountId = obj["id"] as string;
        const chargesEnabled = obj["charges_enabled"] as boolean | null;
        const detailsSubmitted = obj["details_submitted"] as boolean | null;

        if (!accountId) break;

        const onboardingComplete = chargesEnabled === true && detailsSubmitted === true;

        await supabase
          .from("chapters")
          .update({
            stripe_onboarding_complete: onboardingComplete,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", accountId);
        break;
      }

      default:
        // Unknown event — acknowledge and ignore
        break;
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err);
    // Return 500 so Stripe retries
    return new Response(JSON.stringify({ error: "Processing error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
