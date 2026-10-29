"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActive } from "./nav-items";

function NavLinks({ pathname, onNavigate }: { pathname?: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname !== undefined && isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className={cn("size-4", active && "text-sidebar-primary")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

// The pathname is request data, so the highlighted state streams in after the static shell.
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavLinks onNavigate={onNavigate} />}>
      <ActiveNavLinks onNavigate={onNavigate} />
    </Suspense>
  );
}
