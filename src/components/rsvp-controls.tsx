"use client";

import { useState, useTransition } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (past) {
    return <p className="rounded-2xl bg-line/50 px-4 py-3 text-sm">Ця подія вже почалася або минула.</p>;
  }

  function run(kind: "join" | "cancel") {
    setError(null);
    start(async () => {
      const result =
        kind === "join"
          ? await joinEventAction(eventId, inviteToken)
          : await cancelRsvpAction(eventId, inviteToken);
      if (!result.ok) setError(result.error ?? "Не вдалося оновити запис");
    });
  }

  return (
    <div className="space-y-3">
      {joined ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("cancel")}
          className="rounded-full border border-ink px-6 py-3 font-medium hover:bg-ink hover:text-cream disabled:opacity-60"
        >
          {pending ? "Скасовуємо…" : "Скасувати"}
        </button>
      ) : remaining <= 0 ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-danger">Вільних місць немає.</p>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => run("join")}
          className="rounded-full bg-ember px-6 py-3 font-medium text-cream hover:bg-ember-dark disabled:opacity-60"
        >
          {pending ? "Записуємо…" : "Іду"}
        </button>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
