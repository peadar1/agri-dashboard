import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FieldProps {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
  className?: string;
  required?: boolean;
}

export function Field({
  label,
  name,
  errors,
  hint,
  className,
  required,
  children,
}: FieldProps & { children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {errors?.length ? (
        <p id={`${name}-error`} className="text-xs text-destructive">
          {errors[0]}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  name,
  errors,
  hint,
  className,
  inputClassName,
  required,
  ...inputProps
}: FieldProps & Omit<React.ComponentProps<"input">, "name"> & { inputClassName?: string }) {
  return (
    <Field label={label} name={name} errors={errors} hint={hint} className={className} required={required}>
      <Input
        id={name}
        name={name}
        required={required}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? `${name}-error` : undefined}
        className={inputClassName}
        {...inputProps}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  name,
  errors,
  hint,
  className,
  required,
  ...props
}: FieldProps & Omit<React.ComponentProps<"textarea">, "name">) {
  return (
    <Field label={label} name={name} errors={errors} hint={hint} className={className} required={required}>
      <Textarea
        id={name}
        name={name}
        required={required}
        aria-invalid={errors?.length ? true : undefined}
        {...props}
      />
    </Field>
  );
}

export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

export function SelectField({
  label,
  name,
  errors,
  hint,
  className,
  required,
  options,
  placeholder,
  ...props
}: FieldProps &
  Omit<React.ComponentProps<"select">, "name"> & {
    options: { value: string; label: string }[];
    placeholder?: string;
  }) {
  return (
    <Field label={label} name={name} errors={errors} hint={hint} className={className} required={required}>
      <NativeSelect id={name} name={name} required={required} aria-invalid={errors?.length ? true : undefined} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}

export function FormMessage({ state }: { state: { ok?: boolean; message?: string } }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn("text-sm", state.ok ? "text-success" : "text-destructive")}
    >
      {state.message}
    </p>
  );
}
