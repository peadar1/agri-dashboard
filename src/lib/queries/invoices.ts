import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { isOutstanding, summariseInvoice, type InvoiceDisplayStatus } from "@/lib/domain/invoice";
import { addDays } from "@/lib/domain/dates";

export const INVOICES_PAGE_SIZE = 30;

export const INVOICE_TABS = ["all", "outstanding", "overdue", "draft", "paid", "void"] as const;
export type InvoiceTab = (typeof INVOICE_TABS)[number];

export interface InvoiceFilters {
  q?: string;
  tab: InvoiceTab;
  page: number;
}

export function parseInvoiceFilters(params: Record<string, string | string[] | undefined>): InvoiceFilters {
  const str = (key: string) => (typeof params[key] === "string" && params[key] ? (params[key] as string) : undefined);
  const tab = str("tab");
  return {
    q: str("q")?.trim(),
    tab: tab && (INVOICE_TABS as readonly string[]).includes(tab) ? (tab as InvoiceTab) : "all",
    page: Math.max(1, Number.parseInt(str("page") ?? "1", 10) || 1),
  };
}

const TAB_MATCH: Record<InvoiceTab, (s: InvoiceDisplayStatus) => boolean> = {
  all: () => true,
  outstanding: isOutstanding,
  overdue: (s) => s === "OVERDUE",
  draft: (s) => s === "DRAFT",
  paid: (s) => s === "PAID",
  void: (s) => s === "VOID",
};

// Display status depends on payments and today's date, so filtering happens after
// summarising. Fine for a single consultant's book (low thousands of invoices).
export async function listInvoices(f: InvoiceFilters, today: Date) {
  const where: Prisma.InvoiceWhereInput = {};
  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" as const };
    where.OR = [
      { number: contains },
      { client: { firstName: contains } },
      { client: { lastName: contains } },
      { client: { herdNumber: { contains: f.q.replace(/\s/g, ""), mode: "insensitive" } } },
    ];
  }

  const invoices = await db.invoice.findMany({
    where,
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
    include: {
      client: { select: { id: true, firstName: true, lastName: true, herdNumber: true } },
      application: { select: { id: true, year: true, scheme: { select: { code: true } } } },
      lines: { select: { quantity: true, unitPriceCents: true } },
      payments: { select: { amountCents: true, paidAt: true } },
    },
  });

  const summarised = invoices.map((inv) => ({ ...inv, summary: summariseInvoice(inv, today) }));
  const counts = Object.fromEntries(
    INVOICE_TABS.map((t) => [t, summarised.filter((i) => TAB_MATCH[t](i.summary.displayStatus)).length]),
  ) as Record<InvoiceTab, number>;

  const filtered = summarised.filter((i) => TAB_MATCH[f.tab](i.summary.displayStatus));
  const pageCount = Math.max(1, Math.ceil(filtered.length / INVOICES_PAGE_SIZE));
  const rows = filtered.slice((f.page - 1) * INVOICES_PAGE_SIZE, f.page * INVOICES_PAGE_SIZE);

  const thirtyDaysAgo = addDays(today, -30);
  const stats = {
    outstandingCents: summarised
      .filter((i) => isOutstanding(i.summary.displayStatus))
      .reduce((s, i) => s + i.summary.balanceCents, 0),
    overdueCents: summarised
      .filter((i) => i.summary.displayStatus === "OVERDUE")
      .reduce((s, i) => s + i.summary.balanceCents, 0),
    collected30Cents: summarised
      .flatMap((i) => i.payments)
      .filter((p) => p.paidAt >= thirtyDaysAgo)
      .reduce((s, p) => s + p.amountCents, 0),
  };

  return { rows, total: filtered.length, pageCount, counts, stats };
}

export const getInvoice = cache(async (id: string) => {
  return db.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      application: { include: { scheme: true } },
      lines: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "asc" } },
    },
  });
});

export async function listApplicationOptions() {
  const apps = await db.grantApplication.findMany({
    orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      clientId: true,
      year: true,
      scheme: { select: { name: true, code: true, defaultFeeCents: true } },
    },
  });
  return apps.map((a) => ({
    id: a.id,
    clientId: a.clientId,
    label: `${a.scheme.name} ${a.year}`,
    defaultFeeCents: a.scheme.defaultFeeCents,
  }));
}
