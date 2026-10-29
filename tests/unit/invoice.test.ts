import { describe, expect, it } from "vitest";
import {
  deriveInvoiceStatus,
  formatInvoiceNumber,
  invoiceTotals,
  lineTotalCents,
  summariseInvoice,
} from "@/lib/domain/invoice";
import { parseDateOnly } from "@/lib/domain/dates";

const today = parseDateOnly("2026-10-29")!;
const due = (iso: string) => parseDateOnly(iso)!;

describe("line and invoice totals", () => {
  it("multiplies hours by rate for hourly lines", () => {
    expect(lineTotalCents({ quantity: 2.5, unitPriceCents: 6000 })).toBe(15000);
  });

  it("sums lines and adds VAT on the net total", () => {
    const totals = invoiceTotals(
      [
        { quantity: 1, unitPriceCents: 35000 },
        { quantity: 1.5, unitPriceCents: 6000 },
      ],
      2300,
    );
    expect(totals).toEqual({ netCents: 44000, vatCents: 10120, grossCents: 54120 });
  });

  it("returns zero for an invoice with no lines", () => {
    expect(invoiceTotals([], 2300).grossCents).toBe(0);
  });
});

describe("deriveInvoiceStatus", () => {
  const base = { status: "ISSUED" as const, grossCents: 10000 };

  it("keeps draft and void as-is regardless of dates", () => {
    expect(deriveInvoiceStatus({ ...base, status: "DRAFT", dueDate: due("2020-01-01"), paidCents: 0 }, today)).toBe("DRAFT");
    expect(deriveInvoiceStatus({ ...base, status: "VOID", dueDate: due("2020-01-01"), paidCents: 0 }, today)).toBe("VOID");
  });

  it("is paid once payments cover the gross total", () => {
    expect(deriveInvoiceStatus({ ...base, dueDate: due("2020-01-01"), paidCents: 10000 }, today)).toBe("PAID");
  });

  it("is overdue when past due with a balance, even if part paid", () => {
    expect(deriveInvoiceStatus({ ...base, dueDate: due("2026-10-28"), paidCents: 5000 }, today)).toBe("OVERDUE");
  });

  it("is not overdue on the due date itself", () => {
    expect(deriveInvoiceStatus({ ...base, dueDate: due("2026-10-29"), paidCents: 0 }, today)).toBe("ISSUED");
  });

  it("is part paid before the due date", () => {
    expect(deriveInvoiceStatus({ ...base, dueDate: due("2026-11-30"), paidCents: 2500 }, today)).toBe("PARTIAL");
  });
});

describe("summariseInvoice", () => {
  it("computes balance and status together", () => {
    const summary = summariseInvoice(
      {
        status: "ISSUED",
        dueDate: due("2026-11-15"),
        vatRateBps: 2300,
        lines: [{ quantity: 1, unitPriceCents: 20000 }],
        payments: [{ amountCents: 10000 }],
      },
      today,
    );
    expect(summary).toMatchObject({ grossCents: 24600, paidCents: 10000, balanceCents: 14600, displayStatus: "PARTIAL" });
  });

  it("never reports a negative balance on overpayment", () => {
    const summary = summariseInvoice(
      { status: "ISSUED", dueDate: due("2026-11-15"), vatRateBps: 0, lines: [{ quantity: 1, unitPriceCents: 100 }], payments: [{ amountCents: 150 }] },
      today,
    );
    expect(summary.balanceCents).toBe(0);
  });
});

describe("formatInvoiceNumber", () => {
  it("zero-pads the yearly sequence", () => {
    expect(formatInvoiceNumber(2026, 7)).toBe("INV-2026-0007");
  });
});
