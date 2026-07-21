"use client";

import Model, { ModelType, type IExerciseData } from "react-body-highlighter";

// react-body-highlighter's <Model> attaches onClick handlers to its SVG
// polygons inside its own (non-"use client") module, which Next's App
// Router only allows inside a Client Component boundary — hence this
// wrapper, even though nothing here passes an onClick through yet. Keeps
// /volume/page.tsx a plain server component; this is the only part of the
// body map that needs to run client-side.

// One orange hue (Tailwind orange-600, matching the existing bar chart's
// bg-orange-600) at 6 increasing opacity stops, rather than a separate
// palette — tier 6 (index 5) lands on the exact same color the bar chart
// uses at 100%.
const BODY_MAP_COLORS = [
  "rgba(234, 88, 12, 0.35)",
  "rgba(234, 88, 12, 0.48)",
  "rgba(234, 88, 12, 0.61)",
  "rgba(234, 88, 12, 0.74)",
  "rgba(234, 88, 12, 0.87)",
  "rgba(234, 88, 12, 1)",
];

// Tailwind neutral-700 — visible against the card's neutral-900
// background, matching the dark theme instead of the library's default
// light-gray body color.
const BODY_MAP_BASE_COLOR = "#404040";

export function BodyMapVolume({ data }: { data: IExerciseData[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col items-center">
        <Model
          type={ModelType.ANTERIOR}
          data={data}
          bodyColor={BODY_MAP_BASE_COLOR}
          highlightedColors={BODY_MAP_COLORS}
          style={{ width: "100%", maxWidth: 220 }}
        />
        <p className="mt-1 text-xs text-neutral-500">Front</p>
      </div>
      <div className="flex flex-col items-center">
        <Model
          type={ModelType.POSTERIOR}
          data={data}
          bodyColor={BODY_MAP_BASE_COLOR}
          highlightedColors={BODY_MAP_COLORS}
          style={{ width: "100%", maxWidth: 220 }}
        />
        <p className="mt-1 text-xs text-neutral-500">Back</p>
      </div>
    </div>
  );
}
