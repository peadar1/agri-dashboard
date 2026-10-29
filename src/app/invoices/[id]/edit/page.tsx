import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateInvoice } from "@/lib/actions/invoices";
import { listClientOptions } from "@/lib/queries/clients";
import { getInvoice, listApplicationOptions } from "@/lib/queries/invoices";
import { getBusinessSettings } from "@/lib/queries/settings";
import { toDateInput } from "@/lib/domain/dates";
import { centsToInput } from "@/lib/domain/money";
import { InvoiceForm } from "../../invoice-form";

export default async function EditInvoicePage({ params }: PageProps<"/invoices/[id]/edit">) {
  const { id } = await params;
  const [invoice, clients, applications, settings] = await Promise.all([
    getInvoice(id),
    listClientOptions(),
    listApplicationOptions(),
    getBusinessSettings(),
  ]);
  if (!invoice) notFound();
  if (invoice.status !== "DRAFT") redirect(`/invoices/${id}`);

  return (
    <>
      <PageHeader title="Edit draft invoice" back={{ href: `/invoices/${id}`, label: "Back to invoice" }} />
      <InvoiceForm
        action={updateInvoice.bind(null, id)}
        clients={clients}
        applications={applications}
        paymentTermsDays={settings.paymentTermsDays}
        cancelHref={`/invoices/${id}`}
        values={{
          clientId: invoice.clientId,
          applicationId: invoice.applicationId ?? undefined,
          issueDate: toDateInput(invoice.issueDate),
          dueDate: toDateInput(invoice.dueDate),
          vatRate: String(invoice.vatRateBps / 100),
          notes: invoice.notes ?? undefined,
          lines: invoice.lines.map((l) => ({
            description: l.description,
            kind: l.kind,
            quantity: String(l.quantity),
            unitPrice: centsToInput(l.unitPriceCents),
          })),
        }}
      />
    </>
  );
}
