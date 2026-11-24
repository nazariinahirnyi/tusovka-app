import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { AppError } from "@/server/errors";

export const MAX_COVER_BYTES = 2 * 1024 * 1024;

const MAGIC = {
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46],
} as const;

export type AllowedImageExt = "jpg" | "png" | "gif" | "webp";

function bytesStartWith(buf: Buffer, sig: readonly number[]): boolean {
  if (buf.length < sig.length) return false;
  return sig.every((value, index) => buf[index] === value);
}

export function detectImageType(buf: Buffer): AllowedImageExt | null {
  if (bytesStartWith(buf, MAGIC.jpg)) return "jpg";
  if (bytesStartWith(buf, MAGIC.png)) return "png";
  if (bytesStartWith(buf, MAGIC.gif)) return "gif";
  if (bytesStartWith(buf, MAGIC.webp)) {
    if (buf.length >= 12 && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  }
  return null;
}

export const COVER_FILENAME_RE = /^[a-f0-9]{32}\.(jpg|png|gif|webp)$/;

export async function saveCover(uploadsDirectory: string, file: File | Blob | Buffer): Promise<string> {
  let buffer: Buffer;
  if (Buffer.isBuffer(file)) {
    buffer = file;
  } else {
    const ab = await file.arrayBuffer();
    buffer = Buffer.from(ab);
  }

  if (buffer.byteLength === 0) {
    throw new AppError(400, "empty_file", "Файл обкладинки порожній");
  }
  if (buffer.byteLength > MAX_COVER_BYTES) {
    throw new AppError(400, "file_too_large", "Обкладинка має бути не більше 2 МБ");
  }

  const detected = detectImageType(buffer);
  if (!detected) {
    throw new AppError(400, "invalid_image", "Дозволені лише JPEG, PNG, GIF або WebP");
  }

  const filename = `${randomBytes(16).toString("hex")}.${detected}`;
  await mkdir(uploadsDirectory, { recursive: true });
  const dest = path.join(uploadsDirectory, filename);
  const resolved = path.resolve(dest);
  const root = path.resolve(uploadsDirectory);
  if (!resolved.startsWith(root + path.sep)) {
    throw new AppError(400, "invalid_path", "Некоректне імʼя файлу");
  }
  await writeFile(resolved, buffer, { flag: "wx" });
  return filename;
}

export function resolveCoverPath(uploadsDirectory: string, filename: string): string {
  if (!COVER_FILENAME_RE.test(filename)) {
    throw new AppError(400, "invalid_path", "Некоректне імʼя файлу");
  }
  const dest = path.resolve(uploadsDirectory, filename);
  const root = path.resolve(uploadsDirectory);
  if (!dest.startsWith(root + path.sep)) {
    throw new AppError(400, "invalid_path", "Некоректне імʼя файлу");
  }
  return dest;
}

export async function deleteCover(uploadsDirectory: string, filename: string | null | undefined): Promise<void> {
  if (!filename) return;
  try {
    await unlink(resolveCoverPath(uploadsDirectory, filename));
  } catch {
    // Missing file is not fatal.
  }
}

export function contentTypeForExt(ext: string): string {
  switch (ext) {
    case "jpg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
