// ABC (Pareto revenue) classification is an ordinal ranking, not a category identity,
// so it uses steps of the single sequential "blue" ramp (light -> dark = C -> A)
// rather than distinct categorical hues.
const ABC_COLOR: Record<"A" | "B" | "C", string> = {
  A: "#1c5cab",
  B: "#3987e5",
  C: "#86b6ef",
};

const ABC_LABEL: Record<"A" | "B" | "C", string> = {
  A: "A — top 80% of revenue",
  B: "B — next 15%",
  C: "C — long tail",
};

export function AbcBadge({ tier }: { tier: "A" | "B" | "C" }) {
  return (
    <span
      title={ABC_LABEL[tier]}
      className="inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
      style={{ backgroundColor: ABC_COLOR[tier] }}
    >
      {tier}
    </span>
  );
}
