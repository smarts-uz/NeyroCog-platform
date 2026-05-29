# Changelog

NeyroCog (Kognitiv Test Tizimi) — barcha diqqatga loyiq o'zgarishlar. Format:
[Keep a Changelog](https://keepachangelog.com/), sanalar `YYYY-MM-DD`.

## 2026-05-30 — Claude Design sync: scoring guards

### Fixed
- **TMT scoring** — interaktiv forma faqat A qismini bajaradi; `bTime` null
  bo'lganda ball endi faqat A qismiga asoslanadi (ilgari B qismi uchun tekin
  60% kredit berilardi — bu ballarni sun'iy oshirardi).
- **Stroop / Audio** — hech narsa urinilmaganda (test darhol saqlansa) ball
  endi `0`, shishirilgan tezlik balli emas.

### Added
- TMT uchun **tugatish nisbati** (`completed/total`) — barcha nuqtalar
  ulanmasdan saqlangan test jazolanadi (forward-compat).
- Yangi statistik enginelar testlari (zero-attempt va Part-A-only holatlar) —
  jami **56** ta Vitest testi.

### Changed
- Prototip oynasi (`Sources/clinical_app`) so'nggi Claude Design (bundle 9)
  bilan sinxronlandi.

---

## Avvalgi muhim ishlar (qisqacha)

- **Production-readiness** — xavfsizlik sarlavhalari, env validatsiya
  (fail-fast), error/loading/not-found chegaralari, PWA manifest + robots,
  `/api/health`, FK indekslar, `DEPLOYMENT.md`.
- **Shifokor profili** — header chipidan profilni tahrirlash (ism, lavozim,
  klinika, telefon); `doctor_profile.title`/`phone`.
- **Test/trening seansidan chiqishda tasdiq** — saqlanmagan natija
  yo'qolishidan oldin ogohlantirish.
- **Reabilitatsiya** — 50 ta mashq (10 domen × 5) + adaptiv qiyinchilik.
- **Production DB** — RLS yoqilgan, eski CHECK olib tashlangan, 206 bemor +
  3039 test natijasi import qilingan.
