export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-2xl bg-ember text-cream shadow-[inset_0_-2px_0_rgb(0_0_0/0.15)]"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 1.5 10.8 6h4.7L12.4 9.1 14 14 9 11.2 4 14l1.6-4.9L2.5 6h4.7L9 1.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="display text-xl font-medium">Тусовка</span>
    </span>
  );
}
