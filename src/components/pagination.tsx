import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  total,
  basePath,
  params,
}: {
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return <p className="mt-4 text-sm text-muted-foreground">{total} results</p>;

  const hrefFor = (p: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    if (p > 1) search.set("page", String(p));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
      <span>
        Page {page} of {pageCount} · {total} results
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild={page > 1} disabled={page <= 1}>
          {page > 1 ? (
            <Link href={hrefFor(page - 1)}>
              <ChevronLeft /> Previous
            </Link>
          ) : (
            <span>
              <ChevronLeft /> Previous
            </span>
          )}
        </Button>
        <Button variant="outline" size="sm" asChild={page < pageCount} disabled={page >= pageCount}>
          {page < pageCount ? (
            <Link href={hrefFor(page + 1)}>
              Next <ChevronRight />
            </Link>
          ) : (
            <span>
              Next <ChevronRight />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
