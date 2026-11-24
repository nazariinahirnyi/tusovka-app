"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelRsvpAction, joinEventAction } from "@/app/actions/rsvp";

export function RsvpControls({
  eventId,
  inviteToken,
  joined,
  remaining,
  past,
}: {
  eventId: string;
  inviteToken?: string | null;
  joined: boolean;
  remaining: number;
  past: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [localJoined, setLocalJoined] = useState(joined);

  useEffect(() => {
    setLocalJoined(joined);
  }, [joined]);

  if (past) {
    return (
      <p className="rounded-2xl bg-line/50 px-4 py-3 text-sm">
        Ця подія вже почалася або минула. Записатися чи скасувати місце вже не можна.
      </p>
    );
  }

  function run(kind: "join" | "cancel") {
    setError(null);
    start(async () => {
      const result =
        kind === "join"
          ? await joinEventAction(eventId, inviteToken)
          : await cancelRsvpAction(eventId, inviteToken);
      if (!result.ok) {
        setError(result.error ?? "Не вдалося оновити запис");
        return;
      }
      setLocalJoined(kind === "join");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3" aria-live="polite">
      {localJoined ? (
        <>
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-ok">Ви записані. До зустрічі!</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => run("cancel")}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ink px-6 py-3 font-medium hover:bg-ink hover:text-cream disabled:opacity-60"
          >
            {pending ? "Скасовуємо…" : "Скасувати місце"}
          </button>
        </>
      ) : remaining <= 0 ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-danger">
          Вільних місць немає. Якщо хтось скасує — лічильник оновиться.
        </p>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("join")}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ember px-6 py-3 font-medium text-cream hover:bg-ember-dark disabled:opacity-60"
        >
          {pending ? "Записуємо…" : "Іду"}
        </button>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
