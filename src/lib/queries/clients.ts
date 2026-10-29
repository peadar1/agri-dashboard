import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { County, EnterpriseType } from "@/generated/prisma/enums";
import { summariseInvoice, isOutstanding } from "@/lib/domain/invoice";

export const CLIENTS_PAGE_SIZE = 25;

export interface ClientFilters {
  q?: string;
  county?: string;
  enterprise?: string;
  scheme?: string;
  page: number;
}

export function parseClientFilters(params: Record<string, string | string[] | undefined>): ClientFilters {
  const str = (key: string) => (typeof params[key] === "string" && params[key] ? (params[key] as string) : undefined);
  const page = Math.max(1, Number.parseInt(str("page") ?? "1", 10) || 1);
  return {
    q: str("q")?.trim(),
    county: str("county") && str("county")! in County ? str("county") : undefined,
    enterprise: str("enterprise") && str("enterprise")! in EnterpriseType ? str("enterprise") : undefined,
    scheme: str("scheme"),
    page,
  };
}

function whereFor(filters: ClientFilters): Prisma.ClientWhereInput {
  const where: Prisma.ClientWhereInput = {};
  if (filters.q) {
    const contains = { contains: filters.q, mode: "insensitive" as const };
    const compact = filters.q.replace(/\s/g, "");
    where.OR = [
      { firstName: contains },
      { lastName: contains },
      { herdNumber: { contains: compact, mode: "insensitive" } },
      { town: contains },
      { eircode: contains },
      { phone: { contains: compact } },
    ];
    const [first, ...rest] = filters.q.split(/\s+/);
    if (rest.length) {
      where.OR.push({
        AND: [
          { firstName: { contains: first, mode: "insensitive" } },
          { lastName: { contains: rest.join(" "), mode: "insensitive" } },
        ],
      });
    }
  }
  if (filters.county) where.county = filters.county as County;
  if (filters.enterprise) where.enterpriseType = filters.enterprise as EnterpriseType;
  if (filters.scheme) where.applications = { some: { schemeId: filters.scheme } };
  return where;
}

export async function listClients(filters: ClientFilters, today: Date) {
  const where = whereFor(filters);
  const [total, clients] = await Promise.all([
    db.client.count({ where }),
    db.client.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (filters.page - 1) * CLIENTS_PAGE_SIZE,
      take: CLIENTS_PAGE_SIZE,
      include: {
        applications: { select: { status: true } },
        invoices: {
          where: { status: "ISSUED" },
          select: {
            status: true,
            dueDate: true,
            vatRateBps: true,
            lines: { select: { quantity: true, unitPriceCents: true } },
            payments: { select: { amountCents: true } },
          },
        },
      },
    }),
  ]);

  const rows = clients.map(({ invoices, applications, ...client }) => {
    const summaries = invoices.map((inv) => summariseInvoice(inv, today));
    return {
      ...client,
      activeApplications: applications.filter((a) =>
        ["DRAFT", "GATHERING_DOCS", "READY", "SUBMITTED"].includes(a.status),
      ).length,
      outstandingCents: summaries
        .filter((s) => isOutstanding(s.displayStatus))
        .reduce((sum, s) => sum + s.balanceCents, 0),
      hasOverdue: summaries.some((s) => s.displayStatus === "OVERDUE"),
    };
  });

  return { rows, total, pageCount: Math.max(1, Math.ceil(total / CLIENTS_PAGE_SIZE)) };
}

export const getClient = cache(async (id: string) => {
  return db.client.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { occurredAt: "desc" }, take: 50 },
      applications: {
        orderBy: [{ year: "desc" }, { createdAt: "desc" }],
        include: { scheme: true, documents: { select: { status: true } } },
      },
      invoices: {
        orderBy: { issueDate: "desc" },
        include: { lines: true, payments: true },
      },
    },
  });
});

export async function getClientRecord(id: string) {
  return db.client.findUnique({
    where: { id },
    omit: { createdAt: true, updatedAt: true },
  });
}

export async function listClientOptions() {
  const clients = await db.client.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, herdNumber: true, town: true },
  });
  return clients.map((c) => ({
    id: c.id,
    label: `${c.lastName}, ${c.firstName}`,
    detail: [c.herdNumber, c.town].filter(Boolean).join(" · "),
  }));
}

export async function listSchemeOptions() {
  return db.scheme.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, code: true, active: true } });
}
