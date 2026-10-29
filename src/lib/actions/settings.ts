"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
  businessSettingsSchema,
  deadlineSchema,
  documentTemplateSchema,
  schemeSchema,
} from "@/lib/validation/settings";
import { formDataToObject, validationFailure, type FormState } from "@/lib/validation/form";

function nullify<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v === undefined ? null : v])) as {
    [K in keyof T]: Exclude<T[K], undefined> | null;
  };
}

function duplicateCode(error: unknown): FormState | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { ok: false, message: "That scheme code is already used.", errors: { code: ["Already in use"] } };
  }
  return null;
}

export async function saveBusinessSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = businessSettingsSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const { businessName, address, paymentTermsDays, ...optional } = parsed.data;
  const data = { businessName, address, paymentTermsDays, ...nullify(optional) };
  await db.businessSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  revalidatePath("/", "layout");
  return { ok: true, message: "Business details saved." };
}

export async function createScheme(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schemeSchema.safeParse({ ...formDataToObject(formData), active: "on" });
  if (!parsed.success) return validationFailure(parsed.error);

  let id: string;
  try {
    const { defaultFee, ...rest } = parsed.data;
    const scheme = await db.scheme.create({
      data: { ...rest, description: rest.description ?? null, defaultFeeCents: defaultFee ?? null },
    });
    id = scheme.id;
  } catch (error) {
    const dup = duplicateCode(error);
    if (dup) return dup;
    throw error;
  }
  revalidatePath("/", "layout");
  redirect(`/settings/schemes/${id}`);
}

export async function updateScheme(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schemeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const { defaultFee, ...rest } = parsed.data;
    await db.scheme.update({
      where: { id },
      data: { ...rest, description: rest.description ?? null, defaultFeeCents: defaultFee ?? null },
    });
  } catch (error) {
    const dup = duplicateCode(error);
    if (dup) return dup;
    throw error;
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Scheme saved." };
}

export async function deleteScheme(id: string): Promise<FormState> {
  const inUse = await db.grantApplication.count({ where: { schemeId: id } });
  if (inUse > 0) {
    return { ok: false, message: `This scheme has ${inUse} application(s). Mark it inactive instead.` };
  }
  await db.scheme.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/settings");
}

export async function addDocumentTemplate(schemeId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = documentTemplateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const last = await db.schemeDocumentTemplate.aggregate({ where: { schemeId }, _max: { sortOrder: true } });
  await db.schemeDocumentTemplate.create({
    data: { schemeId, name: parsed.data.name, sortOrder: (last._max.sortOrder ?? -1) + 1 },
  });
  revalidatePath(`/settings/schemes/${schemeId}`);
  return { ok: true };
}

export async function deleteDocumentTemplate(id: string, schemeId: string): Promise<void> {
  await db.schemeDocumentTemplate.delete({ where: { id, schemeId } });
  revalidatePath(`/settings/schemes/${schemeId}`);
}

export async function addDeadline(schemeId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = deadlineSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  await db.schemeDeadline.create({ data: { schemeId, ...parsed.data, notes: parsed.data.notes ?? null } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteDeadline(id: string, schemeId: string): Promise<void> {
  await db.schemeDeadline.delete({ where: { id, schemeId } });
  revalidatePath("/", "layout");
}
