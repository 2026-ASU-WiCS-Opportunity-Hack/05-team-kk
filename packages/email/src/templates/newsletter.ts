import { emailLayout, escapeHtml, type BrandingOptions } from "../layout";

export interface NewsletterVars {
  chapterName: string;
  subject: string;
  bodyHtml: string;
  unsubscribeUrl?: string;
}

export function newsletter(
  vars: NewsletterVars,
  branding?: BrandingOptions
): string {
  const body = `
    ${vars.bodyHtml}
    ${vars.unsubscribeUrl ? `
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;text-align:center;">
        You received this email because you subscribed to updates from ${escapeHtml(vars.chapterName)}.
        <a href="${vars.unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
      </p>` : ""}`;
  return emailLayout(body, branding);
}
