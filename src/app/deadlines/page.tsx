import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/skeletons";
import { UrgencyBadge, URGENCY_DOT } from "@/components/status-badges";
import { calendarGrid, listDeadlineEvents, parseMonth, type DeadlineEvent } from "@/lib/queries/deadlines";
import { addDays, formatDate, toDateInput } from "@/lib/domain/dates";
import { daysUntil, deadlineUrgency, describeDaysUntil } from "@/lib/domain/deadlines";
import { cn } from "@/lib/utils";
import { getToday } from "@/lib/today";

export const metadata: Metadata = { title: "Deadlines" };

const MONTH_TITLE = new Intl.DateTimeFormat("en-IE", { month: "long", year: "numeric", timeZone: "UTC" });
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DeadlinesPage({ searchParams }: PageProps<"/deadlines">) {
  return (
    <>
      <PageHeader title="Deadlines" description="Scheme closing dates and open applications, by day." />
      <Suspense fallback={<PageSkeleton />}>
        <DeadlinesView searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const monthParam = (d: Date) => toDateInput(d).slice(0, 7);

async function DeadlinesView({ searchParams }: Pick<PageProps<"/deadlines">, "searchParams">) {
  const { month: monthValue } = await searchParams;
  const today = await getToday();
  const month = parseMonth(monthValue, today);
  const grid = calendarGrid(month);
  const prev = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1));

  const [monthEvents, upcoming] = await Promise.all([
    listDeadlineEvents(grid.start, grid.end),
    listDeadlineEvents(today, addDays(today, 90)),
  ]);

  const byDay = new Map<string, DeadlineEvent[]>();
  for (const e of monthEvents) {
    const key = toDateInput(e.date);
    byDay.set(key, [...(byDay.get(key) ?? []), e]);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-lg">{MONTH_TITLE.format(month)}</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" asChild>
              <Link href={`/deadlines?month=${monthParam(prev)}`} aria-label="Previous month"><ChevronLeft /></Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/deadlines">Today</Link>
            </Button>
            <Button variant="outline" size="icon-sm" asChild>
              <Link href={`/deadlines?month=${monthParam(grid.nextMonth)}`} aria-label="Next month"><ChevronRight /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 border-t border-l text-xs" role="grid" aria-label={MONTH_TITLE.format(month)}>
            {WEEKDAYS.map((w) => (
              <div key={w} className="border-r border-b bg-muted/50 px-1.5 py-1 font-medium text-muted-foreground" role="columnheader">
                {w}
              </div>
            ))}
            {grid.days.map((date) => {
              const key = toDateInput(date);
              const events = byDay.get(key) ?? [];
              const inMonth = date.getUTCMonth() === month.getUTCMonth();
              const isToday = date.getTime() === today.getTime();
              return (
                <div
                  key={key}
                  role="gridcell"
                  aria-label={`${formatDate(date)}${events.length ? `, ${events.length} deadlines` : ""}`}
                  className={cn("min-h-16 border-r border-b p-1 sm:min-h-24", !inMonth && "bg-muted/30 text-muted-foreground")}
                >
                  <span
                    className={cn(
                      "inline-flex size-5 items-center justify-center rounded-full tabular-nums",
                      isToday && "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    {date.getUTCDate()}
                  </span>
                  <ul className="mt-0.5 space-y-0.5">
                    {events.slice(0, 3).map((e) => (
                      <li key={e.key}>
                        <Link
                          href={e.href}
                          title={e.title}
                          className={cn(
                            "block truncate rounded px-1 py-0.5 leading-tight hover:opacity-80",
                            e.kind === "scheme" ? "bg-primary/12 font-medium text-primary" : "bg-chart-2/20",
                          )}
                        >
                          <span className="hidden sm:inline">{e.title}</span>
                          <span className="sm:hidden">{e.kind === "scheme" ? e.detail : "•"}</span>
                        </Link>
                      </li>
                    ))}
                    {events.length > 3 && <li className="px-1 text-muted-foreground">+{events.length - 3} more</li>}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary/30" /> Scheme closing date</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-chart-2/40" /> Open application deadline</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next 90 days</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing coming up.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((e) => {
                const urgency = deadlineUrgency(e.date, today);
                return (
                  <li key={e.key} className="flex items-start gap-2.5">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", URGENCY_DOT[urgency])} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <Link href={e.href} className="block truncate text-sm font-medium hover:underline">{e.title}</Link>
                      <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                    </div>
                    <UrgencyBadge urgency={urgency}>{describeDaysUntil(daysUntil(e.date, today))}</UrgencyBadge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
