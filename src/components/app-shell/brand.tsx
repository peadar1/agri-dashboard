import Link from "next/link";
import { Sprout } from "lucide-react";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Sprout className="size-4.5" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-sidebar-accent-foreground">AgriDesk</span>
        <span className="block text-xs text-sidebar-foreground/70">Grants &amp; invoicing</span>
      </span>
    </Link>
  );
}
