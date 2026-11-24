export function SearchForm({ defaultValue }: { defaultValue: string }) {
  return (
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
        className="w-full rounded-full border border-line bg-cream px-5 py-3"
      />
      <button type="submit" className="rounded-full bg-ink px-5 py-3 font-medium text-cream hover:bg-ember">
        Знайти
      </button>
    </form>
  );
}
