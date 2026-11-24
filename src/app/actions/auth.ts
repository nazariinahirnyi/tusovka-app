"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session-cookie";
import { loginUser, logoutUser, registerUser } from "@/server/auth";
import { type ActionState } from "@/lib/action-state";
import {
  assertMutationOrigin,
  clientIp,
  readSessionToken,
} from "@/server/current-user";
import { getServices } from "@/server/db";
import { isAppError } from "@/server/errors";
import { assertSafeReturnPath } from "@/server/origin";

function fail(error: unknown): ActionState {
  if (isAppError(error)) {
    return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
  }
  return { ok: false, error: "Щось пішло не так. Спробуйте ще раз." };
}

async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertMutationOrigin();
    const services = await getServices();
    const result = await registerUser(
      services,
      {
        email: formData.get("email"),
        password: formData.get("password"),
        displayName: formData.get("displayName"),
      },
      await clientIp(),
    );
    await setSessionCookie(result.sessionToken);
  } catch (error) {
    return fail(error);
  }
  redirect("/");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await assertMutationOrigin();
    const services = await getServices();
    const result = await loginUser(
      services,
      {
        email: formData.get("email"),
        password: formData.get("password"),
      },
      await clientIp(),
    );
    await setSessionCookie(result.sessionToken);
  } catch (error) {
    return fail(error);
  }
  redirect(assertSafeReturnPath(String(formData.get("next") || "/")));
}

export async function logoutAction(): Promise<void> {
  await assertMutationOrigin();
  const services = await getServices();
  await logoutUser(services, await readSessionToken());
  await clearSessionCookie();
  redirect("/");
}
