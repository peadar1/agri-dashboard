"use client";

import { useEffect, useRef, useTransition } from "react";
import { Check, CircleDashed, Download, Loader2, MinusCircle, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { DocumentStatus } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DocumentStatusBadge } from "@/components/status-badges";
import { SubmitButton } from "@/components/form/submit-button";
import { useServerForm } from "@/components/form/use-server-form";
import { addDocument, deleteDocument, setDocumentStatus, uploadDocument } from "@/lib/actions/applications";
import { checklistProgress } from "@/lib/domain/application";
import { initialFormState } from "@/lib/validation/form";

interface Doc {
  id: string;
  name: string;
  status: DocumentStatus;
  fileName: string | null;
}

export function DocumentChecklist({ applicationId, documents }: { applicationId: string; documents: Doc[] }) {
  const progress = checklistProgress(documents);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="text-muted-foreground">
            {progress.received} of {progress.required} received
          </span>
          <span className="font-medium tabular-nums">{progress.percent}%</span>
        </div>
        <Progress value={progress.percent} aria-label="Documents received" />
      </div>

      {documents.length > 0 && (
        <ul className="divide-y rounded-xl border">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} applicationId={applicationId} doc={doc} />
          ))}
        </ul>
      )}

      <AddDocumentForm applicationId={applicationId} />
    </div>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} disabled={disabled} className={className}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function DocumentRow({ applicationId, doc }: { applicationId: string; doc: Doc }) {
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const run = (fn: () => Promise<unknown>) => startTransition(async () => void (await fn()));

  function upload(file: File) {
    const data = new FormData();
    data.set("file", file);
    startTransition(async () => {
      const result = await uploadDocument(doc.id, applicationId, initialFormState, data);
      if (result.ok) toast.success(`${doc.name}: uploaded`);
      else toast.error(result.message);
      if (fileInput.current) fileInput.current.value = "";
    });
  }

  return (
    <li className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className={doc.status === "NOT_REQUIRED" ? "text-sm text-muted-foreground line-through" : "text-sm font-medium"}>{doc.name}</p>
        {doc.fileName && (
          <a href={`/api/documents/${doc.id}`} className="inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline">
            <Download className="size-3 shrink-0" />
            <span className="truncate">{doc.fileName}</span>
          </a>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {pending ? <Loader2 className="mr-1 size-4 animate-spin text-muted-foreground" /> : <DocumentStatusBadge status={doc.status} />}
        {doc.status !== "RECEIVED" && (
          <IconAction label="Mark received" disabled={pending} onClick={() => run(() => setDocumentStatus(doc.id, applicationId, "RECEIVED"))} className="text-success">
            <Check />
          </IconAction>
        )}
        {doc.status !== "MISSING" && (
          <IconAction label="Mark missing" disabled={pending} onClick={() => run(() => setDocumentStatus(doc.id, applicationId, "MISSING"))}>
            <CircleDashed />
          </IconAction>
        )}
        {doc.status !== "NOT_REQUIRED" && (
          <IconAction label="Not required" disabled={pending} onClick={() => run(() => setDocumentStatus(doc.id, applicationId, "NOT_REQUIRED"))}>
            <MinusCircle />
          </IconAction>
        )}
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          aria-label={`Upload ${doc.name}`}
          accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <IconAction label={doc.fileName ? "Replace file" : "Upload file"} disabled={pending} onClick={() => fileInput.current?.click()}>
          <Upload />
        </IconAction>
        <IconAction label="Remove from checklist" disabled={pending} onClick={() => run(() => deleteDocument(doc.id, applicationId))} className="text-muted-foreground hover:text-destructive">
          <Trash2 />
        </IconAction>
      </div>
    </li>
  );
}

function AddDocumentForm({ applicationId }: { applicationId: string }) {
  const { state, onSubmit, pending, errors } = useServerForm(addDocument.bind(null, applicationId));
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="flex gap-2">
      <div className="flex-1">
        <Input name="name" placeholder="Add another document…" aria-label="Document name" aria-invalid={errors.name ? true : undefined} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name[0]}</p>}
      </div>
      <SubmitButton variant="secondary" pending={pending}><Plus /> Add</SubmitButton>
    </form>
  );
}
