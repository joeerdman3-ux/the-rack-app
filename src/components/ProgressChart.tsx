"use client";

import { useState } from "react";
import { MAIN_LIFTS, type MainLift } from "@/lib/lifting/constants";
import type { Session, WeekTonnage } from "@/lib/history/aggregate";
import type { Unit } from "@/lib/lifting/plates";

const LIFT_COLORS: Record<MainLift, string> = {
  Squat: "#3987e5",
  "Bench Press": "#199e70",
  Deadlift: "#c98500",
  "Overhead Press": "#008300",
};

const WIDTH = 640;
const HEIGHT = 280;
const PAD = { top: 16, right: 64, bottom: 28, left: 44 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function formatDateShort(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function niceTicks(min: number, max: number, count: number): number[] {
  if (max <= min) return [min];
  const step = Math.pow(10, Math.floor(Math.log10((max - min) / count)));
  const rounded = Math.ceil((max - min) / count / step) * step;
  const ticks: number[] = [];
  for (let v = Math.floor(min / rounded) * rounded; v <= max; v += rounded) {
    ticks.push(v);
  }
  return ticks;
}

function StrengthChart({
  sessionsByLift,
  unit,
}: {
  sessionsByLift: Record<MainLift, Session[]>;
  unit: Unit;
}) {
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const lifts = MAIN_LIFTS.filter((lift) => (sessionsByLift[lift]?.length ?? 0) > 0);
  const allDates = Array.from(
    new Set(lifts.flatMap((lift) => sessionsByLift[lift].map((s) => s.date))),
  ).sort();

  if (allDates.length === 0) {
    return <p className="text-sm text-neutral-500">Log at least one main lift to see progress.</p>;
  }

  const timestamps = allDates.map((d) => new Date(`${d}T00:00:00Z`).getTime());
  const minT = Math.min(...timestamps);
  const maxT = Math.max(...timestamps);

  const allE1rms = lifts.flatMap((lift) => sessionsByLift[lift].map((s) => s.e1rm));
  const rawMin = Math.min(...allE1rms);
  const rawMax = Math.max(...allE1rms);
  const yMin = Math.max(0, Math.floor((rawMin * 0.95) / 5) * 5);
  const yMax = Math.ceil((rawMax * 1.08) / 5) * 5;

  const x = (date: string) => {
    const t = new Date(`${date}T00:00:00Z`).getTime();
    if (maxT === minT) return PAD.left + PLOT_W / 2;
    return PAD.left + ((t - minT) / (maxT - minT)) * PLOT_W;
  };
  const y = (value: number) => PAD.top + PLOT_H - ((value - yMin) / (yMax - yMin)) * PLOT_H;

  const yTicks = niceTicks(yMin, yMax, 4);

  // Direct end-labels: sort by final y position, nudge apart if they'd collide.
  const endLabels = lifts
    .map((lift) => {
      const sessions = sessionsByLift[lift];
      const last = sessions[sessions.length - 1];
      return { lift, x: x(last.date), y: y(last.e1rm) };
    })
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < endLabels.length; i++) {
    const minGap = 14;
    if (endLabels[i].y - endLabels[i - 1].y < minGap) {
      endLabels[i].y = endLabels[i - 1].y + minGap;
    }
  }

  const hoverLifts = hoverDate
    ? lifts
        .map((lift) => ({
          lift,
          session: sessionsByLift[lift].find((s) => s.date === hoverDate),
        }))
        .filter((r) => r.session)
    : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {lifts.map((lift) => (
          <div key={lift} className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: LIFT_COLORS[lift] }} />
            {lift}
          </div>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          onPointerLeave={() => setHoverDate(null)}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
            let nearest = allDates[0];
            let nearestDist = Infinity;
            for (const d of allDates) {
              const dist = Math.abs(x(d) - px);
              if (dist < nearestDist) {
                nearestDist = dist;
                nearest = d;
              }
            }
            setHoverDate(nearest);
          }}
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="#262626"
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#737373">
                {t}
              </text>
            </g>
          ))}

          {hoverDate && (
            <line
              x1={x(hoverDate)}
              x2={x(hoverDate)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="#404040"
              strokeWidth={1}
            />
          )}

          {lifts.map((lift) => {
            const sessions = sessionsByLift[lift];
            const points = sessions.map((s) => `${x(s.date)},${y(s.e1rm)}`).join(" ");
            return (
              <g key={lift}>
                <polyline points={points} fill="none" stroke={LIFT_COLORS[lift]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {sessions.map((s) => (
                  <circle
                    key={s.date}
                    cx={x(s.date)}
                    cy={y(s.e1rm)}
                    r={4}
                    fill={LIFT_COLORS[lift]}
                    stroke="#171717"
                    strokeWidth={2}
                  />
                ))}
              </g>
            );
          })}

          {endLabels.map(({ lift, x: lx, y: ly }) => (
            <text key={lift} x={lx + 8} y={ly} dominantBaseline="middle" fontSize={10} fill="#c3c2b7">
              {lift}
            </text>
          ))}

          <text x={x(allDates[0])} y={HEIGHT - 6} fontSize={10} fill="#737373" textAnchor="start">
            {formatDateShort(allDates[0])}
          </text>
          <text x={x(allDates[allDates.length - 1])} y={HEIGHT - 6} fontSize={10} fill="#737373" textAnchor="end">
            {formatDateShort(allDates[allDates.length - 1])}
          </text>
        </svg>

        {hoverDate && hoverLifts.length > 0 && (
          <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs shadow-lg">
            <p className="mb-1 font-medium text-neutral-300">{formatDateShort(hoverDate)}</p>
            {hoverLifts.map(({ lift, session }) => (
              <p key={lift} className="flex items-center gap-1.5 text-neutral-400">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: LIFT_COLORS[lift] }} />
                <span className="font-semibold text-white">
                  {session!.e1rm}
                  {unit}
                </span>{" "}
                {lift}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VolumeChart({ weeks, unit }: { weeks: WeekTonnage[]; unit: Unit }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (weeks.length === 0) {
    return <p className="text-sm text-neutral-500">Log some sets to see weekly volume.</p>;
  }

  const maxTonnage = Math.max(...weeks.map((w) => w.tonnage));
  const yMax = Math.ceil((maxTonnage * 1.1) / 100) * 100;
  const yTicks = niceTicks(0, yMax, 4);

  const bandWidth = PLOT_W / weeks.length;
  const barWidth = Math.min(24, bandWidth * 0.6);

  const y = (value: number) => PAD.top + PLOT_H - (value / yMax) * PLOT_H;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(t)} y2={y(t)} stroke="#262626" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#737373">
              {t.toLocaleString()}
            </text>
          </g>
        ))}

        {weeks.map((w, i) => {
          const cx = PAD.left + bandWidth * i + bandWidth / 2;
          const barTop = y(w.tonnage);
          const barHeight = PAD.top + PLOT_H - barTop;
          const isHover = hoverIndex === i;
          return (
            <g key={w.weekStart}>
              <rect
                x={cx - barWidth / 2}
                y={barTop}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={4}
                fill={isHover ? "#5598e7" : "#3987e5"}
                onPointerEnter={() => setHoverIndex(i)}
                onPointerLeave={() => setHoverIndex(null)}
              />
              {(i === 0 || i === weeks.length - 1 || i === Math.floor(weeks.length / 2)) && (
                <text x={cx} y={HEIGHT - 6} fontSize={10} fill="#737373" textAnchor="middle">
                  {formatDateShort(w.weekStart)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hoverIndex !== null && (
        <div className="pointer-events-none absolute left-2 top-2 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs shadow-lg">
          <p className="font-medium text-neutral-300">Week of {formatDateShort(weeks[hoverIndex].weekStart)}</p>
          <p className="font-semibold text-white">
            {weeks[hoverIndex].tonnage.toLocaleString()} {unit} total
          </p>
        </div>
      )}
    </div>
  );
}

export function ProgressChart({
  sessionsByLift,
  weeklyTonnage,
  unit,
}: {
  sessionsByLift: Record<MainLift, Session[]>;
  weeklyTonnage: WeekTonnage[];
  unit: Unit;
}) {
  const [mode, setMode] = useState<"strength" | "volume">("strength");

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Progress</h2>
        <div className="flex rounded-md border border-neutral-700 text-xs">
          <button
            type="button"
            onClick={() => setMode("strength")}
            className={`rounded-l-md px-3 py-1.5 ${mode === "strength" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
          >
            Strength
          </button>
          <button
            type="button"
            onClick={() => setMode("volume")}
            className={`rounded-r-md px-3 py-1.5 ${mode === "volume" ? "bg-orange-600 text-white" : "text-neutral-400 hover:bg-neutral-800"}`}
          >
            Volume
          </button>
        </div>
      </div>

      {mode === "strength" ? (
        <StrengthChart sessionsByLift={sessionsByLift} unit={unit} />
      ) : (
        <VolumeChart weeks={weeklyTonnage} unit={unit} />
      )}
    </div>
  );
}
