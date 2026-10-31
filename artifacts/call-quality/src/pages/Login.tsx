import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { api, auth } from "../api";
import { Button, ErrorBox, inputCls } from "../components/ui";

export default function Login({ onDone }: { onDone: () => void }) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    auth.key = key.trim();
    try {
      await api("/meta");
      onDone();
    } catch (err) {
      auth.key = null;
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-navy px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="تام دنتال" className="mx-auto h-12 w-auto" />
        <h1 className="mt-4 text-center text-lg font-bold">لوحة جودة الخدمة</h1>
        <p className="mt-1 text-center text-sm text-muted">متابعة يومية لأداء موظفات الاتصال والشات</p>
        <label className="mt-6 block text-xs font-semibold text-muted">مفتاح الدخول</label>
        <div className="relative mt-1">
          <KeyRound className="absolute end-3 top-2.5 size-4 text-muted" />
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className={inputCls}
            autoFocus
            required
          />
        </div>
        {error ? <div className="mt-3"><ErrorBox message={error} /></div> : null}
        <Button type="submit" loading={loading} className="mt-5 w-full">
          دخول
        </Button>
      </form>
    </div>
  );
}
