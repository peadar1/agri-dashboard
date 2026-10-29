import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { ApplicationStatus } from "@/generated/prisma/enums";

export const APPLICATIONS_PAGE_SIZE = 30;

export interface ApplicationFilters {
  q?: string;
  status?: ApplicationStatus;
  scheme?: string;
  year?: number;
  view: "table" | "board";
  page: number;
}

export function parseApplicationFilters(params: Record<string, string | string[] | undefined>): ApplicationFilters {
  const str = (key: string) => (typeof params[key] === "string" && params[key] ? (params[key] as string) : undefined);
  const status = str("status");
  const year = Number.parseInt(str("year") ?? "", 10);
  return {
    q: str("q")?.trim(),
    status: status && status in ApplicationStatus ? (status as ApplicationStatus) : undefined,
    scheme: str("scheme"),
    year: Number.isFinite(year) ? year : undefined,
    view: str("view") === "board" ? "board" : "table",
    page: Math.max(1, Number.parseInt(str("page") ?? "1", 10) || 1),
  };
}

function whereFor(f: ApplicationFilters): Prisma.GrantApplicationWhereInput {
  const where: Prisma.GrantApplicationWhereInput = {};
  if (f.status) where.status = f.status;
  if (f.scheme) where.schemeId = f.scheme;
  if (f.year) where.year = f.year;
  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" as const };
    where.OR = [
      { client: { firstName: contains } },
      { client: { lastName: contains } },
      { client: { herdNumber: { contains: f.q.replace(/\s/g, ""), mode: "insensitive" } } },
      { dafmReference: contains },
    ];
  }
  return where;
}

const listInclude = {
  client: { select: { id: true, firstName: true, lastName: true, herdNumber: true, county: true } },
  scheme: { select: { id: true, name: true, code: true } },
  documents: { select: { status: true } },
} satisfies Prisma.GrantApplicationInclude;

export async function listApplications(f: ApplicationFilters) {
  const where = whereFor(f);
  const orderBy: Prisma.GrantApplicationOrderByWithRelationInput[] = [
    { deadline: { sort: "asc", nulls: "last" } },
    { updatedAt: "desc" },
  ];

  if (f.view === "board") {
    const rows = await db.grantApplication.findMany({ where, orderBy, include: listInclude, take: 400 });
    return { rows, total: rows.length, pageCount: 1 };
  }

  const [total, rows] = await Promise.all([
    db.grantApplication.count({ where }),
    db.grantApplication.findMany({
      where,
      orderBy,
      include: listInclude,
      skip: (f.page - 1) * APPLICATIONS_PAGE_SIZE,
      take: APPLICATIONS_PAGE_SIZE,
    }),
  ]);
  return { rows, total, pageCount: Math.max(1, Math.ceil(total / APPLICATIONS_PAGE_SIZE)) };
}

export async function listApplicationYears() {
  const years = await db.grantApplication.findMany({ distinct: ["year"], select: { year: true }, orderBy: { year: "desc" } });
  return years.map((y) => y.year);
}

export const getApplication = cache(async (id: string) => {
  return db.grantApplication.findUnique({
    where: { id },
    include: {
      client: true,
      scheme: true,
      documents: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      invoices: { include: { lines: true, payments: true }, orderBy: { issueDate: "desc" } },
    },
  });
});

export async function listSchemesForForm(today: Date) {
  const schemes = await db.scheme.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { deadlines: { where: { date: { gte: today } }, orderBy: { date: "asc" }, take: 1 } },
  });
  return schemes.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    defaultFeeCents: s.defaultFeeCents,
    nextDeadline: s.deadlines[0]?.date.toISOString().slice(0, 10) ?? null,
  }));
}
