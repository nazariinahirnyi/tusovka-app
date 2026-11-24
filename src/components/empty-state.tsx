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
    <div className="rounded-3xl border border-dashed border-line bg-cream/60 px-6 py-14 text-center">
      <p className="display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-muted">{text}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
