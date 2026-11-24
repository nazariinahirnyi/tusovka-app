import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { getSessionUser } from "@/server/auth";
import { safeEqual } from "@/server/crypto";
import { getServices } from "@/server/db";
import { contentTypeForExt, COVER_FILENAME_RE, resolveCoverPath } from "@/server/uploads";

export async function GET(
  request: Request,
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
      select: { id: true, isPublic: true, authorId: true, inviteToken: true },
    });
    if (!attached) return new Response("Not found", { status: 404 });
    if (!attached.isPublic) {
      const invite = new URL(request.url).searchParams.get("invite");
      const viaInvite = Boolean(invite && safeEqual(invite, attached.inviteToken));
      const store = await cookies();
      const user = await getSessionUser(services, store.get(SESSION_COOKIE)?.value);
      const isAuthor = Boolean(user && user.id === attached.authorId);
      let joined = false;
      if (user && !isAuthor && !viaInvite) {
        const rsvp = await services.prisma.rsvp.findUnique({
          where: { eventId_userId: { eventId: attached.id, userId: user.id } },
          select: { id: true },
        });
        joined = Boolean(rsvp);
      }
      if (!viaInvite && !isAuthor && !joined) {
        return new Response("Not found", { status: 404 });
      }
    }
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
