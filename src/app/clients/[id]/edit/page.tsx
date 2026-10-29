import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { updateClient } from "@/lib/actions/clients";
import { getClientRecord } from "@/lib/queries/clients";
import { ClientForm } from "../../client-form";
import { DeleteClientButton } from "./delete-client-button";

export default async function EditClientPage({ params }: PageProps<"/clients/[id]/edit">) {
  const { id } = await params;
  const client = await getClientRecord(id);
  if (!client) notFound();

  return (
    <>
      <PageHeader
        title={`Edit ${client.firstName} ${client.lastName}`}
        back={{ href: `/clients/${id}`, label: "Back to client" }}
        actions={<DeleteClientButton clientId={id} name={`${client.firstName} ${client.lastName}`} />}
      />
      <ClientForm action={updateClient.bind(null, id)} client={client} cancelHref={`/clients/${id}`} submitLabel="Save changes" />
    </>
  );
}
