import { emailLayout, escapeHtml, type BrandingOptions } from "../layout";

export interface DuesReminderVars {
  chapterLeadName: string;
  chapterName: string;
  dashboardUrl: string;
}

export function duesReminder(
  vars: DuesReminderVars,
  branding?: BrandingOptions
): string {
  const primary = branding?.primaryColor || "#1A7A8A";

  const body = `
    <h1 style="font-family:Lexend,sans-serif;color:${primary};font-size:24px;margin:0 0 16px;">
      Weekly Dues Collection Reminder
    </h1>
    <p>Hello ${escapeHtml(vars.chapterLeadName)},</p>
    <p>This is your weekly reminder to collect outstanding dues for <strong>${escapeHtml(vars.chapterName)}</strong>.</p>
    <p>WIAL Global requires payment for:</p>
    <ul style="padding-left:20px;line-height:1.8;">
      <li><strong>$50</strong> per student enrolled in the eLearning platform</li>
      <li><strong>$30</strong> per student fully certified as a coach</li>
    </ul>
    <p>Use the Payments section in your chapter dashboard to create payment requests and track collections.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${vars.dashboardUrl}" style="display:inline-block;background-color:${primary};color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        View Payments Dashboard
      </a>
    </div>`;

  return emailLayout(body, branding);
}
