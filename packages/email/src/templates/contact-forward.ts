import { emailLayout, escapeHtml, type BrandingOptions } from "../layout";

export interface ContactForwardVars {
  senderName: string;
  senderEmail: string;
  message: string;
  chapterName: string;
}

export function contactForward(
  vars: ContactForwardVars,
  branding?: BrandingOptions
): string {
  const primary = branding?.primaryColor || "#1A7A8A";
  const body = `
    <h1 style="font-family:Lexend,sans-serif;color:${primary};font-size:24px;margin:0 0 16px;">
      New Contact Form Message
    </h1>
    <p><strong>From:</strong> ${escapeHtml(vars.senderName)} &lt;${escapeHtml(vars.senderEmail)}&gt;</p>
    <p><strong>Chapter:</strong> ${escapeHtml(vars.chapterName)}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
    <p>${escapeHtml(vars.message).replace(/\n/g, "<br>")}</p>`;
  return emailLayout(body, branding);
}
