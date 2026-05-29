# Kognitiv Test Tizimi (KTT)

Pediatrik bemorlarda **operatsiyadan keyingi kognitiv buzilishlarni (POCD)** baholash, prognoz qilish va reabilitatsiya qilish uchun mo'ljallangan klinik dastur.

> **Maqsad:** 7–17 yoshli bolalarda anesteziya/operatsiyaning kognitiv funksiyalarga ta'sirini standartlashtirilgan KNBT testlari orqali aniqlash, xavf omillarini bashorat qilish va Pantogam + raqamli kognitiv trening yordamida reabilitatsiya qilish.

---

## Tezkor boshlash

1. **Ochish:** `clinical_app/index.html` ni brauzerda oching
2. **Login:** Foydalanuvchi nomi `doktor`, parol istalgan
3. **Bemor qo'shing yoki mavjudini oching** — testlar va prognozlar avtomatik ishlaydi

Ma'lumotlar brauzeringizning `localStorage`'da saqlanadi (`ktt_state_v1` kaliti). Production'da Supabase/PostgreSQL backend kerak bo'ladi.

---

## Asosiy talablar (MAJBURIY)

### 📱 Mobile-first / To'liq adaptiv dizayn
**Web app to'liq mobile adaptive bo'lishi shart.** Research Plan'ga muvofiq:
- 2-dastur (reabilitatsiya) — bola uyda telefon orqali mashqlarni bajaradi
- 1-dastur (diagnostika) — shifoxonada planshet yoki kompyuterda ishlatiladi
- Min ekran kengligi: **360px** (mobil), o'rta: **768px** (planshet), katta: **1280px+** (desktop)
- Barcha test ekranlari **touch event**larni qo'llab-quvvatlashi shart
- Tugmalar min **44×44px** hit target (Apple HIG)
- Hech qanday horizontal scroll mobil ekranda

---

## Asosiy funksiyalar

### 1. 👥 Bemorlar bazasi
- F.I.Sh., jinsi, tug'ilgan sana (yoshi avtomatik), premorbid nevrologik fon
- Amaliyot boshlanish va tugash vaqti (davomiyligi avtomatik)
- Anestetik preparatlar soni
- Statistika: jami / testlar bajarilgan / reabilitatsiyada / yangi bu hafta
- Qidiruv, bashoratli xavf foizi har bir qator uchun

### 2. 🧪 7 ta diagnostik test (KNBT)
| Test | Domen | Bajarish |
|------|------|----------|
| **Stroop** | Diqqatni boshqarish, interferensiya | Interaktiv (40 trial) |
| **TMT** | Vizual qidiruv, kognitiv moslashuvchanlik | Interaktiv (25 nuqta) |
| **DST** | Qisqa muddatli va ishchi xotira | Interaktiv (Forward + Backward) |
| **LMWT** | Eshitish-og'zaki o'rganish (Rey AVLT) | Manual forma (5 urinish + delayed) |
| **NS** | 12 ta nevrologik shkala (MRC, DTR, ICARS...) | Manual forma + POCD baholash |
| **EEG** | α/θ amplituda, IHA, IAF | Manual forma |
| **Audio** | Eshitish, diqqat, reaksiya | Interaktiv (30 trial, Web Audio API) |

### 3. 📊 KNBT Composite + ISPOCD
- Har test bo'yicha **CogScore (0–100)**, **Z-score**, **Cognitive Health label**
- **Composite CogScore** — 5 ta core testning o'rtachasi
- **ISPOCD verdict** — agar ≥2 ta core testda Z ≤ −1.96 bo'lsa "Musbat"

### 4. 🔮 PNB Bashorat moduli
- **Logistic Regression** — PNB rivojlanish ehtimoli (%) bemor ma'lumotlari asosida
- **Multiple Linear Regression** — kutilayotgan CogScore (PostOp)
- Manba: `Statistics M-3 Risk Factors` (n=181)
- 4 xavf omili: anesteziya davomiyligi, preparatlar soni, yoshi, premorbid fon
- Har omil uchun **OR (Odds Ratio)** va **kontribution bar**
- 7 ta KNBT instrumenti uchun alohida bashorat
- Avtomatik klinik tavsiyalar (Pantogam, kognitiv trening, kuzatuv)

### 5. 🧠 Reabilitatsiya (2-Dastur)
5 ta kognitiv mashq, 4 hafta protokoli (haftasiga 3 marta):

| Mashq | Domen | Vaqt |
|-------|-------|------|
| **Vizual qidiruv** | Diqqat va selektiv diqqat | 3–4 daq |
| **N-Back xotira** | Ishchi xotira | 3–4 daq |
| **Qoidalar almashinuvi** | Ijro funksiyalari (task switching) | 3 daq |
| **Reaksiya tezligi** | Psixomotor tezlik (GO/NO-GO) | 2–3 daq |
| **Nishon kuzatish** | Vizual-motor koordinatsiya | 45 son |

Har seans: ball, aniqlik, daraja, vaqt saqlanadi. Domenlar bo'yicha rivojlanish progress bar bilan ko'rinadi.

### 6. 📈 Tahlil markazi (4 ta modul)

**Dashboard** — kohort statistikasi:
- 6 ta KPI (jami, testlar, reabilitatsiya, POCD, yuqori xavf, premorbid+)
- Yosh va jins taqsimoti
- Yuqori xavfli bemorlar jadvali

**ROC tahlili** — diagnostik aniqlik:
- 8 ta instrument uchun ROC chizmasi (SVG)
- AUC + 95% CI + p-value
- Youden indeksi orqali optimal cut-off
- **Confusion matrix** (TP/FP/TN/FN + PPV/NPV/Aniqlik)
- **DeLong test** — ikki ROC ni statistik solishtirish

**Davolash effekti** — Pantogam + trening samaradorligi (M-4):
- PostOp → PostTx line chart (Asosiy vs Taqqoslov)
- Cohen's d effekt o'lchami
- Tiklanish foizi
- ARR + NNT (Number Needed to Treat)

**Hisobotlar** — eksport:
- CSV (UTF-8 BOM, Excel'da to'g'ri ochiladi)
- Bemor PDF — to'liq klinik hisobot (window.print orqali)

---

## Loyiha tuzilishi

```
clinical_app/
├── index.html              ← entry point, barcha scriptlarni yuklaydi
├── app.css                 ← CSS variables, atom stillari
├── knbt.js                 ← KNBT scoring engine (CogScore, Z-score, ISPOCD)
├── prediction.js           ← LR + MLR koeffitsientlari, PNB bashorat
├── stats.js                ← Statistika: t-test, χ², Welch ANOVA, ROC, DeLong
│
├── App.jsx                 ← root, ekranlar orasidagi navigatsiya
├── Login.jsx               ← kirish ekrani
├── PatientsList.jsx        ← bemorlar jadvali, yangi bemor modali
├── PatientView.jsx         ← bemor kartochkasi, 3 ta tab
├── Composite.jsx           ← KNBT Composite paneli
├── PNBForecast.jsx         ← PNB bashorat moduli (PNB prognozi tab)
├── Results.jsx             ← test natijasi ekrani
├── _shared.jsx             ← AppHeader, Logo, Icon (Lucide React'ga)
│
├── tests/
│   ├── _TestShell.jsx      ← test ekranlari uchun shared shell
│   ├── Stroop.jsx          DST.jsx        Audio.jsx
│   ├── LMWT.jsx            NS.jsx         EEG.jsx
│   (TMT.jsx — alohida, eski versiyadan)
│
├── training/
│   ├── _TrainingShell.jsx
│   ├── _meta.js            ← 5 ta mashq metadata
│   ├── RehabHub.jsx        ← Reabilitatsiya tab
│   ├── VisualSearch.jsx    NBack.jsx       TaskSwitch.jsx
│   ├── ReactionTime.jsx    Tracking.jsx
│
└── Analytics.jsx           ← Tahlil markazi (root)
    AnalyticsROC.jsx        ← ROC + Confusion Matrix + DeLong
    AnalyticsTreatment.jsx  ← Davolash effekti
    AnalyticsReports.jsx    ← CSV + PDF eksport
```

---

## Statistik manbalar

Barcha formulalar va koeffitsientlar quyidagi Excel fayllaridan olingan:

| Fayl | Ishlatiladigan joy |
|------|---------------------|
| `Dataset ALL` | Asosiy ko'rsatkichlar + kolonkalar |
| `Statistics M-1 POCD Features` | t-test, χ², Welch ANOVA (statistik fonksiyalar) |
| `Statistics M-2 Diagnostic Value` | ROC, AUC, Youden cut-off, sensitivity/specificity |
| `Statistics M-3 Risk Factors` | LR + MLR koeffitsientlari (PNB bashorat) |
| `Statistics M-4 Treatment Efficacy` | Cohen's d, tiklanish foizi, NNT |
| `Nevrologik_Baholash_POCD` | NS shkalalari, ilmiy izoh, ilmiy manbalar |

---

## Texnologiyalar

- **Frontend:** Vanilla React 18 + Babel Standalone (inline JSX, build yo'q)
- **Stillar:** CSS variables (`--primary`, `--ink`, `--font-sans`), Outfit shrift
- **Ikonlar:** Lucide (React component sifatida, MutationObserver loopisiz)
- **Saqlash:** Browser `localStorage` (kalit: `ktt_state_v1`)
- **Statistika:** Mustaqil JS engine (`stats.js`) — tashqi kutubxonasiz

---

## Cheklovlar va kelajak rejalar

### Hozir mavjud emas
- ❌ Real database (Supabase/PostgreSQL backend)
- ❌ Multi-user auth (haqiqiy login)
- ❌ TMT-B varianti (faqat TMT-A interaktiv)

### Aniq qadamlar
1. **Backend:** Supabase ulanish (bemor jadvali, RLS bilan auth) — 1 kun
2. **TMT-B:** raqam-harf almashinuvi (1-A-2-B-3-C...) — yarim kun
3. **PDF eksport:** mavjud `window.print()` o'rniga `jsPDF` bilan to'g'ri PDF — 1 kun
4. **Mobil optimallash:** test ekranlari uchun touch eventlar — 1 kun
5. **Production deploy:** Vercel/Netlify + custom domain — 0.5 kun

---

## Foydalanish ko'rsatmasi (shifokor uchun)

1. **Yangi bemor qo'shish:**
   - "Yangi bemor" tugmasini bosing
   - F.I.Sh., jinsi, tug'ilgan sana, premorbid fon, amaliyot vaqtlari, preparatlar soni
   - Yoshi va davomiyligi avtomatik hisoblanadi

2. **Test o'tkazish:**
   - Bemorni oching → "Diagnostik testlar" tab → kerakli testni tanlang
   - Stroop/TMT/DST/Audio — interaktiv (bemor o'zi bajaradi)
   - LMWT/NS/EEG — manual forma (shifokor to'ldiradi)

3. **Bashorat ko'rish:**
   - Bemor sahifasida "PNB prognozi" tab — har bemor uchun avtomatik

4. **Reabilitatsiya:**
   - "Reabilitatsiya" tab → 5 ta mashqdan birini tanlang
   - 4 hafta, har mashq 12 marta (haftasiga 3) tavsiya etiladi

5. **Hisobot:**
   - "Tahlil markazi" → "Hisobotlar" → CSV (barcha) yoki PDF (bemor)

---

## Litsenziya va aloqa

Bu — tadqiqot prototipi. Klinik ishlatish uchun mahalliy etika komiteti tasdig'i kerak.

Savollar uchun — loyiha rahbari bilan bog'laning.
