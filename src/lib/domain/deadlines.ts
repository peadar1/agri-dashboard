import { daysBetween } from "./dates";

export type Urgency = "overdue" | "urgent" | "soon" | "later";

export function daysUntil(date: Date, today: Date): number {
  return daysBetween(today, date);
}

export function deadlineUrgency(date: Date, today: Date): Urgency {
  const days = daysUntil(date, today);
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "later";
}

export function describeDaysUntil(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}
