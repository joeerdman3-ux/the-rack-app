import Link from "next/link";
import type { Diagnosis } from "@/lib/standards/diagnosis";
import type { Tier } from "@/lib/standards/tables";
import type { Unit } from "@/lib/lifting/plates";

const TIER_STYLES: Record<Tier, string> = {
  Untrained: "bg-neutral-800 text-neutral-300",
  Novice: "bg-blue-950 text-blue-300",
  Intermediate: "bg-green-950 text-green-300",
  Advanced: "bg-purple-950 text-purple-300",
  Elite: "bg-amber-950 text-amber-300",
};

export function StandardsPanel({
  diagnosis,
  unit,
  hasProfile,
}: {
  diagnosis: Diagnosis;
  unit: Unit;
  hasProfile: boolean;
}) {
  if (!hasProfile) {
    return (
      <section className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Strength standards</h2>
        <p className="text-sm text-neutral-400">
          Add your bodyweight and gender in{" "}
          <Link href="/settings" className="text-orange-500 hover:underline">
            Settings
          </Link>{" "}
          to see your tier per lift and a weak-point diagnosis.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Strength standards</h2>
        <ul className="space-y-2">
          {diagnosis.standings.map((s) => (
            <li key={s.lift} className="flex items-center justify-between">
              <span className="text-neutral-300">{s.lift}</span>
              <span className="flex items-center gap-2 text-sm">
                <span className="text-neutral-500">
                  {s.best !== null ? `${s.best}${unit}` : "Not logged yet"}
                </span>
                {s.tier && (
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${TIER_STYLES[s.tier]}`}>
                    {s.tier}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Weak-point diagnosis</h2>

        {diagnosis.weakestLifts.length === 0 && diagnosis.laggingRatios.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Log at least two main lifts to get a diagnosis.
          </p>
        ) : (
          <div className="space-y-3 text-sm">
            {diagnosis.weakestLifts.length > 0 && (
              <p className="text-neutral-300">
                Lowest tier: <span className="font-semibold text-white">{diagnosis.weakestLifts.join(", ")}</span> —
                {" "}focus your accessory work here.
              </p>
            )}
            {diagnosis.laggingRatios.map((r) => (
              <p key={r.label} className="text-neutral-300">
                <span className="font-semibold text-white">{r.label}</span> is lagging:
                {" "}{r.actual.toFixed(2)}x actual vs {r.expected.toFixed(2)}x typical.
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
