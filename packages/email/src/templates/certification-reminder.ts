import { emailLayout, escapeHtml, type BrandingOptions } from "../layout";

export interface CertificationReminderVars {
  coachName: string;
  certificationLevel: string;
  dueDate: string;
  daysRemaining: number;
  chapterName: string;
  dashboardUrl: string;
}

export function certificationReminder(
  vars: CertificationReminderVars,
  branding?: BrandingOptions
): string {
  const primary = branding?.primaryColor || "#1A7A8A";
  const urgencyColor = vars.daysRemaining <= 30 ? "#dc2626" : vars.daysRemaining <= 60 ? "#d97706" : "#16a34a";

  const body = `
    <h1 style="font-family:Lexend,sans-serif;color:${primary};font-size:24px;margin:0 0 16px;">
      Certification Renewal Reminder
    </h1>
    <p>Hello ${escapeHtml(vars.coachName)},</p>
    <p>Your <strong>${escapeHtml(vars.certificationLevel)}</strong> certification with <strong>${escapeHtml(vars.chapterName)}</strong> is due for renewal on <strong>${escapeHtml(vars.dueDate)}</strong>.</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;text-align:center;">
      <p style="margin:0;font-size:14px;color:#6b7280;">Time Remaining</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:${urgencyColor};">${vars.daysRemaining} days</p>
    </div>
    <p>Please ensure your continuing education credits are up to date and contact your chapter lead if you have questions about the renewal process.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${vars.dashboardUrl}" style="display:inline-block;background-color:${primary};color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        View My Certification
      </a>
    </div>`;
  return emailLayout(body, branding);
}
