/**
 * NS — 12 ta nevrologik shkala.
 * Manba: "Ilmiy Izoh va Adabiyotlar" (Nevrologik_Baholash_POCD Excel).
 * Har shkala: kod, nom, max, POCD ta'sir koeffitsienti (impact), yosh normasi,
 * darajalar (klinik ma'no bilan), manba.
 *
 * CLAUDE.md: bu koeffitsientlarni Excel'siz o'zgartirmang.
 */

import type { NSRaw } from "@/lib/engines/types";

export interface NSLevel {
  v: number;
  label: string;
  short: string;
  desc: string;
}

export interface NSScale {
  key: keyof NSRaw;
  code: string;
  name: string;
  abbr: string;
  max: number;
  impact: number;
  sensitive?: boolean;
  description: string;
  levels: NSLevel[];
  norm: (age: number) => number;
  refs: string;
}

export const NS_SCALES: NSScale[] = [
  {
    key: "mrc",
    code: "MS",
    name: "Mushak kuchi",
    abbr: "MRC",
    max: 5,
    impact: 0.6,
    description:
      "Medical Research Council shkalasi. Har asosiy mushak guruhi alohida baholanadi va o'rtacha qiymat olinadi.",
    levels: [
      { v: 0, label: "Falaj", short: "Falaj", desc: "Hech qanday harakat yo'q. To'liq plegiya." },
      {
        v: 1,
        label: "Ko'rinadigan qisqarish",
        short: "Qisqarish",
        desc: "Mushak qisqaradi, lekin bo'g'imda harakat hosil qilmaydi.",
      },
      {
        v: 2,
        label: "Gravitatsiyasiz",
        short: "Yotgan h.",
        desc: "Bo'g'imda harakat — faqat gravitatsiya yo'q holatda (yotgan).",
      },
      {
        v: 3,
        label: "Gravitatsiyaga",
        short: "Tik h.",
        desc: "Gravitatsiyaga qarshi harakat, lekin qarshilikka chidamaydi.",
      },
      {
        v: 4,
        label: "Qismiy qarshilik",
        short: "Qisman",
        desc: "Tashqi qarshilikka qisman bardosh — to'liq emas.",
      },
      {
        v: 5,
        label: "To'liq kuch",
        short: "Norma",
        desc: "Yosh me'yoriga mos to'liq mushak kuchi.",
      },
    ],
    norm: (age) => Math.min(5, 4.0 + (age - 7) * 0.1),
    refs: "MRC Scale (MRC 1943); Bohannon & Smith, Phys Ther (1987)",
  },
  {
    key: "dtr",
    code: "RF",
    name: "Reflekslar holati",
    abbr: "DTR",
    max: 4,
    impact: 0.38,
    description:
      "Chuqur paya reflekslari (DTR) Jendrassik manyovri bilan. Patellar, ahillov, biceps, triceps reflekslari o'rtachasi.",
    levels: [
      { v: 0, label: "Areflexia", short: "Yo'q", desc: "Refleks butunlay yo'q." },
      {
        v: 1,
        label: "Giporefleksiya",
        short: "Past",
        desc: "Refleks sustlangan, faqat kuchaytirish bilan chaqiriladi.",
      },
      { v: 2, label: "Norma", short: "Norma", desc: "Normal yorqin refleks — me'yoriy javob." },
      {
        v: 3,
        label: "Giperefleksiya",
        short: "Yuqori",
        desc: "Refleks kuchaygan, lekin klonus yo'q.",
      },
      {
        v: 4,
        label: "Klonus",
        short: "Klonus",
        desc: "Klonus mavjud — markaziy motor neyron buzilishi belgisi.",
      },
    ],
    norm: (age) => (age <= 10 ? 2.0 : age <= 14 ? 2.2 : 2.5),
    refs: "Campbell WW, DeJong's Neurological Exam (2013)",
  },
  {
    key: "icars",
    code: "KO",
    name: "Harakat koordinatsiyasi",
    abbr: "ICARS",
    max: 10,
    impact: 0.5,
    description:
      "ICARS/SARA soddalashtirilgan 0–10 versiyasi. Romberg + barmoq-burun + dyadokokinezi + tandem yurish.",
    levels: [
      {
        v: 0,
        label: "Og'ir ataksiya",
        short: "Og'ir",
        desc: "Yura olmaydi, mustaqil tura olmaydi.",
      },
      {
        v: 2,
        label: "Sezilarli buzilish",
        short: "Sezilarli",
        desc: "Yordam bilan yuradi. Barmoq-burun aniq dismetriya.",
      },
      {
        v: 4,
        label: "O'rta buzilish",
        short: "O'rta",
        desc: "Mustaqil yuradi, lekin tandem yurishni qila olmaydi.",
      },
      {
        v: 6,
        label: "Yengil buzilish",
        short: "Yengil",
        desc: "Tandem yurishda noaniqlik, dyadokokinezi sustlangan.",
      },
      {
        v: 8,
        label: "Engil-kichik",
        short: "Subnormal",
        desc: "Barcha sinovlar bajariladi, lekin kichik noaniqliklar bor.",
      },
      { v: 10, label: "Norma", short: "Norma", desc: "Barcha koordinatsion sinovlar mukammal." },
    ],
    norm: (age) => Math.min(10, 6.0 + (age - 7) * 0.4),
    refs: "ICARS — Trouillas P et al. J Neurol Sci (1997)",
  },
  {
    key: "etdrs",
    code: "KF",
    name: "Ko'rish faoliyati",
    abbr: "ETDRS",
    max: 10,
    impact: 0.28,
    description: "ETDRS logMAR ko'rish o'tkirligi + ko'rish maydoni (perimetriya).",
    levels: [
      {
        v: 0,
        label: "Amaurosis",
        short: "Ko'rmaydi",
        desc: "Yorug'lik sezish yo'q. Total ko'rlik.",
      },
      { v: 2, label: "Juda past", short: "Juda past", desc: "Faqat qo'l harakatini ko'radi." },
      { v: 4, label: "Past", short: "Past", desc: "logMAR > 0.7 (≈ 20/100 yoki yomonroq)." },
      { v: 6, label: "O'rta", short: "O'rta", desc: "logMAR 0.3–0.7." },
      { v: 8, label: "Yaxshi", short: "Yaxshi", desc: "logMAR 0.1–0.3." },
      { v: 10, label: "Norma 20/20", short: "Norma", desc: "logMAR ≤ 0." },
    ],
    norm: (age) => (age <= 9 ? 8.5 : age <= 13 ? 9.0 : 9.5),
    refs: "ETDRS — Vitale S et al. Arch Ophthalmol (2006)",
  },
  {
    key: "pta",
    code: "ES",
    name: "Eshitish funksiyasi",
    abbr: "PTA",
    max: 10,
    impact: 0.18,
    description: "PTA (Pure Tone Average) + markaziy eshitish qayta ishlash. WHO 2021 mezonlari.",
    levels: [
      { v: 0, label: "Karlik (> 80 dB)", short: "Karlik", desc: "Profund eshitish yo'qoligi." },
      {
        v: 2,
        label: "Og'ir (61–80 dB)",
        short: "Og'ir",
        desc: "Faqat baland nutqni yordamchi vositalar bilan eshitadi.",
      },
      {
        v: 4,
        label: "O'rta (41–60 dB)",
        short: "O'rta",
        desc: "Oddiy nutqni eshitishda qiyinchilik.",
      },
      {
        v: 6,
        label: "Yengil (26–40 dB)",
        short: "Yengil",
        desc: "Shovqinli muhitda nutq tushunarli emas.",
      },
      {
        v: 8,
        label: "Subnormal",
        short: "Subnormal",
        desc: "≤25 dB lekin markaziy qayta ishlash sustlangan.",
      },
      {
        v: 10,
        label: "Norma (≤ 15 dB)",
        short: "Norma",
        desc: "WHO me'yori: barcha chastotalarda eshitish to'liq.",
      },
    ],
    norm: (age) => (age <= 11 ? 9.0 : 9.5),
    refs: "WHO World Report on Hearing (2021)",
  },
  {
    key: "dhi",
    code: "VB",
    name: "Vestibulyar tizim",
    abbr: "DHI",
    max: 4,
    impact: 0.42,
    description: "Pediatrik DHI + Romberg + Unterberger + VOR + nistagm.",
    levels: [
      {
        v: 0,
        label: "Og'ir buzilish",
        short: "Og'ir",
        desc: "Spontan nistagm, Romberg+. Mustaqil tura olmaydi.",
      },
      {
        v: 1,
        label: "Sezilarli",
        short: "Sezilarli",
        desc: "VOR sustlangan, Unterberger pozitiv.",
      },
      { v: 2, label: "O'rta", short: "O'rta", desc: "Hujum davrida bosh aylanishi." },
      { v: 3, label: "Yengil", short: "Yengil", desc: "Faqat bosh harakatlarida noaniqlik." },
      { v: 4, label: "Norma", short: "Norma", desc: "Barcha vestibulyar sinovlar normal." },
    ],
    norm: (age) => (age <= 10 ? 3.5 : age <= 14 ? 3.7 : 4.0),
    refs: "DHI — Jacobson & Newman (1990)",
  },
  {
    key: "omf",
    code: "KH",
    name: "Ko'z harakati",
    abbr: "OMF",
    max: 6,
    impact: 0.32,
    description: "Sakkad + cover test + smooth pursuit + nistagm. III, IV, VI nervlar funksiyasi.",
    levels: [
      {
        v: 0,
        label: "Ophthalmoplegia",
        short: "Falaj",
        desc: "Ko'zlar fiksatsiyalangan, harakat yo'q.",
      },
      {
        v: 1,
        label: "Sezilarli paresis",
        short: "Paresis",
        desc: "Bir yoki bir nechta yo'nalishda cheklov.",
      },
      { v: 2, label: "Diplopiya", short: "Diplopiya", desc: "Ko'zlar konjugatsiyasi buzilgan." },
      { v: 3, label: "Sakkad sustligi", short: "Sakkad-", desc: "Sakkadlar sekin yoki noaniq." },
      {
        v: 4,
        label: "Subnormal",
        short: "Subnorma",
        desc: "Smooth pursuit sustlangan, sakkadlar normal.",
      },
      {
        v: 5,
        label: "Deyarli norma",
        short: "≈Norma",
        desc: "Faqat ekstremal nigohda ozgina nistagm.",
      },
      {
        v: 6,
        label: "Norma",
        short: "Norma",
        desc: "Barcha yo'nalishlarda mukammal ko'z harakatlari.",
      },
    ],
    norm: (age) => (age <= 9 ? 5.5 : age <= 13 ? 5.8 : 6.0),
    refs: "Leigh RJ & Zee DS. Neurology of Eye Movements (5th ed.)",
  },
  {
    key: "fois",
    code: "YB",
    name: "Yutish / Bulbar simptomlar",
    abbr: "FOIS",
    max: 4,
    impact: 0.38,
    description:
      "Functional Oral Intake Scale. Aspiratsiya xavfi va ovqat to'g'risi bilan baholanadi.",
    levels: [
      {
        v: 0,
        label: "Disfagiya (NPO)",
        short: "NPO",
        desc: "Og'iz orqali yeya olmaydi. NG zond yoki PEG kerak.",
      },
      { v: 1, label: "Faqat suyuq", short: "Suyuq", desc: "Faqat suyuq ozuqa." },
      {
        v: 2,
        label: "Suyuq+puré",
        short: "Puré",
        desc: "Yumshatilgan ovqat, suvga ehtiyot bo'lish kerak.",
      },
      {
        v: 3,
        label: "Cheklangan dieta",
        short: "Cheklov",
        desc: "Ko'p turdagi ovqat, lekin ba'zilari xavfli.",
      },
      {
        v: 4,
        label: "Norma",
        short: "Norma",
        desc: "Cheklovsiz oddiy ovqatlanish, aspiratsiya yo'q.",
      },
    ],
    norm: (age) => (age <= 10 ? 3.8 : 4.0),
    refs: "FOIS — Crary MA et al. Dysphagia (2005)",
  },
  {
    key: "fda",
    code: "NQ",
    name: "So'zlash / Nutq",
    abbr: "FDA",
    max: 10,
    impact: 0.55,
    sensitive: true,
    description: "Frenchay Dysarthria + Boston/WAB. ★ ENG SEZGIR ko'rsatkich (POCD ta'siri 55%).",
    levels: [
      {
        v: 0,
        label: "Mutizm / Afaziya",
        short: "Mutizm",
        desc: "Nutq yo'q yoki butunlay tushunarsiz.",
      },
      { v: 2, label: "Og'ir dizartriya", short: "Og'ir", desc: "Faqat 1–2 so'z, ifoda buzilgan." },
      {
        v: 4,
        label: "O'rta dizartriya",
        short: "O'rta",
        desc: "Qisqa jumla, ko'p artikulyatsion xato.",
      },
      {
        v: 6,
        label: "Yengil dizartriya",
        short: "Yengil",
        desc: "Ravon nutq, lekin notanish kishilarga tushunarsiz.",
      },
      {
        v: 8,
        label: "Subnormal",
        short: "Subnorma",
        desc: "Ravon, faqat charchaganda artikulyatsiya susayadi.",
      },
      {
        v: 10,
        label: "Norma",
        short: "Norma",
        desc: "Yosh me'yoriga mos ravon, ifodali, tushunarli nutq.",
      },
    ],
    norm: (age) => Math.min(10, 7.5 + (age - 7) * 0.25),
    refs: "FDA — Enderby PM (1983); WAB — Kertesz A (1982)",
  },
  {
    key: "psqi",
    code: "UY",
    name: "Uyqu sifati",
    abbr: "PSQI",
    max: 10,
    impact: 0.48,
    sensitive: true,
    description: "PSQI/SDSC pediatrik. ★ Dastlabki POCD markeri — REM va delta to'lqin buzilishi.",
    levels: [
      {
        v: 0,
        label: "Og'ir insomniya",
        short: "Insomniya",
        desc: "Uyqu fragmentlangan, har kechasi <4 soat samarali uyqu.",
      },
      { v: 2, label: "Buzilish", short: "Buzilish", desc: "Tez-tez uyg'onish, ertalab charchoq." },
      { v: 4, label: "O'rta sifat", short: "O'rta", desc: "Uyquga ketish qiyin, REM sustlangan." },
      { v: 6, label: "Yengil ko'tarilish", short: "Yengil", desc: "Vaqt o'rtacha, sifat past." },
      { v: 8, label: "Yaxshi", short: "Yaxshi", desc: "8+ soat, faqat ba'zan uyg'onish." },
      {
        v: 10,
        label: "Mukammal",
        short: "Mukammal",
        desc: "Yosh me'yorida (8–10 soat), siklik tuzilish bus-butun.",
      },
    ],
    norm: (age) => (age <= 9 ? 9.5 : age <= 13 ? 9.0 : 8.5),
    refs: "PSQI — Buysse DJ et al. (1989); SDSC — Bruni O et al. (1996)",
  },
  {
    key: "cn",
    code: "BN",
    name: "Bosh miya nerv belgilari",
    abbr: "I–XII",
    max: 12,
    impact: 0.38,
    description: "Har 12 ta kranial nerv 1 ball: ishlasa 1, buzilsa 0.",
    levels: [
      { v: 0, label: "Hammasi buzilgan", short: "0/12", desc: "Hech bir nerv to'liq ishlamaydi." },
      { v: 3, label: "Ko'p buzilish", short: "3/12", desc: "9 ta nerv buzilgan." },
      {
        v: 6,
        label: "Yarmi buzilgan",
        short: "6/12",
        desc: "Yarmi buzilgan, asosan I, VII, VIII.",
      },
      { v: 9, label: "Yengil", short: "9/12", desc: "3 ta nerv buzilgan." },
      { v: 10, label: "Subnormal", short: "10/12", desc: "2 ta yengil buzilish." },
      { v: 11, label: "Deyarli norma", short: "11/12", desc: "1 ta yengil buzilish." },
      {
        v: 12,
        label: "Norma",
        short: "12/12",
        desc: "Barcha 12 ta kranial nerv mukammal ishlaydi.",
      },
    ],
    norm: () => 12,
    refs: "Blumenfeld H. Neuroanatomy Clinical Cases (2022)",
  },
  {
    key: "asa",
    code: "SF",
    name: "Umumiy somatik fon",
    abbr: "ASA",
    max: 10,
    impact: 0.32,
    description: "ASA Physical Status + CIRS. Komorbidlik POCD xavfini 2–3× oshiradi.",
    levels: [
      {
        v: 0,
        label: "ASA V (moribund)",
        short: "ASA V",
        desc: "Hayotga tahdid, 24 soat ichida o'lim xavfi.",
      },
      {
        v: 2,
        label: "ASA IV (og'ir)",
        short: "ASA IV",
        desc: "Doimiy hayotga tahdid soluvchi tizimli kasallik.",
      },
      {
        v: 4,
        label: "ASA III",
        short: "ASA III",
        desc: "Faollikni cheklovchi og'ir tizimli kasallik.",
      },
      {
        v: 6,
        label: "ASA II",
        short: "ASA II",
        desc: "Yengil tizimli kasallik (astma, kontrollangan DM).",
      },
      {
        v: 8,
        label: "Yaxshi",
        short: "Yaxshi",
        desc: "Bir nechta yengil belgilar, lekin diagnoz yo'q.",
      },
      {
        v: 10,
        label: "ASA I (sog'lom)",
        short: "ASA I",
        desc: "Sog'lom, normal funksional zaxiralar.",
      },
    ],
    norm: (age) => (age <= 10 ? 9.0 : age <= 14 ? 9.2 : 9.5),
    refs: "ASA Physical Status (2020); CIRS — Linn BS et al. (1968)",
  },
];

/** observed = norm × (1 − POCD/100 × K_i)  →  POCD = (1 − observed/norm) / K_i × 100 */
export function estimatePOCD(scale: NSScale, value: number, age: number): number | null {
  if (value == null) return null;
  const norm = scale.norm(age);
  if (norm <= 0) return null;
  const ratio = value / norm;
  const pocd = ((1 - ratio) / scale.impact) * 100;
  return Math.max(0, Math.min(100, pocd));
}

export function pocdSeverity(pocd: number | null) {
  if (pocd == null) return { label: "—", color: "var(--color-ink-3)" };
  if (pocd <= 0) return { label: "Sog'lom", color: "#16A34A" };
  if (pocd <= 25) return { label: "Yengil", color: "#65A30D" };
  if (pocd <= 50) return { label: "O'rta", color: "#D97706" };
  if (pocd <= 75) return { label: "Og'ir", color: "#DC2626" };
  return { label: "Juda og'ir", color: "#991B1B" };
}
