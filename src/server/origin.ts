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
  if (path.includes("://") || path.includes("%") || path.includes("@")) return "/";
  if (/[\u0000-\u001f\u007f]/.test(path)) return "/";
  return path;
}

export function expectedRequestHost(input: {
  host?: string | null;
  appOrigin?: string | null;
}): string | null {
  return parseHost(input.appOrigin ?? process.env.APP_ORIGIN) ?? parseHost(input.host);
}

export function assertSameOrigin(input: {
  origin?: string | null;
  referer?: string | null;
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
}): void {
  // Never trust X-Forwarded-Host from the client: it is trivial to spoof
  // unless the process already has an explicit APP_ORIGIN allowlist.
  const host = expectedRequestHost({
    host: input.host,
    appOrigin: process.env.APP_ORIGIN,
  });
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
  if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3000";
}
