import type { ApplicationStatus, DocumentStatus } from "@/generated/prisma/enums";

export const APPLICATION_FLOW: ApplicationStatus[] = [
  "DRAFT",
  "GATHERING_DOCS",
  "READY",
  "SUBMITTED",
  "APPROVED",
  "PAID_OUT",
];

export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "DRAFT",
  "GATHERING_DOCS",
  "READY",
  "SUBMITTED",
];

const TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ["GATHERING_DOCS"],
  GATHERING_DOCS: ["DRAFT", "READY"],
  READY: ["GATHERING_DOCS", "SUBMITTED"],
  SUBMITTED: ["READY", "APPROVED", "REJECTED"],
  APPROVED: ["SUBMITTED", "PAID_OUT"],
  REJECTED: ["SUBMITTED"],
  PAID_OUT: ["APPROVED"],
};

export function allowedTransitions(from: ApplicationStatus): ApplicationStatus[] {
  return TRANSITIONS[from];
}

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export const PRE_SUBMISSION_STATUSES: ApplicationStatus[] = ["DRAFT", "GATHERING_DOCS", "READY"];

// A deadline only matters until the application has been submitted.
export function isAwaitingSubmission(status: ApplicationStatus): boolean {
  return PRE_SUBMISSION_STATUSES.includes(status);
}

export interface ChecklistProgress {
  required: number;
  received: number;
  percent: number;
  complete: boolean;
}

export function checklistProgress(documents: { status: DocumentStatus }[]): ChecklistProgress {
  const required = documents.filter((d) => d.status !== "NOT_REQUIRED").length;
  const received = documents.filter((d) => d.status === "RECEIVED").length;
  const percent = required === 0 ? 100 : Math.round((received / required) * 100);
  return { required, received, percent, complete: received === required };
}
