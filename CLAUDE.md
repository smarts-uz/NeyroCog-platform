# CLAUDE.md — Loyiha yo'l-yo'rig'i

Bu — **Pediatrik Kognitiv Test Tizimi (KTT)** loyihasi. Operatsiyadan keyingi kognitiv buzilishlarni (POCD) bolalarda diagnostika, bashorat va reabilitatsiya qilish uchun.

## Til

- **Foydalanuvchi interfeysi:** O'ZBEK tili (lotin yozuvi)
- **Kommentlar va o'zgaruvchilar:** kod ichida — lotin alifbosida (`patient`, `taqsimot`, `premorbid`)
- **Apostrof:** `o'zbek` (oddiy apostrof) — `o'zbek` smart quote emas

## Brend va dizayn

- **Loyiha nomi:** "Kognitiv Test Tizimi"
- **Asosiy rang:** teal (`--primary: #0F766E`)
- **Shrift:** Outfit (sans) + JetBrains Mono (mono)
- **Fon:** slate-100 (`#F1F5F9`), karta `#FFFFFF`
- **Ikonlar:** Lucide — `<Icon name="..." />` React component sifatida (`_shared.jsx`'da)
- **Hech qachon emoji ishlatmang** — klinik, professional brend

CSS variables to'liq ro'yxati `clinical_app/app.css`'da. Ranglarni hardcode qilmang — `var(--primary)` ishlatib turing.

## Mobile-first / To'liq adaptiv (MAJBURIY)

**Web app to'liq mobile adaptive bo'lishi shart** — Research Plan talabi.

- Min kenglik **360px** (mobil) → **768px** (planshet) → **1280px+** (desktop)
- Tailwind responsive prefixlardan foydalaning: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- Test ekranlari (Stroop, TMT, DST, Audio) — `pointerdown`/`touchstart` event'larni qo'llab-quvvatlashi shart
- Tugmalar min `h-11` (44px) bo'lishi kerak (touch target)
- Hech qanday horizontal scroll mobil ekranda — `overflow-x-hidden` body'da
- Modal'lar mobil'da to'liq ekran (`sm:max-w-[640px]`)
- Sticky header `h-14` mobil'da, `h-16` desktop'da

## Texnik qoidalar

### React strukturasi

- **Build YO'Q** — Babel Standalone inline JSX, har JSX fayl `<script type="text/babel" src="...">` orqali yuklanadi
- **Har komponent oxirida:** `window.ComponentName = ComponentName` (cross-file ishlatish uchun)
- **Style objects nomi:** unique bo'lishi shart (`stroopStyles`, `tmtStyles`), `const styles = {}` ishlatmang
- **Hooks qoidasi:** `if (!open) return null` BEFORE `useState/useEffect/useMemo` — Hooks qoidasini buzmang

### Ma'lumot strukturasi

Bemor obyekti:
```js
{
  id, fish, jinsi: "Erkak"|"Ayol",
  tugilgan: "YYYY-MM-DD",         // tug'ilgan sana
  yosh,                            // tugilgan'dan avtomatik
  premorbid: 0 | 1,                // BINARY (0=Yo'q, 1=Mavjud), boshqa qiymat YO'Q
  davom,                           // amaliyot davomiyligi (daqiqada)
  prep,                            // anestetik preparatlar soni
  boshlanish, tugash,              // "YYYY-MM-DDTHH:MM"
  sana,                            // ro'yxatga olingan sana
  results: { Stroop: {...}, TMT: {...}, ... },
  training: [ {exerciseId, score, accuracy, duration, completedAt}, ... ],
}
```

**Premorbid har doim 0 yoki 1.** Eski `2`/`3` qiymatlar bo'lsa migratsiya qiling. Tekshirishda `Number(p.premorbid) > 0` ishlating (`=== 1` emas).

### Statistik formulalar — Excel'dan olingan

**Hech qachon o'ylab ko'rmasdan koeffitsientni o'zgartirmang!** Hammasi konkret Excel fayllaridan:

| Fayl | Engine |
|------|--------|
| Statistics M-3 Risk Factors | `prediction.js` — LR + MLR koeffitsientlari |
| Statistics M-2 Diagnostic Value | `AnalyticsROC.jsx` — `ROC_REFERENCE` AUC qiymatlari |
| Statistics M-4 Treatment Efficacy | `AnalyticsTreatment.jsx` — `TREATMENT_RESULTS` |
| Statistics M-1 POCD Features | `stats.js` — statistik funksiyalar (t-test, χ², ANOVA) |
| Nevrologik_Baholash_POCD | `tests/NS.jsx` — `NS_SCALES` (12 ta shkala) |

Yangi koeffitsient kerak bo'lsa — birinchi Excel'dan qiymatni oling, keyin kod o'zgartiring.

### Lucide ikonlar

- **`MutationObserver` ishlatmang** — `lucide.createIcons()` DOM ni o'zgartirib React'ni buzadi
- O'rniga `_shared.jsx`'dagi `Icon` componenti `lucide.icons[Name]` data'sidan SVG yaratadi
- Yangi ikon kerak bo'lsa — `<Icon name="kebab-case-name" size={16} />` (Lucide nomi)

### LocalStorage

- Kalit: `ktt_state_v1`
- Migratsiya: agar struktura o'zgarsa, App.jsx'da migrate logic qo'shing
- Hech qachon to'g'ridan-to'g'ri o'chirmang foydalanuvchidan so'ramasdan

## Voice va ton

- **Direct, klinik** — ortiqcha so'z yo'q
- **"Siz" emas, "Foydalanuvchi"** — interfeysda
- **Bemor uchun emas** — bu shifokor ilovasi, klinik atamalar mumkin
- **Xato xabarlar konkret** — "Tug'ilgan sana noto'g'ri" (umumiy "Xato" emas)

### Atama lug'ati

- **POCD** = Postoperative Cognitive Dysfunction (operatsiyadan keyingi kognitiv buzilish)
- **PNB** = Postoperatsion nevrologik buzilish (POCD ning o'zbek tilidagi qisqartmasi)
- **KNBT** = Kognitiv NeyroBiologik Test (8 ta test to'plami)
- **ISPOCD** = International Study of POCD — bu yerda ≥2/4 core testda Z ≤ −1.96 bo'lsa "Musbat"
- **CogScore** = 0-100 oraliqdagi yagona kognitiv ko'rsatkich
- **Asosiy** / **Taqqoslov** / **Sog'lom** / **Nazorat** — 4 ta tadqiqot guruhi (lekin hozir UI'da yashirin)

## Test komponentlari uchun konvensiya

Har test komponenti `tests/_TestShell.jsx`'dan `TestShell`, `TestIntro`, `TestMetric` import qiladi. Format:

```jsx
const StroopTest = ({ patient, onAbort, onFinish }) => {
  const [phase, setPhase] = React.useState("intro"); // intro | running | done

  const onFinishHandler = () => {
    onFinish({
      test: "Stroop",
      raw: { correct, errors, ... },  // STT.jsx, prediction.js larga input
      completedAt: new Date().toISOString(),
    });
  };

  return <TestShell ... />;
};
window.StroopTest = StroopTest;
```

## Tahrirlash qoidalari

1. **Kichik o'zgarishlar** — `str_replace_edit` ishlating
2. **Yangi fayl** — `write_file`
3. **Komponent qayta yozish kerak bo'lsa** — `index.html`'dagi `REQUIRED` ro'yxatga qo'shing
4. **Hech qachon `localStorage.clear()`** qilmang — faqat aniq kalitni o'chiring

## Bilingki

- Hozir frontend-only — backend yo'q
- Ma'lumotlar faqat brauzerda saqlanadi
- Mobil layout: prototip darajasida — production'da TO'LIQ ADAPTIV bo'lishi shart (yuqorida)
- Foydalanuvchi shifokor (klinik), bemor emas — LEKIN reabilitatsiya mashqlarini bola uyda telefonda bajaradi
