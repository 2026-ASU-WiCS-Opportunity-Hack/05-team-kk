import { emailLayout, escapeHtml, type BrandingOptions } from "../layout";

export interface PaymentReceiptVars {
  payerEmail: string;
  paymentType: string;
  amountCents: number;
  currency: string;
  chapterName: string;
  sessionId: string;
  date: string;
}

export function paymentReceipt(
  vars: PaymentReceiptVars,
  branding?: BrandingOptions
): string {
  const primary = branding?.primaryColor || "#1A7A8A";
  const amount = (vars.amountCents / 100).toFixed(2);
  const currency = vars.currency.toUpperCase();
  const typeLabel = vars.paymentType.charAt(0).toUpperCase() + vars.paymentType.slice(1);

  const body = `
    <h1 style="font-family:Lexend,sans-serif;color:${primary};font-size:24px;margin:0 0 16px;">
      Payment Receipt
    </h1>
    <p>Thank you for your payment to <strong>${escapeHtml(vars.chapterName)}</strong>.</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Type</td>
          <td style="padding:6px 0;font-weight:600;text-align:right;">${escapeHtml(typeLabel)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Amount</td>
          <td style="padding:6px 0;font-weight:600;text-align:right;">${escapeHtml(amount)} ${escapeHtml(currency)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Date</td>
          <td style="padding:6px 0;text-align:right;">${escapeHtml(vars.date)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:14px;">Reference</td>
          <td style="padding:6px 0;font-family:monospace;font-size:12px;text-align:right;">${escapeHtml(vars.sessionId.slice(-12))}</td>
        </tr>
      </table>
    </div>
    <p>Your payment has been received and recorded. If you have any questions, please contact your chapter lead.</p>`;

  return emailLayout(body, branding);
}
