import type {
  ActivityType,
  ApplicationStatus,
  County,
  DocumentStatus,
  EnterpriseType,
  LineKind,
  PaymentMethod,
} from "@/generated/prisma/enums";
import type { InvoiceDisplayStatus } from "./invoice";

export function countyLabel(county: County): string {
  return county.charAt(0) + county.slice(1).toLowerCase();
}

export const ENTERPRISE_LABELS: Record<EnterpriseType, string> = {
  BEEF: "Beef",
  DAIRY: "Dairy",
  SHEEP: "Sheep",
  TILLAGE: "Tillage",
  MIXED: "Mixed",
  FORESTRY: "Forestry",
  OTHER: "Other",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  GATHERING_DOCS: "Gathering docs",
  READY: "Ready to submit",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID_OUT: "Paid out",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  MISSING: "Missing",
  RECEIVED: "Received",
  NOT_REQUIRED: "Not required",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceDisplayStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIAL: "Part paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  CALL: "Phone call",
  VISIT: "Farm visit",
  NOTE: "Note",
  SUBMISSION: "Submission",
  PAYMENT: "Payment",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  TRANSFER: "Bank transfer",
  CHEQUE: "Cheque",
  CASH: "Cash",
  CARD: "Card",
};

export const LINE_KIND_LABELS: Record<LineKind, string> = {
  FIXED: "Fixed fee",
  HOURLY: "Hourly",
};
