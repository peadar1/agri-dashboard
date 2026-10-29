import { z } from "zod";
import { parseEuroToCents } from "@/lib/domain/money";
import { parseDateOnly } from "@/lib/domain/dates";
import { optionalText, requiredText } from "./form";

const blank = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const optionalEuro = z.preprocess(
  blank,
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined) return undefined;
      const cents = parseEuroToCents(v);
      if (cents === null || cents < 0) {
        ctx.addIssue({ code: "custom", message: "Enter an amount like 350 or 350.00" });
        return z.NEVER;
      }
      return cents;
    }),
);

export const requiredDate = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .transform((v, ctx) => {
      const date = parseDateOnly(v);
      if (!date) {
        ctx.addIssue({ code: "custom", message: `${label} is required` });
        return z.NEVER;
      }
      return date;
    });

export const optionalDate = z.preprocess(
  blank,
  z
    .string()
    .optional()
    .transform((v, ctx) => {
      if (v === undefined) return undefined;
      const date = parseDateOnly(v);
      if (!date) {
        ctx.addIssue({ code: "custom", message: "Enter a valid date" });
        return z.NEVER;
      }
      return date;
    }),
);

export const businessSettingsSchema = z.object({
  businessName: requiredText("Business name", 120),
  ownerName: optionalText(120),
  address: requiredText("Address", 500),
  phone: optionalText(40),
  email: z.preprocess(blank, z.email("Enter a valid email address").optional()),
  vatNumber: optionalText(20),
  iban: optionalText(40).transform((v) => v?.replace(/\s/g, "").toUpperCase()),
  bic: optionalText(15).transform((v) => v?.toUpperCase()),
  paymentTermsDays: z.coerce.number({ error: "Enter a number of days" }).int().min(0).max(365),
  invoiceFooter: optionalText(500),
});

export const schemeSchema = z.object({
  code: requiredText("Code", 20)
    .transform((v) => v.toUpperCase().replace(/\s+/g, "-"))
    .refine((v) => /^[A-Z0-9-]+$/.test(v), "Use letters, numbers and dashes only"),
  name: requiredText("Name", 120),
  description: optionalText(1000),
  defaultFee: optionalEuro,
  active: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export const documentTemplateSchema = z.object({
  name: requiredText("Document name", 120),
});

export const deadlineSchema = z.object({
  title: requiredText("Title", 120),
  date: requiredDate("Date"),
  notes: optionalText(500),
});
