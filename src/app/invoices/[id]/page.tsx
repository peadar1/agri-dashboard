import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/skeletons";
import { InvoiceStatusBadge } from "@/components/status-badges";
import { getInvoice } from "@/lib/queries/invoices";
import { formatDate, toDateInput } from "@/lib/domain/dates";
import { lineTotalCents, summariseInvoice } from "@/lib/domain/invoice";
import { LINE_KIND_LABELS, PAYMENT_METHOD_LABELS, countyLabel } from "@/lib/domain/labels";
import { centsToInput, formatEuro, formatVatRate } from "@/lib/domain/money";
import { getToday } from "@/lib/today";
import { DeletePaymentButton, InvoiceActions, PaymentForm } from "./invoice-actions";

export async function generateMetadata({ params }: PageProps<"/invoices/[id]">): Promise<Metadata> {
  const { id } = await params;
  const invoice = await getInvoice(id);
  return { title: invoice ? (invoice.number ?? "Draft invoice") : "Invoice not found" };
}

export default function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <InvoiceDetail params={params} />
    </Suspense>
  );
}

async function InvoiceDetail({ params }: Pick<PageProps<"/invoices/[id]">, "params">) {
  const { id } = await params;
  const [invoice, today] = await Promise.all([getInvoice(id), getToday()]);
  if (!invoice) notFound();

  const summary = summariseInvoice(invoice, today);
  const { client } = invoice;

  return (
    <>
      <PageHeader
        back={{ href: "/invoices", label: "Invoices" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {invoice.number ?? "Draft invoice"}
            <InvoiceStatusBadge status={summary.displayStatus} />
          </span>
        }
        description={`Issued ${formatDate(invoice.issueDate)} · due ${formatDate(invoice.dueDate)}`}
        actions={<InvoiceActions id={invoice.id} status={invoice.status} hasPayments={invoice.payments.length > 0} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Bill to</p>
                <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                  {client.firstName} {client.lastName}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {[client.addressLine1, client.town, `Co. ${countyLabel(client.county)}`, client.eircode].filter(Boolean).join(", ")}
                </p>
                <p className="mt-1 font-mono text-xs">Herd {client.herdNumber}</p>
              </div>
              {invoice.application && (
                <div>
                  <p className="text-xs text-muted-foreground">For application</p>
                  <Link href={`/applications/${invoice.application.id}`} className="font-medium hover:underline">
                    {invoice.application.scheme.name} {invoice.application.year}
                  </Link>
                  {invoice.application.dafmReference && (
                    <p className="font-mono text-xs">{invoice.application.dafmReference}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="pr-4 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="pl-4 whitespace-normal">{line.description}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{LINE_KIND_LABELS[line.kind]}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.quantity}
                      {line.kind === "HOURLY" && " h"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatEuro(line.unitPriceCents)}</TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">{formatEuro(lineTotalCents(line))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="pl-4 text-right text-muted-foreground">Subtotal</TableCell>
                  <TableCell className="pr-4 text-right tabular-nums">{formatEuro(summary.netCents)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="pl-4 text-right text-muted-foreground">VAT @ {formatVatRate(invoice.vatRateBps)}</TableCell>
                  <TableCell className="pr-4 text-right tabular-nums">{formatEuro(summary.vatCents)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className="pl-4 text-right font-semibold">Total</TableCell>
                  <TableCell className="pr-4 text-right font-semibold tabular-nums">{formatEuro(summary.grossCents)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </Card>

          {invoice.notes && (
            <Card>
              <CardContent className="text-sm whitespace-pre-line">{invoice.notes}</CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Balance</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className={`text-3xl font-semibold tabular-nums ${summary.displayStatus === "OVERDUE" ? "text-destructive" : ""}`}>
                {formatEuro(summary.balanceCents)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatEuro(summary.paidCents)} paid of {formatEuro(summary.grossCents)}
              </p>
              {invoice.payments.length > 0 && (
                <ul className="divide-y border-t text-sm">
                  {invoice.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                      <span>
                        <span className="font-medium tabular-nums">{formatEuro(p.amountCents)}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDate(p.paidAt)} · {PAYMENT_METHOD_LABELS[p.method]}
                          {p.reference && ` · ${p.reference}`}
                        </span>
                      </span>
                      {invoice.status === "ISSUED" && <DeletePaymentButton paymentId={p.id} invoiceId={invoice.id} />}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {invoice.status === "ISSUED" && summary.balanceCents > 0 && (
            <Card>
              <CardHeader><CardTitle>Record a payment</CardTitle></CardHeader>
              <CardContent>
                <PaymentForm invoiceId={invoice.id} balance={centsToInput(summary.balanceCents)} today={toDateInput(today)} />
              </CardContent>
            </Card>
          )}
          {invoice.status === "DRAFT" && (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              This is a draft. Issue it to give it an invoice number, generate the PDF and start tracking payment.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
