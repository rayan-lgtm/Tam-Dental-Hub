const API = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";
const TOKEN_KEY = "tam_cup_token";
const ADMIN_KEY = "tam_cup_admin";

const read = (store: Storage, key: string) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const write = (store: Storage, key: string, value: string | null) => {
  try {
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
};

export const auth = {
  get token() {
    return read(localStorage, TOKEN_KEY);
  },
  set token(v: string | null) {
    write(localStorage, TOKEN_KEY, v);
  },
  get adminKey() {
    return read(sessionStorage, ADMIN_KEY);
  },
  set adminKey(v: string | null) {
    write(sessionStorage, ADMIN_KEY, v);
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

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; admin?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth.token) headers["Authorization"] = `Bearer ${auth.token}`;
  if (options.admin && auth.adminKey) headers["x-admin-key"] = auth.adminKey;
  let res: Response;
  try {
    res = await fetch(`${API}/cup${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("تعذّر الاتصال بالخادم، تحقق من الإنترنت", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? "حدث خطأ", res.status);
  return data as T;
}
