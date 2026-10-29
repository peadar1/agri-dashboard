"use client";

import { FormMessage, TextAreaField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { useServerForm } from "@/components/form/use-server-form";
import { updateApplication } from "@/lib/actions/applications";
import { toDateInput } from "@/lib/domain/dates";
import { centsToInput } from "@/lib/domain/money";

export function DetailsForm({
  id,
  values,
}: {
  id: string;
  values: {
    deadline: Date | null;
    dafmReference: string | null;
    amountAppliedCents: number | null;
    amountApprovedCents: number | null;
    notes: string | null;
  };
}) {
  const { state, onSubmit, pending, errors } = useServerForm(updateApplication.bind(null, id));

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <TextField label="Deadline" name="deadline" type="date" defaultValue={values.deadline ? toDateInput(values.deadline) : undefined} errors={errors.deadline} />
      <TextField label="DAFM reference" name="dafmReference" defaultValue={values.dafmReference ?? undefined} errors={errors.dafmReference} inputClassName="font-mono" />
      <TextField
        label="Amount applied for (€)"
        name="amountApplied"
        inputMode="decimal"
        defaultValue={values.amountAppliedCents != null ? centsToInput(values.amountAppliedCents) : undefined}
        errors={errors.amountApplied}
      />
      <TextField
        label="Amount approved (€)"
        name="amountApproved"
        inputMode="decimal"
        defaultValue={values.amountApprovedCents != null ? centsToInput(values.amountApprovedCents) : undefined}
        errors={errors.amountApproved}
      />
      <TextAreaField label="Notes" name="notes" rows={3} defaultValue={values.notes ?? undefined} errors={errors.notes} className="sm:col-span-2" />
      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        <FormMessage state={state} />
        <SubmitButton variant="secondary" pending={pending}>Save details</SubmitButton>
      </div>
    </form>
  );
}
