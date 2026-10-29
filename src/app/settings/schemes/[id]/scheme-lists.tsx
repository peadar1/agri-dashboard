"use client";

import { useEffect, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/form/submit-button";
import { useServerForm } from "@/components/form/use-server-form";
import { ConfirmAction } from "@/components/confirm-action";
import {
  addDeadline,
  addDocumentTemplate,
  deleteDeadline,
  deleteDocumentTemplate,
  deleteScheme,
} from "@/lib/actions/settings";

function useResetOnSuccess(ok: boolean | undefined, state: unknown) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (ok) ref.current?.reset();
  }, [ok, state]);
  return ref;
}

export function AddTemplateForm({ schemeId }: { schemeId: string }) {
  const { state, onSubmit, pending, errors } = useServerForm(addDocumentTemplate.bind(null, schemeId));
  const ref = useResetOnSuccess(state.ok, state);
  return (
    <form ref={ref} onSubmit={onSubmit} className="flex gap-2">
      <div className="flex-1">
        <Input name="name" placeholder="e.g. Signed nitrates declaration" aria-label="Document name" aria-invalid={errors.name ? true : undefined} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name[0]}</p>}
      </div>
      <SubmitButton variant="secondary" pending={pending}><Plus /> Add</SubmitButton>
    </form>
  );
}

export function AddDeadlineForm({ schemeId }: { schemeId: string }) {
  const { state, onSubmit, pending, errors } = useServerForm(addDeadline.bind(null, schemeId));
  const ref = useResetOnSuccess(state.ok, state);
  return (
    <form ref={ref} onSubmit={onSubmit} className="grid gap-2 sm:grid-cols-[1fr_10rem_auto]">
      <div>
        <Input name="title" placeholder="e.g. 2027 closing date" aria-label="Deadline title" aria-invalid={errors.title ? true : undefined} />
        {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title[0]}</p>}
      </div>
      <div>
        <Input name="date" type="date" aria-label="Deadline date" aria-invalid={errors.date ? true : undefined} />
        {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date[0]}</p>}
      </div>
      <SubmitButton variant="secondary" pending={pending}><Plus /> Add</SubmitButton>
    </form>
  );
}

export function RemoveButton({ kind, id, schemeId }: { kind: "template" | "deadline"; id: string; schemeId: string }) {
  const action = kind === "template" ? deleteDocumentTemplate : deleteDeadline;
  return (
    <form action={action.bind(null, id, schemeId)}>
      <Button type="submit" variant="ghost" size="icon-sm" aria-label={`Remove ${kind}`} className="text-muted-foreground hover:text-destructive">
        <Trash2 />
      </Button>
    </form>
  );
}

export function DeleteSchemeButton({ schemeId, name }: { schemeId: string; name: string }) {
  return (
    <ConfirmAction
      trigger={<Button variant="destructive"><Trash2 /> Delete scheme</Button>}
      title={`Delete ${name}?`}
      description="Schemes that already have applications can't be deleted. Mark them inactive instead."
      confirmLabel="Delete"
      action={() => deleteScheme(schemeId)}
    />
  );
}
