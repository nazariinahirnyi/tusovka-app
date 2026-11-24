import { AppError } from "@/server/errors";

function parseHost(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return new URL(value).host.toLowerCase();
    }
    return new URL(`http://${value}`).host.toLowerCase();
  } catch {
    return null;
  }
}

export function assertSafeReturnPath(path: string | null | undefined): string {
  if (!path) return "/";
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
  if (path.includes("://")) return "/";
  return path;
}

export function assertSameOrigin(input: {
  origin?: string | null;
  referer?: string | null;
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
}): void {
  const host = parseHost(input.forwardedHost ?? input.host);
  if (!host) {
    throw new AppError(403, "csrf", "Невірне джерело запиту");
  }

  const originHost = parseHost(input.origin ?? null);
  if (originHost) {
    if (originHost !== host) {
      throw new AppError(403, "csrf", "Невірне джерело запиту");
    }
    return;
  }

  const refererHost = parseHost(input.referer ?? null);
  if (refererHost) {
    if (refererHost !== host) {
      throw new AppError(403, "csrf", "Невірне джерело запиту");
    }
    return;
  }

  throw new AppError(403, "csrf", "Невірне джерело запиту");
}

export function appOrigin(): string {
  return process.env.APP_ORIGIN?.replace(/\/$/, "") || "http://localhost:3000";
}
