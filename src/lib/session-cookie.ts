export const SESSION_COOKIE = "tusovka_sid";

export function sessionCookieOptions() {
  const secure =
    process.env.SESSION_COOKIE_SECURE === "true" ||
    (process.env.NODE_ENV === "production" && process.env.SESSION_COOKIE_SECURE !== "false");
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 14 * 24 * 60 * 60,
  };
}
