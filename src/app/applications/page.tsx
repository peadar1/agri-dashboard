import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Columns3, FilePlus2, FileText, List, Search } from "lucide-react";
import { ApplicationStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeSelect } from "@/components/form/fields";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { TableSkeleton } from "@/components/skeletons";
import { ApplicationStatusBadge, UrgencyBadge } from "@/components/status-badges";
import { listApplications, listApplicationYears, parseApplicationFilters, type ApplicationFilters } from "@/lib/queries/applications";
import { listSchemeOptions } from "@/lib/queries/clients";
import { checklistProgress, isAwaitingSubmission } from "@/lib/domain/application";
import { formatDate } from "@/lib/domain/dates";
import { daysUntil, deadlineUrgency, describeDaysUntil } from "@/lib/domain/deadlines";
import { APPLICATION_STATUS_LABELS } from "@/lib/domain/labels";
import { cn } from "@/lib/utils";
import { getToday } from "@/lib/today";

export const metadata: Metadata = { title: "Applications" };

export default function ApplicationsPage({ searchParams }: PageProps<"/applications">) {
  return (
    <>
      <PageHeader
        title="Grant applications"
        description="Track every application from first contact to payout."
        actions={
          <Button asChild>
            <Link href="/applications/new"><FilePlus2 /> New application</Link>
          </Button>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <ApplicationsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}

type Row = Awaited<ReturnType<typeof listApplications>>["rows"][number];

function hrefWith(filters: ApplicationFilters, overrides: Partial<Record<string, string | undefined>>) {
  const params = new URLSearchParams();
  const merged: Record<string, string | undefined> = {
    q: filters.q,
    status: filters.status,
    scheme: filters.scheme,
    year: filters.year?.toString(),
    view: filters.view === "board" ? "board" : undefined,
    ...overrides,
  };
  for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/applications?${qs}` : "/applications";
}

async function ApplicationsView({ searchParams }: Pick<PageProps<"/applications">, "searchParams">) {
  const filters = parseApplicationFilters(await searchParams);
  const today = await getToday();
  const [{ rows, total, pageCount }, schemes, years] = await Promise.all([
    listApplications(filters),
    listSchemeOptions(),
    listApplicationYears(),
  ]);
  const hasFilters = Boolean(filters.q || filters.status || filters.scheme || filters.year);

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 xl:flex-row xl:items-center">
        <form action="/applications" className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
          {filters.view === "board" && <input type="hidden" name="view" value="board" />}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={filters.q} placeholder="Client, herd no. or DAFM ref…" className="pl-8" aria-label="Search applications" />
          </div>
          <NativeSelect name="status" defaultValue={filters.status ?? ""} aria-label="Status" className="lg:w-40">
            <option value="">All statuses</option>
            {(Object.values(ApplicationStatus) as ApplicationStatus[]).map((s) => (
              <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>
            ))}
          </NativeSelect>
          <NativeSelect name="scheme" defaultValue={filters.scheme ?? ""} aria-label="Scheme" className="lg:w-40">
            <option value="">All schemes</option>
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </NativeSelect>
          <NativeSelect name="year" defaultValue={filters.year?.toString() ?? ""} aria-label="Year" className="lg:w-28">
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </NativeSelect>
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" className="flex-1">Filter</Button>
            {hasFilters && (
              <Button variant="ghost" asChild>
                <Link href={filters.view === "board" ? "/applications?view=board" : "/applications"}>Clear</Link>
              </Button>
            )}
          </div>
        </form>
        <div className="flex w-fit rounded-lg border p-0.5" role="group" aria-label="View">
          <Button variant={filters.view === "table" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href={hrefWith(filters, { view: undefined })} aria-current={filters.view === "table" ? "page" : undefined}><List /> Table</Link>
          </Button>
          <Button variant={filters.view === "board" ? "secondary" : "ghost"} size="sm" asChild>
            <Link href={hrefWith(filters, { view: "board" })} aria-current={filters.view === "board" ? "page" : undefined}><Columns3 /> Board</Link>
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hasFilters ? "No applications match those filters" : "No applications yet"}
          action={!hasFilters && <Button asChild><Link href="/applications/new"><FilePlus2 /> New application</Link></Button>}
        />
      ) : filters.view === "board" ? (
        <Board rows={rows} today={today} />
      ) : (
        <>
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Client</TableHead>
                  <TableHead>Scheme</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Documents</TableHead>
                  <TableHead className="pr-4 text-right">Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((app) => {
                  const progress = checklistProgress(app.documents);
                  const showUrgency = app.deadline && isAwaitingSubmission(app.status);
                  return (
                    <TableRow key={app.id} className="relative">
                      <TableCell className="pl-4">
                        <Link href={`/applications/${app.id}`} className="font-medium after:absolute after:inset-0 hover:underline">
                          {app.client.lastName}, {app.client.firstName}
                        </Link>
                        <span className="block font-mono text-xs text-muted-foreground">{app.client.herdNumber}</span>
                      </TableCell>
                      <TableCell>
                        {app.scheme.name} <span className="text-muted-foreground">{app.year}</span>
                      </TableCell>
                      <TableCell><ApplicationStatusBadge status={app.status} /></TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Progress value={progress.percent} className="h-1.5 w-20" aria-label="Documents received" />
                          <span className="text-xs text-muted-foreground tabular-nums">{progress.received}/{progress.required}</span>
                        </div>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        {app.deadline ? (
                          <span className="inline-flex flex-col items-end gap-0.5">
                            <span>{formatDate(app.deadline)}</span>
                            {showUrgency && (
                              <UrgencyBadge urgency={deadlineUrgency(app.deadline, today)}>
                                {describeDaysUntil(daysUntil(app.deadline, today))}
                              </UrgencyBadge>
                            )}
                          </span>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
          <Pagination
            page={filters.page}
            pageCount={pageCount}
            total={total}
            basePath="/applications"
            params={{ q: filters.q, status: filters.status, scheme: filters.scheme, year: filters.year?.toString() }}
          />
        </>
      )}
    </>
  );
}

const BOARD_COLUMNS: ApplicationStatus[] = [
  "DRAFT",
  "GATHERING_DOCS",
  "READY",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "PAID_OUT",
];

function Board({ rows, today }: { rows: Row[]; today: Date }) {
  const columns = BOARD_COLUMNS;
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[1100px] grid-cols-7 gap-3">
        {columns.map((status) => {
          const items = rows.filter((r) => r.status === status);
          return (
            <section key={status} className="flex flex-col rounded-xl bg-muted/50 p-2" aria-label={APPLICATION_STATUS_LABELS[status]}>
              <h2 className="mb-2 flex items-center justify-between px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {APPLICATION_STATUS_LABELS[status]}
                <span className="rounded-full bg-background px-1.5 py-0.5 tabular-nums">{items.length}</span>
              </h2>
              <ul className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto">
                {items.map((app) => {
                  const progress = checklistProgress(app.documents);
                  const urgency = app.deadline && isAwaitingSubmission(app.status) ? deadlineUrgency(app.deadline, today) : null;
                  return (
                    <li key={app.id}>
                      <Link
                        href={`/applications/${app.id}`}
                        className={cn(
                          "block rounded-lg border bg-card p-2.5 text-sm shadow-xs transition-colors hover:border-primary/40",
                          urgency === "overdue" && "border-destructive/50",
                        )}
                      >
                        <p className="font-medium leading-tight">{app.client.firstName} {app.client.lastName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{app.scheme.code} · {app.year}</p>
                        {progress.required > 0 && isAwaitingSubmission(app.status) && (
                          <Progress value={progress.percent} className="mt-2 h-1" aria-label="Documents received" />
                        )}
                        {app.deadline && urgency && (
                          <p className={cn("mt-1.5 text-xs", urgency === "overdue" ? "text-destructive" : urgency === "urgent" ? "font-medium" : "text-muted-foreground")}>
                            Due {formatDate(app.deadline)}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
