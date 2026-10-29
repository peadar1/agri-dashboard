"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { canTransition } from "@/lib/domain/application";
import { APPLICATION_STATUS_LABELS } from "@/lib/domain/labels";
import { todayDateOnly } from "@/lib/domain/dates";
import { deleteFolder, deleteUpload, saveUpload, validateUpload } from "@/lib/storage";
import {
  applicationDetailsSchema,
  createApplicationSchema,
  documentSchema,
  documentStatusSchema,
  statusSchema,
} from "@/lib/validation/application";
import { formDataToObject, validationFailure, type FormState } from "@/lib/validation/form";

function revalidateApplication(id: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/applications/${id}`);
}

export async function createApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = createApplicationSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const { clientId, schemeId, year, deadline, dafmReference, amountApplied, notes } = parsed.data;

  const scheme = await db.scheme.findUnique({
    where: { id: schemeId },
    include: { documentTemplates: { orderBy: { sortOrder: "asc" } } },
  });
  if (!scheme) return { ok: false, errors: { schemeId: ["Scheme not found"] } };
  if (!(await db.client.count({ where: { id: clientId } }))) {
    return { ok: false, errors: { clientId: ["Client not found"] } };
  }

  const application = await db.$transaction(async (tx) => {
    const created = await tx.grantApplication.create({
      data: {
        clientId,
        schemeId,
        year,
        deadline: deadline ?? null,
        dafmReference: dafmReference ?? null,
        amountAppliedCents: amountApplied ?? null,
        notes: notes ?? null,
        status: scheme.documentTemplates.length ? "GATHERING_DOCS" : "DRAFT",
        documents: {
          create: scheme.documentTemplates.map((t) => ({ name: t.name, sortOrder: t.sortOrder })),
        },
      },
    });
    await tx.activity.create({
      data: { clientId, type: "NOTE", body: `Started ${scheme.name} ${year} application.` },
    });
    return created;
  });

  revalidatePath("/", "layout");
  redirect(`/applications/${application.id}`);
}

export async function updateApplication(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = applicationDetailsSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const { deadline, dafmReference, amountApplied, amountApproved, notes } = parsed.data;

  await db.grantApplication.update({
    where: { id },
    data: {
      deadline: deadline ?? null,
      dafmReference: dafmReference ?? null,
      amountAppliedCents: amountApplied ?? null,
      amountApprovedCents: amountApproved ?? null,
      notes: notes ?? null,
    },
  });
  revalidateApplication(id);
  return { ok: true, message: "Saved." };
}

const ACTIVITY_FOR_STATUS: Partial<Record<ApplicationStatus, "SUBMISSION" | "NOTE">> = {
  SUBMITTED: "SUBMISSION",
  APPROVED: "NOTE",
  REJECTED: "NOTE",
  PAID_OUT: "NOTE",
};

export async function changeApplicationStatus(id: string, target: string): Promise<FormState> {
  const to = statusSchema.safeParse(target);
  if (!to.success) return { ok: false, message: "Unknown status." };

  const app = await db.grantApplication.findUnique({ where: { id }, include: { scheme: true } });
  if (!app) return { ok: false, message: "Application not found." };
  if (!canTransition(app.status, to.data)) {
    return {
      ok: false,
      message: `Can't move from ${APPLICATION_STATUS_LABELS[app.status]} to ${APPLICATION_STATUS_LABELS[to.data]}.`,
    };
  }

  const today = todayDateOnly();
  const activityType = ACTIVITY_FOR_STATUS[to.data];
  await db.$transaction([
    db.grantApplication.update({
      where: { id },
      data: {
        status: to.data,
        ...(to.data === "SUBMITTED" && { submittedAt: today }),
        ...((to.data === "APPROVED" || to.data === "REJECTED") && { decisionAt: today }),
      },
    }),
    ...(activityType
      ? [
          db.activity.create({
            data: {
              clientId: app.clientId,
              type: activityType,
              body: `${app.scheme.name} ${app.year}: ${APPLICATION_STATUS_LABELS[to.data].toLowerCase()}.`,
            },
          }),
        ]
      : []),
  ]);
  revalidateApplication(id);
  return { ok: true, message: `Marked as ${APPLICATION_STATUS_LABELS[to.data].toLowerCase()}.` };
}

export async function deleteApplication(id: string): Promise<FormState> {
  await db.grantApplication.delete({ where: { id } });
  await deleteFolder(id);
  revalidatePath("/", "layout");
  redirect("/applications");
}

export async function addDocument(applicationId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = documentSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const last = await db.applicationDocument.aggregate({ where: { applicationId }, _max: { sortOrder: true } });
  await db.applicationDocument.create({
    data: { applicationId, name: parsed.data.name, sortOrder: (last._max.sortOrder ?? -1) + 1 },
  });
  revalidateApplication(applicationId);
  return { ok: true };
}

export async function setDocumentStatus(documentId: string, applicationId: string, status: string): Promise<void> {
  const parsed = documentStatusSchema.parse(status);
  await db.applicationDocument.update({
    where: { id: documentId, applicationId },
    data: { status: parsed, receivedAt: parsed === "RECEIVED" ? new Date() : null },
  });
  revalidateApplication(applicationId);
}

export async function uploadDocument(
  documentId: string,
  applicationId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Choose a file to upload." };
  const problem = validateUpload(file);
  if (problem) return { ok: false, message: problem };

  const doc = await db.applicationDocument.findUnique({ where: { id: documentId, applicationId } });
  if (!doc) return { ok: false, message: "Document not found." };

  const storedName = await saveUpload(file, applicationId);
  await db.applicationDocument.update({
    where: { id: documentId },
    data: { storedName, fileName: file.name.slice(0, 200), status: "RECEIVED", receivedAt: new Date() },
  });
  await deleteUpload(doc.storedName);
  revalidateApplication(applicationId);
  return { ok: true, message: "Uploaded." };
}

export async function deleteDocument(documentId: string, applicationId: string): Promise<void> {
  const doc = await db.applicationDocument.delete({ where: { id: documentId, applicationId } });
  await deleteUpload(doc.storedName);
  revalidateApplication(applicationId);
}
