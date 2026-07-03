import { useMemo, useState } from "react";

export interface DateRange {
  from: string;
  to: string;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface DateRangePreset {
  label: string;
  range: () => DateRange;
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  {
    label: "Last 30 days",
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 29);
      return { from: toDateString(from), to: toDateString(to) };
    },
  },
  {
    label: "Last 90 days",
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 89);
      return { from: toDateString(from), to: toDateString(to) };
    },
  },
  {
    label: "Month to date",
    range: () => {
      const to = new Date();
      const from = new Date(to.getFullYear(), to.getMonth(), 1);
      return { from: toDateString(from), to: toDateString(to) };
    },
  },
  {
    label: "Year to date",
    range: () => {
      const to = new Date();
      const from = new Date(to.getFullYear(), 0, 1);
      return { from: toDateString(from), to: toDateString(to) };
    },
  },
  {
    label: "Last 12 months",
    range: () => {
      const to = new Date();
      const from = new Date();
      from.setFullYear(from.getFullYear() - 1);
      from.setDate(from.getDate() + 1);
      return { from: toDateString(from), to: toDateString(to) };
    },
  },
];

export function useDateRange(defaultPresetIndex = 4) {
  const [range, setRange] = useState<DateRange>(() => DATE_RANGE_PRESETS[defaultPresetIndex]!.range());
  const [activePreset, setActivePreset] = useState<string | null>(
    DATE_RANGE_PRESETS[defaultPresetIndex]!.label,
  );

  const applyPreset = (preset: DateRangePreset) => {
    setRange(preset.range());
    setActivePreset(preset.label);
  };

  const applyCustom = (custom: DateRange) => {
    setRange(custom);
    setActivePreset(null);
  };

  return useMemo(
    () => ({ range, activePreset, applyPreset, applyCustom }),
    [range, activePreset],
  );
}
