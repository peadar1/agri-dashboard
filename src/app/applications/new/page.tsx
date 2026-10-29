import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons";
import { listClientOptions } from "@/lib/queries/clients";
import { listSchemesForForm } from "@/lib/queries/applications";
import { getToday } from "@/lib/today";
import { ApplicationForm } from "./application-form";

export const metadata: Metadata = { title: "New application" };

export default function NewApplicationPage({ searchParams }: PageProps<"/applications/new">) {
  return (
    <>
      <PageHeader title="New grant application" back={{ href: "/applications", label: "Applications" }} />
      <Suspense fallback={<TableSkeleton rows={4} />}>
        <FormLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function FormLoader({ searchParams }: Pick<PageProps<"/applications/new">, "searchParams">) {
  const { clientId } = await searchParams;
  const today = await getToday();
  const [clients, schemes] = await Promise.all([listClientOptions(), listSchemesForForm(today)]);
  return (
    <ApplicationForm
      clients={clients}
      schemes={schemes}
      defaultClientId={typeof clientId === "string" ? clientId : undefined}
      defaultYear={today.getUTCFullYear()}
    />
  );
}
