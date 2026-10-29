import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

// Local disk storage for application documents. Swap these four functions for an
// S3/Blob client to move uploads off the server.
const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".heic": "image/heic",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function validateUpload(file: File): string | null {
  if (file.size === 0) return "Choose a file to upload.";
  if (file.size > MAX_UPLOAD_BYTES) return "Files must be 10 MB or smaller.";
  if (!(path.extname(file.name).toLowerCase() in ALLOWED_TYPES)) {
    return "Upload a PDF, image, Word or Excel file.";
  }
  return null;
}

function resolveStored(storedName: string): string {
  const full = path.resolve(UPLOAD_ROOT, storedName);
  if (!full.startsWith(UPLOAD_ROOT + path.sep)) throw new Error("Invalid storage path");
  return full;
}

export async function saveUpload(file: File, folder: string): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();
  const storedName = `${folder}/${randomUUID()}${ext}`;
  const full = resolveStored(storedName);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, Buffer.from(await file.arrayBuffer()));
  return storedName;
}

export async function readUpload(storedName: string): Promise<Buffer> {
  return readFile(resolveStored(storedName));
}

export async function deleteUpload(storedName: string | null): Promise<void> {
  if (!storedName) return;
  await rm(resolveStored(storedName), { force: true });
}

export async function deleteFolder(folder: string): Promise<void> {
  await rm(resolveStored(folder), { recursive: true, force: true });
}

export function contentTypeFor(fileName: string): string {
  return ALLOWED_TYPES[path.extname(fileName).toLowerCase()] ?? "application/octet-stream";
}
