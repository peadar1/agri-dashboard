import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons";
import { createScheme } from "@/lib/actions/settings";
import { getBusinessSettings, listSchemes } from "@/lib/queries/settings";
import { formatDate } from "@/lib/domain/dates";
import { formatEuro } from "@/lib/domain/money";
import { getToday } from "@/lib/today";
import { BusinessForm } from "./business-form";
import { SchemeForm } from "./scheme-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Your business details and the grant schemes you work on." />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business details</CardTitle>
            <CardDescription>Printed on every invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<TableSkeleton rows={4} />}>
              <BusinessSection />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grant schemes</CardTitle>
            <CardDescription>Default fees, document checklists and closing dates for each scheme.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Suspense fallback={<TableSkeleton rows={5} />}>
              <SchemesTable />
            </Suspense>
            <div className="rounded-xl border bg-muted/40 p-4">
              <h3 className="mb-3 text-sm font-medium">Add a scheme</h3>
              <SchemeForm action={createScheme} submitLabel="Add scheme" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

async function BusinessSection() {
  const settings = await getBusinessSettings();
  return <BusinessForm values={settings} />;
}

async function SchemesTable() {
  const [schemes, today] = await Promise.all([listSchemes(), getToday()]);

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Scheme</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Default fee</TableHead>
            <TableHead className="hidden text-right md:table-cell">Documents</TableHead>
            <TableHead className="hidden text-right md:table-cell">Applications</TableHead>
            <TableHead className="pr-4 text-right">Next deadline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schemes.map((s) => {
            const next = s.deadlines.find((d) => d.date >= today);
            return (
              <TableRow key={s.id} className={`relative ${s.active ? "" : "text-muted-foreground"}`}>
                <TableCell className="pl-4">
                  <Link href={`/settings/schemes/${s.id}`} className="font-medium after:absolute after:inset-0 hover:underline">
                    {s.name}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">{s.code}</span>
                  {!s.active && <span className="ml-2 text-xs">(inactive)</span>}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {s.defaultFeeCents != null ? formatEuro(s.defaultFeeCents) : "—"}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">{s._count.documentTemplates}</TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">{s._count.applications}</TableCell>
                <TableCell className="pr-4 text-right">{next ? formatDate(next.date) : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
