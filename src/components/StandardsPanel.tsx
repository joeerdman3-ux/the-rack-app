import Link from "next/link";
import type { Diagnosis } from "@/lib/standards/diagnosis";
import { isLowConfidence, type Tier } from "@/lib/standards/tables";
import type { SBDLift } from "@/lib/standards/benchmarks";
import type { MainLift } from "@/lib/lifting/constants";
import type { Unit } from "@/lib/lifting/plates";

const TIER_STYLES: Record<Tier, string> = {
  Untrained: "bg-neutral-800 text-neutral-300",
  Novice: "bg-blue-950 text-blue-300",
  Intermediate: "bg-green-950 text-green-300",
  Advanced: "bg-purple-950 text-purple-300",
  Elite: "bg-amber-950 text-amber-300",
};

function withQualifier(lift: MainLift): string {
  return isLowConfidence(lift) ? `${lift} (based on limited data)` : lift;
}

// estimatePercentile returns "<10", "99+", or a plain integer string like "37".
function formatPercentileText(estimate: string): string {
  if (estimate === "<10") return "in the bottom 10% of your class";
  if (estimate === "99+") return "in the top 1% of your class";
  if (estimate.startsWith("<")) return `below the ${estimate.slice(1)}th percentile of your class`;
  if (estimate.endsWith("+")) return `above the ${estimate.slice(0, -1)}th percentile of your class`;
  return `beats ~${estimate}% of lifters in your class`;
}

function joinLabels(labels: string[]): string {
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export function StandardsPanel({
  diagnosis,
  unit,
  hasProfile,
  percentileEstimates = {},
}: {
  diagnosis: Diagnosis;
  unit: Unit;
  hasProfile: boolean;
  percentileEstimates?: Partial<Record<SBDLift, string>>;
}) {
  if (!hasProfile) {
    return (
      <section className="mt-8 rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Strength standards</h2>
        <p className="text-sm text-neutral-400">
          Add your bodyweight, birthdate, and gender in{" "}
          <Link href="/settings" className="text-orange-500 hover:underline">
            Settings
          </Link>{" "}
          to see your tier per lift and a weak-point diagnosis.
        </p>
      </section>
    );
  }

  const anyLowConfidence = diagnosis.standings.some((s) => isLowConfidence(s.lift));

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Strength standards</h2>
        <ul className="space-y-2">
          {diagnosis.standings.map((s) => {
            const estimate = percentileEstimates[s.lift as SBDLift];
            return (
              <li key={s.lift}>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">
                    {s.lift}
                    {isLowConfidence(s.lift) && <span className="text-neutral-600">*</span>}
                  </span>
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
                </div>
                {estimate && (
                  <p className="mt-0.5 text-right text-xs text-neutral-500">
                    {formatPercentileText(estimate)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-xs text-neutral-600">
          Squat/Bench/Deadlift standards are computed from real competition
          results via{" "}
          <a
            href="https://www.openpowerlifting.org"
            className="underline hover:text-neutral-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenPowerlifting
          </a>{" "}
          (public domain), matched to your sex, age bracket, and bodyweight class.
          {anyLowConfidence && " * Overhead Press standards are crowdsourced estimates, not competition-verified."}
        </p>
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
                Lowest tier:{" "}
                <span className="font-semibold text-white">
                  {diagnosis.weakestLifts.map(withQualifier).join(", ")}
                </span>{" "}
                — focus your accessory work here.
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

      {diagnosis.stickingPointDiagnoses.map((d) => {
        const isWeakest = diagnosis.weakestLifts.includes(d.lift);
        const heading = (
          <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
            Prescribed accessory work
            {isWeakest && (
              <span className="rounded px-2 py-0.5 text-xs font-semibold bg-orange-950 text-orange-300">
                Weakest lift
              </span>
            )}
          </h2>
        );

        if (d.status === "pending") {
          return (
            <div key={d.lift} className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
              {heading}
              <p className="text-sm text-neutral-400">
                Log {d.remainingCount} more missed {d.lift} set{d.remainingCount === 1 ? "" : "s"}{" "}
                with a sticking point tagged to unlock your diagnosis ({d.currentCount}/{d.threshold}
                ).
              </p>
            </div>
          );
        }

        if (d.status === "tied") {
          const clauses = d.labels.map((label, i) => {
            const percent = Math.round((d.counts[i] / d.totalTaggedMisses) * 100);
            return `${label} (${d.counts[i]} of ${d.totalTaggedMisses}, ${percent}%)`;
          });
          return (
            <div key={d.lift} className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
              {heading}
              <p className="mb-4 text-sm text-neutral-400">
                Your {d.lift} misses point evenly toward {joinLabels(clauses)}
                {isLowConfidence(d.lift) && " (based on limited data)"} — consider prescriptions for
                both.
              </p>
              <ul className="space-y-3">
                {d.prescriptions.map((p, i) => (
                  <li key={`${p.exercise}-${i}`} className="text-sm">
                    <p className="font-medium text-white">
                      {p.exercise} <span className="font-normal text-neutral-500">— {p.setsReps}</span>
                    </p>
                    <p className="text-neutral-400">{p.rationale}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        const percent = Math.round((d.count / d.totalTaggedMisses) * 100);

        return (
          <div key={d.lift} className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
            {heading}
            <p className="mb-4 text-sm text-neutral-400">
              Most-reported sticking point on {d.lift}
              {isLowConfidence(d.lift) && " (based on limited data)"}:{" "}
              <span className="text-neutral-300">{d.label}</span> ({d.count} of {d.totalTaggedMisses}
              {" "}missed sets, {percent}%)
            </p>
            <ul className="space-y-3">
              {d.prescriptions.map((p) => (
                <li key={p.exercise} className="text-sm">
                  <p className="font-medium text-white">
                    {p.exercise} <span className="font-normal text-neutral-500">— {p.setsReps}</span>
                  </p>
                  <p className="text-neutral-400">{p.rationale}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
