export function FormError({
  error,
  fieldErrors,
}: {
  error?: string;
  fieldErrors?: Record<string, string>;
}) {
  if (!error && (!fieldErrors || Object.keys(fieldErrors).length === 0)) return null;
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-danger"
    >
      {error ? <p>{error}</p> : null}
      {fieldErrors
        ? Object.entries(fieldErrors).map(([key, message]) => (
            <p key={key}>{message}</p>
          ))
        : null}
    </div>
  );
}

export function Field({
  label,
  name,
  children,
  hint,
  error,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base text-ink placeholder:text-muted/70";
