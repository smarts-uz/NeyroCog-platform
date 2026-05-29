// NS — Neurological scoring (12 standardized scales)
// "Ilmiy Izoh va Adabiyotlar" Excel'dan olingan POCD-asoslangan referens qiymatlar.
//
// Har bir shkala uchun:
//   • Code (MS, RF, KO, …) + abbreviation
//   • 0..max oraliqdagi har bir qiymat — KLINIK MA'NOSI bilan
//   • Yosh bo'yicha sog'lom norma (norm function)
//   • POCD ta'sir koeffitsienti (K_i)
//   • Ilmiy manba
//
// Shifokor har bir qiymatni tanlashda nima ko'rsatishini aniq bilishi uchun
// barcha izohlar to'g'ridan-to'g'ri formada ko'rinadi.

const NS_SCALES = [
  {
    key: "mrc", code: "MS", name: "Mushak kuchi", abbr: "MRC", max: 5, impact: 0.60,
    description: "Medical Research Council shkalasi. Har asosiy mushak guruhi (deltoid, biceps, kvadritseps, …) alohida baholanadi va o'rtacha qiymat olinadi.",
    levels: [
      { v: 0, label: "Falaj",                short: "Falaj",     desc: "Hech qanday harakat yo'q. To'liq plegiya." },
      { v: 1, label: "Ko'rinadigan qisqarish", short: "Qisqarish", desc: "Mushak qisqaradi, lekin bo'g'imda harakat hosil qilmaydi." },
      { v: 2, label: "Gravitatsiyasiz",      short: "Yotgan h.", desc: "Bo'g'imda harakat — faqat gravitatsiya yo'q holatda (yotgan)." },
      { v: 3, label: "Gravitatsiyaga",       short: "Tik h.",    desc: "Gravitatsiyaga qarshi harakat, lekin qarshilikka chidamaydi." },
      { v: 4, label: "Qismiy qarshilik",     short: "Qisman",    desc: "Tashqi qarshilikka qisman bardosh — to'liq emas." },
      { v: 5, label: "To'liq kuch",          short: "Norma",     desc: "Yosh me'yoriga mos to'liq mushak kuchi." },
    ],
    norm: (age) => Math.min(5, 4.0 + (age - 7) * 0.1),
    refs: "MRC Scale (MRC 1943); Bohannon & Smith, Phys Ther (1987)",
  },
  {
    key: "dtr", code: "RF", name: "Reflekslar holati", abbr: "DTR", max: 4, impact: 0.38,
    description: "Chuqur paya reflekslari (DTR) Jendrassik manyovri bilan. Patellar, ahillov, biceps, triceps reflekslari o'rtachasi.",
    levels: [
      { v: 0, label: "Areflexia",          short: "Yo'q",       desc: "Refleks butunlay yo'q. Tom Jendrassik bilan ham." },
      { v: 1, label: "Giporefleksiya",     short: "Past",       desc: "Refleks sustlangan, faqat kuchaytirish bilan chaqiriladi." },
      { v: 2, label: "Norma",              short: "Norma",      desc: "Normal yorqin refleks — me'yoriy javob." },
      { v: 3, label: "Giperefleksiya",     short: "Yuqori",     desc: "Refleks kuchaygan, lekin klonus yo'q." },
      { v: 4, label: "Klonus",             short: "Klonus",     desc: "Klonus mavjud — markaziy motor neyron buzilishi belgisi." },
    ],
    norm: (age) => age <= 10 ? 2.0 : age <= 14 ? 2.2 : 2.5,
    refs: "Campbell WW, DeJong's Neurological Exam (2013)",
  },
  {
    key: "icars", code: "KO", name: "Harakat koordinatsiyasi", abbr: "ICARS", max: 10, impact: 0.50,
    description: "ICARS/SARA shkalalarining soddalashtirilgan 0–10 versiyasi. Romberg + barmoq-burun + dyadokokinezi + tandem yurish.",
    levels: [
      { v: 0, label: "Og'ir ataksiya",     short: "Og'ir",   desc: "Yura olmaydi, mustaqil tura olmaydi. Romberg + (ko'zlar ochiq ham)." },
      { v: 2, label: "Sezilarli buzilish", short: "Sezilarli", desc: "Yordam bilan yuradi. Barmoq-burun aniq dismetriya." },
      { v: 4, label: "O'rta buzilish",     short: "O'rta",   desc: "Mustaqil yuradi, lekin tandem yurishni qila olmaydi." },
      { v: 6, label: "Yengil buzilish",    short: "Yengil",  desc: "Tandem yurishda noaniqlik, dyadokokinezi sustlangan." },
      { v: 8, label: "Engil-kichik",       short: "Subnormal", desc: "Barcha sinovlar bajariladi, lekin kichik noaniqliklar bor." },
      { v: 10,label: "Norma",              short: "Norma",   desc: "Barcha koordinatsion sinovlar mukammal." },
    ],
    norm: (age) => Math.min(10, 6.0 + (age - 7) * 0.4),
    refs: "ICARS — Trouillas P et al. J Neurol Sci (1997); SARA — Schmitz-Hubsch (2006)",
  },
  {
    key: "etdrs", code: "KF", name: "Ko'rish faoliyati", abbr: "ETDRS", max: 10, impact: 0.28,
    description: "ETDRS logMAR ko'rish o'tkirligi + ko'rish maydoni (perimetriya). Pediatrik o'lchovlar.",
    levels: [
      { v: 0, label: "Amaurosis",      short: "Ko'rmaydi",  desc: "Yorug'lik sezish yo'q. Total ko'rlik." },
      { v: 2, label: "Juda past",      short: "Juda past",  desc: "Faqat qo'l harakatini ko'radi. Hech bir qator o'qiy olmaydi." },
      { v: 4, label: "Past",           short: "Past",       desc: "logMAR > 0.7 (≈ 20/100 yoki yomonroq)." },
      { v: 6, label: "O'rta",          short: "O'rta",      desc: "logMAR 0.3–0.7 (≈ 20/40 dan 20/100 gacha)." },
      { v: 8, label: "Yaxshi",         short: "Yaxshi",     desc: "logMAR 0.1–0.3 (≈ 20/25 dan 20/40 gacha)." },
      { v: 10,label: "Norma 20/20",    short: "Norma",      desc: "logMAR ≤ 0 (≈ 20/20 yoki yaxshiroq). Maydon ham normal." },
    ],
    norm: (age) => age <= 9 ? 8.5 : age <= 13 ? 9.0 : 9.5,
    refs: "ETDRS — Vitale S et al. Arch Ophthalmol (2006); AAO PPP (2017)",
  },
  {
    key: "pta", code: "ES", name: "Eshitish funksiyasi", abbr: "PTA", max: 10, impact: 0.18,
    description: "PTA (Pure Tone Average) + markaziy eshitish qayta ishlash. WHO 2021 mezonlari.",
    levels: [
      { v: 0, label: "Karlik (> 80 dB)", short: "Karlik",  desc: "Profund eshitish yo'qoligi. Hatto baland tovushni ham sezmaydi." },
      { v: 2, label: "Og'ir (61–80 dB)", short: "Og'ir",   desc: "Faqat baland nutqni qoshilgan yordamchi vositalar bilan eshitadi." },
      { v: 4, label: "O'rta (41–60 dB)", short: "O'rta",   desc: "Oddiy nutqni eshitishda qiyinchilik. Eshitish vositasi tavsiya etiladi." },
      { v: 6, label: "Yengil (26–40 dB)",short: "Yengil",  desc: "Shovqinli muhitda nutq tushunarli emas." },
      { v: 8, label: "Subnormal",        short: "Subnormal", desc: "≤25 dB lekin markaziy qayta ishlash sustlangan." },
      { v: 10,label: "Norma (≤ 15 dB)",  short: "Norma",   desc: "WHO me'yori: barcha chastotalarda eshitish to'liq." },
    ],
    norm: (age) => age <= 11 ? 9.0 : 9.5,
    refs: "WHO World Report on Hearing (2021); JCIH 2019 Guidelines",
  },
  {
    key: "dhi", code: "VB", name: "Vestibulyar tizim", abbr: "DHI", max: 4, impact: 0.42,
    description: "Pediatrik DHI + Romberg + Unterberger + VOR + nistagm. Bosh aylanishi va muvozanat.",
    levels: [
      { v: 0, label: "Og'ir buzilish",      short: "Og'ir",     desc: "Spontan nistagm, Romberg+. Mustaqil tura olmaydi." },
      { v: 1, label: "Sezilarli",           short: "Sezilarli", desc: "VOR sustlangan, Unterberger pozitiv." },
      { v: 2, label: "O'rta",               short: "O'rta",     desc: "Hujum davrida bosh aylanishi, fojiya emas." },
      { v: 3, label: "Yengil",              short: "Yengil",    desc: "Faqat bosh harakatlarida noaniqlik." },
      { v: 4, label: "Norma",               short: "Norma",     desc: "Barcha vestibulyar sinovlar normal." },
    ],
    norm: (age) => age <= 10 ? 3.5 : age <= 14 ? 3.7 : 4.0,
    refs: "DHI — Jacobson & Newman (1990); Pediatric Vestibular Society",
  },
  {
    key: "omf", code: "KH", name: "Ko'z harakati", abbr: "OMF", max: 6, impact: 0.32,
    description: "Sakkad + cover test + smooth pursuit + nistagm. III, IV, VI nervlar funksiyasi.",
    levels: [
      { v: 0, label: "Ophthalmoplegia",     short: "Falaj",      desc: "Ko'zlar fiksatsiyalangan, harakat yo'q." },
      { v: 1, label: "Sezilarli paresis",   short: "Paresis",    desc: "Bir yoki bir nechta yo'nalishda cheklov." },
      { v: 2, label: "Diplopiya",           short: "Diplopiya",  desc: "Ko'zlar konjugatsiyasi buzilgan." },
      { v: 3, label: "Sakkad sustligi",     short: "Sakkad-",    desc: "Sakkadlar sekin yoki noaniq." },
      { v: 4, label: "Subnormal",           short: "Subnorma",   desc: "Smooth pursuit sustlangan, sakkadlar normal." },
      { v: 5, label: "Deyarli norma",       short: "≈Norma",     desc: "Faqat ekstremal nigohda ozgina nistagm." },
      { v: 6, label: "Norma",               short: "Norma",      desc: "Barcha yo'nalishlarda mukammal ko'z harakatlari." },
    ],
    norm: (age) => age <= 9 ? 5.5 : age <= 13 ? 5.8 : 6.0,
    refs: "Leigh RJ & Zee DS. Neurology of Eye Movements (5th ed.)",
  },
  {
    key: "fois", code: "YB", name: "Yutish / Bulbar simptomlar", abbr: "FOIS", max: 4, impact: 0.38,
    description: "Functional Oral Intake Scale. Aspiratsiya xavfi va ovqat to'g'risi bilan baholanadi.",
    levels: [
      { v: 0, label: "Disfagiya (NPO)",     short: "NPO",       desc: "Og'iz orqali yeya olmaydi. NG zond yoki PEG kerak." },
      { v: 1, label: "Faqat suyuq",         short: "Suyuq",     desc: "Faqat suyuq ozuqa, qattig'iga yutish yo'q." },
      { v: 2, label: "Suyuq+puré",          short: "Puré",      desc: "Yumshatilgan ovqat, suvga ehtiyot bo'lish kerak." },
      { v: 3, label: "Cheklangan dieta",    short: "Cheklov",   desc: "Ko'p turdagi ovqat, lekin ba'zilari xavfli." },
      { v: 4, label: "Norma",               short: "Norma",     desc: "Cheklovsiz oddiy ovqatlanish, aspiratsiya yo'q." },
    ],
    norm: (age) => age <= 10 ? 3.8 : 4.0,
    refs: "FOIS — Crary MA et al. Dysphagia (2005)",
  },
  {
    key: "fda", code: "NQ", name: "So'zlash / Nutq", abbr: "FDA", max: 10, impact: 0.55, sensitive: true,
    description: "Frenchay Dysarthria + Boston/WAB. ★ ENG SEZGIR ko'rsatkich (POCD ta'siri 55%).",
    levels: [
      { v: 0, label: "Mutizm / Afaziya",   short: "Mutizm",    desc: "Nutq yo'q yoki butunlay tushunarsiz." },
      { v: 2, label: "Og'ir dizartriya",   short: "Og'ir",     desc: "Faqat 1–2 so'z, ifoda buzilgan." },
      { v: 4, label: "O'rta dizartriya",   short: "O'rta",     desc: "Qisqa jumla, ko'p artikulyatsion xato." },
      { v: 6, label: "Yengil dizartriya",  short: "Yengil",    desc: "Ravon nutq, lekin notanish kishilarga tushunarsiz." },
      { v: 8, label: "Subnormal",          short: "Subnorma",  desc: "Ravon, faqat charchaganda yoki tez gapirganda artikulyatsiya susayadi." },
      { v: 10,label: "Norma",              short: "Norma",     desc: "Yosh me'yoriga mos ravon, ifodali, tushunarli nutq." },
    ],
    norm: (age) => Math.min(10, 7.5 + (age - 7) * 0.25),
    refs: "FDA — Enderby PM (1983); WAB — Kertesz A (1982)",
  },
  {
    key: "psqi", code: "UY", name: "Uyqu sifati", abbr: "PSQI", max: 10, impact: 0.48, sensitive: true,
    description: "PSQI/SDSC pediatrik. ★ Dastlabki POCD markeri — REM va delta to'lqin buzilishi.",
    levels: [
      { v: 0, label: "Og'ir insomniya",     short: "Insomniya", desc: "Uyqu fragmentlangan, har kechasi <4 soat samarali uyqu." },
      { v: 2, label: "Buzilish",            short: "Buzilish",  desc: "Tez-tez uyg'onish, ertalab charchoq, kunduzgi uyqu." },
      { v: 4, label: "O'rta sifat",         short: "O'rta",     desc: "Uyquga ketish qiyin, REM sustlangan." },
      { v: 6, label: "Yengil ko'tarilish",  short: "Yengil",    desc: "Vaqt o'rtacha, sifat past." },
      { v: 8, label: "Yaxshi",              short: "Yaxshi",    desc: "8+ soat, faqat ba'zan uyg'onish." },
      { v: 10,label: "Mukammal",            short: "Mukammal",  desc: "Yosh me'yorida (8–10 soat), siklik tuzilish bus-butun." },
    ],
    norm: (age) => age <= 9 ? 9.5 : age <= 13 ? 9.0 : 8.5,
    refs: "PSQI — Buysse DJ et al. (1989); SDSC — Bruni O et al. (1996)",
  },
  {
    key: "cn", code: "BN", name: "Bosh miya nerv belgilari", abbr: "I–XII", max: 12, impact: 0.38,
    description: "Har 12 ta kranial nerv 1 ball: ishlasa 1, buzilsa 0. I (hid), VIII (eshitish), VII (yuz) — POCD da ko'p ta'sirlanadi.",
    levels: [
      { v: 0, label: "Hammasi buzilgan",    short: "0/12",      desc: "Hech bir nerv to'liq ishlamaydi. Og'ir miya shikastlanishi." },
      { v: 3, label: "Ko'p buzilish",       short: "3/12",      desc: "9 ta nerv buzilgan." },
      { v: 6, label: "Yarmi buzilgan",      short: "6/12",      desc: "Yarmi buzilgan, asosan I, VII, VIII." },
      { v: 9, label: "Yengil",              short: "9/12",      desc: "3 ta nerv buzilgan (odatda I — hid bilish, VII)." },
      { v:10, label: "Subnormal",           short: "10/12",     desc: "2 ta yengil buzilish." },
      { v:11, label: "Deyarli norma",       short: "11/12",     desc: "1 ta yengil buzilish (odatda I — hid bilish)." },
      { v:12, label: "Norma",               short: "12/12",     desc: "Barcha 12 ta kranial nerv mukammal ishlaydi." },
    ],
    norm: () => 12,
    refs: "Blumenfeld H. Neuroanatomy Clinical Cases (2022)",
  },
  {
    key: "asa", code: "SF", name: "Umumiy somatik fon", abbr: "ASA", max: 10, impact: 0.32,
    description: "ASA Physical Status + CIRS. Komorbidlik POCD xavfini 2–3× oshiradi.",
    levels: [
      { v: 0, label: "ASA V (moribund)",   short: "ASA V",    desc: "Hayotga tahdid, 24 soat ichida o'lim xavfi." },
      { v: 2, label: "ASA IV (og'ir)",     short: "ASA IV",   desc: "Doimiy hayotga tahdid soluvchi tizimli kasallik." },
      { v: 4, label: "ASA III",            short: "ASA III",  desc: "Faollikni cheklovchi og'ir tizimli kasallik." },
      { v: 6, label: "ASA II",             short: "ASA II",   desc: "Yengil tizimli kasallik (astma, kontrollangan DM)." },
      { v: 8, label: "Yaxshi",             short: "Yaxshi",   desc: "Bir nechta yengil belgilar, lekin diagnoz yo'q." },
      { v: 10,label: "ASA I (sog'lom)",    short: "ASA I",    desc: "Sog'lom, normal funksional zaxiralar." },
    ],
    norm: (age) => age <= 10 ? 9.0 : age <= 14 ? 9.2 : 9.5,
    refs: "ASA Physical Status (2020); CIRS — Linn BS et al. (1968)",
  },
];

// Compute approximate POCD level from observed value vs age-norm
// Formula (Excel): observed = norm × (1 − POCD/100 × K_i)
// Reversed:        POCD = (1 − observed/norm) / K_i × 100
function estimatePOCD(scale, value, age) {
  if (value == null) return null;
  const norm = scale.norm(age);
  if (norm <= 0) return null;
  const ratio = value / norm;
  const pocd = ((1 - ratio) / scale.impact) * 100;
  return Math.max(0, Math.min(100, pocd));
}

function pocdSeverity(pocd) {
  if (pocd == null) return { label: "—", tone: "neutral", color: "var(--ink-3)" };
  if (pocd <= 0)    return { label: "Sog'lom",      tone: "great", color: "#16A34A" };
  if (pocd <= 25)   return { label: "Yengil",       tone: "good",  color: "#65A30D" };
  if (pocd <= 50)   return { label: "O'rta",        tone: "warn",  color: "#D97706" };
  if (pocd <= 75)   return { label: "Og'ir",        tone: "bad",   color: "#DC2626" };
  return                   { label: "Juda og'ir",   tone: "bad",   color: "#991B1B" };
}

// ===== UI =====

const NSTest = ({ patient, onAbort, onFinish }) => {
  const test = window.KNBT.TEST_META.NS;
  const [phase, setPhase] = React.useState("intro");
  // Default each scale to its age-norm (rounded to integer)
  const [vals, setVals] = React.useState(() =>
    Object.fromEntries(NS_SCALES.map(s => [s.key, Math.round(s.norm(patient.yosh || 10))]))
  );
  const [expanded, setExpanded] = React.useState(null);

  const set = (k, v) => setVals(f => ({ ...f, [k]: +v }));

  // Aggregate POCD estimate across all scales (weighted by impact)
  const aggregatePOCD = React.useMemo(() => {
    let weighted = 0, totalW = 0;
    NS_SCALES.forEach(s => {
      const pocd = estimatePOCD(s, vals[s.key], patient.yosh);
      if (pocd != null) {
        const w = s.impact;
        weighted += pocd * w;
        totalW += w;
      }
    });
    return totalW > 0 ? weighted / totalW : null;
  }, [vals, patient.yosh]);

  const aggSev = pocdSeverity(aggregatePOCD);
  const total = NS_SCALES.reduce((a, s) => a + (vals[s.key] || 0), 0);
  const maxTotal = NS_SCALES.reduce((a, s) => a + s.max, 0);

  const submit = (e) => {
    e?.preventDefault?.();
    onFinish({
      test: "NS",
      raw: { ...vals, total },
      pocdEstimate: aggregatePOCD,
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <TestShell
      patient={patient} test={test} phase={phase === "intro" ? "intro" : "running"}
      onAbort={onAbort}
      intro={
        <TestIntro test={test}
          title="Nevrologik holatni baholash (NS)"
          description="12 ta standart nevrologik shkala bo'yicha bemor holatini baholang. Har bir shkala uchun ko'rsatkichni tanlang — har bir qiymatning klinik ma'nosi izoh bilan ko'rsatiladi. Yuqori qiymat — yaxshiroq holatni anglatadi."
          steps={[
            "Har bir shkala uchun bemor holatiga mos qiymatni tanlang.",
            "Tanlash uchun: shkala tugmalarini bosing yoki surgichdan foydalaning.",
            "Bemor yoshi uchun sog'lom norma har shkalada ko'rsatilgan.",
            "Tahminiy POCD darajasi har bir shkala yonida real vaqtda hisoblanadi.",
          ]}
          onStart={() => setPhase("entry")}
          ctaLabel="Baholashni boshlash"
        />
      }
      body={
        <form onSubmit={submit} style={{
          width: 1000, maxWidth: "100%",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          {/* Sticky summary header */}
          <div className="card" style={{
            padding: "16px 20px",
            display: "grid",
            gridTemplateColumns: "1fr auto auto auto",
            gap: 20, alignItems: "center",
            position: "sticky", top: 0, zIndex: 5,
            boxShadow: "var(--shadow-md)",
          }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>Bemor: {patient.fish}</div>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ink-2)",
              }}>{patient.yosh} yosh · {NS_SCALES.length} ta shkala bo'yicha baholash</div>
            </div>
            <div style={{
              padding: "8px 14px", borderRadius: 10,
              background: "var(--surface-2)", border: "1px solid var(--border)",
              display: "flex", flexDirection: "column", alignItems: "center", minWidth: 90,
            }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>Jami</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {total} / {maxTotal}
              </span>
            </div>
            <div style={{
              padding: "8px 14px", borderRadius: 10,
              background: aggSev.tone === "bad" ? "var(--err-bg)"
                       : aggSev.tone === "warn" ? "var(--warn-bg)"
                       : aggSev.tone === "good" ? "var(--ok-bg)"
                       : aggSev.tone === "great" ? "var(--ok-bg)" : "var(--surface-2)",
              color: aggSev.color,
              display: "flex", flexDirection: "column", alignItems: "center", minWidth: 120,
              border: "1px solid currentColor",
            }}>
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.85 }}>
                Tahminiy POCD
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {aggregatePOCD == null ? "—" : aggregatePOCD.toFixed(0)}
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600 }}>
                {aggSev.label}
              </span>
            </div>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={16} /> Saqlash
            </button>
          </div>

          {/* Scale cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {NS_SCALES.map(s => (
              <ScaleCard key={s.key}
                scale={s}
                value={vals[s.key]}
                onChange={(v) => set(s.key, v)}
                age={patient.yosh}
                expanded={expanded === s.key}
                onToggleExpand={() => setExpanded(e => e === s.key ? null : s.key)}
              />
            ))}
          </div>

          <div style={{
            display: "flex", gap: 10, justifyContent: "flex-end",
            paddingTop: 12, borderTop: "1px solid var(--divider)",
          }}>
            <button type="button" className="btn btn-secondary" onClick={onAbort}>Bekor qilish</button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={16} /> Saqlash va davom etish
            </button>
          </div>
        </form>
      }
    />
  );
};

const ScaleCard = ({ scale, value, onChange, age, expanded, onToggleExpand }) => {
  const norm = scale.norm(age);
  const pocd = estimatePOCD(scale, value, age);
  const sev = pocdSeverity(pocd);
  const selectedLevel = scale.levels.find(l => l.v === value) || scale.levels.reduce((best, l) =>
    Math.abs(l.v - value) < Math.abs(best.v - value) ? l : best, scale.levels[0]);

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      padding: 0,
      overflow: "hidden",
      boxShadow: "var(--shadow-xs)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "var(--primary-soft)", color: "var(--primary-press)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13,
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}>{scale.code}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
            color: "var(--ink)", letterSpacing: "-0.005em",
          }}>
            {scale.name}
            {scale.sensitive && (
              <span title="Sezgir ko'rsatkich — POCD ta'siri kuchli" style={{
                fontFamily: "var(--font-mono)", fontSize: 9,
                color: "#92400E", background: "#FEF3C7",
                padding: "1px 5px", borderRadius: 4, fontWeight: 700,
                letterSpacing: "0.04em",
              }}>★ SEZGIR</span>
            )}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>
            {scale.abbr} · 0–{scale.max} · {age}y norma: <b style={{ color: "var(--ink-2)" }}>{norm.toFixed(1)}</b>
            {" · "}POCD ta'sir: <b style={{ color: "var(--ink-2)" }}>{Math.round(scale.impact * 100)}%</b>
          </div>
        </div>
        <button type="button" onClick={onToggleExpand}
          style={{
            background: "transparent", border: 0, cursor: "pointer",
            padding: 4, borderRadius: 6, color: "var(--ink-3)",
            display: "flex", alignItems: "center",
          }} title="Ilmiy izoh">
          <Icon name={expanded ? "chevron-up" : "info"} size={16} />
        </button>
      </div>

      {/* Value buttons */}
      <div style={{ padding: "0 16px", display: "flex", gap: 4, flexWrap: "wrap" }}>
        {scale.levels.map(lvl => {
          const active = lvl.v === value;
          return (
            <button key={lvl.v} type="button"
              onClick={() => onChange(lvl.v)}
              title={lvl.desc}
              style={{
                flex: "1 1 0", minWidth: 0,
                padding: "8px 6px",
                borderRadius: 8,
                border: active ? "2px solid var(--primary)" : "1px solid var(--border)",
                background: active ? "var(--primary-soft)" : "var(--surface-2)",
                color: active ? "var(--primary-press)" : "var(--ink-2)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                transition: "background var(--dur) var(--ease)",
              }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14,
                fontVariantNumeric: "tabular-nums",
              }}>{lvl.v}</span>
              <span style={{
                fontSize: 9.5, fontWeight: 500, lineHeight: 1.15, textAlign: "center",
                opacity: active ? 1 : 0.75,
              }}>{lvl.short}</span>
            </button>
          );
        })}
      </div>

      {/* Selected level detail + POCD estimate */}
      <div style={{
        padding: "10px 16px",
        display: "flex", alignItems: "center", gap: 12,
        background: "var(--surface-2)",
        borderTop: "1px solid var(--divider)",
        marginTop: 10,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, color: "var(--ink)",
          }}>{selectedLevel.label}</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)",
            lineHeight: 1.4, marginTop: 1,
          }}>{selectedLevel.desc}</div>
        </div>
        <div style={{
          padding: "4px 10px", borderRadius: 8,
          background: `${sev.color}1A`,
          color: sev.color,
          border: `1px solid ${sev.color}33`,
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          display: "flex", flexDirection: "column", alignItems: "center",
          minWidth: 70,
        }}>
          <span style={{ fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>POCD</span>
          <span>{pocd == null ? "—" : pocd.toFixed(0)}</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 600 }}>{sev.label}</span>
        </div>
      </div>

      {/* Expanded scientific info */}
      {expanded && (
        <div style={{
          padding: "12px 16px",
          background: "var(--primary-soft-2)",
          borderTop: "1px solid var(--divider)",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11, color: "var(--primary-press)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              Ilmiy asos
            </div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
              {scale.description}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11, color: "var(--primary-press)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              Manba
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
              {scale.refs}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.NSTest = NSTest;
window.NS_SCALES = NS_SCALES;
window.NS_estimatePOCD = estimatePOCD;
window.NS_pocdSeverity = pocdSeverity;
