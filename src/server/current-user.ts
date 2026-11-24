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

function plausibleIp(value: string): boolean {
  return value.length > 0 && value.length <= 64 && /^[0-9a-fA-F:.]+$/.test(value);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  // The leftmost X-Forwarded-For hop is chosen by the client and bypasses IP limits.
  // A proxy appends the observed address, so the rightmost hop is the one we keep.
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((part) => part.trim()).filter(plausibleIp);
    const last = hops.at(-1);
    if (last) return last;
  }
  const real = h.get("x-real-ip")?.trim() ?? "";
  if (plausibleIp(real)) return real;
  return "0.0.0.0";
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
