import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  FilePlus2,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ReceiptEuro,
  Tractor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/skeletons";
import { ApplicationStatusBadge, InvoiceStatusBadge } from "@/components/status-badges";
import { getClient } from "@/lib/queries/clients";
import { checklistProgress } from "@/lib/domain/application";
import { formatDate, formatDateTime } from "@/lib/domain/dates";
import { isOutstanding, summariseInvoice } from "@/lib/domain/invoice";
import { ACTIVITY_LABELS, countyLabel, ENTERPRISE_LABELS } from "@/lib/domain/labels";
import { formatEuro } from "@/lib/domain/money";
import { getToday } from "@/lib/today";
import { ActivityForm, DeleteActivityButton } from "./activity-log";
import { ClientLocation } from "./client-location";

export async function generateMetadata({ params }: PageProps<"/clients/[id]">): Promise<Metadata> {
  const { id } = await params;
  const client = await getClient(id);
  return { title: client ? `${client.firstName} ${client.lastName}` : "Client not found" };
}

export default function ClientPage({ params }: PageProps<"/clients/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClientDetail params={params} />
    </Suspense>
  );
}

async function ClientDetail({ params }: Pick<PageProps<"/clients/[id]">, "params">) {
  const { id } = await params;
  const [client, today] = await Promise.all([getClient(id), getToday()]);
  if (!client) notFound();

  const invoices = client.invoices.map((inv) => ({ ...inv, summary: summariseInvoice(inv, today) }));
  const outstanding = invoices
    .filter((i) => isOutstanding(i.summary.displayStatus))
    .reduce((sum, i) => sum + i.summary.balanceCents, 0);
  const overdue = invoices.filter((i) => i.summary.displayStatus === "OVERDUE").length;
  const address = [client.addressLine1, client.addressLine2, client.town, `Co. ${countyLabel(client.county)}`, client.eircode]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        back={{ href: "/clients", label: "Clients" }}
        title={`${client.firstName} ${client.lastName}`}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono">{client.herdNumber}</span>
            <span>{ENTERPRISE_LABELS[client.enterpriseType]}</span>
            <span>{countyLabel(client.county)}</span>
          </span>
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/clients/${client.id}/edit`}><Pencil /> Edit</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/invoices/new?clientId=${client.id}`}><ReceiptEuro /> New invoice</Link>
            </Button>
            <Button asChild>
              <Link href={`/applications/new?clientId=${client.id}`}><FilePlus2 /> New application</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {client.phone && (
              <a href={`tel:${client.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:underline">
                <Phone className="size-4 text-muted-foreground" /> {client.phone}
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-2 break-all hover:underline">
                <Mail className="size-4 shrink-0 text-muted-foreground" /> {client.email}
              </a>
            )}
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> {address}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Farm</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Detail label="Total area" value={client.totalHectares != null ? `${client.totalHectares.toFixed(2)} ha` : "—"} />
              <Detail label="Eligible area" value={client.eligibleHectares != null ? `${client.eligibleHectares.toFixed(2)} ha` : "—"} />
              <Detail label="Agfood ID" value={client.agfoodId ?? "—"} mono />
              <Detail label="Client since" value={formatDate(client.createdAt)} />
              <Detail
                label="Outstanding"
                value={<span className={overdue ? "text-destructive" : undefined}>{formatEuro(outstanding)}</span>}
              />
              <Detail label="Overdue invoices" value={overdue || "None"} />
            </dl>
            {client.notes && <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-line">{client.notes}</p>}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Location</CardTitle></CardHeader>
          <CardContent>
            {client.latitude != null && client.longitude != null ? (
              <ClientLocation
                id={client.id}
                lat={client.latitude}
                lng={client.longitude}
                label={`${client.firstName} ${client.lastName}`}
                enterprise={client.enterpriseType}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No pin set. <Link href={`/clients/${client.id}/edit`} className="text-primary hover:underline">Add one</Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="applications" className="mt-6">
        <TabsList>
          <TabsTrigger value="applications">Applications ({client.applications.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({client.activities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="mt-4">
          {client.applications.length === 0 ? (
            <EmptyState icon={FileText} title="No applications yet" action={
              <Button asChild size="sm"><Link href={`/applications/new?clientId=${client.id}`}><FilePlus2 /> New application</Link></Button>
            } />
          ) : (
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Scheme</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Documents</TableHead>
                    <TableHead className="pr-4 text-right">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.applications.map((app) => {
                    const progress = checklistProgress(app.documents);
                    return (
                      <TableRow key={app.id} className="relative">
                        <TableCell className="pl-4 font-medium">
                          <Link href={`/applications/${app.id}`} className="after:absolute after:inset-0 hover:underline">{app.scheme.name}</Link>
                        </TableCell>
                        <TableCell>{app.year}</TableCell>
                        <TableCell><ApplicationStatusBadge status={app.status} /></TableCell>
                        <TableCell className="hidden tabular-nums sm:table-cell">{progress.received}/{progress.required}</TableCell>
                        <TableCell className="pr-4 text-right">{app.deadline ? formatDate(app.deadline) : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          {invoices.length === 0 ? (
            <EmptyState icon={ReceiptEuro} title="No invoices yet" action={
              <Button asChild size="sm"><Link href={`/invoices/new?clientId=${client.id}`}><ReceiptEuro /> New invoice</Link></Button>
            } />
          ) : (
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Invoice</TableHead>
                    <TableHead className="hidden sm:table-cell">Issued</TableHead>
                    <TableHead className="hidden sm:table-cell">Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="pr-4 text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="relative">
                      <TableCell className="pl-4 font-medium">
                        <Link href={`/invoices/${inv.id}`} className="after:absolute after:inset-0 hover:underline">{inv.number ?? "Draft"}</Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(inv.issueDate)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(inv.dueDate)}</TableCell>
                      <TableCell><InvoiceStatusBadge status={inv.summary.displayStatus} /></TableCell>
                      <TableCell className="text-right tabular-nums">{formatEuro(inv.summary.grossCents)}</TableCell>
                      <TableCell className="pr-4 text-right tabular-nums">{formatEuro(inv.summary.balanceCents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-4">
          <ActivityForm clientId={client.id} />
          {client.activities.length === 0 ? (
            <EmptyState icon={Tractor} title="Nothing logged yet" description="Calls, visits and submissions you log will appear here." />
          ) : (
            <ol className="relative space-y-4 border-l pl-5">
              {client.activities.map((a) => (
                <li key={a.id} className="group relative">
                  <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-background bg-primary" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{ACTIVITY_LABELS[a.type]}</span> · {formatDateTime(a.occurredAt)}
                      </p>
                      <p className="mt-0.5 text-sm whitespace-pre-line">{a.body}</p>
                    </div>
                    <DeleteActivityButton id={a.id} clientId={client.id} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : "font-medium"}>{value}</dd>
    </div>
  );
}
