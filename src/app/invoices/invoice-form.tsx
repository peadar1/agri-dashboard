"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Send, Trash2 } from "lucide-react";
import type { LineKind } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClientPicker, type ClientOption } from "@/components/form/client-picker";
import { FormMessage, NativeSelect, SelectField, TextAreaField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { useServerForm } from "@/components/form/use-server-form";
import { addDays, parseDateOnly, toDateInput } from "@/lib/domain/dates";
import { invoiceTotals } from "@/lib/domain/invoice";
import { centsToInput, formatEuro, parseEuroToCents } from "@/lib/domain/money";
import type { FormState } from "@/lib/validation/form";

export interface ApplicationOption {
  id: string;
  clientId: string;
  label: string;
  defaultFeeCents: number | null;
}

interface LineState {
  key: number;
  description: string;
  kind: LineKind;
  quantity: string;
  unitPrice: string;
}

export interface InvoiceFormValues {
  clientId?: string;
  applicationId?: string;
  issueDate: string;
  dueDate: string;
  vatRate: string;
  notes?: string;
  lines: Omit<LineState, "key">[];
}

let nextKey = 1;
const withKey = (line: Omit<LineState, "key">): LineState => ({ ...line, key: nextKey++ });
const blankLine = (): LineState => withKey({ description: "", kind: "FIXED", quantity: "1", unitPrice: "" });

function feeLineFor(app: ApplicationOption): Omit<LineState, "key"> {
  return {
    description: `${app.label} application: professional fee`,
    kind: "FIXED",
    quantity: "1",
    unitPrice: app.defaultFeeCents != null ? centsToInput(app.defaultFeeCents) : "",
  };
}

export function InvoiceForm({
  action,
  clients,
  applications,
  values,
  paymentTermsDays,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  clients: ClientOption[];
  applications: ApplicationOption[];
  values: InvoiceFormValues;
  paymentTermsDays: number;
  cancelHref: string;
}) {
  const { state, onSubmit, pending, errors } = useServerForm(action);
  const [clientId, setClientId] = useState(values.clientId ?? "");
  const [applicationId, setApplicationId] = useState(values.applicationId ?? "");
  const [issueDate, setIssueDate] = useState(values.issueDate);
  const [dueDate, setDueDate] = useState(values.dueDate);
  const [dueTouched, setDueTouched] = useState(false);
  const [vatRate, setVatRate] = useState(values.vatRate);
  const [lines, setLines] = useState<LineState[]>(() =>
    values.lines.length ? values.lines.map(withKey) : [blankLine()],
  );

  const clientApplications = applications.filter((a) => a.clientId === clientId);

  const totals = useMemo(() => {
    const vatBps = Math.round((Number(vatRate) || 0) * 100);
    return invoiceTotals(
      lines.map((l) => ({ quantity: Number(l.quantity) || 0, unitPriceCents: parseEuroToCents(l.unitPrice) ?? 0 })),
      vatBps,
    );
  }, [lines, vatRate]);

  const serialisedLines = JSON.stringify(
    lines.map(({ description, kind, quantity, unitPrice }) => ({ description, kind, quantity, unitPrice })),
  );

  function updateLine(key: number, patch: Partial<LineState>) {
    setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function chooseApplication(id: string) {
    setApplicationId(id);
    const app = applications.find((a) => a.id === id);
    if (!app) return;
    const onlyBlank = lines.length === 1 && !lines[0].description && !lines[0].unitPrice;
    if (onlyBlank) setLines([withKey(feeLineFor(app))]);
    else if (!lines.some((l) => l.description.startsWith(app.label))) setLines((c) => [...c, withKey(feeLineFor(app))]);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <input type="hidden" name="lines" value={serialisedLines} />
      <Card>
        <CardHeader><CardTitle>Bill to</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ClientPicker
            options={clients}
            defaultValue={values.clientId}
            errors={errors.clientId}
            onChange={(id) => {
              setClientId(id);
              setApplicationId("");
            }}
          />
          <SelectField
            label="For application (optional)"
            name="applicationId"
            value={applicationId}
            onChange={(e) => chooseApplication(e.target.value)}
            options={clientApplications.map((a) => ({ value: a.id, label: a.label }))}
            placeholder={clientId ? (clientApplications.length ? "None" : "No applications for this client") : "Choose a client first"}
            disabled={!clientId || clientApplications.length === 0}
            errors={errors.applicationId}
          />
          <TextField
            label="Issue date"
            name="issueDate"
            type="date"
            required
            value={issueDate}
            onChange={(e) => {
              setIssueDate(e.target.value);
              const parsed = parseDateOnly(e.target.value);
              if (parsed && !dueTouched) setDueDate(toDateInput(addDays(parsed, paymentTermsDays)));
            }}
            errors={errors.issueDate}
          />
          <TextField
            label="Due date"
            name="dueDate"
            type="date"
            required
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              setDueTouched(true);
            }}
            errors={errors.dueDate}
            hint={`Defaults to ${paymentTermsDays} days after issue`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="hidden grid-cols-[1fr_8rem_6rem_8rem_7rem_2rem] gap-2 px-1 text-xs font-medium text-muted-foreground md:grid">
            <span>Description</span>
            <span>Type</span>
            <span>Qty / hours</span>
            <span>Price / rate (€)</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {lines.map((line, i) => {
            const amount = Math.round((Number(line.quantity) || 0) * (parseEuroToCents(line.unitPrice) ?? 0));
            return (
              <div key={line.key} className="grid grid-cols-2 gap-2 rounded-lg border p-2 md:grid-cols-[1fr_8rem_6rem_8rem_7rem_2rem] md:items-center md:border-0 md:p-0">
                <Input
                  aria-label={`Line ${i + 1} description`}
                  value={line.description}
                  placeholder="e.g. Farm visit and mapping"
                  onChange={(e) => updateLine(line.key, { description: e.target.value })}
                  className="col-span-2 md:col-span-1"
                />
                <NativeSelect
                  aria-label={`Line ${i + 1} type`}
                  value={line.kind}
                  onChange={(e) => updateLine(line.key, { kind: e.target.value as LineKind })}
                >
                  <option value="FIXED">Fixed fee</option>
                  <option value="HOURLY">Hourly</option>
                </NativeSelect>
                <Input
                  aria-label={`Line ${i + 1} ${line.kind === "HOURLY" ? "hours" : "quantity"}`}
                  type="number"
                  step={line.kind === "HOURLY" ? "0.25" : "1"}
                  min="0"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                />
                <Input
                  aria-label={`Line ${i + 1} ${line.kind === "HOURLY" ? "hourly rate" : "price"}`}
                  inputMode="decimal"
                  value={line.unitPrice}
                  placeholder="0.00"
                  onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                />
                <span className="self-center text-right text-sm tabular-nums">{formatEuro(amount)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove line ${i + 1}`}
                  disabled={lines.length === 1}
                  onClick={() => setLines((c) => c.filter((l) => l.key !== line.key))}
                  className="justify-self-end text-muted-foreground hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}
          {errors.lines && <p className="text-sm text-destructive">{errors.lines[0]}</p>}
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((c) => [...c, blankLine()])}>
            <Plus /> Add line
          </Button>

          <div className="ml-auto grid w-full max-w-xs gap-1.5 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatEuro(totals.netCents)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="vatRate" className="text-muted-foreground">VAT %</label>
              <Input id="vatRate" name="vatRate" inputMode="decimal" value={vatRate} onChange={(e) => setVatRate(e.target.value)} className="h-7 w-16 text-right" aria-invalid={errors.vatRate ? true : undefined} />
              <span className="ml-auto tabular-nums">{formatEuro(totals.vatCents)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatEuro(totals.grossCents)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TextAreaField label="Notes on invoice" name="notes" rows={2} defaultValue={values.notes} errors={errors.notes} hint="Printed on the PDF, e.g. scheme reference or payment instructions" />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <FormMessage state={state} />
        <Button variant="outline" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <SubmitButton name="intent" value="draft" variant="secondary" pending={pending}>Save draft</SubmitButton>
        <SubmitButton name="intent" value="issue" pending={pending}><Send /> Save &amp; issue</SubmitButton>
      </div>
    </form>
  );
}
