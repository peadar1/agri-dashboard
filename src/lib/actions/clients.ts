"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { activitySchema, clientSchema, type ClientInput } from "@/lib/validation/client";
import { formDataToObject, validationFailure, type FormState } from "@/lib/validation/form";

function toData(input: ClientInput) {
  return {
    ...input,
    phone: input.phone ?? null,
    email: input.email ?? null,
    addressLine1: input.addressLine1 ?? null,
    addressLine2: input.addressLine2 ?? null,
    town: input.town ?? null,
    eircode: input.eircode ?? null,
    totalHectares: input.totalHectares ?? null,
    eligibleHectares: input.eligibleHectares ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    agfoodId: input.agfoodId ?? null,
    notes: input.notes ?? null,
  };
}

function duplicateHerd(error: unknown): FormState | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return {
      ok: false,
      message: "Another client already has this herd number.",
      errors: { herdNumber: ["This herd number is already registered"] },
    };
  }
  return null;
}

export async function createClient(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = clientSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  let id: string;
  try {
    const client = await db.client.create({ data: toData(parsed.data) });
    id = client.id;
  } catch (error) {
    const dup = duplicateHerd(error);
    if (dup) return dup;
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(`/clients/${id}`);
}

export async function updateClient(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = clientSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await db.client.update({ where: { id }, data: toData(parsed.data) });
  } catch (error) {
    const dup = duplicateHerd(error);
    if (dup) return dup;
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(`/clients/${id}`);
}

export async function deleteClient(id: string): Promise<FormState> {
  const invoiceCount = await db.invoice.count({ where: { clientId: id, status: { not: "DRAFT" } } });
  if (invoiceCount > 0) {
    return {
      ok: false,
      message: "This client has issued invoices, which must be kept for your records. Void them instead.",
    };
  }
  await db.$transaction([
    db.invoice.deleteMany({ where: { clientId: id } }),
    db.client.delete({ where: { id } }),
  ]);
  revalidatePath("/", "layout");
  redirect("/clients");
}

export async function addActivity(clientId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = activitySchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  await db.activity.create({ data: { clientId, ...parsed.data } });
  revalidatePath(`/clients/${clientId}`);
  return { ok: true, message: "Logged." };
}

export async function deleteActivity(id: string, clientId: string): Promise<void> {
  await db.activity.delete({ where: { id, clientId } });
  revalidatePath(`/clients/${clientId}`);
}
