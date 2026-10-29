"use client";

import { useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { Ban, Download, Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PaymentMethod } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/confirm-action";
import { FormMessage, SelectField, TextField } from "@/components/form/fields";
import { SubmitButton } from "@/components/form/submit-button";
import { useServerForm } from "@/components/form/use-server-form";
import { deleteInvoice, deletePayment, issueInvoice, recordPayment, voidInvoice } from "@/lib/actions/invoices";
import { PAYMENT_METHOD_LABELS } from "@/lib/domain/labels";

export function InvoiceActions({ id, status, hasPayments }: { id: string; status: "DRAFT" | "ISSUED" | "VOID"; hasPayments: boolean }) {
  const [pending, startTransition] = useTransition();

  function issue() {
    startTransition(async () => {
      const result = await issueInvoice(id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <>
      {status === "DRAFT" && (
        <>
          <ConfirmAction
            trigger={<Button variant="ghost"><Trash2 /> Delete</Button>}
            title="Delete this draft?"
            description="Drafts have no invoice number yet, so deleting one leaves no gap in your numbering."
            confirmLabel="Delete draft"
            action={() => deleteInvoice(id)}
          />
          <Button variant="outline" asChild>
            <Link href={`/invoices/${id}/edit`}><Pencil /> Edit</Link>
          </Button>
          <Button onClick={issue} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Send />} Issue invoice
          </Button>
        </>
      )}
      {status === "ISSUED" && !hasPayments && (
        <ConfirmAction
          trigger={<Button variant="ghost"><Ban /> Void</Button>}
          title="Void this invoice?"
          description="The invoice number is kept for your records but the balance is cancelled. This can't be undone."
          confirmLabel="Void invoice"
          action={() => voidInvoice(id)}
          successMessage="Invoice voided."
        />
      )}
      {status !== "DRAFT" && (
        <Button variant={status === "VOID" ? "outline" : "default"} asChild>
          <a href={`/invoices/${id}/pdf`} target="_blank" rel="noopener">
            <Download /> PDF
          </a>
        </Button>
      )}
    </>
  );
}

export function PaymentForm({ invoiceId, balance, today }: { invoiceId: string; balance: string; today: string }) {
  const { state, onSubmit, pending, errors } = useServerForm(recordPayment.bind(null, invoiceId));
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      ref.current?.reset();
    }
  }, [state]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="grid gap-3" noValidate>
      <TextField label="Amount (€)" name="amount" inputMode="decimal" required defaultValue={balance} key={balance} errors={errors.amount} />
      <TextField label="Date received" name="paidAt" type="date" required defaultValue={today} errors={errors.paidAt} />
      <SelectField
        label="Method"
        name="method"
        required
        defaultValue="TRANSFER"
        options={(Object.values(PaymentMethod) as PaymentMethod[]).map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))}
        errors={errors.method}
      />
      <TextField label="Reference" name="reference" placeholder="Cheque no. or bank ref" errors={errors.reference} />
      <div className="flex items-center justify-end gap-3 sm:col-span-2">
        {!state.ok && <FormMessage state={state} />}
        <SubmitButton pending={pending}>Record payment</SubmitButton>
      </div>
    </form>
  );
}

export function DeletePaymentButton({ paymentId, invoiceId }: { paymentId: string; invoiceId: string }) {
  return (
    <ConfirmAction
      trigger={
        <Button variant="ghost" size="icon-xs" aria-label="Remove payment" className="text-muted-foreground hover:text-destructive">
          <Trash2 />
        </Button>
      }
      title="Remove this payment?"
      description="Use this if a payment was recorded by mistake or a cheque bounced."
      confirmLabel="Remove"
      action={() => deletePayment(paymentId, invoiceId)}
    />
  );
}
