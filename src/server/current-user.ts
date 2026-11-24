import { cookies, headers } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session-cookie";
import { getSessionUser, requireUser, type PublicUser } from "@/server/auth";
import { getServices } from "@/server/db";
import { assertSameOrigin } from "@/server/origin";

export async function readSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function currentUser(): Promise<PublicUser | null> {
  const services = await getServices();
  return getSessionUser(services, await readSessionToken());
}

export async function requireCurrentUser(): Promise<PublicUser> {
  const services = await getServices();
  return requireUser(services, await readSessionToken());
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "0.0.0.0";
  return h.get("x-real-ip") || "0.0.0.0";
}

export async function assertMutationOrigin(): Promise<void> {
  const h = await headers();
  assertSameOrigin({
    origin: h.get("origin"),
    referer: h.get("referer"),
    host: h.get("host"),
    forwardedHost: h.get("x-forwarded-host"),
    forwardedProto: h.get("x-forwarded-proto"),
  });
}
