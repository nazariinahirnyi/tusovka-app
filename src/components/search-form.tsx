import Link from "next/link";

export function SearchForm({ defaultValue }: { defaultValue: string }) {
  return (
    <div className="space-y-2">
      <form action="/" method="get" className="flex w-full gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Пошук за назвою
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          maxLength={120}
          placeholder="Пошук за назвою…"
          className="min-h-11 w-full rounded-full border border-line bg-cream px-5 py-3"
        />
        <button
          type="submit"
          className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-ink px-5 py-3 font-medium text-cream hover:bg-ember"
        >
          Знайти
        </button>
      </form>
      {defaultValue ? (
        <p className="text-sm">
          <Link href="/" className="font-medium text-ember hover:underline">
            Скинути пошук
          </Link>
        </p>
      ) : null}
    </div>
  );
}
