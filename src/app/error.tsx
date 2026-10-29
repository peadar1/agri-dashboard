"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title="Something went wrong"
      description={
        error.digest
          ? `The page couldn't load (ref ${error.digest}). Check the database is running and try again.`
          : "The page couldn't load. Check the database is running and try again."
      }
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
