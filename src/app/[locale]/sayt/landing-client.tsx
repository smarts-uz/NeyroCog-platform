"use client";

import { Link } from "@/i18n/navigation";
import {
  Activity,
  ArrowRight,
  Brain,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileDown,
  FlaskConical,
  Gauge,
  Hospital,
  Layers,
  LineChart,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Moon,
  Phone,
  Pill,
  PlayCircle,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Star,
  Stethoscope,
  TrendingUp,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const GRAD = "linear-gradient(135deg,#2B7FD4 0%,#1FA6B0 50%,#3AB87A 100%)";

const NAV = [
  { href: "#features", label: "Imkoniyatlar" },
  { href: "#how", label: "Qanday ishlaydi" },
  { href: "#audience", label: "Kimlar uchun" },
  { href: "#showcase", label: "Mahsulot ichida" },
  { href: "#contact", label: "Aloqa" },
];

const FEATURES: {
  cat: string;
  items: { icon: typeof Brain; bg: string; fg: string; title: string; body: string }[];
}[] = [
  {
    cat: "Diagnostika",
    items: [
      {
        icon: ClipboardList,
        bg: "#CCFBF1",
        fg: "#0F766E",
        title: "7 ta KNBT testi",
        body: "Kompleks neyrokognitiv baholash: Stroop, TMT, Digit Span, Lurya so'z xotirasi, nevrologik baholash (12 shkala), audio gnozis va EEG — bitta batareyada.",
      },
      {
        icon: Layers,
        bg: "#FEF3C7",
        fg: "#D97706",
        title: "3 bosqichli kuzatuv",
        body: "Har bemor uchun PreOp, PostOp (7–10 kun) va PostTx bosqichlarida solishtirma o'lchov.",
      },
      {
        icon: Gauge,
        bg: "#DBEAFE",
        fg: "#2563EB",
        title: "CogScore va ISPOCD",
        body: "Har test 0–100 ball, Z-ball va kognitiv salomatlik darajasiga aylantiriladi; composite ISPOCD verdikti avtomatik.",
      },
    ],
  },
  {
    cat: "Bashorat va tahlil",
    items: [
      {
        icon: TrendingUp,
        bg: "#FCE7F3",
        fg: "#DB2777",
        title: "PNB xavf bashorati",
        body: "Logistik regressiya yosh, anesteziya davomiyligi, dori soni va premorbid fon asosida PNB ehtimolini (%) hisoblaydi.",
      },
      {
        icon: Activity,
        bg: "#CCFBF1",
        fg: "#0F766E",
        title: "ROC va diagnostik aniqlik",
        body: "Har instrument uchun ROC egri chizig'i, AUC + 95% CI, Youden cut-off, sezgirlik/xoslik va DeLong solishtiruvi.",
      },
      {
        icon: Pill,
        bg: "#DCFCE7",
        fg: "#16A34A",
        title: "Davolash samaradorligi",
        body: "Pantogam + kognitiv trening ta'sirini Cohen's d, tiklanish foizi va NNT bilan baholash.",
      },
    ],
  },
  {
    cat: "Reabilitatsiya",
    items: [
      {
        icon: BrainCircuit,
        bg: "#F3E8FF",
        fg: "#7C3AED",
        title: "50 raqamli mashq",
        body: "10 kognitiv domen bo'yicha — diqqat, ishchi xotira, ijro funksiyalari, psixomotor tezlik va boshqalar.",
      },
      {
        icon: SlidersHorizontal,
        bg: "#FEF3C7",
        fg: "#D97706",
        title: "Adaptiv qiyinlik",
        body: "Mashq darajasi bolaning natijasiga qarab avtomatik moslashadi; kunlik maqsad va streak bilan motivatsiya.",
      },
      {
        icon: LineChart,
        bg: "#DBEAFE",
        fg: "#2563EB",
        title: "Progress kuzatuvi",
        body: "Har seans balli, aniqligi va vaqti saqlanadi; domenlar bo'yicha rivojlanish vizual ko'rsatiladi.",
      },
    ],
  },
  {
    cat: "Platforma",
    items: [
      {
        icon: Users,
        bg: "#DCFCE7",
        fg: "#16A34A",
        title: "Bemorlar bazasi",
        body: "Ro'yxatga olish, qidiruv, kohort KPI statistikasi va har qator uchun bashoratli xavf foizi.",
      },
      {
        icon: Smartphone,
        bg: "#CCFBF1",
        fg: "#0F766E",
        title: "Istalgan qurilmada",
        body: "To'liq moslashuvchan dizayn — telefon, planshet va kompyuterda; test ekranlari sensorli boshqaruvni qo'llaydi.",
      },
      {
        icon: WifiOff,
        bg: "#E0F2FE",
        fg: "#0284C7",
        title: "Offline (PWA)",
        body: "Ilova qurilmaga o'rnatiladi va internetsiz ishlaydi — ma'lumotlar himoyalangan.",
      },
      {
        icon: FileDown,
        bg: "#F1F5F9",
        fg: "#475569",
        title: "Hisobot eksporti",
        body: "Kohort ma'lumotlari CSV (Excel) va har bemor uchun to'liq klinik PDF hisoboti.",
      },
      {
        icon: Moon,
        bg: "#1E293B",
        fg: "#ffffff",
        title: "Tungi rejim",
        body: "Yorug' va qorong'i mavzu — uzoq klinik smenalarda ko'zni charchatmaydi.",
      },
      {
        icon: ShieldCheck,
        bg: "#FEE2E2",
        fg: "#DC2626",
        title: "Maxfiy va xavfsiz",
        body: "Bemor ma'lumotlari himoyalangan serverda (RLS) saqlanadi va shifrlangan kanal orqali uzatiladi.",
      },
    ],
  },
];

const ZIGS = [
  {
    tag: "Bemor kartasi",
    title: "Bitta ekranda to'liq klinik manzara",
    body: "Bemorning demografik ma'lumotlari, xavf omillari, har bosqichdagi test holati va PNB ehtimoli — hammasi yagona klinik kartada.",
    img: "/screenshots/landing/patient-card.png",
    alt: "Bemor klinik kartasi",
    list: [
      "Diagnostika, ehtimol va reabilitatsiya bir joyda",
      "Har bosqich uchun test progressi (PreOp / PostOp / PostTx)",
      "ISPOCD musbat bo'lganda avtomatik belgi",
    ],
  },
  {
    tag: "Diagnostik testlar",
    title: "Standartlashtirilgan KNBT batareyasi",
    body: "Interaktiv testlar bolaning o'zi tomonidan bajariladi, manual shkalalar shifokor tomonidan to'ldiriladi — har biri avtomatik ballanadi.",
    img: "/screenshots/landing/tests.png",
    alt: "Diagnostik testlar ro'yxati",
    list: [
      "Stroop, TMT, DST, Audio — interaktiv",
      "LMWT, NS (12 shkala), EEG — klinik forma",
      "Yosh normasiga moslashtirilgan baholash",
    ],
  },
  {
    tag: "PNB bashorati",
    title: "Xavfni testdan oldin biling",
    body: "Logistik va chiziqli regressiya modellari ro'yxatdagi 4 ta xavf omilidan PNB ehtimolini va kutilayotgan CogScore'ni hisoblaydi.",
    img: "/screenshots/landing/forecast.png",
    alt: "PNB ehtimoli bashorat moduli",
    list: [
      "PNB ehtimoli (%) + kutilayotgan CogScore",
      "AUC, Pseudo-R² va omillar hissasi",
      "Avtomatik klinik tavsiyalar",
    ],
  },
  {
    tag: "Statistik tahlil",
    title: "Tadqiqot darajasidagi analitika",
    body: "ROC/AUC, DeLong solishtiruvi, confusion matrix, davolash samaradorligi va kohort hisobotlari — eksport bilan.",
    img: "/screenshots/landing/analytics.png",
    alt: "ROC tahlili va statistik panel",
    list: ["ROC egri chizig'i + 95% CI + cut-off", "Cohen's d, ARR, NNT", "CSV va PDF eksport"],
  },
];

const STEPS = [
  {
    n: 1,
    title: "Ro'yxatdan o'ting",
    body: "Tizimga kiring va bemorni xavf omillari bilan ro'yxatga oling.",
  },
  { n: 2, title: "Testlarni o'tkazing", body: "KNBT batareyasini kerakli bosqichda bajaring." },
  {
    n: 3,
    title: "Natijani ko'ring",
    body: "CogScore, ISPOCD verdikti va PNB ehtimoli avtomatik hisoblanadi.",
  },
  {
    n: 4,
    title: "Reabilitatsiya qiling",
    body: "Mashqlar tayinlang, progress va samaradorlikni kuzating.",
  },
];

const AUDIENCE = [
  {
    icon: Stethoscope,
    title: "Anesteziolog va jarrohlar",
    body: "Operatsiyadan oldin yuqori xavfli bolalarni aniqlang va taktikani moslang.",
  },
  {
    icon: Brain,
    title: "Nevrolog va pediatrlar",
    body: "Kognitiv buzilishni standart o'lchovlar bilan tashxislang va dinamikani kuzating.",
  },
  {
    icon: Hospital,
    title: "Klinika va shifoxonalar",
    body: "Yagona protokol, kohort statistikasi va hisobotlar bilan markazlashgan kuzatuv.",
  },
  {
    icon: FlaskConical,
    title: "Tadqiqotchilar",
    body: "ROC, AUC, regressiya va effekt o'lchamlari bilan ilmiy tahlil va eksport.",
  },
];

const GALLERY = [
  {
    img: "/screenshots/landing/dashboard.png",
    title: "Bemorlar paneli",
    sub: "Kohort KPI, qidiruv va xavf foizi",
  },
  {
    img: "/screenshots/landing/rehab.png",
    title: "Reabilitatsiya markazi",
    sub: "10 domen, 50 mashq, kunlik maqsad",
  },
  {
    img: "/screenshots/landing/forecast.png",
    title: "PNB bashorati",
    sub: "Logistik regressiya + CogScore",
  },
  {
    img: "/screenshots/landing/analytics.png",
    title: "Tahlil markazi",
    sub: "ROC, AUC va diagnostik aniqlik",
  },
];

const FAQ = [
  {
    q: "Platforma kimlar uchun mo'ljallangan?",
    a: "NeyroCog bolalar anesteziologlari, jarrohlar, nevrologlar va pediatrlar, shuningdek klinikalar va tadqiqotchilar uchun. Reabilitatsiya mashqlarini bola uyda telefon orqali bajaradi.",
  },
  {
    q: "Ma'lumotlarim xavfsizmi?",
    a: "Ha. Bemor ma'lumotlari himoyalangan serverda (Supabase RLS) saqlanadi va faqat autentifikatsiyadan o'tgan shifokorga ko'rinadi.",
  },
  {
    q: "Internetsiz ishlaydimi?",
    a: "Ha. NeyroCog — Progressive Web App (PWA). Ilovani qurilmaga o'rnatib, asosiy oqimlardan internetsiz foydalanish mumkin.",
  },
  {
    q: "Qanday boshlash mumkin?",
    a: '"Kirish" tugmasini bosing, tizimga kiring va birinchi bemorni qo\'shing. Testlar va bashorat avtomatik ishlaydi.',
  },
  {
    q: "Bashorat test natijasimi?",
    a: "Yo'q. PNB ehtimoli faqat ro'yxatga olishda kiritilgan xavf omillaridan hisoblanadi — bemor hali test topshirmasa ham mavjud bo'ladi.",
  },
  {
    q: "Natijalarni eksport qilsa bo'ladimi?",
    a: "Ha. Kohort ma'lumotlarini CSV (Excel) formatida va har bemor uchun to'liq klinik PDF hisobotini chiqarish mumkin.",
  },
];

function MockBar() {
  return (
    <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-surface-2 border-b border-border">
      <i className="block w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
      <i className="block w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
      <i className="block w-2.5 h-2.5 rounded-full bg-[#28C840]" />
      <span className="flex-1 ml-2 h-[22px] rounded-md bg-surface border border-border flex items-center px-2.5 font-mono text-[11px] text-ink-4">
        neyrocog.uz/app
      </span>
    </div>
  );
}

export function LandingClient() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reveal-on-scroll: progressively show .reveal elements; honors reduced motion.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const els = Array.from(rootRef.current?.querySelectorAll<HTMLElement>(".reveal") ?? []);
    if (reduced || !("IntersectionObserver" in window)) {
      for (const el of els) el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="bg-surface text-ink">
      {/* NAV */}
      <header
        className={`sticky top-0 z-[60] transition-colors border-b ${
          scrolled
            ? "bg-surface/85 backdrop-blur border-border shadow-[0_4px_20px_-16px_rgba(15,23,42,0.4)]"
            : "border-transparent"
        }`}
      >
        <div className="max-w-[1180px] mx-auto px-6 flex items-center gap-5 h-[72px]">
          <a
            href="#top"
            className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight"
          >
            <span
              className="grid place-items-center h-9 w-9 rounded-lg text-white"
              style={{ background: GRAD }}
            >
              <Brain className="h-5 w-5" />
            </span>
            Neyro<span className="text-primary">Cog</span>
          </a>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="px-3 py-2 rounded-[10px] text-sm font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center h-[42px] px-4 rounded-[14px] border border-border-strong text-sm font-semibold hover:bg-surface-3 transition-colors"
            >
              Ro'yxatdan o'tish
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 h-[42px] px-4 rounded-[14px] bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors"
            >
              <LogIn className="h-4 w-4" /> Kirish
            </Link>
            <button
              type="button"
              aria-label="Menyu"
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden grid place-items-center w-11 h-11 rounded-[11px] border border-border bg-surface"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div className="md:hidden border-t border-border bg-surface px-6 py-4 flex flex-col gap-1.5">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="px-3.5 py-3 rounded-[11px] font-semibold text-ink-2 hover:bg-surface-3"
              >
                {n.label}
              </a>
            ))}
          </div>
        ) : null}
      </header>

      <span id="top" />

      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-10">
        <div className="max-w-[1180px] mx-auto px-6 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
          <div className="reveal">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-primary-soft-2 border border-primary-soft text-primary-press text-[13px] font-semibold mb-5">
              <Brain className="h-[15px] w-[15px]" /> Pediatrik neyrokognitiv platforma
            </span>
            <h1 className="text-[clamp(34px,4.6vw,56px)] font-black tracking-[-0.035em] leading-[1.08]">
              Bolalarda operatsiyadan keyingi{" "}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: GRAD }}>
                kognitiv buzilishni
              </span>{" "}
              erta aniqlang
            </h1>
            <p className="text-[clamp(16px,1.7vw,19px)] text-ink-2 mt-5 max-w-[540px] leading-relaxed">
              NeyroCog — maktab yoshidagi bolalarda perioperativ neyrokognitiv buzilishni (PNB)
              standartlashtirilgan testlar orqali baholaydi, xavfni statistik model bilan bashorat
              qiladi va raqamli reabilitatsiyani boshqaradi — barchasi bitta tizimda.
            </p>
            <div className="flex gap-3 mt-7 flex-wrap">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 h-[54px] px-7 rounded-[14px] bg-primary text-white font-semibold text-base hover:bg-primary-hover transition-colors shadow-[0_6px_18px_-6px_rgba(15,118,110,0.5)]"
              >
                <LogIn className="h-[18px] w-[18px]" /> Kirish
              </Link>
              <a
                href="#showcase"
                className="inline-flex items-center gap-2 h-[54px] px-7 rounded-[14px] border border-border-strong font-semibold text-base hover:bg-surface-3 transition-colors"
              >
                <PlayCircle className="h-[18px] w-[18px]" /> Demoni ko'rish
              </a>
            </div>
            <div className="flex gap-8 mt-9 flex-wrap">
              {[
                ["7", "KNBT diagnostik testi"],
                ["3", "baholash bosqichi"],
                ["50", "reabilitatsiya mashqi"],
                ["0.78", "o'rtacha AUC aniqlik"],
              ].map(([b, s]) => (
                <div key={s}>
                  <b className="block font-mono text-2xl font-bold tracking-tight text-ink">{b}</b>
                  <span className="text-[13px] text-ink-3 font-medium">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal">
            <div className="rounded-[20px] overflow-hidden border border-border bg-surface shadow-[0_30px_60px_-20px_rgba(15,23,42,0.28)]">
              <MockBar />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/screenshots/landing/dashboard.png"
                alt="NeyroCog bemorlar paneli — kohort statistikasi va xavf foizi"
                className="w-full block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <div className="bg-surface-2 border-y border-border py-9">
        <div className="max-w-[1180px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ["7", "standartlashtirilgan test"],
            ["10", "kognitiv domen"],
            ["n=181", "tadqiqot namunasi"],
            ["100%", "PWA o'rnatiladigan"],
          ].map(([b, s]) => (
            <div key={s} className="reveal">
              <b className="block font-mono text-[34px] font-bold text-primary tracking-tight">
                {b}
              </b>
              <span className="text-sm text-ink-3 font-medium">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="py-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center max-w-[680px] mx-auto mb-12 reveal">
            <div className="font-mono text-[12.5px] font-semibold tracking-[0.14em] uppercase text-primary mb-3.5">
              Imkoniyatlar
            </div>
            <h2 className="text-[clamp(28px,3.4vw,40px)] font-extrabold tracking-tight">
              Tizimning to'liq imkoniyatlari
            </h2>
            <p className="text-ink-3 mt-4 text-[17px]">
              Diagnostikadan bashoratgacha, reabilitatsiyadan statistik tahlilgacha — NeyroCog
              perioperativ kognitiv kuzatuvning har bir bosqichini qamrab oladi.
            </p>
          </div>
          {FEATURES.map((grp) => (
            <div key={grp.cat} className="mb-2">
              <div className="font-mono text-xs font-semibold tracking-[0.12em] uppercase text-ink-4 mt-5 mb-2 reveal">
                {grp.cat}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
                {grp.items.map((f) => (
                  <div
                    key={f.title}
                    className="reveal bg-surface border border-border rounded-[20px] p-6 transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:shadow-md hover:border-border-strong"
                  >
                    <div
                      className="w-12 h-12 rounded-[13px] grid place-items-center mb-4"
                      style={{ background: f.bg, color: f.fg }}
                    >
                      <f.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight mb-2">{f.title}</h3>
                    <p className="text-[14.5px] text-ink-3 leading-relaxed">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ZIGZAG SHOWCASE */}
      <section className="bg-surface-2 border-y border-border py-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center max-w-[680px] mx-auto mb-12 reveal">
            <div className="font-mono text-[12.5px] font-semibold tracking-[0.14em] uppercase text-primary mb-3.5">
              Yaqindan
            </div>
            <h2 className="text-[clamp(28px,3.4vw,40px)] font-extrabold tracking-tight">
              Klinik jarayon — bir tizimda
            </h2>
          </div>
          <div className="flex flex-col gap-14">
            {ZIGS.map((z, i) => (
              <div key={z.tag} className="reveal grid lg:grid-cols-2 gap-10 items-center">
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="font-mono text-xs font-semibold tracking-[0.1em] uppercase text-primary mb-3">
                    {z.tag}
                  </div>
                  <h3 className="text-[clamp(24px,2.6vw,32px)] font-extrabold mb-4">{z.title}</h3>
                  <p className="text-ink-2 text-base mb-4 leading-relaxed">{z.body}</p>
                  <ul className="flex flex-col gap-2.5">
                    {z.list.map((li) => (
                      <li key={li} className="flex gap-2.5 items-start text-[15px] text-ink-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" /> {li}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className={`rounded-[20px] overflow-hidden border border-border bg-surface shadow-[0_30px_60px_-20px_rgba(15,23,42,0.18)] ${
                    i % 2 === 1 ? "lg:order-1" : ""
                  }`}
                >
                  <MockBar />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={z.img} alt={z.alt} className="w-full block" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center max-w-[680px] mx-auto mb-12 reveal">
            <div className="font-mono text-[12.5px] font-semibold tracking-[0.14em] uppercase text-primary mb-3.5">
              Qanday ishlaydi
            </div>
            <h2 className="text-[clamp(28px,3.4vw,40px)] font-extrabold tracking-tight">
              To'rt qadamda boshlang
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="reveal bg-surface border border-border rounded-[20px] p-7">
                <div
                  className="w-[42px] h-[42px] rounded-xl grid place-items-center text-white font-mono font-bold text-lg mb-4"
                  style={{ background: GRAD }}
                >
                  {s.n}
                </div>
                <h3 className="text-[17px] font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-ink-3">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section id="audience" className="bg-surface-2 border-y border-border py-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center max-w-[680px] mx-auto mb-12 reveal">
            <div className="font-mono text-[12.5px] font-semibold tracking-[0.14em] uppercase text-primary mb-3.5">
              Kimlar uchun
            </div>
            <h2 className="text-[clamp(28px,3.4vw,40px)] font-extrabold tracking-tight">
              Sizning ishingiz uchun yaratilgan
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-[18px]">
            {AUDIENCE.map((a) => (
              <div
                key={a.title}
                className="reveal bg-surface border border-border rounded-[20px] p-6 transition-[transform,box-shadow,border-color] hover:-translate-y-1 hover:shadow-md hover:border-primary-soft"
              >
                <div className="w-[46px] h-[46px] rounded-full bg-primary-soft-2 text-primary grid place-items-center mb-3.5">
                  <a.icon className="h-[22px] w-[22px]" />
                </div>
                <h3 className="text-[17px] font-bold mb-2">{a.title}</h3>
                <p className="text-sm text-ink-3">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOWCASE GALLERY */}
      <section id="showcase" className="py-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center max-w-[680px] mx-auto mb-12 reveal">
            <div className="font-mono text-[12.5px] font-semibold tracking-[0.14em] uppercase text-primary mb-3.5">
              Mahsulot ichida
            </div>
            <h2 className="text-[clamp(28px,3.4vw,40px)] font-extrabold tracking-tight">
              Haqiqiy interfeys
            </h2>
            <p className="text-ink-3 mt-4 text-[17px]">
              Quyidagilar — platformaning haqiqiy ekran tasvirlari, klinik ish jarayoniga moslangan.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-[22px]">
            {GALLERY.map((g) => (
              <div
                key={g.title}
                className="reveal border border-border rounded-[20px] overflow-hidden bg-surface shadow-xs transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.img} alt={g.title} className="w-full block" />
                <div className="px-[18px] py-3.5 border-t border-border">
                  <b className="text-[15px] font-bold">{g.title}</b>
                  <span className="block text-[13px] text-ink-3 mt-0.5">{g.sub}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-11 reveal">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 h-[54px] px-7 rounded-[14px] bg-primary text-white font-semibold text-base hover:bg-primary-hover transition-colors"
            >
              Platformani sinab ko'ring <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center max-w-[680px] mx-auto mb-12 reveal">
            <div className="font-mono text-[12.5px] font-semibold tracking-[0.14em] uppercase text-primary mb-3.5">
              Mutaxassislar fikri
            </div>
            <h2 className="text-[clamp(28px,3.4vw,40px)] font-extrabold tracking-tight">
              Klinik amaliyotda
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                t: "Operatsiyadan oldin yuqori xavfli bolalarni aniqlash endi soniyalar masalasi. Bashorat moduli kundalik ishimni osonlashtirdi.",
                av: "DA",
                n: "Dr. A. Karimova",
                r: "Bolalar anesteziologi",
              },
              {
                t: "KNBT batareyasi va Z-ball baholash standartlashtirilgan — natijalarni bosqichlar bo'yicha solishtirish qulay.",
                av: "SN",
                n: "Dr. S. Nazarov",
                r: "Bolalar nevrologi",
              },
              {
                t: "ROC, AUC va DeLong tahlili to'g'ridan-to'g'ri ilovada — tadqiqot ma'lumotlarini eksport qilish ham oson.",
                av: "MR",
                n: "Dr. M. Rahimova",
                r: "Ilmiy tadqiqotchi",
              },
            ].map((q) => (
              <div key={q.av} className="reveal bg-surface border border-border rounded-[20px] p-6">
                <div className="flex gap-0.5 text-[#F59E0B] mb-3.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-[17px] w-[17px] fill-[#F59E0B]" />
                  ))}
                </div>
                <p className="text-[15px] text-ink-2 leading-relaxed">{q.t}</p>
                <div className="flex items-center gap-3 mt-[18px]">
                  <div
                    className="w-[42px] h-[42px] rounded-full grid place-items-center text-white font-bold text-[15px]"
                    style={{ background: GRAD }}
                  >
                    {q.av}
                  </div>
                  <div>
                    <b className="text-[14.5px] block">{q.n}</b>
                    <span className="text-[13px] text-ink-3">{q.r}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-surface-2 border-y border-border py-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="text-center max-w-[680px] mx-auto mb-12 reveal">
            <div className="font-mono text-[12.5px] font-semibold tracking-[0.14em] uppercase text-primary mb-3.5">
              Savol-javob
            </div>
            <h2 className="text-[clamp(28px,3.4vw,40px)] font-extrabold tracking-tight">
              Ko'p beriladigan savollar
            </h2>
          </div>
          <div className="max-w-[780px] mx-auto flex flex-col gap-3">
            {FAQ.map((qa, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={qa.q}
                  className="border border-border rounded-[14px] bg-surface overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-[22px] py-[18px] text-left font-semibold text-[16.5px] cursor-pointer"
                  >
                    {qa.q}
                    <ChevronDown
                      className={`h-5 w-5 text-ink-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-[22px] pb-5 text-ink-3 text-[15px]">{qa.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20">
        <div className="max-w-[1180px] mx-auto px-6">
          <div
            className="reveal rounded-[28px] px-10 py-16 text-center text-white relative overflow-hidden"
            style={{ background: GRAD }}
          >
            <h2 className="text-[clamp(28px,3.6vw,42px)] font-black relative">
              NeyroCog bilan bugun boshlang
            </h2>
            <p className="text-lg opacity-95 mt-4 relative max-w-[560px] mx-auto">
              Bolalar kognitiv salomatligini erta aniqlash, bashorat qilish va reabilitatsiya
              qilishning to'liq tizimi.
            </p>
            <Link
              href="/signup"
              className="relative inline-flex items-center gap-2 mt-7 h-14 px-7 rounded-[14px] bg-white text-primary-press font-semibold text-[17px] hover:bg-primary-soft-2 transition-colors"
            >
              <LogIn className="h-[18px] w-[18px]" /> Bepul ro'yxatdan o'tish
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-ink text-[#CBD5E1] pt-14 pb-7 mt-2">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.2fr] gap-9">
            <div>
              <div className="flex items-center gap-2.5 text-white font-extrabold text-xl mb-3.5">
                <span
                  className="grid place-items-center h-9 w-9 rounded-lg text-white"
                  style={{ background: GRAD }}
                >
                  <Brain className="h-5 w-5" />
                </span>
                Neyro<span className="text-primary-soft">Cog</span>
              </div>
              <p className="text-sm text-[#94A3B8] max-w-[300px]">
                Bolalarda perioperativ neyrokognitiv buzilishni diagnostika, bashorat va
                reabilitatsiya qilish tizimi.
              </p>
            </div>
            <div>
              <h4 className="text-white text-[13px] font-bold tracking-[0.08em] uppercase mb-4">
                Platforma
              </h4>
              {["Imkoniyatlar", "Qanday ishlaydi", "Mahsulot ichida"].map((l, i) => (
                <a
                  key={l}
                  href={["#features", "#how", "#showcase"][i]}
                  className="block text-[#94A3B8] text-[14.5px] py-1.5 hover:text-white transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
            <div>
              <h4 className="text-white text-[13px] font-bold tracking-[0.08em] uppercase mb-4">
                Tizim
              </h4>
              <Link
                href="/login"
                className="block text-[#94A3B8] text-[14.5px] py-1.5 hover:text-white transition-colors"
              >
                Kirish
              </Link>
              <Link
                href="/signup"
                className="block text-[#94A3B8] text-[14.5px] py-1.5 hover:text-white transition-colors"
              >
                Ro'yxatdan o'tish
              </Link>
              <a
                href="#faq"
                className="block text-[#94A3B8] text-[14.5px] py-1.5 hover:text-white transition-colors"
              >
                Savol-javob
              </a>
            </div>
            <div>
              <h4 className="text-white text-[13px] font-bold tracking-[0.08em] uppercase mb-4">
                Loyiha rahbari
              </h4>
              <div className="text-[14.5px] text-white font-semibold leading-snug mb-2">
                Zakirova Durdona Abdujalolovna
              </div>
              <div className="flex items-center gap-2.5 text-sm py-1 text-[#94A3B8]">
                <Mail className="h-4 w-4 text-primary-soft" /> dr.durdona.zakirova@gmail.com
              </div>
              <div className="flex items-center gap-2.5 text-sm py-1 text-[#94A3B8]">
                <Phone className="h-4 w-4 text-primary-soft" /> +998 99 816 74 77
              </div>
              <div className="flex items-center gap-2.5 text-sm py-1 text-[#94A3B8]">
                <MapPin className="h-4 w-4 text-primary-soft" /> Toshkent, O'zbekiston
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-5 flex justify-between gap-4 flex-wrap text-[13px] text-[#64748B]">
            <span>© 2026 NeyroCog. Barcha huquqlar himoyalangan.</span>
            <span>Ilmiy-tadqiqot tizimi · v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
