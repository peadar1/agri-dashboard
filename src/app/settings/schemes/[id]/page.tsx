import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { UrgencyBadge } from "@/components/status-badges";
import { updateScheme } from "@/lib/actions/settings";
import { getScheme } from "@/lib/queries/settings";
import { formatDate } from "@/lib/domain/dates";
import { daysUntil, deadlineUrgency, describeDaysUntil } from "@/lib/domain/deadlines";
import { getToday } from "@/lib/today";
import { SchemeForm } from "../../scheme-form";
import { AddDeadlineForm, AddTemplateForm, DeleteSchemeButton, RemoveButton } from "./scheme-lists";

export default async function SchemePage({ params }: PageProps<"/settings/schemes/[id]">) {
  const { id } = await params;
  const [scheme, today] = await Promise.all([getScheme(id), getToday()]);
  if (!scheme) notFound();

  return (
    <>
      <PageHeader
        back={{ href: "/settings", label: "Settings" }}
        title={scheme.name}
        description={`${scheme._count.applications} application(s) use this scheme`}
        actions={scheme._count.applications === 0 && <DeleteSchemeButton schemeId={scheme.id} name={scheme.name} />}
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>Scheme details</CardTitle></CardHeader>
          <CardContent>
            <SchemeForm action={updateScheme.bind(null, scheme.id)} values={scheme} submitLabel="Save scheme" />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Document checklist</CardTitle>
              <CardDescription>Copied onto each new application for this scheme.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheme.documentTemplates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents yet.</p>
              ) : (
                <ul className="divide-y rounded-xl border">
                  {scheme.documentTemplates.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 py-1 pr-1 pl-3 text-sm">
                      {t.name}
                      <RemoveButton kind="template" id={t.id} schemeId={scheme.id} />
                    </li>
                  ))}
                </ul>
              )}
              <AddTemplateForm schemeId={scheme.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deadlines</CardTitle>
              <CardDescription>Shown on the dashboard and deadlines calendar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheme.deadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deadlines yet.</p>
              ) : (
                <ul className="divide-y rounded-xl border">
                  {scheme.deadlines.map((d) => {
                    const days = daysUntil(d.date, today);
                    return (
                      <li key={d.id} className="flex items-center justify-between gap-2 py-1.5 pr-1 pl-3 text-sm">
                        <span>
                          <span className="font-medium">{d.title}</span>
                          <span className="ml-2 text-muted-foreground">{formatDate(d.date)}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <UrgencyBadge urgency={deadlineUrgency(d.date, today)}>{describeDaysUntil(days)}</UrgencyBadge>
                          <RemoveButton kind="deadline" id={d.id} schemeId={scheme.id} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <AddDeadlineForm schemeId={scheme.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
