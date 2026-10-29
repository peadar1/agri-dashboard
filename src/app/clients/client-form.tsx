"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, X } from "lucide-react";
import type { Client } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage, SelectField, TextAreaField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { useServerForm } from "@/components/form/use-server-form";
import { LazyFarmMap } from "@/components/map/lazy-farm-map";
import { COUNTY_OPTIONS, ENTERPRISE_OPTIONS } from "@/lib/domain/options";
import type { FormState } from "@/lib/validation/form";

type ClientValues = Partial<Omit<Client, "createdAt" | "updatedAt">>;

export function ClientForm({
  action,
  client = {},
  cancelHref,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  client?: ClientValues;
  cancelHref: string;
  submitLabel: string;
}) {
  const { state, onSubmit, pending, errors } = useServerForm(action);
  const [lat, setLat] = useState(client.latitude?.toString() ?? "");
  const [lng, setLng] = useState(client.longitude?.toString() ?? "");
  const picked = lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))
    ? { lat: Number(lat), lng: Number(lng) }
    : null;

  const v = (key: keyof ClientValues) => {
    const value = client[key];
    return value === null || value === undefined ? undefined : String(value);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Farmer</CardTitle>
          <CardDescription>Who you deal with for this herd.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextField label="First name" name="firstName" required defaultValue={v("firstName")} errors={errors.firstName} autoComplete="off" />
          <TextField label="Last name" name="lastName" required defaultValue={v("lastName")} errors={errors.lastName} autoComplete="off" />
          <TextField label="Phone" name="phone" type="tel" defaultValue={v("phone")} errors={errors.phone} placeholder="087 123 4567" />
          <TextField label="Email" name="email" type="email" defaultValue={v("email")} errors={errors.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Farm</CardTitle>
          <CardDescription>One herd number per client.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField
            label="Herd number"
            name="herdNumber"
            required
            defaultValue={v("herdNumber")}
            errors={errors.herdNumber}
            placeholder="G1234567"
            inputClassName="font-mono"
            autoComplete="off"
          />
          <SelectField
            label="Enterprise"
            name="enterpriseType"
            required
            options={ENTERPRISE_OPTIONS}
            placeholder="Choose…"
            defaultValue={v("enterpriseType") ?? ""}
            errors={errors.enterpriseType}
          />
          <TextField label="Agfood ID" name="agfoodId" defaultValue={v("agfoodId")} errors={errors.agfoodId} hint="DAFM online services reference (no passwords)" />
          <TextField label="Total hectares" name="totalHectares" type="number" step="0.01" min="0" defaultValue={v("totalHectares")} errors={errors.totalHectares} />
          <TextField label="Eligible hectares" name="eligibleHectares" type="number" step="0.01" min="0" defaultValue={v("eligibleHectares")} errors={errors.eligibleHectares} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address &amp; location</CardTitle>
          <CardDescription>Click the map to drop a pin on the farmyard.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <TextField label="Address line 1" name="addressLine1" defaultValue={v("addressLine1")} errors={errors.addressLine1} className="sm:col-span-2" />
            <TextField label="Address line 2" name="addressLine2" defaultValue={v("addressLine2")} errors={errors.addressLine2} className="sm:col-span-2" />
            <TextField label="Town / townland" name="town" defaultValue={v("town")} errors={errors.town} />
            <SelectField label="County" name="county" required options={COUNTY_OPTIONS} placeholder="Choose…" defaultValue={v("county") ?? ""} errors={errors.county} />
            <TextField label="Eircode" name="eircode" defaultValue={v("eircode")} errors={errors.eircode} placeholder="H91 E2K3" inputClassName="uppercase" />
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
              <TextField label="Latitude" name="latitude" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} errors={errors.latitude} />
              <TextField label="Longitude" name="longitude" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} errors={errors.longitude} />
            </div>
            {picked && (
              <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => { setLat(""); setLng(""); }}>
                <X /> Clear pin
              </Button>
            )}
          </div>
          <div>
            <LazyFarmMap
              className="h-80"
              picked={picked}
              onPick={(la, ln) => {
                setLat(String(la));
                setLng(String(ln));
              }}
            />
            {!picked && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" /> No location set yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <TextAreaField label="Internal notes" name="notes" rows={4} defaultValue={v("notes")} errors={errors.notes} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <FormMessage state={state} />
        <Button variant="outline" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
