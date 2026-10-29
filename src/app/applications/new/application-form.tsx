"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClientPicker, type ClientOption } from "@/components/form/client-picker";
import { FormMessage, SelectField, TextAreaField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { useServerForm } from "@/components/form/use-server-form";
import { createApplication } from "@/lib/actions/applications";

interface SchemeOption {
  id: string;
  name: string;
  code: string;
  nextDeadline: string | null;
}

export function ApplicationForm({
  clients,
  schemes,
  defaultClientId,
  defaultYear,
}: {
  clients: ClientOption[];
  schemes: SchemeOption[];
  defaultClientId?: string;
  defaultYear: number;
}) {
  const { state, onSubmit, pending, errors } = useServerForm(createApplication);
  const [deadline, setDeadline] = useState("");

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ClientPicker options={clients} defaultValue={defaultClientId} errors={errors.clientId} />
          </div>
          <SelectField
            label="Scheme"
            name="schemeId"
            required
            placeholder="Choose a scheme…"
            options={schemes.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
            errors={errors.schemeId}
            onChange={(e) => {
              const scheme = schemes.find((s) => s.id === e.target.value);
              setDeadline(scheme?.nextDeadline ?? "");
            }}
          />
          <TextField label="Scheme year" name="year" type="number" required defaultValue={defaultYear} errors={errors.year} />
          <TextField
            label="Deadline"
            name="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            errors={errors.deadline}
            hint="Filled from the scheme's next closing date"
          />
          <TextField label="Amount applied for (€)" name="amountApplied" inputMode="decimal" errors={errors.amountApplied} />
          <TextField label="DAFM reference" name="dafmReference" errors={errors.dafmReference} inputClassName="font-mono" />
          <TextAreaField label="Notes" name="notes" rows={3} errors={errors.notes} className="sm:col-span-2" />
          <p className="text-xs text-muted-foreground sm:col-span-2">
            The scheme&apos;s document checklist is copied onto the application automatically.
          </p>
        </CardContent>
      </Card>
      <div className="mt-6 flex items-center justify-end gap-3">
        <FormMessage state={state} />
        <Button variant="outline" asChild>
          <Link href={defaultClientId ? `/clients/${defaultClientId}` : "/applications"}>Cancel</Link>
        </Button>
        <SubmitButton pending={pending}>Create application</SubmitButton>
      </div>
    </form>
  );
}
