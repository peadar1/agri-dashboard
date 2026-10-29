"use client";

import { FormMessage, TextAreaField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { useServerForm } from "@/components/form/use-server-form";
import { saveBusinessSettings } from "@/lib/actions/settings";

interface BusinessValues {
  businessName: string;
  ownerName: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  vatNumber: string | null;
  iban: string | null;
  bic: string | null;
  paymentTermsDays: number;
  invoiceFooter: string | null;
}

export function BusinessForm({ values }: { values: BusinessValues }) {
  const { state, onSubmit, pending, errors } = useServerForm(saveBusinessSettings);
  const d = (v: string | number | null) => (v === null ? undefined : String(v));

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
      <TextField label="Business name" name="businessName" required defaultValue={values.businessName} errors={errors.businessName} />
      <TextField label="Your name" name="ownerName" defaultValue={d(values.ownerName)} errors={errors.ownerName} />
      <TextAreaField label="Address" name="address" required rows={3} defaultValue={values.address} errors={errors.address} className="sm:row-span-2" />
      <TextField label="Phone" name="phone" defaultValue={d(values.phone)} errors={errors.phone} />
      <TextField label="Email" name="email" type="email" defaultValue={d(values.email)} errors={errors.email} />
      <TextField label="VAT number" name="vatNumber" defaultValue={d(values.vatNumber)} errors={errors.vatNumber} placeholder="IE1234567T" />
      <TextField label="IBAN" name="iban" defaultValue={d(values.iban)} errors={errors.iban} inputClassName="font-mono" />
      <TextField label="BIC" name="bic" defaultValue={d(values.bic)} errors={errors.bic} inputClassName="font-mono" />
      <TextField label="Payment terms (days)" name="paymentTermsDays" type="number" min={0} max={365} required defaultValue={values.paymentTermsDays} errors={errors.paymentTermsDays} />
      <TextAreaField label="Invoice footer" name="invoiceFooter" rows={2} defaultValue={d(values.invoiceFooter)} errors={errors.invoiceFooter} hint="Shown at the bottom of every PDF invoice" className="sm:col-span-2" />
      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        <FormMessage state={state} />
        <SubmitButton pending={pending}>Save details</SubmitButton>
      </div>
    </form>
  );
}
