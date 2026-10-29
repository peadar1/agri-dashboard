import type { ApplicationStatus, DocumentStatus } from "@/generated/prisma/enums";
import type { InvoiceDisplayStatus } from "@/lib/domain/invoice";
import type { Urgency } from "@/lib/domain/deadlines";
import {
  APPLICATION_STATUS_LABELS,
  DOCUMENT_STATUS_LABELS,
  INVOICE_STATUS_LABELS,
} from "@/lib/domain/labels";
import { cn } from "@/lib/utils";

const tone = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-chart-3/15 text-chart-3",
  progress: "bg-chart-2/20 text-[oklch(0.45_0.1_75)] dark:text-chart-2",
  success: "bg-success/15 text-success",
  danger: "bg-destructive/12 text-destructive",
  strong: "bg-primary text-primary-foreground",
} as const;

type Tone = keyof typeof tone;

function Pill({ t, children, className }: { t: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium whitespace-nowrap",
        tone[t],
        className,
      )}
    >
      {children}
    </span>
  );
}

const INVOICE_TONES: Record<InvoiceDisplayStatus, Tone> = {
  DRAFT: "neutral",
  ISSUED: "info",
  PARTIAL: "progress",
  PAID: "success",
  OVERDUE: "danger",
  VOID: "neutral",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceDisplayStatus }) {
  return (
    <Pill t={INVOICE_TONES[status]} className={status === "VOID" ? "line-through" : undefined}>
      {INVOICE_STATUS_LABELS[status]}
    </Pill>
  );
}

const APPLICATION_TONES: Record<ApplicationStatus, Tone> = {
  DRAFT: "neutral",
  GATHERING_DOCS: "progress",
  READY: "info",
  SUBMITTED: "info",
  APPROVED: "success",
  REJECTED: "danger",
  PAID_OUT: "strong",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <Pill t={APPLICATION_TONES[status]}>{APPLICATION_STATUS_LABELS[status]}</Pill>;
}

const DOCUMENT_TONES: Record<DocumentStatus, Tone> = {
  MISSING: "danger",
  RECEIVED: "success",
  NOT_REQUIRED: "neutral",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Pill t={DOCUMENT_TONES[status]}>{DOCUMENT_STATUS_LABELS[status]}</Pill>;
}

const URGENCY_TONES: Record<Urgency, Tone> = {
  overdue: "danger",
  urgent: "progress",
  soon: "info",
  later: "neutral",
};

export function UrgencyBadge({ urgency, children }: { urgency: Urgency; children: React.ReactNode }) {
  return <Pill t={URGENCY_TONES[urgency]}>{children}</Pill>;
}

export const URGENCY_DOT: Record<Urgency, string> = {
  overdue: "bg-destructive",
  urgent: "bg-warning",
  soon: "bg-chart-3",
  later: "bg-muted-foreground/40",
};
