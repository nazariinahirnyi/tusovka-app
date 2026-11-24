"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "@/app/actions/auth";
import { Field, FormError, inputClass } from "@/components/form-error";
import { idleState } from "@/lib/action-state";

export function RegisterForm({ nextPath = "/" }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(registerAction, idleState);
  const loginHref = nextPath && nextPath !== "/" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <FormError error={state.error} fieldErrors={state.fieldErrors} />
      <Field label="Імʼя" name="displayName" error={state.fieldErrors?.displayName}>
        <input
          id="displayName"
          name="displayName"
          autoComplete="name"
          required
          minLength={2}
          maxLength={40}
          className={inputClass}
        />
      </Field>
      <Field label="Email" name="email" error={state.fieldErrors?.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </Field>
      <Field
        label="Пароль"
        name="password"
        hint="Щонайменше 10 символів"
        error={state.fieldErrors?.password}
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={128}
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink px-5 py-3 font-medium text-cream hover:bg-ember disabled:opacity-60"
      >
        {pending ? "Створюємо акаунт…" : "Зареєструватися"}
      </button>
      <p className="text-center text-sm text-muted">
        Уже є акаунт?{" "}
        <Link className="font-medium text-ember underline-offset-2 hover:underline" href={loginHref}>
          Увійти
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(loginAction, idleState);
  const registerHref =
    nextPath && nextPath !== "/" ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <FormError error={state.error} fieldErrors={state.fieldErrors} />
      <Field label="Email" name="email" error={state.fieldErrors?.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </Field>
      <Field label="Пароль" name="password" error={state.fieldErrors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-ink px-5 py-3 font-medium text-cream hover:bg-ember disabled:opacity-60"
      >
        {pending ? "Входимо…" : "Увійти"}
      </button>
      <p className="text-center text-sm text-muted">
        Немає акаунта?{" "}
        <Link className="font-medium text-ember underline-offset-2 hover:underline" href={registerHref}>
          Реєстрація
        </Link>
      </p>
    </form>
  );
}
