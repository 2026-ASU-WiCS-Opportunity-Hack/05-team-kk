import { emailLayout, escapeHtml, type BrandingOptions } from "../layout";

export interface InvitationVars {
  chapterName: string;
  roleLabel: string;
  signupUrl: string;
}

export function invitation(vars: InvitationVars, branding?: BrandingOptions): string {
  const body = `
    <h1 style="font-family:Lexend,sans-serif;color:${branding?.primaryColor || "#1A7A8A"};font-size:24px;margin:0 0 16px;">
      You've been invited to ${escapeHtml(vars.chapterName)}
    </h1>
    <p>You've been invited to join <strong>${escapeHtml(vars.chapterName)}</strong> as a <strong>${escapeHtml(vars.roleLabel)}</strong> on the WIAL Global Chapter Network Platform.</p>
    <p>Click the button below to create your account. This invitation expires in 7 days.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${vars.signupUrl}" style="display:inline-block;background-color:${branding?.primaryColor || "#1A7A8A"};color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        Create Your Account
      </a>
    </div>
    <p style="color:#6b7280;font-size:14px;">If the button doesn't work, copy and paste this link:<br/>
      <a href="${vars.signupUrl}" style="color:${branding?.primaryColor || "#1A7A8A"};">${vars.signupUrl}</a>
    </p>`;
  return emailLayout(body, branding);
}
