export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-cream/70 px-6 py-14 text-center">
      <div
        aria-hidden
        className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-ember/10 text-2xl text-ember"
      >
        ✦
      </div>
      <p className="display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-muted">{text}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
