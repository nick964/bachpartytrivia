import "server-only";
import { Resend } from "resend";
import { clerkClient } from "@clerk/nextjs/server";
import type { EventRow } from "@/lib/db/types";
import { partyNoun, responderNoun } from "@/lib/theme";

function resend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured.");
  return new Resend(key);
}

async function ownerEmail(event: EventRow): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(event.owner_clerk_id);
    return (
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      null
    );
  } catch {
    return null;
  }
}

/** Shared shell for both editions. */
function emailShell(event: EventRow, heading: string, body: string): string {
  const navy = event.theme === "navy";
  const bg = navy ? "#0e1626" : "#fbf6f2";
  const surface = navy ? "#172440" : "#ffffff";
  const ink = navy ? "#f3efe6" : "#43303a";
  const primary = navy ? "#c9a24b" : "#b76e79";
  const soft = navy ? "#9da8bc" : "#97808b";
  return `<!doctype html>
<html><body style="margin:0;padding:32px 16px;background:${bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:${surface};border-radius:24px;padding:32px;color:${ink};">
    <p style="margin:0;font-size:26px;color:${primary};font-style:italic;font-weight:600;">Bach Party Trivia</p>
    <h1 style="font-size:22px;margin:20px 0 0;">${heading}</h1>
    ${body}
    <p style="margin:28px 0 0;font-size:12px;color:${soft};">Videos are automatically deleted 30 days after the party.</p>
  </div>
</body></html>`;
}

function button(href: string, label: string, primary: string): string {
  return `<p style="margin:24px 0 0;"><a href="${href}" style="display:inline-block;background:${primary};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:999px;">${label}</a></p>`;
}

const FROM = () =>
  process.env.EMAIL_FROM ?? "Bach Party Trivia <hello@bachpartytrivia.com>";
const APP = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://bachpartytrivia.com";

/** "He did it" — sent when the honoree submits their answers. */
export async function sendCompletionEmail(event: EventRow): Promise<void> {
  const to = await ownerEmail(event);
  if (!to) return;
  const primary = event.theme === "navy" ? "#c9a24b" : "#b76e79";
  const pronounDid = event.honoree_role === "bride" ? "He did it" : "She did it";
  await resend().emails.send({
    from: FROM(),
    to,
    subject: `${pronounDid}. ${event.honoree_name}'s answers are in 👀`,
    html: emailShell(
      event,
      `${pronounDid}.`,
      `<p style="margin:12px 0 0;font-size:15px;line-height:1.6;">${event.honoree_name} answered every question for <strong>${event.title}</strong>. Go watch before the party — you've earned a sneak peek.</p>` +
        button(`${APP()}/dashboard/events/${event.id}`, "Watch the answers", primary)
    ),
  });
}

/** Nudge when the party is close and answers are incomplete. */
export async function sendReminderEmail(
  event: EventRow,
  doneCount: number,
  totalCount: number
): Promise<void> {
  const to = await ownerEmail(event);
  if (!to) return;
  const primary = event.theme === "navy" ? "#c9a24b" : "#b76e79";
  const respondUrl = `${APP()}/respond/${event.respond_token}`;
  await resend().emails.send({
    from: FROM(),
    to,
    subject: `${event.honoree_name} still owes you ${
      totalCount - doneCount
    } answer${totalCount - doneCount === 1 ? "" : "s"} 🕐`,
    html: emailShell(
      event,
      "The party's almost here.",
      `<p style="margin:12px 0 0;font-size:15px;line-height:1.6;"><strong>${event.title}</strong> is coming up and ${event.honoree_name} has recorded ${doneCount} of ${totalCount} answers. Time for a friendly threat — here's the link to re-send:</p>` +
        `<p style="margin:16px 0 0;font-size:13px;word-break:break-all;"><a href="${respondUrl}" style="color:${primary};">${respondUrl}</a></p>` +
        button(`${APP()}/dashboard/events/${event.id}`, "Open the event", primary)
    ),
  });
}

/** One week before videos are deleted. */
export async function sendDeletionWarningEmail(event: EventRow): Promise<void> {
  const to = await ownerEmail(event);
  if (!to) return;
  const primary = event.theme === "navy" ? "#c9a24b" : "#b76e79";
  await resend().emails.send({
    from: FROM(),
    to,
    subject: `Download ${event.honoree_name}'s videos before they're gone`,
    html: emailShell(
      event,
      "7 days left on the videos.",
      `<p style="margin:12px 0 0;font-size:15px;line-height:1.6;">The videos from <strong>${event.title}</strong> are deleted 30 days after the ${partyNoun(
        event.honoree_role
      )}. If you want to keep ${responderNoun(
        event.honoree_role
      ) === "groom" ? "his" : "her"} answers forever, download them this week.</p>` +
        button(
          `${APP()}/dashboard/events/${event.id}`,
          "Download the videos",
          primary
        )
    ),
  });
}
