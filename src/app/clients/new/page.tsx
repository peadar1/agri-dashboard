import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/actions/clients";
import { ClientForm } from "../client-form";

export const metadata: Metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <>
      <PageHeader title="New client" back={{ href: "/clients", label: "Clients" }} />
      <ClientForm action={createClient} cancelHref="/clients" submitLabel="Create client" />
    </>
  );
}
