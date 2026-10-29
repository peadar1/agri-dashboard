"use client";

import { LazyFarmMap } from "@/components/map/lazy-farm-map";
import type { FarmMarker } from "@/components/map/farm-map";

export function FarmsMap({ markers }: { markers: FarmMarker[] }) {
  return <LazyFarmMap markers={markers} fitToMarkers className="h-[65vh] min-h-96" />;
}
