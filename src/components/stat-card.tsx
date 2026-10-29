import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "default",
  href,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "danger" | "success";
  href?: string;
}) {
  const body = (
    <Card className={cn("h-full gap-0 py-4 transition-colors", href && "hover:border-primary/40")}>
      <CardContent className="px-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          {Icon && <Icon className="size-4 text-muted-foreground" />}
        </div>
        <p
          className={cn(
            "mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
            tone === "danger" && "text-destructive",
            tone === "success" && "text-success",
          )}
        >
          {value}
        </p>
        {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  );
}
