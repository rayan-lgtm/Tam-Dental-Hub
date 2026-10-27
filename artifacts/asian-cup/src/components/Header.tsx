import { LogOut } from "lucide-react";
import { useApp } from "../store";

export function Header() {
  const { me, logout, meta } = useApp();
  const stage = meta.stages.find((s) => s.id === meta.settings.currentStage);
  return (
    <header className="hero-bg sticky top-0 z-20 px-4 pb-3 pt-[max(env(safe-area-inset-top),12px)] text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo-light.png`} alt="تام دنتال TAM Dental" className="h-8 w-auto" />
          <span className="h-7 w-px bg-white/20" />
          <div className="leading-tight">
            <p className="text-[13px] font-bold">تحدي توقعات كأس آسيا</p>
            <p className="text-[11px] text-white/70">{stage?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="max-w-20 truncate text-xs text-white/80">{me.participant.name}</span>
          <button
            onClick={logout}
            aria-label="تسجيل الخروج"
            className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
