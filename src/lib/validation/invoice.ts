import { z } from "zod";
import { LineKind, PaymentMethod } from "@/generated/prisma/enums";
import { parseEuroToCents } from "@/lib/domain/money";
import { optionalText, requiredText } from "./form";
import { requiredDate } from "./settings";

const euroAmount = (label: string, opts: { positive?: boolean } = {}) =>
  z.string({ error: `${label} is required` }).transform((v, ctx) => {
    const cents = parseEuroToCents(v);
    if (cents === null || cents < 0 || (opts.positive && cents === 0)) {
      ctx.addIssue({ code: "custom", message: opts.positive ? `Enter an amount above €0` : `Enter a valid amount` });
      return z.NEVER;
    }
    return cents;
  });

export const invoiceLineSchema = z.object({
  description: requiredText("Description", 200),
  kind: z.enum(LineKind),
  quantity: z.coerce.number({ error: "Enter a quantity" }).positive("Must be more than 0").max(10_000),
  unitPrice: euroAmount("Price"),
});

export type InvoiceLineInput = z.input<typeof invoiceLineSchema>;

export const invoiceSchema = z
  .object({
    clientId: z.string({ error: "Choose a client" }).min(1, "Choose a client"),
    applicationId: optionalText(40),
    issueDate: requiredDate("Issue date"),
    dueDate: requiredDate("Due date"),
    vatRate: z.coerce
      .number({ error: "Enter a VAT rate" })
      .min(0, "VAT can't be negative")
      .max(100)
      .transform((pct) => Math.round(pct * 100)),
    notes: optionalText(1000),
    intent: z.enum(["draft", "issue"]).default("draft"),
    lines: z
      .string()
      .transform((raw, ctx) => {
        try {
          return JSON.parse(raw) as unknown;
        } catch {
          ctx.addIssue({ code: "custom", message: "Invalid line items" });
          return z.NEVER;
        }
      })
      .pipe(z.array(invoiceLineSchema).min(1, "Add at least one line item").max(50)),
  })
  .refine((v) => v.dueDate >= v.issueDate, { path: ["dueDate"], message: "Due date can't be before the issue date" });

export const paymentSchema = z.object({
  amount: euroAmount("Amount", { positive: true }),
  paidAt: requiredDate("Payment date"),
  method: z.enum(PaymentMethod, { error: "Choose a payment method" }),
  reference: optionalText(80),
});
