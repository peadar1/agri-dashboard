import { db } from "@/lib/db";
import { contentTypeFor, readUpload } from "@/lib/storage";

export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const { id } = await ctx.params;
  const doc = await db.applicationDocument.findUnique({ where: { id } });
  if (!doc?.storedName || !doc.fileName) return new Response("Not found", { status: 404 });

  let body: Buffer;
  try {
    body = await readUpload(doc.storedName);
  } catch {
    return new Response("File missing from storage", { status: 404 });
  }

  const asciiName = doc.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": contentTypeFor(doc.fileName),
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
