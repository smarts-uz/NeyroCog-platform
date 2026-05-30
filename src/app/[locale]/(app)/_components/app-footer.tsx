"use client";

import { Link } from "@/i18n/navigation";
import { Globe, Mail, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

// Hujjat (docs) modal matnlari — prototipdagi FOOTER_INFO bilan bir xil.
const FOOTER_INFO = {
  guide: {
    title: "Yo'riqnoma",
    body: "Bemor qo'shing, KNBT batareyasidagi 7 ta diagnostik testni bosqichma-bosqich (PreOp / PostOp / PostTx) o'tkazing, so'ng reabilitatsiya mashqlarini tayinlang. Har bir natija avtomatik CogScore va Z-ball bilan baholanadi.",
  },
  method: {
    title: "Metodologiya",
    body: "Statistik modellar (LR, MLR, ROC/AUC, t-test, χ², ANOVA) tadqiqot rejasi va Excel ma'lumotlar to'plamlari asosida qurilgan. PNB tasnifi ISPOCD mezoni bo'yicha: 4 ta asosiy testdan ≥2 tasida Z ≤ −1.96.",
  },
  privacy: {
    title: "Maxfiylik siyosati",
    body: "Bemor ma'lumotlari himoyalangan serverda (Supabase, RLS) saqlanadi va faqat autentifikatsiyadan o'tgan shifokorga ko'rinadi. Ma'lumotlar shifrlangan kanal orqali uzatiladi.",
  },
  terms: {
    title: "Foydalanish shartlari",
    body: "Bu — ilmiy-tadqiqot tizimi. Natijalar yordamchi xususiyatga ega va klinik qaror qabul qilish uchun yagona asos bo'la olmaydi. Yakuniy tashxis shifokor zimmasida.",
  },
} as const;

type InfoKey = keyof typeof FOOTER_INFO;

const headCls = "text-[11px] font-bold uppercase tracking-[0.08em] text-ink-3 mb-1";
const linkCls =
  "text-left text-[13px] text-ink-3 hover:text-primary transition-colors cursor-pointer";

export function AppFooter() {
  const [info, setInfo] = useState<InfoKey | null>(null);

  useEffect(() => {
    if (!info) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInfo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [info]);

  const active = info ? FOOTER_INFO[info] : null;

  return (
    <footer className="border-t border-border mt-10 bg-surface-2 print:hidden">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-7 grid gap-7 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="grid place-items-center h-7 w-7 rounded-md bg-primary text-white">
              <Globe className="h-4 w-4" />
            </span>
            <span className="font-extrabold text-base tracking-tight text-ink">
              Neyro<span className="text-primary">Cog</span>
            </span>
          </div>
          <p className="text-[12.5px] leading-relaxed text-ink-3 mb-2.5 max-w-[320px]">
            Pediatrik perioperativ neyrokognitiv buzilishni (PNB) diagnostika, bashorat va
            reabilitatsiya tizimi.
          </p>
          <div className="text-[11.5px] text-ink-4">© 2026 NeyroCog · v1.0</div>
        </div>

        {/* System */}
        <nav className="flex flex-col gap-1.5">
          <div className={headCls}>Tizim</div>
          <Link href="/bemorlar" className={linkCls}>
            Bemorlar
          </Link>
          <Link href="/tahlil" className={linkCls}>
            ROC tahlili
          </Link>
          <Link href="/tahlil" className={linkCls}>
            Davolash effekti
          </Link>
          <Link href="/tahlil" className={linkCls}>
            Hisobotlar
          </Link>
        </nav>

        {/* Docs */}
        <div className="flex flex-col gap-1.5">
          <div className={headCls}>Hujjatlar</div>
          <button type="button" className={linkCls} onClick={() => setInfo("guide")}>
            Yo'riqnoma
          </button>
          <button type="button" className={linkCls} onClick={() => setInfo("method")}>
            Metodologiya
          </button>
          <button type="button" className={linkCls} onClick={() => setInfo("privacy")}>
            Maxfiylik siyosati
          </button>
          <button type="button" className={linkCls} onClick={() => setInfo("terms")}>
            Foydalanish shartlari
          </button>
        </div>

        {/* Project leader */}
        <div className="flex flex-col gap-1.5">
          <div className={headCls}>Loyiha rahbari</div>
          <div className="text-[13px] font-semibold text-ink leading-snug">
            Zakirova Durdona
            <br />
            Abdujalolovna
          </div>
          <a
            href="mailto:dr.durdona.zakirova@gmail.com"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-primary transition-colors"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" /> dr.durdona.zakirova@gmail.com
          </a>
          <a
            href="tel:+998998167477"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-primary transition-colors"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" /> +998 99 816 74 77
          </a>
        </div>
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={() => setInfo(null)}
          className="fixed inset-0 z-[220] bg-black/45 flex items-center justify-center p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border rounded-xl shadow-lg w-[min(460px,100%)] p-6 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="m-0 font-bold text-lg tracking-tight text-ink">{active.title}</h3>
              <button
                type="button"
                onClick={() => setInfo(null)}
                aria-label="Yopish"
                className="grid place-items-center h-8 w-8 rounded-md text-ink-3 hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-ink-2 m-0">{active.body}</p>
          </div>
        </div>
      ) : null}
    </footer>
  );
}
