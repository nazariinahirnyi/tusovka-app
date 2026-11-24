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
      <p className="mt-3 text-muted">Сталася помилка. Спробуйте ще раз або поверніться на головну.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-2.5 font-medium text-cream"
        >
          Спробувати знову
        </button>
        <a href="/" className="inline-flex min-h-11 items-center rounded-full px-5 py-2.5 font-medium text-ember">
          На головну
        </a>
      </div>
    </div>
  );
}
