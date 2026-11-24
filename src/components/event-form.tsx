"use client";

import { useActionState, useState } from "react";
import { createEventAction, updateEventAction } from "@/app/actions/events";
import { Field, FormError, inputClass } from "@/components/form-error";
import { idleState, type ActionState } from "@/lib/action-state";

const MAX_COVER_BYTES = 2 * 1024 * 1024;

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
  minStartsAt,
}: {
  eventId?: string;
  defaults?: EventFormValues;
  minStartsAt?: string;
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
  const [coverHint, setCoverHint] = useState<string | null>(null);
  const [titleLen, setTitleLen] = useState(defaults?.title.length ?? 0);
  const [descLen, setDescLen] = useState(defaults?.description.length ?? 0);

  return (
    <form action={formAction} className="space-y-5">
      <FormError error={state.error} fieldErrors={state.fieldErrors} />
      <Field label="Назва" name="title" error={state.fieldErrors?.title} hint={`${titleLen}/120`}>
        <input
          id="title"
          name="title"
          required
          minLength={3}
          maxLength={120}
          defaultValue={defaults?.title}
          className={inputClass}
          onChange={(event) => setTitleLen(event.target.value.length)}
        />
      </Field>
      <Field
        label="Опис"
        name="description"
        error={state.fieldErrors?.description}
        hint={`${descLen}/5000`}
      >
        <textarea
          id="description"
          name="description"
          required
          maxLength={5000}
          rows={6}
          defaultValue={defaults?.description}
          className={`${inputClass} min-h-36 resize-y`}
          onChange={(event) => setDescLen(event.target.value.length)}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Дата й час (Київ)"
          name="startsAt"
          hint="Оберіть майбутній час. Зберігаємо в UTC, показуємо за Києвом."
          error={state.fieldErrors?.startsAt}
        >
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            min={minStartsAt}
            defaultValue={defaults?.startsAt}
            className={inputClass}
          />
        </Field>
        <Field
          label="Кількість місць"
          name="capacity"
          hint="Не можна зменшити нижче вже записаних."
          error={state.fieldErrors?.capacity}
        >
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
        hint="JPEG, PNG, GIF або WebP до 2 МБ. Можна без фото. Якщо форма не пройшла перевірку — оберіть файл ще раз."
        error={state.fieldErrors?.cover ?? coverHint ?? undefined}
      >
        <input
          id="cover"
          name="cover"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className={inputClass}
          onChange={(event) => {
            const file = event.target.files?.[0];
            setCoverHint(null);
            if (!file) return;
            if (file.size > MAX_COVER_BYTES) {
              setCoverHint("Обкладинка має бути не більше 2 МБ");
              event.target.value = "";
              setPreview(defaults?.coverFilename ? `/api/covers/${defaults.coverFilename}` : null);
              return;
            }
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
        className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 py-3 font-medium text-cream hover:bg-ember disabled:opacity-60"
      >
        {pending ? "Зберігаємо…" : eventId ? "Зберегти зміни" : "Опублікувати подію"}
      </button>
    </form>
  );
}
