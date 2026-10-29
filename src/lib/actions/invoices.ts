"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { formatInvoiceNumber, summariseInvoice } from "@/lib/domain/invoice";
import { formatEuro } from "@/lib/domain/money";
import { todayDateOnly } from "@/lib/domain/dates";
import { invoiceSchema, paymentSchema } from "@/lib/validation/invoice";
import { formDataToObject, validationFailure, type FormState } from "@/lib/validation/form";

type Tx = Prisma.TransactionClient;

async function allocateNumber(tx: Tx, issueDate: Date): Promise<string> {
  const year = issueDate.getUTCFullYear();
  const seq = await tx.invoiceSequence.upsert({
    where: { year },
    create: { year, last: 1 },
    update: { last: { increment: 1 } },
  });
  return formatInvoiceNumber(year, seq.last);
}

function revalidateInvoice(id: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/invoices/${id}`);
}

type ParsedInvoice =
  | { success: true; data: z.output<typeof invoiceSchema> }
  | { success: false; error: FormState };

async function parseInvoice(formData: FormData): Promise<ParsedInvoice> {
  const parsed = invoiceSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const failure = validationFailure(parsed.error);
    const lineErrors = parsed.error.issues.filter((i) => i.path[0] === "lines");
    if (lineErrors.length) {
      const first = lineErrors[0];
      const row = typeof first.path[1] === "number" ? `Line ${first.path[1] + 1}: ` : "";
      failure.errors = { ...failure.errors, lines: [`${row}${first.message}`] };
    }
    return { success: false, error: failure };
  }

  const { applicationId, clientId } = parsed.data;
  if (applicationId) {
    const app = await db.grantApplication.findUnique({ where: { id: applicationId }, select: { clientId: true } });
    if (!app || app.clientId !== clientId) {
      return { success: false, error: { ok: false, errors: { applicationId: ["That application belongs to a different client"] } } };
    }
  }
  return { success: true, data: parsed.data };
}

function linesData(lines: { description: string; kind: "FIXED" | "HOURLY"; quantity: number; unitPrice: number }[]) {
  return lines.map((l, i) => ({
    description: l.description,
    kind: l.kind,
    quantity: l.quantity,
    unitPriceCents: l.unitPrice,
    sortOrder: i,
  }));
}

export async function createInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = await parseInvoice(formData);
  if (!result.success) return result.error;
  const { lines, intent, applicationId, notes, vatRate, ...rest } = result.data;

  const invoice = await db.$transaction(async (tx) =>
    tx.invoice.create({
      data: {
        ...rest,
        applicationId: applicationId ?? null,
        notes: notes ?? null,
        vatRateBps: vatRate,
        status: intent === "issue" ? "ISSUED" : "DRAFT",
        number: intent === "issue" ? await allocateNumber(tx, rest.issueDate) : null,
        lines: { create: linesData(lines) },
      },
    }),
  );

  revalidatePath("/", "layout");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoice(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const existing = await db.invoice.findUnique({ where: { id }, select: { status: true } });
  if (existing?.status !== "DRAFT") return { ok: false, message: "Only draft invoices can be edited." };

  const result = await parseInvoice(formData);
  if (!result.success) return result.error;
  const { lines, intent, applicationId, notes, vatRate, ...rest } = result.data;

  await db.$transaction(async (tx) => {
    await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
    await tx.invoice.update({
      where: { id },
      data: {
        ...rest,
        applicationId: applicationId ?? null,
        notes: notes ?? null,
        vatRateBps: vatRate,
        ...(intent === "issue" && { status: "ISSUED", number: await allocateNumber(tx, rest.issueDate) }),
        lines: { create: linesData(lines) },
      },
    });
  });

  revalidateInvoice(id);
  redirect(`/invoices/${id}`);
}

export async function issueInvoice(id: string): Promise<FormState> {
  const invoice = await db.invoice.findUnique({ where: { id }, include: { lines: true } });
  if (!invoice || invoice.status !== "DRAFT") return { ok: false, message: "Only drafts can be issued." };
  if (invoice.lines.length === 0) return { ok: false, message: "Add a line item before issuing." };

  const number = await db.$transaction(async (tx) => {
    const allocated = await allocateNumber(tx, invoice.issueDate);
    await tx.invoice.update({ where: { id }, data: { status: "ISSUED", number: allocated } });
    return allocated;
  });
  revalidateInvoice(id);
  return { ok: true, message: `Issued as ${number}.` };
}

export async function voidInvoice(id: string): Promise<FormState> {
  const invoice = await db.invoice.findUnique({ where: { id }, include: { _count: { select: { payments: true } } } });
  if (!invoice || invoice.status !== "ISSUED") return { ok: false, message: "Only issued invoices can be voided." };
  if (invoice._count.payments > 0) return { ok: false, message: "Remove recorded payments before voiding." };

  await db.invoice.update({ where: { id }, data: { status: "VOID" } });
  revalidateInvoice(id);
  return { ok: true, message: "Invoice voided." };
}

export async function deleteInvoice(id: string): Promise<FormState> {
  const invoice = await db.invoice.findUnique({ where: { id }, select: { status: true } });
  if (invoice?.status !== "DRAFT") {
    return { ok: false, message: "Issued invoices can't be deleted. Void them instead." };
  }
  await db.invoice.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/invoices");
}

export async function recordPayment(invoiceId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = paymentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true, payments: true },
  });
  if (!invoice || invoice.status !== "ISSUED") {
    return { ok: false, message: "Payments can only be recorded against issued invoices." };
  }
  const { balanceCents } = summariseInvoice(invoice, todayDateOnly());
  if (parsed.data.amount > balanceCents) {
    return {
      ok: false,
      errors: { amount: [`That's more than the ${formatEuro(balanceCents)} outstanding`] },
    };
  }

  await db.$transaction([
    db.payment.create({
      data: {
        invoiceId,
        amountCents: parsed.data.amount,
        paidAt: parsed.data.paidAt,
        method: parsed.data.method,
        reference: parsed.data.reference ?? null,
      },
    }),
    db.activity.create({
      data: {
        clientId: invoice.clientId,
        type: "PAYMENT",
        body: `Paid ${formatEuro(parsed.data.amount)} against ${invoice.number}.`,
      },
    }),
  ]);
  revalidateInvoice(invoiceId);
  return { ok: true, message: "Payment recorded." };
}

export async function deletePayment(paymentId: string, invoiceId: string): Promise<void> {
  await db.payment.delete({ where: { id: paymentId, invoiceId } });
  revalidateInvoice(invoiceId);
}
