import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Not found"
      description="That client, application or invoice doesn't exist. It may have been deleted."
      action={
        <Button asChild>
          <Link href="/">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
