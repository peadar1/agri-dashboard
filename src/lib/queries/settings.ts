import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export const DEFAULT_BUSINESS = {
  id: 1,
  businessName: "Your Agri Consultancy",
  ownerName: null,
  address: "Main Street\nTown\nCo. Galway",
  phone: null,
  email: null,
  vatNumber: null,
  iban: null,
  bic: null,
  paymentTermsDays: 30,
  invoiceFooter: null,
};

export const getBusinessSettings = cache(async () => {
  return (await db.businessSettings.findUnique({ where: { id: 1 } })) ?? DEFAULT_BUSINESS;
});

export async function listSchemes() {
  return db.scheme.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { applications: true, documentTemplates: true } },
      deadlines: { orderBy: { date: "asc" } },
    },
  });
}

export async function getScheme(id: string) {
  return db.scheme.findUnique({
    where: { id },
    include: {
      documentTemplates: { orderBy: { sortOrder: "asc" } },
      deadlines: { orderBy: { date: "asc" } },
      _count: { select: { applications: true } },
    },
  });
}
