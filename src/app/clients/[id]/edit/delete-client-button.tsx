"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/confirm-action";
import { deleteClient } from "@/lib/actions/clients";

export function DeleteClientButton({ clientId, name }: { clientId: string; name: string }) {
  return (
    <ConfirmAction
      trigger={
        <Button variant="destructive">
          <Trash2 /> Delete client
        </Button>
      }
      title={`Delete ${name}?`}
      description="This removes the client, their applications, documents and activity log. Clients with issued invoices can't be deleted."
      confirmLabel="Delete"
      action={() => deleteClient(clientId)}
    />
  );
}
