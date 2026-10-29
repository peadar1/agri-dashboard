"use client";

import { useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { ActivityType } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { NativeSelect, FormMessage } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { useServerForm } from "@/components/form/use-server-form";
import { addActivity, deleteActivity } from "@/lib/actions/clients";
import { ACTIVITY_LABELS } from "@/lib/domain/labels";

export function ActivityForm({ clientId }: { clientId: string }) {
  const { state, onSubmit, pending, errors } = useServerForm(addActivity.bind(null, clientId));
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit} className="grid gap-2 rounded-xl border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect name="type" defaultValue="CALL" aria-label="Activity type" className="w-36">
          {(Object.values(ActivityType) as ActivityType[]).map((t) => (
            <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>
          ))}
        </NativeSelect>
        <span className="text-xs text-muted-foreground">Logged with today&apos;s date and time</span>
      </div>
      <Textarea name="body" rows={2} placeholder="e.g. Rang about missing bank details for ACRES" aria-label="Details" aria-invalid={errors.body ? true : undefined} />
      <div className="flex items-center justify-end gap-3">
        {errors.body ? <p className="text-xs text-destructive">{errors.body[0]}</p> : <FormMessage state={state} />}
        <SubmitButton size="sm" pending={pending}>Log activity</SubmitButton>
      </div>
    </form>
  );
}

export function DeleteActivityButton({ id, clientId }: { id: string; clientId: string }) {
  return (
    <form action={deleteActivity.bind(null, id, clientId)}>
      <Button type="submit" variant="ghost" size="icon-xs" aria-label="Delete activity" className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100">
        <Trash2 />
      </Button>
    </form>
  );
}
