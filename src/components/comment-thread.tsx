"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { addCommentAction } from "@/app/actions/comments";
import { FormError, inputClass } from "@/components/form-error";
import { formatKyivDateTime } from "@/lib/datetime";
import { idleState } from "@/lib/action-state";

export type CommentView = {
  id: string;
  body: string;
  createdAt: Date | string;
  user: { id: string; displayName: string };
};

export function CommentBody({ body }: { body: string }) {
  return <p className="whitespace-pre-wrap break-words text-[15px] leading-6">{body}</p>;
}

export function CommentThread({
  eventId,
  inviteToken,
  comments,
  canComment,
  loginHref,
  lockedReason,
}: {
  eventId: string;
  inviteToken?: string | null;
  comments: CommentView[];
  canComment: boolean;
  loginHref?: string;
  lockedReason?: string;
}) {
  const bound = addCommentAction.bind(null, eventId, inviteToken ?? null);
  const [state, action, pending] = useActionState(bound, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const [length, setLength] = useState(0);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setLength(0);
    }
  }, [state.ok]);

  return (
    <section className="space-y-5" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="display text-2xl">
        Коментарі
        <span className="ml-2 font-sans text-base font-normal text-muted">({comments.length})</span>
      </h2>
      {comments.length === 0 ? (
        <p className="text-muted">Поки тихо. Напишіть перший коментар.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl border border-line bg-cream px-4 py-3">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{comment.user.displayName}</span>
                <time className="text-muted" dateTime={new Date(comment.createdAt).toISOString()}>
                  {formatKyivDateTime(new Date(comment.createdAt))}
                </time>
              </div>
              <CommentBody body={comment.body} />
            </li>
          ))}
        </ul>
      )}
      {canComment ? (
        <form ref={formRef} action={action} className="space-y-3">
          <FormError error={state.error} fieldErrors={state.fieldErrors} />
          <label htmlFor="body" className="sr-only">
            Коментар
          </label>
          <textarea
            id="body"
            name="body"
            required
            maxLength={1000}
            rows={3}
            placeholder="Що варто знати тим, хто йде?"
            className={`${inputClass} resize-y`}
            onChange={(event) => setLength(event.target.value.length)}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">{length}/1000</p>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream hover:bg-ember disabled:opacity-60"
            >
              {pending ? "Надсилаємо…" : "Надіслати"}
            </button>
          </div>
        </form>
      ) : lockedReason ? (
        <p className="rounded-2xl bg-line/40 px-4 py-3 text-sm text-muted">{lockedReason}</p>
      ) : (
        <p className="text-sm text-muted">
          {loginHref ? (
            <>
              <Link className="font-medium text-ember hover:underline" href={loginHref}>
                Увійдіть
              </Link>
              , щоб залишити коментар.
            </>
          ) : (
            "Увійдіть, щоб залишити коментар."
          )}
        </p>
      )}
    </section>
  );
}
