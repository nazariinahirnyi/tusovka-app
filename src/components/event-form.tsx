"use client";

import { useActionState, useState } from "react";
import { createEventAction, updateEventAction } from "@/app/actions/events";
import { Field, FormError, inputClass } from "@/components/form-error";
import { idleState, type ActionState } from "@/lib/action-state";

type EventFormValues = {
  title: string;
  description: string;
  startsAt: string;
  capacity: number;
  isPublic: boolean;
  coverFilename?: string | null;
};

export function EventForm({
  eventId,
  defaults,
}: {
  eventId?: string;
  defaults?: EventFormValues;
}) {
  const action = eventId
    ? updateEventAction.bind(null, eventId)
    : createEventAction;
  const [state, formAction, pending] = useActionState(
    action as (state: ActionState, formData: FormData) => Promise<ActionState>,
    idleState,
  );
  const [preview, setPreview] = useState<string | null>(
    defaults?.coverFilename ? `/api/covers/${defaults.coverFilename}` : null,
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError error={state.error} fieldErrors={state.fieldErrors} />
      <Field label="Назва" name="title" error={state.fieldErrors?.title}>
        <input
          id="title"
          name="title"
          required
          minLength={3}
          maxLength={120}
          defaultValue={defaults?.title}
          className={inputClass}
        />
      </Field>
      <Field label="Опис" name="description" error={state.fieldErrors?.description}>
        <textarea
          id="description"
          name="description"
          required
          maxLength={5000}
          rows={6}
          defaultValue={defaults?.description}
          className={`${inputClass} min-h-36 resize-y`}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Дата й час (Київ)"
          name="startsAt"
          error={state.fieldErrors?.startsAt}
        >
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            defaultValue={defaults?.startsAt}
            className={inputClass}
          />
        </Field>
        <Field label="Кількість місць" name="capacity" error={state.fieldErrors?.capacity}>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={10000}
            required
            defaultValue={defaults?.capacity ?? 20}
            className={inputClass}
          />
        </Field>
      </div>
      <fieldset className="space-y-3 rounded-2xl border border-line bg-cream p-4">
        <legend className="px-1 text-sm font-medium">Видимість</legend>
        <label className="flex items-start gap-3">
          <input
            type="radio"
            name="visibility"
            value="public"
            defaultChecked={defaults?.isPublic !== false}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Публічна</span>
            <span className="block text-sm text-muted">
              Побачать усі на головній і в пошуку.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="radio"
            name="visibility"
            value="private"
            defaultChecked={defaults?.isPublic === false}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Приватна</span>
            <span className="block text-sm text-muted">
              Лише за посиланням-запрошенням. На головній не зʼявиться.
            </span>
          </span>
        </label>
      </fieldset>
      <Field
        label="Обкладинка"
        name="cover"
        hint="JPEG, PNG, GIF або WebP до 2 МБ. Можна без фото."
        error={state.fieldErrors?.cover}
      >
        <input
          id="cover"
          name="cover"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className={inputClass}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const url = URL.createObjectURL(file);
            setPreview(url);
          }}
        />
      </Field>
      {preview ? (
        // Preview of the selected/current cover.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Попередній перегляд обкладинки" className="max-h-56 rounded-2xl object-cover" />
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-6 py-3 font-medium text-cream hover:bg-ember disabled:opacity-60"
      >
        {pending ? "Зберігаємо…" : eventId ? "Зберегти зміни" : "Опублікувати подію"}
      </button>
    </form>
  );
}
