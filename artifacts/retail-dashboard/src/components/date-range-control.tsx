import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { DATE_RANGE_PRESETS, type DateRange } from "@/lib/use-date-range";

export function DateRangeControl({
  range,
  activePreset,
  onPreset,
  onCustom,
}: {
  range: DateRange;
  activePreset: string | null;
  onPreset: (preset: (typeof DATE_RANGE_PRESETS)[number]) => void;
  onCustom: (range: DateRange) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {activePreset ?? `${range.from} → ${range.to}`}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        {DATE_RANGE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onPreset(preset)}
            className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          >
            {preset.label}
            {activePreset === preset.label && <Check className="size-3.5" />}
          </button>
        ))}
        <Separator className="my-1" />
        <div className="flex items-center gap-2 px-2 py-1.5">
          <input
            type="date"
            defaultValue={range.from}
            max={range.to}
            className="w-full rounded-sm border border-input bg-background px-1.5 py-1 text-xs"
            onChange={(e) => onCustom({ from: e.target.value, to: range.to })}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            defaultValue={range.to}
            min={range.from}
            className="w-full rounded-sm border border-input bg-background px-1.5 py-1 text-xs"
            onChange={(e) => onCustom({ from: range.from, to: e.target.value })}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
