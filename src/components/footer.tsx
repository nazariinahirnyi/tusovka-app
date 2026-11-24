import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-ink text-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-cream/75 sm:flex-row sm:items-center sm:justify-between">
        <p>Тусовка — збирайся з людьми, які тобі близькі. Час подій — за київським поясом.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link className="hover:text-cream" href="/">
            Події
          </Link>
          <Link className="hover:text-cream" href="/events/new">
            Створити
          </Link>
          <Link className="hover:text-cream" href="/profile">
            Профіль
          </Link>
        </nav>
      </div>
    </footer>
  );
}
