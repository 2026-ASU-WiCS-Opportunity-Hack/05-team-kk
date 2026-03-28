import { emailLayout, escapeHtml, type BrandingOptions } from "../layout";

export interface EventReminderVars {
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  chapterName: string;
  registrationLink?: string;
  isVirtual: boolean;
  virtualLink?: string;
}

export function eventReminder(
  vars: EventReminderVars,
  branding?: BrandingOptions
): string {
  const primary = branding?.primaryColor || "#1A7A8A";
  const locationLine = vars.isVirtual
    ? `<strong>Location:</strong> Virtual${vars.virtualLink ? ` — <a href="${vars.virtualLink}" style="color:${primary};">Join Link</a>` : ""}`
    : `<strong>Location:</strong> ${escapeHtml(vars.eventLocation)}`;

  const body = `
    <h1 style="font-family:Lexend,sans-serif;color:${primary};font-size:24px;margin:0 0 16px;">
      Upcoming Event: ${escapeHtml(vars.eventTitle)}
    </h1>
    <p>${escapeHtml(vars.chapterName)} has an upcoming event:</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid ${primary};">
      <p style="margin:0 0 8px;font-weight:600;font-size:18px;">${escapeHtml(vars.eventTitle)}</p>
      <p style="margin:0 0 4px;color:#6b7280;font-size:14px;"><strong>Date:</strong> ${escapeHtml(vars.eventDate)}</p>
      <p style="margin:0 0 4px;color:#6b7280;font-size:14px;">${locationLine}</p>
      <p style="margin:0;color:#6b7280;font-size:14px;"><strong>Type:</strong> ${escapeHtml(vars.eventType)}</p>
    </div>
    ${vars.registrationLink ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${vars.registrationLink}" style="display:inline-block;background-color:${primary};color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
          Register Now
        </a>
      </div>` : ""}`;
  return emailLayout(body, branding);
}
