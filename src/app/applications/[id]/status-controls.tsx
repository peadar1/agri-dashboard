"use client";

import { useTransition } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { changeApplicationStatus } from "@/lib/actions/applications";
import { APPLICATION_FLOW, allowedTransitions } from "@/lib/domain/application";
import { APPLICATION_STATUS_LABELS } from "@/lib/domain/labels";
import { cn } from "@/lib/utils";

export function StatusControls({ id, status }: { id: string; status: ApplicationStatus }) {
  const [pending, startTransition] = useTransition();
  const rejected = status === "REJECTED";
  const steps: ApplicationStatus[] = rejected
    ? ["DRAFT", "GATHERING_DOCS", "READY", "SUBMITTED", "REJECTED"]
    : APPLICATION_FLOW;
  const currentIndex = steps.indexOf(status);
  const nextSteps = allowedTransitions(status);
  const forward = nextSteps.filter((s) => steps.indexOf(s) > currentIndex || s === "REJECTED");
  const back = nextSteps.filter((s) => !forward.includes(s));

  function move(to: ApplicationStatus) {
    startTransition(async () => {
      const result = await changeApplicationStatus(id, to);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap items-center gap-y-2" aria-label="Application progress">
        {steps.map((step, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          const failed = step === "REJECTED";
          return (
            <li key={step} className="flex items-center">
              <span
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  done && "text-success",
                  current && !failed && "bg-primary text-primary-foreground",
                  current && failed && "bg-destructive text-white",
                  !done && !current && "text-muted-foreground",
                )}
              >
                {done && <Check className="size-3.5" />}
                {current && failed && <X className="size-3.5" />}
                {APPLICATION_STATUS_LABELS[step]}
              </span>
              {i < steps.length - 1 && <span className={cn("mx-1 h-px w-4 sm:w-6", done ? "bg-success" : "bg-border")} />}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-2">
        {forward.map((to) => (
          <Button
            key={to}
            onClick={() => move(to)}
            disabled={pending}
            variant={to === "REJECTED" ? "destructive" : "default"}
          >
            {pending ? <Loader2 className="animate-spin" /> : to === "REJECTED" ? <X /> : <ArrowRight />}
            {to === "REJECTED" ? "Mark rejected" : `Move to ${APPLICATION_STATUS_LABELS[to].toLowerCase()}`}
          </Button>
        ))}
        {back.map((to) => (
          <Button key={to} variant="ghost" onClick={() => move(to)} disabled={pending}>
            <ArrowLeft /> Back to {APPLICATION_STATUS_LABELS[to].toLowerCase()}
          </Button>
        ))}
      </div>
    </div>
  );
}
