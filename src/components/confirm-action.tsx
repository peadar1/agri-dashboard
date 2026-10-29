"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { FormState } from "@/lib/validation/form";

export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  action,
  destructive = true,
  successMessage,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<FormState | void>;
  destructive?: boolean;
  successMessage?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await action();
                if (result && result.ok === false) toast.error(result.message ?? "Something went wrong.");
                else if (successMessage) toast.success(successMessage);
              });
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
