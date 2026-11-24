import { seatsLeftLabel } from "@/lib/uk";

export function SeatMeter({
  taken,
  capacity,
  showLabel = true,
}: {
  taken: number;
  capacity: number;
  showLabel?: boolean;
}) {
  const remaining = Math.max(0, capacity - taken);
  const pct = capacity <= 0 ? 0 : Math.min(100, Math.round((taken / capacity) * 100));
  return (
    <div className="space-y-1.5">
      {showLabel ? <p className="text-sm font-medium">{seatsLeftLabel(remaining)}</p> : null}
      <div
        className="h-1.5 overflow-hidden rounded-full bg-line"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={taken}
        aria-label="Зайняті місця"
      >
        <div
          className={`h-full rounded-full ${remaining <= 0 ? "bg-danger" : "bg-ember"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
