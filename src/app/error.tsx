"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-line bg-cream px-8 py-16 text-center">
      <h1 className="display text-3xl">Щось пішло не так</h1>
      <p className="mt-3 text-muted">Ми вже не ті. Спробуйте ще раз або поверніться на головну.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-ink px-5 py-2.5 font-medium text-cream"
      >
        Спробувати знову
      </button>
    </div>
  );
}
