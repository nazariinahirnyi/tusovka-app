import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-line bg-cream px-8 py-16 text-center">
      <p className="text-sm uppercase tracking-widest text-ember">404</p>
      <h1 className="display mt-2 text-4xl">Такої тусовки немає</h1>
      <p className="mt-3 text-muted">Подію видалили, посилання застаріло, або у вас немає доступу.</p>
      <Link href="/" className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 font-medium text-cream">
        На головну
      </Link>
    </div>
  );
}
