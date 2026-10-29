"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { FarmMapProps } from "./farm-map";

// Leaflet touches `window` on import, so it can only load in the browser.
const DynamicFarmMap = dynamic(() => import("./farm-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-xl" />,
});

export function LazyFarmMap({ className = "h-96", ...props }: FarmMapProps) {
  return (
    <div className={className}>
      <DynamicFarmMap {...props} className="h-full" />
    </div>
  );
}
