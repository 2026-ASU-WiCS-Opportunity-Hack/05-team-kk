/** Shared HTML email layout with optional chapter branding. */
export interface BrandingOptions {
  chapterName?: string;
  logoUrl?: string;
  primaryColor?: string;
}

const DEFAULT_PRIMARY = "#1A7A8A";

export function emailLayout(
  body: string,
  branding?: BrandingOptions
): string {
  const primary = branding?.primaryColor || DEFAULT_PRIMARY;
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
        <!-- Header -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
          ${logoHtml}
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;color:#374151;font-size:16px;line-height:1.6;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">WIAL Global Chapter Network Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
