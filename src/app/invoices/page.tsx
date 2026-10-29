import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, Plus, ReceiptEuro, Search, Wallet, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { CardsSkeleton, TableSkeleton } from "@/components/skeletons";
import { StatCard } from "@/components/stat-card";
import { InvoiceStatusBadge } from "@/components/status-badges";
import { INVOICE_TABS, listInvoices, parseInvoiceFilters, type InvoiceTab } from "@/lib/queries/invoices";
import { formatDate } from "@/lib/domain/dates";
import { formatEuro } from "@/lib/domain/money";
import { cn } from "@/lib/utils";
import { getToday } from "@/lib/today";

export const metadata: Metadata = { title: "Invoices" };

const TAB_LABELS: Record<InvoiceTab, string> = {
  all: "All",
  outstanding: "Outstanding",
  overdue: "Overdue",
  draft: "Drafts",
  paid: "Paid",
  void: "Void",
};

export default function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  return (
    <>
      <PageHeader
        title="Invoices"
        description="What you've billed, what's been paid and who still owes you."
        actions={
          <Button asChild>
            <Link href="/invoices/new"><Plus /> New invoice</Link>
          </Button>
        }
      />
      <Suspense
        fallback={
          <div className="space-y-6">
            <CardsSkeleton count={3} />
            <TableSkeleton />
          </div>
        }
      >
        <InvoicesView searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function InvoicesView({ searchParams }: Pick<PageProps<"/invoices">, "searchParams">) {
  const filters = parseInvoiceFilters(await searchParams);
  const today = await getToday();
  const { rows, total, pageCount, counts, stats } = await listInvoices(filters, today);

  const tabHref = (tab: InvoiceTab) => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (filters.q) params.set("q", filters.q);
    const qs = params.toString();
    return qs ? `/invoices?${qs}` : "/invoices";
  };

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={formatEuro(stats.outstandingCents)} detail={`${counts.outstanding} invoices`} icon={Wallet} href={tabHref("outstanding")} />
        <StatCard
          label="Overdue"
          value={formatEuro(stats.overdueCents)}
          detail={`${counts.overdue} past their due date`}
          icon={AlertTriangle}
          tone={stats.overdueCents ? "danger" : "default"}
          href={tabHref("overdue")}
        />
        <StatCard label="Collected (30 days)" value={formatEuro(stats.collected30Cents)} icon={PiggyBank} tone="success" />
      </div>

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <nav className="-mx-1 flex gap-1 overflow-x-auto px-1" aria-label="Invoice status">
          {INVOICE_TABS.map((tab) => (
            <Link
              key={tab}
              href={tabHref(tab)}
              aria-current={filters.tab === tab ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                filters.tab === tab ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {TAB_LABELS[tab]}
              <span className="rounded-full bg-background/70 px-1.5 text-xs tabular-nums">{counts[tab]}</span>
            </Link>
          ))}
        </nav>
        <form action="/invoices" className="relative xl:w-72" role="search">
          {filters.tab !== "all" && <input type="hidden" name="tab" value={filters.tab} />}
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={filters.q} placeholder="Invoice no., client or herd no." className="pl-8" aria-label="Search invoices" />
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ReceiptEuro}
          title={filters.q || filters.tab !== "all" ? "No invoices here" : "No invoices yet"}
          action={<Button asChild><Link href="/invoices/new"><Plus /> New invoice</Link></Button>}
        />
      ) : (
        <>
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden xl:table-cell">Issued</TableHead>
                  <TableHead className="hidden sm:table-cell">Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Total</TableHead>
                  <TableHead className="pr-4 text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((inv) => (
                  <TableRow key={inv.id} className="relative">
                    <TableCell className="pl-4">
                      <Link href={`/invoices/${inv.id}`} className="font-medium after:absolute after:inset-0 hover:underline">
                        {inv.number ?? "Draft"}
                      </Link>
                      {inv.application && (
                        <span className="block text-xs text-muted-foreground">
                          {inv.application.scheme.code} {inv.application.year}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inv.client.lastName}, {inv.client.firstName}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">{formatDate(inv.issueDate)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell><InvoiceStatusBadge status={inv.summary.displayStatus} /></TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">{formatEuro(inv.summary.grossCents)}</TableCell>
                    <TableCell
                      className={cn(
                        "pr-4 text-right tabular-nums",
                        inv.summary.displayStatus === "OVERDUE" && "font-medium text-destructive",
                      )}
                    >
                      {formatEuro(inv.summary.balanceCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <Pagination
            page={filters.page}
            pageCount={pageCount}
            total={total}
            basePath="/invoices"
            params={{ q: filters.q, tab: filters.tab === "all" ? undefined : filters.tab }}
          />
        </>
      )}
    </>
  );
}
