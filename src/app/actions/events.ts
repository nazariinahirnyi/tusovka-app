"use server";

import { redirect } from "next/navigation";
import { eventHref } from "@/server/access";
import { type ActionState } from "@/lib/action-state";
import { assertMutationOrigin, requireCurrentUser } from "@/server/current-user";
import { getServices } from "@/server/db";
import { createEvent, deleteEvent, updateEvent } from "@/server/events";
import { isAppError } from "@/server/errors";

function fail(error: unknown): ActionState {
  if (isAppError(error)) {
    return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
  }
  return { ok: false, error: "Щось пішло не так. Спробуйте ще раз." };
}

function eventFields(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    startsAt: formData.get("startsAt"),
    capacity: formData.get("capacity"),
    isPublic: formData.get("visibility"),
  };
}

function coverFromForm(formData: FormData): File | null {
  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) return null;
  return file;
}

export async function createEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertMutationOrigin();
    const user = await requireCurrentUser();
    const services = await getServices();
    const event = await createEvent(services, user.id, eventFields(formData), coverFromForm(formData));
    redirect(eventHref(event));
  } catch (error) {
    if (isRedirect(error)) throw error;
    return fail(error);
  }
}

export async function updateEventAction(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertMutationOrigin();
    const user = await requireCurrentUser();
    const services = await getServices();
    const event = await updateEvent(services, eventId, user.id, eventFields(formData), coverFromForm(formData));
    redirect(eventHref(event));
  } catch (error) {
    if (isRedirect(error)) throw error;
    return fail(error);
  }
}

export async function deleteEventAction(eventId: string): Promise<ActionState> {
  try {
    await assertMutationOrigin();
    const user = await requireCurrentUser();
    const services = await getServices();
    await deleteEvent(services, eventId, user.id);
  } catch (error) {
    return fail(error);
  }
  redirect("/profile");
}

function isRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}
