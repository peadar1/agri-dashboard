import { z } from "zod";
import { ApplicationStatus, DocumentStatus } from "@/generated/prisma/enums";
import { optionalText, requiredText } from "./form";
import { optionalDate, optionalEuro } from "./settings";

const id = (label: string) => z.string({ error: `Choose a ${label}` }).min(1, `Choose a ${label}`);

export const applicationDetailsSchema = z.object({
  deadline: optionalDate,
  dafmReference: optionalText(60),
  amountApplied: optionalEuro,
  amountApproved: optionalEuro,
  notes: optionalText(4000),
});

export const createApplicationSchema = applicationDetailsSchema.omit({ amountApproved: true }).extend({
  clientId: id("client"),
  schemeId: id("scheme"),
  year: z.coerce.number({ error: "Enter a year" }).int().min(2000).max(2100),
});

export const statusSchema = z.enum(ApplicationStatus);
export const documentStatusSchema = z.enum(DocumentStatus);

export const documentSchema = z.object({
  name: requiredText("Document name", 120),
});
