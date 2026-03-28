import { emailLayout, escapeHtml, type BrandingOptions } from "../layout";

export interface DeploymentNotificationVars {
  chapterName: string;
  status: "done" | "failed";
  deployUrl?: string;
  errorMessage?: string;
  triggeredBy: string;
}

export function deploymentNotification(
  vars: DeploymentNotificationVars,
  branding?: BrandingOptions
): string {
  const primary = branding?.primaryColor || "#1A7A8A";
  const isSuccess = vars.status === "done";
  const statusColor = isSuccess ? "#16a34a" : "#dc2626";
  const statusLabel = isSuccess ? "Successful" : "Failed";

  const body = `
    <h1 style="font-family:Lexend,sans-serif;color:${primary};font-size:24px;margin:0 0 16px;">
      Deployment ${statusLabel}
    </h1>
    <p>A deployment for <strong>${escapeHtml(vars.chapterName)}</strong> triggered by ${escapeHtml(vars.triggeredBy)} has <span style="color:${statusColor};font-weight:600;">${statusLabel.toLowerCase()}</span>.</p>
    ${isSuccess && vars.deployUrl ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${vars.deployUrl}" style="display:inline-block;background-color:${primary};color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
          View Live Site
        </a>
      </div>` : ""}
    ${!isSuccess && vars.errorMessage ? `
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#991b1b;font-size:14px;"><strong>Error:</strong> ${escapeHtml(vars.errorMessage)}</p>
      </div>` : ""}`;
  return emailLayout(body, branding);
}
