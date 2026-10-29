import { Suspense } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, FileText, Tractor, Wallet } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/skeletons";
import { StatCard } from "@/components/stat-card";
import { UrgencyBadge, URGENCY_DOT } from "@/components/status-badges";
import { getDashboard } from "@/lib/queries/dashboard";
import { formatDate, formatDateTime } from "@/lib/domain/dates";
import { daysUntil, deadlineUrgency, describeDaysUntil } from "@/lib/domain/deadlines";
import { ACTIVITY_LABELS } from "@/lib/domain/labels";
import { formatEuro } from "@/lib/domain/money";
import { cn } from "@/lib/utils";
import { getToday } from "@/lib/today";
import { CashflowChart, PipelineChart } from "./dashboard-charts";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="What needs doing this week, and who owes what." />
      <Suspense fallback={<PageSkeleton />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const today = await getToday();
  const d = await getDashboard(today);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Outstanding" value={formatEuro(d.outstandingCents)} detail={`${d.outstandingCount} unpaid invoices`} icon={Wallet} href="/invoices?tab=outstanding" />
        <StatCard
          label="Overdue"
          value={formatEuro(d.overdueCents)}
          detail={`${d.overdueCount} invoices past due`}
          icon={AlertTriangle}
          tone={d.overdueCount ? "danger" : "default"}
          href="/invoices?tab=overdue"
        />
        <StatCard label="Applications in progress" value={d.activeApplications} detail={`across ${d.clientCount} clients`} icon={FileText} href="/applications?view=board" />
        <StatCard label="Deadlines in 30 days" value={d.deadlinesNext30} detail="scheme closing dates" icon={CalendarClock} href="/deadlines" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
            <CardDescription>Scheme closing dates over the next 60 days</CardDescription>
            <CardAction>
              <Link href="/deadlines" className="text-sm text-primary hover:underline">Calendar</Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {d.deadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing due in the next 60 days.</p>
            ) : (
              <ul className="divide-y">
                {d.deadlines.map((dl) => {
                  const days = daysUntil(dl.date, today);
                  const urgency = deadlineUrgency(dl.date, today);
                  return (
                    <li key={dl.id} className="flex items-center gap-3 py-2.5">
                      <span className={cn("size-2 shrink-0 rounded-full", URGENCY_DOT[urgency])} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{dl.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(dl.date)}
                          {dl.openApplications > 0 && (
                            <>
                              {" · "}
                              <Link href={`/applications?scheme=${dl.scheme.id}`} className="hover:underline">
                                {dl.openApplications} open application{dl.openApplications === 1 ? "" : "s"}
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                      <UrgencyBadge urgency={urgency}>{describeDaysUntil(days)}</UrgencyBadge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>Unsubmitted applications due within 3 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {d.attention.length === 0 ? (
              <p className="text-sm text-muted-foreground">You&apos;re on top of everything.</p>
            ) : (
              <ul className="space-y-3">
                {d.attention.map((a) => {
                  const urgency = a.deadline ? deadlineUrgency(a.deadline, today) : "later";
                  return (
                    <li key={a.id}>
                      <Link href={`/applications/${a.id}`} className="group block">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate font-medium group-hover:underline">
                            {a.client.firstName} {a.client.lastName}
                            <span className="ml-1.5 font-normal text-muted-foreground">{a.scheme.code}</span>
                          </span>
                          {a.deadline && (
                            <span className={cn("shrink-0 text-xs", urgency === "overdue" ? "text-destructive" : "text-muted-foreground")}>
                              {describeDaysUntil(daysUntil(a.deadline, today))}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress value={a.progress.percent} className="h-1.5" aria-label="Documents received" />
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {a.progress.received}/{a.progress.required} docs
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Invoiced vs collected</CardTitle>
            <CardDescription>Last 12 months, incl. VAT</CardDescription>
          </CardHeader>
          <CardContent>
            <CashflowChart data={d.months} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application pipeline</CardTitle>
            <CardDescription>All applications by status</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineChart counts={d.statusCounts} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Oldest overdue invoices</CardTitle>
            <CardAction>
              <Link href="/invoices?tab=overdue" className="text-sm text-primary hover:underline">View all</Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {d.overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue invoices.</p>
            ) : (
              <ul className="divide-y">
                {d.overdue.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">{inv.number}</Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {inv.client.firstName} {inv.client.lastName} · due {formatDate(inv.dueDate)}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-destructive tabular-nums">{formatEuro(inv.summary.balanceCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {d.activity.length === 0 ? (
              <EmptyActivity />
            ) : (
              <ul className="divide-y">
                {d.activity.map((a) => (
                  <li key={a.id} className="py-2 text-sm">
                    <p className="text-xs text-muted-foreground">
                      <Link href={`/clients/${a.client.id}`} className="font-medium text-foreground hover:underline">
                        {a.client.firstName} {a.client.lastName}
                      </Link>
                      {" · "}
                      {ACTIVITY_LABELS[a.type]} · {formatDateTime(a.occurredAt)}
                    </p>
                    <p className="truncate">{a.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyActivity() {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Tractor className="size-4" /> Nothing logged yet.
    </p>
  );
}
