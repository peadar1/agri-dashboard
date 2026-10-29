// Date-only fields (due dates, deadlines) are stored as UTC midnight, so they are
// formatted in UTC; timestamps are shown in Irish local time.
const IRISH_TZ = "Europe/Dublin";
const DAY_MS = 86_400_000;

const isoDateInIreland = new Intl.DateTimeFormat("en-CA", {
  timeZone: IRISH_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-IE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: IRISH_TZ,
});

export function todayDateOnly(now: Date = new Date()): Date {
  return parseDateOnly(isoDateInIreland.format(now))!;
}

export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || toDateInput(date) !== value ? null : date;
}

export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date);
}
