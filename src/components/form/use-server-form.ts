"use client";

import { startTransition, useActionState } from "react";
import { initialFormState, type FormState } from "@/lib/validation/form";

// Submitting via a transition (instead of <form action>) keeps the user's input
// when the server returns validation errors; React resets action-driven forms.
export function useServerForm(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, formAction, pending] = useActionState(action, initialFormState);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(formData));
  }

  return { state, onSubmit, pending, errors: state.errors ?? {} };
}
