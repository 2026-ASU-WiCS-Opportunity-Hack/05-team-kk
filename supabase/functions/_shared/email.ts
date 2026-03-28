/**
 * Shared email utilities for Edge Functions.
 * Mirrors packages/email/ but adapted for the Deno runtime.
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "WIAL Platform <noreply@wial.ashwanthbk.com>";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Array.isArray(options.to) ? options.to : [options.to];

  if (!apiKey) {
    console.log(`[DEV] Email to ${to.join(", ")}: ${options.subject}`);
    return { success: true };
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from || DEFAULT_FROM,
      to,
      subject: options.subject,
      html: options.html,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error("Resend error:", errBody);
    return { success: false, error: errBody };
  }

  return { success: true };
}

// ── Layout ──────────────────────────────────────────────────

export interface BrandingOptions {
  chapterName?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function emailLayout(body: string, branding?: BrandingOptions): string {
  const primary = branding?.primaryColor || "#1A7A8A";
  const orgName = branding?.chapterName || "WIAL";
  const logoHtml = branding?.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${orgName}" style="max-height:40px;width:auto;" />`
    : `<span style="font-family:Lexend,sans-serif;font-size:20px;font-weight:700;color:${primary};">${escapeHtml(orgName)}</span>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Source Sans 3',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">${logoHtml}</td></tr>
        <tr><td style="padding:32px;color:#374151;font-size:16px;line-height:1.6;">${body}</td></tr>
        <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">WIAL Global Chapter Network Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
