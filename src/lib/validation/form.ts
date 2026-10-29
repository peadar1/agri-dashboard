import { z } from "zod";

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
}

export const initialFormState: FormState = {};

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const optionalText = (max = 200) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

export const requiredText = (label: string, max = 200) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max);

export const optionalNumber = (opts: { min?: number; max?: number } = {}) =>
  z.preprocess(
    blankToUndefined,
    z.coerce
      .number({ error: "Must be a number" })
      .min(opts.min ?? Number.MIN_SAFE_INTEGER)
      .max(opts.max ?? Number.MAX_SAFE_INTEGER)
      .optional(),
  );

export function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  const entries = [...formData.entries()].filter(([key]) => !key.startsWith("$ACTION"));
  return Object.fromEntries(entries);
}

export function validationFailure(error: z.ZodError): FormState {
  return {
    ok: false,
    message: "Please fix the highlighted fields.",
    errors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  };
}
