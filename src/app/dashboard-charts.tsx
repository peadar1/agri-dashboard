"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { APPLICATION_STATUS_LABELS } from "@/lib/domain/labels";

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const compactEuro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", notation: "compact" });

const cashConfig = {
  invoiced: { label: "Invoiced", color: "var(--chart-3)" },
  collected: { label: "Collected", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function CashflowChart({ data }: { data: { month: string; invoiced: number; collected: number }[] }) {
  return (
    <ChartContainer config={cashConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ left: 4, right: 4 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v: number) => compactEuro.format(v)} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(value, name) => (
            <span className="flex w-full justify-between gap-4">
              <span className="text-muted-foreground">{cashConfig[name as keyof typeof cashConfig]?.label}</span>
              <span className="font-medium tabular-nums">{euro.format(Number(value))}</span>
            </span>
          )} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="invoiced" fill="var(--color-invoiced)" radius={[3, 3, 0, 0]} />
        <Bar dataKey="collected" fill="var(--color-collected)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

const PIPELINE: ApplicationStatus[] = ["DRAFT", "GATHERING_DOCS", "READY", "SUBMITTED", "APPROVED", "PAID_OUT", "REJECTED"];

const pipelineConfig = { count: { label: "Applications", color: "var(--chart-1)" } } satisfies ChartConfig;

export function PipelineChart({ counts }: { counts: Partial<Record<ApplicationStatus, number>> }) {
  const data = PIPELINE.map((status) => ({ status: APPLICATION_STATUS_LABELS[status], count: counts[status] ?? 0 }));
  return (
    <ChartContainer config={pipelineConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }} accessibilityLayer>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="status" tickLine={false} axisLine={false} width={112} interval={0} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel={false} />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
