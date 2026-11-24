"use server";

import { revalidatePath } from "next/cache";
import { type ActionState } from "@/lib/action-state";
import { assertMutationOrigin, requireCurrentUser } from "@/server/current-user";
import { getServices } from "@/server/db";
import { addComment } from "@/server/comments";
import { isAppError } from "@/server/errors";

function fail(error: unknown): ActionState {
  if (isAppError(error)) {
    return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
  }
  return { ok: false, error: "Щось пішло не так. Спробуйте ще раз." };
}

export async function addCommentAction(
  eventId: string,
  inviteToken: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertMutationOrigin();
    const user = await requireCurrentUser();
    const services = await getServices();
    await addComment(
      services,
      eventId,
      user.id,
      { body: formData.get("body") },
      inviteToken,
    );
    revalidatePath(`/events/${eventId}`);
    if (inviteToken) revalidatePath(`/i/${inviteToken}`);
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}
