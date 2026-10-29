import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Search, Tractor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeSelect } from "@/components/form/fields";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { TableSkeleton } from "@/components/skeletons";
import { listClients, listSchemeOptions, parseClientFilters } from "@/lib/queries/clients";
import { countyLabel, ENTERPRISE_LABELS } from "@/lib/domain/labels";
import { COUNTY_OPTIONS, ENTERPRISE_OPTIONS } from "@/lib/domain/options";
import { formatEuro } from "@/lib/domain/money";
import { getToday } from "@/lib/today";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage({ searchParams }: PageProps<"/clients">) {
  return (
    <>
      <PageHeader
        title="Clients"
        description="Every farm you work with, searchable by name, herd number, town or Eircode."
        actions={
          <Button asChild>
            <Link href="/clients/new">
              <Plus /> New client
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <ClientsTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ClientsTable({ searchParams }: Pick<PageProps<"/clients">, "searchParams">) {
  const params = await searchParams;
  const filters = parseClientFilters(params);
  const today = await getToday();
  const [{ rows, total, pageCount }, schemes] = await Promise.all([listClients(filters, today), listSchemeOptions()]);
  const hasFilters = Boolean(filters.q || filters.county || filters.enterprise || filters.scheme);

  return (
    <>
      <form action="/clients" className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={filters.q} placeholder="Name, herd no., town or Eircode…" className="pl-8" aria-label="Search clients" />
        </div>
        <NativeSelect name="county" defaultValue={filters.county ?? ""} aria-label="County" className="lg:w-36">
          <option value="">All counties</option>
          {COUNTY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelect>
        <NativeSelect name="enterprise" defaultValue={filters.enterprise ?? ""} aria-label="Enterprise" className="lg:w-36">
          <option value="">All enterprises</option>
          {ENTERPRISE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelect>
        <NativeSelect name="scheme" defaultValue={filters.scheme ?? ""} aria-label="Scheme" className="lg:w-40">
          <option value="">Any scheme</option>
          {schemes.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </NativeSelect>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary" className="flex-1">Filter</Button>
          {hasFilters && (
            <Button variant="ghost" asChild>
              <Link href="/clients">Clear</Link>
            </Button>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={Tractor}
          title={hasFilters ? "No clients match those filters" : "No clients yet"}
          description={hasFilters ? "Try a different search or clear the filters." : "Add your first farm to get started."}
          action={!hasFilters && <Button asChild><Link href="/clients/new"><Plus /> New client</Link></Button>}
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Herd no.</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead className="hidden xl:table-cell">Enterprise</TableHead>
                <TableHead className="hidden text-right xl:table-cell">Hectares</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Active apps</TableHead>
                <TableHead className="pr-4 text-right">Outstanding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id} className="relative">
                  <TableCell className="pl-4 font-medium">
                    <Link href={`/clients/${c.id}`} className="after:absolute after:inset-0 hover:underline">
                      {c.lastName}, {c.firstName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{c.herdNumber}</TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {[c.town, countyLabel(c.county)].filter(Boolean).join(", ")}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{ENTERPRISE_LABELS[c.enterpriseType]}</TableCell>
                  <TableCell className="hidden text-right tabular-nums xl:table-cell">{c.totalHectares?.toFixed(1) ?? "—"}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{c.activeApplications || "—"}</TableCell>
                  <TableCell className={`pr-4 text-right tabular-nums ${c.hasOverdue ? "font-medium text-destructive" : ""}`}>
                    {c.outstandingCents ? formatEuro(c.outstandingCents) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <Pagination
        page={filters.page}
        pageCount={pageCount}
        total={total}
        basePath="/clients"
        params={{ q: filters.q, county: filters.county, enterprise: filters.enterprise, scheme: filters.scheme }}
      />
    </>
  );
}
