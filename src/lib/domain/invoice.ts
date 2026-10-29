import type { InvoiceStatus } from "@/generated/prisma/enums";
import { vatCents } from "./money";

export type InvoiceDisplayStatus = "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "OVERDUE" | "VOID";

export interface LineAmounts {
  quantity: number;
  unitPriceCents: number;
}

export interface InvoiceTotals {
  netCents: number;
  vatCents: number;
  grossCents: number;
}

export function lineTotalCents(line: LineAmounts): number {
  return Math.round(line.quantity * line.unitPriceCents);
}

export function invoiceTotals(lines: LineAmounts[], vatRateBps: number): InvoiceTotals {
  const netCents = lines.reduce((sum, line) => sum + lineTotalCents(line), 0);
  const vat = vatCents(netCents, vatRateBps);
  return { netCents, vatCents: vat, grossCents: netCents + vat };
}

export function sumPayments(payments: { amountCents: number }[]): number {
  return payments.reduce((sum, p) => sum + p.amountCents, 0);
}

export function deriveInvoiceStatus(
  invoice: { status: InvoiceStatus; dueDate: Date; grossCents: number; paidCents: number },
  today: Date,
): InvoiceDisplayStatus {
  if (invoice.status === "DRAFT" || invoice.status === "VOID") return invoice.status;
  if (invoice.paidCents >= invoice.grossCents) return "PAID";
  if (invoice.dueDate.getTime() < today.getTime()) return "OVERDUE";
  if (invoice.paidCents > 0) return "PARTIAL";
  return "ISSUED";
}

export interface InvoiceSummary extends InvoiceTotals {
  paidCents: number;
  balanceCents: number;
  displayStatus: InvoiceDisplayStatus;
}

export function summariseInvoice(
  invoice: {
    status: InvoiceStatus;
    dueDate: Date;
    vatRateBps: number;
    lines: LineAmounts[];
    payments: { amountCents: number }[];
  },
  today: Date,
): InvoiceSummary {
  const totals = invoiceTotals(invoice.lines, invoice.vatRateBps);
  const paidCents = sumPayments(invoice.payments);
  const balanceCents = invoice.status === "VOID" ? 0 : Math.max(totals.grossCents - paidCents, 0);
  return {
    ...totals,
    paidCents,
    balanceCents,
    displayStatus: deriveInvoiceStatus(
      { status: invoice.status, dueDate: invoice.dueDate, grossCents: totals.grossCents, paidCents },
      today,
    ),
  };
}

export function isOutstanding(status: InvoiceDisplayStatus): boolean {
  return status === "ISSUED" || status === "PARTIAL" || status === "OVERDUE";
}

export function formatInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(4, "0")}`;
}
