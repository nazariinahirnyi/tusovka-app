"use client";

import { useState, useTransition } from "react";
import { deleteEventAction } from "@/app/actions/events";

export function DeleteEventButton({ eventId, title }: { eventId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-rose-50"
      >
        Видалити
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-ink/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-cream p-6 shadow-xl">
            <h2 id="delete-title" className="display text-2xl">
              Видалити подію?
            </h2>
            <p className="mt-2 text-sm text-muted">
              «{title}» зникне разом із записами й коментарями. Це не можна скасувати.
            </p>
            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-sm"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Залишити
              </button>
              <button
                type="button"
                disabled={pending}
                className="rounded-full bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                onClick={() => {
                  setError(null);
                  start(async () => {
                    const result = await deleteEventAction(eventId);
                    if (result && !result.ok) {
                      setError(result.error ?? "Не вдалося видалити");
                    }
                  });
                }}
              >
                {pending ? "Видаляємо…" : "Так, видалити"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
