import { emailLayout, escapeHtml, type BrandingOptions } from "../layout";

export interface WelcomeVars {
  userName: string;
  chapterName: string;
  roleLabel: string;
  dashboardUrl: string;
}

export function welcome(vars: WelcomeVars, branding?: BrandingOptions): string {
  const primary = branding?.primaryColor || "#1A7A8A";
  const body = `
    <h1 style="font-family:Lexend,sans-serif;color:${primary};font-size:24px;margin:0 0 16px;">
      Welcome to ${escapeHtml(vars.chapterName)}, ${escapeHtml(vars.userName)}!
    </h1>
    <p>Your account has been created. You've joined <strong>${escapeHtml(vars.chapterName)}</strong> as a <strong>${escapeHtml(vars.roleLabel)}</strong>.</p>
    <p>Sign in to your dashboard to get started.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${vars.dashboardUrl}" style="display:inline-block;background-color:${primary};color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        Go to Dashboard
      </a>
    </div>`;
  return emailLayout(body, branding);
}
