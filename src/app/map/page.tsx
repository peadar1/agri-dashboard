import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { EnterpriseType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NativeSelect } from "@/components/form/fields";
import { PageHeader } from "@/components/page-header";
import { ENTERPRISE_COLORS } from "@/components/map/colors";
import { db } from "@/lib/db";
import { listSchemeOptions, parseClientFilters } from "@/lib/queries/clients";
import { countyLabel, ENTERPRISE_LABELS } from "@/lib/domain/labels";
import { COUNTY_OPTIONS, ENTERPRISE_OPTIONS } from "@/lib/domain/options";
import type { Prisma } from "@/generated/prisma/client";
import { FarmsMap } from "./farms-map";

export const metadata: Metadata = { title: "Farm map" };

export default function MapPage({ searchParams }: PageProps<"/map">) {
  return (
    <>
      <PageHeader title="Farm map" description="Where your clients are, coloured by enterprise. Click a pin for details." />
      <Suspense fallback={<Skeleton className="h-[65vh] w-full rounded-xl" />}>
        <MapView searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function MapView({ searchParams }: Pick<PageProps<"/map">, "searchParams">) {
  const filters = parseClientFilters(await searchParams);
  const where: Prisma.ClientWhereInput = { latitude: { not: null }, longitude: { not: null } };
  if (filters.county) where.county = filters.county as Prisma.ClientWhereInput["county"];
  if (filters.enterprise) where.enterpriseType = filters.enterprise as EnterpriseType;
  if (filters.scheme) where.applications = { some: { schemeId: filters.scheme } };

  const [clients, schemes, unpinned] = await Promise.all([
    db.client.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        herdNumber: true,
        town: true,
        county: true,
        enterpriseType: true,
        latitude: true,
        longitude: true,
      },
    }),
    listSchemeOptions(),
    db.client.count({ where: { OR: [{ latitude: null }, { longitude: null }] } }),
  ]);

  const markers = clients.map((c) => ({
    id: c.id,
    lat: c.latitude!,
    lng: c.longitude!,
    label: `${c.firstName} ${c.lastName}`,
    sublabel: `${c.herdNumber} · ${ENTERPRISE_LABELS[c.enterpriseType]} · ${[c.town, countyLabel(c.county)].filter(Boolean).join(", ")}`,
    color: ENTERPRISE_COLORS[c.enterpriseType],
    href: `/clients/${c.id}`,
  }));

  const hasFilters = Boolean(filters.county || filters.enterprise || filters.scheme);

  return (
    <div className="space-y-4">
      <form action="/map" className="flex flex-wrap items-center gap-2">
        <NativeSelect name="county" defaultValue={filters.county ?? ""} aria-label="County" className="w-40">
          <option value="">All counties</option>
          {COUNTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </NativeSelect>
        <NativeSelect name="enterprise" defaultValue={filters.enterprise ?? ""} aria-label="Enterprise" className="w-40">
          <option value="">All enterprises</option>
          {ENTERPRISE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </NativeSelect>
        <NativeSelect name="scheme" defaultValue={filters.scheme ?? ""} aria-label="Scheme" className="w-44">
          <option value="">Any scheme</option>
          {schemes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </NativeSelect>
        <Button type="submit" variant="secondary">Filter</Button>
        {hasFilters && <Button variant="ghost" asChild><Link href="/map">Clear</Link></Button>}
        <span className="ml-auto text-sm text-muted-foreground">
          {markers.length} farms shown
          {unpinned > 0 && ` · ${unpinned} without a location`}
        </span>
      </form>

      <FarmsMap markers={markers} />

      <Card className="py-3">
        <CardContent className="flex flex-wrap gap-x-5 gap-y-2 px-4 text-sm">
          {(Object.values(EnterpriseType) as EnterpriseType[]).map((e) => (
            <span key={e} className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: ENTERPRISE_COLORS[e] }} />
              {ENTERPRISE_LABELS[e]}
            </span>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
