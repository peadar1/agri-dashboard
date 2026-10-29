"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Field } from "./fields";

export interface ClientOption {
  id: string;
  label: string;
  detail: string;
}

const MAX_RESULTS = 50;

export function ClientPicker({
  options,
  name = "clientId",
  label = "Client",
  defaultValue,
  errors,
  onChange,
}: {
  options: ClientOption[];
  name?: string;
  label?: string;
  defaultValue?: string;
  errors?: string[];
  onChange?: (id: string) => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const selected = options.find((o) => o.id === selectedId);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const matching =
      !terms.length || (selected && query === selected.label)
        ? options
        : options.filter((o) => {
            const haystack = `${o.label} ${o.detail}`.toLowerCase();
            return terms.every((t) => haystack.includes(t));
          });
    return matching.slice(0, MAX_RESULTS);
  }, [options, query, selected]);

  function choose(option: ClientOption) {
    setSelectedId(option.id);
    setQuery(option.label);
    setOpen(false);
    onChange?.(option.id);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && open && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <Field label={label} name={`${name}-search`} errors={errors} required>
      <div className="relative">
        <input type="hidden" name={name} value={selectedId} />
        <Input
          ref={inputRef}
          id={`${name}-search`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
          aria-invalid={errors?.length ? true : undefined}
          autoComplete="off"
          placeholder="Search by name, herd number or town…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
            if (selectedId) {
              setSelectedId("");
              onChange?.("");
            }
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="pr-8"
        />
        <ChevronsUpDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        {open && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg bg-popover p-1 text-sm shadow-md ring-1 ring-foreground/10"
          >
            {results.length === 0 ? (
              <li className="px-2 py-1.5 text-muted-foreground">No matching clients</li>
            ) : (
              results.map((o, i) => (
                <li
                  key={o.id}
                  id={`${listId}-${o.id}`}
                  role="option"
                  aria-selected={o.id === selectedId}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(o);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex cursor-default items-center justify-between gap-2 rounded-md px-2 py-1.5",
                    i === active && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{o.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{o.detail}</span>
                  </span>
                  {o.id === selectedId && <Check className="size-4 shrink-0" />}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </Field>
  );
}
