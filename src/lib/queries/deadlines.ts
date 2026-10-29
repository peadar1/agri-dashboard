import "server-only";
import { db } from "@/lib/db";
import { PRE_SUBMISSION_STATUSES } from "@/lib/domain/application";
import { addDays, toDateInput } from "@/lib/domain/dates";

export interface DeadlineEvent {
  key: string;
  date: Date;
  kind: "scheme" | "application";
  title: string;
  href: string;
  detail?: string;
}

export function parseMonth(value: string | string[] | undefined, today: Date) {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})$/.exec(value) : null;
  const year = match ? Number(match[1]) : today.getUTCFullYear();
  const month = match ? Number(match[2]) - 1 : today.getUTCMonth();
  return new Date(Date.UTC(year, Math.min(Math.max(month, 0), 11), 1));
}

export async function listDeadlineEvents(from: Date, to: Date): Promise<DeadlineEvent[]> {
  const [schemeDeadlines, applications] = await Promise.all([
    db.schemeDeadline.findMany({
      where: { date: { gte: from, lte: to } },
      include: { scheme: { select: { id: true, code: true } } },
    }),
    db.grantApplication.findMany({
      where: { deadline: { gte: from, lte: to }, status: { in: PRE_SUBMISSION_STATUSES } },
      select: { id: true, deadline: true, scheme: { select: { id: true, code: true } } },
    }),
  ]);

  const events: DeadlineEvent[] = schemeDeadlines.map((d) => ({
    key: `s-${d.id}`,
    date: d.date,
    kind: "scheme",
    title: d.title,
    href: `/settings/schemes/${d.scheme.id}`,
    detail: d.scheme.code,
  }));

  // Group open applications per scheme and day so a busy closing date shows one entry.
  const groups = new Map<string, { date: Date; schemeId: string; code: string; count: number; id: string }>();
  for (const app of applications) {
    if (!app.deadline) continue;
    const key = `${toDateInput(app.deadline)}-${app.scheme.id}`;
    const group = groups.get(key) ?? { date: app.deadline, schemeId: app.scheme.id, code: app.scheme.code, count: 0, id: app.id };
    group.count += 1;
    groups.set(key, group);
  }
  for (const [key, g] of groups) {
    events.push({
      key: `a-${key}`,
      date: g.date,
      kind: "application",
      title: `${g.count} open ${g.code} application${g.count === 1 ? "" : "s"}`,
      href: g.count === 1 ? `/applications/${g.id}` : `/applications?scheme=${g.schemeId}`,
    });
  }

  const kindOrder = { scheme: 0, application: 1 } as const;
  return events.sort((a, b) => a.date.getTime() - b.date.getTime() || kindOrder[a.kind] - kindOrder[b.kind]);
}

export function calendarGrid(month: Date) {
  const first = month;
  const offset = (first.getUTCDay() + 6) % 7; // Monday-first weeks
  const start = addDays(first, -offset);
  const nextMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1));
  const days: Date[] = [];
  for (let d = start; d < nextMonth || days.length % 7 !== 0; d = addDays(d, 1)) days.push(d);
  return { start, end: days[days.length - 1], days, nextMonth };
}
