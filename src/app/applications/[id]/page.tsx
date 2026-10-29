import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ReceiptEuro, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/confirm-action";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/skeletons";
import { ApplicationStatusBadge, InvoiceStatusBadge, UrgencyBadge } from "@/components/status-badges";
import { deleteApplication } from "@/lib/actions/applications";
import { getApplication } from "@/lib/queries/applications";
import { isAwaitingSubmission } from "@/lib/domain/application";
import { formatDate } from "@/lib/domain/dates";
import { daysUntil, deadlineUrgency, describeDaysUntil } from "@/lib/domain/deadlines";
import { summariseInvoice } from "@/lib/domain/invoice";
import { formatEuro } from "@/lib/domain/money";
import { getToday } from "@/lib/today";
import { DetailsForm } from "./details-form";
import { DocumentChecklist } from "./document-checklist";
import { StatusControls } from "./status-controls";

export async function generateMetadata({ params }: PageProps<"/applications/[id]">): Promise<Metadata> {
  const { id } = await params;
  const app = await getApplication(id);
  return { title: app ? `${app.scheme.code} ${app.year} · ${app.client.lastName}` : "Application not found" };
}

export default function ApplicationPage({ params }: PageProps<"/applications/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ApplicationDetail params={params} />
    </Suspense>
  );
}

async function ApplicationDetail({ params }: Pick<PageProps<"/applications/[id]">, "params">) {
  const { id } = await params;
  const [app, today] = await Promise.all([getApplication(id), getToday()]);
  if (!app) notFound();

  const invoices = app.invoices.map((inv) => ({ ...inv, summary: summariseInvoice(inv, today) }));
  const showUrgency = app.deadline && isAwaitingSubmission(app.status);

  return (
    <>
      <PageHeader
        back={{ href: "/applications", label: "Applications" }}
        title={`${app.scheme.name} ${app.year}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Link href={`/clients/${app.client.id}`} className="font-medium text-foreground hover:underline">
              {app.client.firstName} {app.client.lastName}
            </Link>
            <span className="font-mono">{app.client.herdNumber}</span>
            <ApplicationStatusBadge status={app.status} />
          </span>
        }
        actions={
          <>
            <ConfirmAction
              trigger={<Button variant="ghost"><Trash2 /> Delete</Button>}
              title="Delete this application?"
              description="Its document checklist and uploaded files will be removed. Linked invoices are kept."
              confirmLabel="Delete"
              action={deleteApplication.bind(null, app.id)}
            />
            <Button asChild>
              <Link href={`/invoices/new?applicationId=${app.id}`}><ReceiptEuro /> Create invoice</Link>
            </Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <StatusControls id={app.id} status={app.status} />
          <dl className="grid shrink-0 grid-cols-3 gap-6 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Deadline</dt>
              <dd className="font-medium">{app.deadline ? formatDate(app.deadline) : "—"}</dd>
              {showUrgency && (
                <dd className="mt-0.5">
                  <UrgencyBadge urgency={deadlineUrgency(app.deadline!, today)}>
                    {describeDaysUntil(daysUntil(app.deadline!, today))}
                  </UrgencyBadge>
                </dd>
              )}
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Submitted</dt>
              <dd className="font-medium">{app.submittedAt ? formatDate(app.submittedAt) : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Decision</dt>
              <dd className="font-medium">{app.decisionAt ? formatDate(app.decisionAt) : "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Document checklist</CardTitle>
            <CardDescription>Tick documents off as they come in, or upload a scan.</CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentChecklist
              applicationId={app.id}
              documents={app.documents.map(({ id, name, status, fileName }) => ({ id, name, status, fileName }))}
            />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              <DetailsForm
                id={app.id}
                values={{
                  deadline: app.deadline,
                  dafmReference: app.dafmReference,
                  amountAppliedCents: app.amountAppliedCents,
                  amountApprovedCents: app.amountApprovedCents,
                  notes: app.notes,
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Not invoiced yet.
                  {app.scheme.defaultFeeCents != null && ` Default fee for ${app.scheme.code} is ${formatEuro(app.scheme.defaultFeeCents)} + VAT.`}
                </p>
              ) : (
                <ul className="divide-y">
                  {invoices.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">{inv.number ?? "Draft"}</Link>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums">{formatEuro(inv.summary.grossCents)}</span>
                        <InvoiceStatusBadge status={inv.summary.displayStatus} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
