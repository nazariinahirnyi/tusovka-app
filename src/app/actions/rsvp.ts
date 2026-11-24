"use server";

import { revalidatePath } from "next/cache";
import { type ActionState } from "@/lib/action-state";
import { assertMutationOrigin, requireCurrentUser } from "@/server/current-user";
import { getServices } from "@/server/db";
import { isAppError } from "@/server/errors";
import { cancelRsvp, joinEvent } from "@/server/rsvp";

function fail(error: unknown): ActionState {
  if (isAppError(error)) {
    return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
  }
  return { ok: false, error: "Щось пішло не так. Спробуйте ще раз." };
}

function revalidateEvent(eventId: string, inviteToken?: string | null) {
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/events/${eventId}`);
  if (inviteToken) revalidatePath(`/i/${inviteToken}`);
}

export async function joinEventAction(
  eventId: string,
  inviteToken?: string | null,
): Promise<ActionState> {
  try {
    await assertMutationOrigin();
    const user = await requireCurrentUser();
    const services = await getServices();
    await joinEvent(services, eventId, user.id, inviteToken);
    revalidateEvent(eventId, inviteToken);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function cancelRsvpAction(
  eventId: string,
  inviteToken?: string | null,
): Promise<ActionState> {
  try {
    await assertMutationOrigin();
    const user = await requireCurrentUser();
    const services = await getServices();
    await cancelRsvp(services, eventId, user.id, inviteToken);
    revalidateEvent(eventId, inviteToken);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
