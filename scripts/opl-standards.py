#!/usr/bin/env python3
"""
Compute bodyweight-binned percentile strength standards (Squat/Bench/Deadlift)
from an OpenPowerlifting bulk CSV export, for The Rack's strength-standards
feature.

Data: https://data.openpowerlifting.org (public domain, attribution
appreciated). Also mirrored on Kaggle as open-powerlifting/powerlifting-database.

Usage:
    pip install pandas
    python scripts/opl-standards.py path/to/openpowerlifting.csv -o opl-standards.json

Then send the resulting JSON file back — it gets dropped into
src/lib/standards/ and wired into the tier-lookup code, replacing the
current placeholder Squat/Bench/Deadlift tables.

Filtering applied (per spec):
  - Equipment == Raw
  - Tested == Yes
  - Sanctioned == Yes, if that column exists in this export (older/newer
    bulk CSVs have varied on whether sanctioning is a separate column vs.
    implied by federation; this script warns rather than silently skipping
    if the column isn't found)
  - Event == SBD (full power meets only, so Best3SquatKg/BenchKg/DeadliftKg
    are all from the same competitive attempt, not a bench-only meet etc.)
  - Age 18-55 inclusive; rows with missing/implausible Age or BodyweightKg dropped
  - Split by Sex (M/F)

Computation:
  - Bins lifters into 5kg bodyweight bins
  - Per bin/lift/sex, computes the 5th/20th/50th/85th percentile of the
    lift-to-bodyweight ratio (Best3XKg / BodyweightKg)
  - 5th -> Novice floor, 20th -> Intermediate floor, 50th -> Advanced floor,
    85th -> Elite floor (adjust with --percentiles if you want different cuts)
  - Bins with fewer than --min-samples rows are dropped (noisy percentiles
    otherwise) — the script reports how many bins were dropped per lift/sex
"""

import argparse
import json
import sys
from datetime import datetime, timezone

import pandas as pd

LIFT_COLUMNS = {
    "Squat": "Best3SquatKg",
    "Bench Press": "Best3BenchKg",
    "Deadlift": "Best3DeadliftKg",
}


def parse_args():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("csv_path", help="Path to the OpenPowerlifting bulk CSV (or .csv.gz)")
    p.add_argument("-o", "--output", default="opl-standards.json", help="Output JSON path")
    p.add_argument("--bin-size-kg", type=float, default=5.0, help="Bodyweight bin width in kg (default 5)")
    p.add_argument("--min-age", type=float, default=18, help="Minimum age (default 18)")
    p.add_argument("--max-age", type=float, default=55, help="Maximum age (default 55)")
    p.add_argument("--min-bodyweight-kg", type=float, default=30, help="Drop rows below this bodyweight")
    p.add_argument("--max-bodyweight-kg", type=float, default=250, help="Drop rows above this bodyweight")
    p.add_argument(
        "--percentiles",
        default="5,20,50,85",
        help="Comma-separated percentiles mapped to Novice,Intermediate,Advanced,Elite floors (default 5,20,50,85)",
    )
    p.add_argument("--min-samples", type=int, default=30, help="Minimum rows per bin to keep it (default 30)")
    return p.parse_args()


def main():
    args = parse_args()
    tier_names = ["Novice", "Intermediate", "Advanced", "Elite"]
    percentiles = [float(x) for x in args.percentiles.split(",")]
    if len(percentiles) != 4:
        sys.exit("--percentiles must have exactly 4 values (Novice,Intermediate,Advanced,Elite)")

    print(f"Loading {args.csv_path} ...", file=sys.stderr)
    df = pd.read_csv(args.csv_path, low_memory=False)
    print(f"  {len(df):,} rows loaded", file=sys.stderr)

    filters_applied = []

    df = df[df["Equipment"] == "Raw"]
    filters_applied.append("Equipment == Raw")

    if "Tested" in df.columns:
        df = df[df["Tested"] == "Yes"]
        filters_applied.append("Tested == Yes")
    else:
        print("WARNING: no 'Tested' column found — drug-tested filter NOT applied", file=sys.stderr)

    if "Sanctioned" in df.columns:
        df = df[df["Sanctioned"] == "Yes"]
        filters_applied.append("Sanctioned == Yes")
    else:
        print("WARNING: no 'Sanctioned' column found in this export — sanctioning filter NOT applied. "
              "Check the CSV's actual column names and adjust this script if needed.", file=sys.stderr)

    df = df[df["Event"] == "SBD"]
    filters_applied.append("Event == SBD")

    df = df[(df["Age"] >= args.min_age) & (df["Age"] <= args.max_age)]
    filters_applied.append(f"Age between {args.min_age} and {args.max_age}")

    df = df[
        (df["BodyweightKg"] >= args.min_bodyweight_kg)
        & (df["BodyweightKg"] <= args.max_bodyweight_kg)
    ]
    filters_applied.append(f"BodyweightKg between {args.min_bodyweight_kg} and {args.max_bodyweight_kg}")

    df = df[df["Sex"].isin(["M", "F"])]

    print(f"  {len(df):,} rows after filtering", file=sys.stderr)
    for f in filters_applied:
        print(f"    - {f}", file=sys.stderr)

    df["BodyweightBin"] = (df["BodyweightKg"] // args.bin_size_kg) * args.bin_size_kg + args.bin_size_kg / 2

    output = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "OpenPowerlifting (openpowerlifting.org), public domain",
        "filters": filters_applied,
        "binSizeKg": args.bin_size_kg,
        "percentiles": dict(zip(tier_names, percentiles)),
        "minSamplesPerBin": args.min_samples,
        "male": {},
        "female": {},
    }

    sex_map = {"M": "male", "F": "female"}

    for lift_name, col in LIFT_COLUMNS.items():
        lift_df = df[df[col] > 0].copy()
        lift_df["ratio"] = lift_df[col] / lift_df["BodyweightKg"]

        for sex_code, sex_key in sex_map.items():
            sex_df = lift_df[lift_df["Sex"] == sex_code]
            bins_out = []
            dropped = 0
            for bw_bin, group in sex_df.groupby("BodyweightBin"):
                if len(group) < args.min_samples:
                    dropped += 1
                    continue
                pcts = group["ratio"].quantile([p / 100 for p in percentiles]).tolist()
                bins_out.append(
                    {
                        "bodyweightKg": round(float(bw_bin), 1),
                        "sampleSize": int(len(group)),
                        **{tier: round(float(v), 3) for tier, v in zip(tier_names, pcts)},
                    }
                )
            bins_out.sort(key=lambda b: b["bodyweightKg"])
            output[sex_key][lift_name] = bins_out
            print(
                f"  {lift_name} / {sex_key}: {len(bins_out)} bins kept, {dropped} dropped (< {args.min_samples} samples)",
                file=sys.stderr,
            )

    with open(args.output, "w") as f:
        json.dump(output, f, indent=2)
    print(f"Wrote {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
