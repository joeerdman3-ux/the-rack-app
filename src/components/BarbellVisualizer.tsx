import { calculatePlates, formatPlateSummary, getPlateDefs, type Unit } from "@/lib/lifting/plates";

function Plate({ weight, unit }: { weight: number; unit: Unit }) {
  const def = getPlateDefs(unit).find((d) => d.weight === weight);
  if (!def) return null;

  const height = unit === "kg" ? 150 : (def.diameter ?? 90);
  const width = unit === "kg" ? Math.round(14 + weight * 1.6) : 20;

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[3px] border border-black/30 text-[10px] font-bold leading-none"
      style={{ width, height, background: def.color, color: def.textColor }}
    >
      {weight}
    </div>
  );
}

export function BarbellVisualizer({
  weight,
  unit,
  barWeight,
}: {
  weight: number;
  unit: Unit;
  // Omit for the standard 45lb/20kg bar — matches calculatePlates()'s own
  // default, so LogForm (which never passes this) is unaffected.
  barWeight?: number;
}) {
  const plateResult = calculatePlates(weight, unit, barWeight);
  const { perSide } = plateResult;
  const expanded = perSide.flatMap(({ weight: w, count }) =>
    Array.from({ length: count }, (_, i) => `${w}-${i}`),
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-[170px] items-center justify-center">
        <div
          className="absolute h-2 rounded-full bg-neutral-500"
          style={{ width: `calc(100% + 60px)` }}
        />
        <div className="relative flex flex-row-reverse items-center gap-[2px]">
          {expanded.map((key) => (
            <Plate key={`l-${key}`} weight={Number(key.split("-")[0])} unit={unit} />
          ))}
        </div>
        <div className="w-10" />
        <div className="relative flex items-center gap-[2px]">
          {expanded.map((key) => (
            <Plate key={`r-${key}`} weight={Number(key.split("-")[0])} unit={unit} />
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-neutral-400">{formatPlateSummary(plateResult, unit)}</p>
    </div>
  );
}
