import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { getServices } from "@/server/db";
import { contentTypeForExt, COVER_FILENAME_RE, resolveCoverPath } from "@/server/uploads";

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  if (!COVER_FILENAME_RE.test(filename)) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const services = await getServices();
    const attached = await services.prisma.event.findFirst({
      where: { coverFilename: filename },
      select: { id: true },
    });
    if (!attached) return new Response("Not found", { status: 404 });
    const filePath = resolveCoverPath(services.uploadsDir, filename);
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const ext = filename.split(".")[1] ?? "";
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": contentTypeForExt(ext),
        "Content-Length": String(info.size),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=86400, immutable",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
