"use client";

import { LazyFarmMap } from "@/components/map/lazy-farm-map";
import { ENTERPRISE_COLORS } from "@/components/map/colors";
import type { EnterpriseType } from "@/generated/prisma/enums";

export function ClientLocation({
  id,
  lat,
  lng,
  label,
  enterprise,
}: {
  id: string;
  lat: number;
  lng: number;
  label: string;
  enterprise: EnterpriseType;
}) {
  return (
    <LazyFarmMap
      className="h-56"
      center={[lat, lng]}
      zoom={11}
      markers={[{ id, lat, lng, label, color: ENTERPRISE_COLORS[enterprise] }]}
    />
  );
}
