import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons";
import { createInvoice } from "@/lib/actions/invoices";
import { listClientOptions } from "@/lib/queries/clients";
import { listApplicationOptions } from "@/lib/queries/invoices";
import { getBusinessSettings } from "@/lib/queries/settings";
import { addDays, toDateInput } from "@/lib/domain/dates";
import { centsToInput } from "@/lib/domain/money";
import { getToday } from "@/lib/today";
import { InvoiceForm, type InvoiceFormValues } from "../invoice-form";

export const metadata: Metadata = { title: "New invoice" };

export default function NewInvoicePage({ searchParams }: PageProps<"/invoices/new">) {
  return (
    <>
      <PageHeader title="New invoice" back={{ href: "/invoices", label: "Invoices" }} />
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <FormLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function FormLoader({ searchParams }: Pick<PageProps<"/invoices/new">, "searchParams">) {
  const params = await searchParams;
  const today = await getToday();
  const [clients, applications, settings] = await Promise.all([
    listClientOptions(),
    listApplicationOptions(),
    getBusinessSettings(),
  ]);

  const application = applications.find((a) => a.id === params.applicationId);
  const clientId = application?.clientId ?? (typeof params.clientId === "string" ? params.clientId : undefined);

  const values: InvoiceFormValues = {
    clientId,
    applicationId: application?.id,
    issueDate: toDateInput(today),
    dueDate: toDateInput(addDays(today, settings.paymentTermsDays)),
    vatRate: "23",
    lines: application
      ? [
          {
            description: `${application.label} application: professional fee`,
            kind: "FIXED",
            quantity: "1",
            unitPrice: application.defaultFeeCents != null ? centsToInput(application.defaultFeeCents) : "",
          },
        ]
      : [],
  };

  const cancelHref = application ? `/applications/${application.id}` : clientId ? `/clients/${clientId}` : "/invoices";

  return (
    <InvoiceForm
      action={createInvoice}
      clients={clients}
      applications={applications}
      values={values}
      paymentTermsDays={settings.paymentTermsDays}
      cancelHref={cancelHref}
    />
  );
}
