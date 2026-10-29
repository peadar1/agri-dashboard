"use client";

import { FormMessage, TextAreaField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { useServerForm } from "@/components/form/use-server-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { centsToInput } from "@/lib/domain/money";
import type { FormState } from "@/lib/validation/form";

export function SchemeForm({
  action,
  values,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  values?: { code: string; name: string; description: string | null; defaultFeeCents: number | null; active: boolean };
  submitLabel: string;
}) {
  const { state, onSubmit, pending, errors } = useServerForm(action);

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[8rem_1fr_9rem]" noValidate>
      <TextField label="Code" name="code" required defaultValue={values?.code} errors={errors.code} placeholder="ACRES" inputClassName="uppercase" />
      <TextField label="Name" name="name" required defaultValue={values?.name} errors={errors.name} placeholder="Agri-Climate Rural Environment Scheme" />
      <TextField
        label="Default fee (€)"
        name="defaultFee"
        inputMode="decimal"
        defaultValue={values?.defaultFeeCents != null ? centsToInput(values.defaultFeeCents) : undefined}
        errors={errors.defaultFee}
        hint="Ex VAT"
      />
      <TextAreaField label="Description" name="description" rows={2} defaultValue={values?.description ?? undefined} errors={errors.description} className="sm:col-span-3" />
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-3">
        {values ? (
          <div className="flex items-center gap-2">
            <Checkbox id="active" name="active" defaultChecked={values.active} />
            <Label htmlFor="active">Active (offered for new applications)</Label>
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          <FormMessage state={state} />
          <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
