import { z } from "zod";
import { ActivityType, County, EnterpriseType } from "@/generated/prisma/enums";
import {
  isValidEircode,
  isValidHerdNumber,
  normaliseEircode,
  normaliseHerdNumber,
} from "@/lib/domain/identifiers";
import { optionalNumber, optionalText, requiredText } from "./form";

export const clientSchema = z
  .object({
    firstName: requiredText("First name", 80),
    lastName: requiredText("Last name", 80),
    phone: optionalText(40),
    email: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.email("Enter a valid email address").trim().optional(),
    ),
    addressLine1: optionalText(120),
    addressLine2: optionalText(120),
    town: optionalText(80),
    county: z.enum(County, { error: "Choose a county" }),
    eircode: optionalText(10)
      .refine((v) => v === undefined || isValidEircode(v), "Enter a valid Eircode, e.g. H91 E2K3")
      .transform((v) => (v ? normaliseEircode(v) : undefined)),
    herdNumber: requiredText("Herd number", 12)
      .refine(isValidHerdNumber, "Herd numbers are one letter followed by seven digits, e.g. G1234567")
      .transform(normaliseHerdNumber),
    enterpriseType: z.enum(EnterpriseType, { error: "Choose an enterprise type" }),
    totalHectares: optionalNumber({ min: 0, max: 100_000 }),
    eligibleHectares: optionalNumber({ min: 0, max: 100_000 }),
    latitude: optionalNumber({ min: 51, max: 56 }),
    longitude: optionalNumber({ min: -11, max: -5 }),
    agfoodId: optionalText(40),
    notes: optionalText(4000),
  })
  .refine(
    (c) => c.eligibleHectares === undefined || c.totalHectares === undefined || c.eligibleHectares <= c.totalHectares,
    { path: ["eligibleHectares"], message: "Eligible hectares can't exceed total hectares" },
  )
  .refine((c) => (c.latitude === undefined) === (c.longitude === undefined), {
    path: ["latitude"],
    message: "Set both latitude and longitude, or neither",
  });

export type ClientInput = z.infer<typeof clientSchema>;

export const activitySchema = z.object({
  type: z.enum(ActivityType),
  body: requiredText("Details", 4000),
});
