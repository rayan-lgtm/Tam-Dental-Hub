import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { RANGES, rangeDates, type RangeKey } from "./format";

const RANGE_KEY = "tam_qa_range";

export function useRange() {
  const [range, setRangeState] = useState<RangeKey>(() => {
    try {
      const v = localStorage.getItem(RANGE_KEY) as RangeKey | null;
      return v && RANGES.some((r) => r.key === v) ? v : "month";
    } catch {
      return "month";
    }
  });
  const setRange = (r: RangeKey) => {
    setRangeState(r);
    try {
      localStorage.setItem(RANGE_KEY, r);
    } catch {
      /* ignore */
    }
  };
  const { from, to } = rangeDates(range);
  return { range, setRange, query: `from=${from}&to=${to}` };
}

export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api<T>(path));
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}
