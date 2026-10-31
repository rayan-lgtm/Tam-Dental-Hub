const API = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";
const KEY = "tam_qa_key";

export const auth = {
  get key(): string | null {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set key(v: string | null) {
    try {
      if (v === null) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, v);
    } catch {
      /* storage unavailable */
    }
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.key) headers["x-qa-key"] = auth.key;
  let res: Response;
  try {
    res = await fetch(`${API}/qa${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("تعذّر الاتصال بالخادم", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "حدث خطأ", res.status);
  return data as T;
}
