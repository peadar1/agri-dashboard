import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoice } from "@/lib/queries/invoices";
import { getBusinessSettings } from "@/lib/queries/settings";
import { summariseInvoice } from "@/lib/domain/invoice";
import { getToday } from "@/lib/today";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";

export async function GET(_request: Request, ctx: RouteContext<"/invoices/[id]/pdf">) {
  const { id } = await ctx.params;
  const [invoice, business, today] = await Promise.all([getInvoice(id), getBusinessSettings(), getToday()]);
  if (!invoice) return new Response("Invoice not found", { status: 404 });
  if (invoice.status === "DRAFT" || !invoice.number) {
    return new Response("Issue the invoice before generating a PDF", { status: 409 });
  }

  const pdf = await renderToBuffer(
    <InvoiceDocument
      data={{
        number: invoice.number,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        vatRateBps: invoice.vatRateBps,
        notes: invoice.notes,
        summary: summariseInvoice(invoice, today),
        lines: invoice.lines,
        client: invoice.client,
        applicationLabel: invoice.application
          ? `${invoice.application.scheme.name} ${invoice.application.year}${invoice.application.dafmReference ? ` (${invoice.application.dafmReference})` : ""}`
          : null,
        business,
      }}
    />,
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
