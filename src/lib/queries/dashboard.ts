import "server-only";
import { db } from "@/lib/db";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { ACTIVE_APPLICATION_STATUSES, PRE_SUBMISSION_STATUSES, checklistProgress } from "@/lib/domain/application";
import { addDays } from "@/lib/domain/dates";
import { isOutstanding, summariseInvoice } from "@/lib/domain/invoice";

const MONTH_LABEL = new Intl.DateTimeFormat("en-IE", { month: "short", timeZone: "UTC" });

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function getDashboard(today: Date) {
  const in30 = addDays(today, 30);
  const yearAgo = new Date(Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth() + 1, 1));

  const [invoices, statusGroups, schemeDeadlines, attention, activity, clientCount] = await Promise.all([
    db.invoice.findMany({
      where: { status: "ISSUED" },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        lines: { select: { quantity: true, unitPriceCents: true } },
        payments: { select: { amountCents: true, paidAt: true } },
      },
    }),
    db.grantApplication.groupBy({ by: ["status"], _count: { _all: true } }),
    db.schemeDeadline.findMany({
      where: { date: { gte: addDays(today, -7), lte: addDays(today, 60) } },
      orderBy: { date: "asc" },
      include: {
        scheme: {
          select: {
            id: true,
            name: true,
            code: true,
            applications: {
              where: { status: { in: PRE_SUBMISSION_STATUSES } },
              select: { deadline: true },
            },
          },
        },
      },
    }),
    db.grantApplication.findMany({
      where: { status: { in: ["DRAFT", "GATHERING_DOCS", "READY"] }, deadline: { lte: addDays(today, 21) } },
      orderBy: { deadline: "asc" },
      take: 8,
      include: {
        client: { select: { firstName: true, lastName: true } },
        scheme: { select: { code: true } },
        documents: { select: { status: true } },
      },
    }),
    db.activity.findMany({
      orderBy: { occurredAt: "desc" },
      take: 8,
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    }),
    db.client.count(),
  ]);

  const summarised = invoices.map((inv) => ({ ...inv, summary: summariseInvoice(inv, today) }));
  const outstanding = summarised.filter((i) => isOutstanding(i.summary.displayStatus));
  const overdue = summarised
    .filter((i) => i.summary.displayStatus === "OVERDUE")
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const months: { key: string; month: string; invoiced: number; collected: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(yearAgo.getUTCFullYear(), yearAgo.getUTCMonth() + i, 1));
    months.push({ key: monthKey(d), month: MONTH_LABEL.format(d), invoiced: 0, collected: 0 });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const inv of summarised) {
    const bucket = byKey.get(monthKey(inv.issueDate));
    if (bucket) bucket.invoiced += inv.summary.grossCents / 100;
    for (const p of inv.payments) {
      const pb = byKey.get(monthKey(p.paidAt));
      if (pb) pb.collected += p.amountCents / 100;
    }
  }

  const statusCounts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])) as Partial<
    Record<ApplicationStatus, number>
  >;

  return {
    clientCount,
    outstandingCents: outstanding.reduce((s, i) => s + i.summary.balanceCents, 0),
    outstandingCount: outstanding.length,
    overdueCents: overdue.reduce((s, i) => s + i.summary.balanceCents, 0),
    overdue: overdue.slice(0, 6),
    overdueCount: overdue.length,
    activeApplications: ACTIVE_APPLICATION_STATUSES.reduce((s, st) => s + (statusCounts[st] ?? 0), 0),
    statusCounts,
    deadlines: schemeDeadlines.map((d) => ({
      id: d.id,
      title: d.title,
      date: d.date,
      scheme: d.scheme,
      openApplications: d.scheme.applications.filter((a) => a.deadline?.getTime() === d.date.getTime()).length,
    })),
    deadlinesNext30: schemeDeadlines.filter((d) => d.date >= today && d.date <= in30).length,
    attention: attention.map((a) => ({ ...a, progress: checklistProgress(a.documents) })),
    activity,
    months: months.map(({ month, invoiced, collected }) => ({
      month,
      invoiced: Math.round(invoiced),
      collected: Math.round(collected),
    })),
  };
}
