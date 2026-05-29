/**
 * Adaptiv qiyinchilik + mukofot dvigateli — kognitiv reabilitatsiya uchun.
 *
 * Qiyinchilik darajasi har bemor, har mashq uchun 1..MAX butun son. Har
 * seansdan keyin bola yaxshi bajarsa daraja oshadi, qiynalsa pasayadi — shunda
 * 12-seanslik protokol bola rivojlangani sari haqiqatdan ham qiyinlashadi
 * (M-4 davolash samaradorligini o'lchash uchun klinik jihatdan zarur).
 *
 * Bu yerda daraja bemorning trening tarixidan (har seans aniqligi) hosil
 * qilinadi — DB sxemasiga qo'shimcha ustun shart emas.
 */

import type { ExerciseConfig, ExerciseMeta } from "./meta";

export const MAX_LEVEL = 6;
export const MIN_LEVEL = 1;
export const DAILY_GOAL = 3;

export const LEVEL_NAMES = [
  "",
  "Boshlang'ich",
  "Oson",
  "O'rta",
  "Yaxshi",
  "Qiyin",
  "Usta",
] as const;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

/**
 * Oldingi daraja va so'nggi seans aniqligidan keyingi darajani hisoblaydi.
 *   aniqlik ≥ 0.85 → +1   (o'zlashtirildi, qiyinlashtirish)
 *   aniqlik < 0.50 → −1   (qiynalmoqda, yengillashtirish)
 *   aks holda      → o'zgarmaydi
 */
export function nextLevel(current: number, accuracy: number | null): number {
  let lvl = current;
  if (accuracy != null) {
    if (accuracy >= 0.85) lvl += 1;
    else if (accuracy < 0.5) lvl -= 1;
  }
  return clamp(lvl, MIN_LEVEL, MAX_LEVEL);
}

/**
 * Bemorning shu mashq bo'yicha tarixidan joriy qiyinchilik darajasini
 * hosil qiladi. accuracyHistory — vaqt tartibida (eski → yangi), 0–1 oraliqda.
 */
export function deriveLevel(accuracyHistory: number[]): number {
  let lvl = MIN_LEVEL;
  for (const acc of accuracyHistory) lvl = nextLevel(lvl, acc);
  return clamp(lvl, MIN_LEVEL, MAX_LEVEL);
}

/**
 * Mashq config'ini bemor darajasiga moslab kengaytiradi. YANGI obyekt
 * qaytaradi (meta'ni o'zgartirmaydi). Har knob mantiqiy chegaralarga qisiladi.
 */
export function adaptExercise(meta: ExerciseMeta, level: number): ExerciseMeta {
  const lvl = clamp(level, MIN_LEVEL, MAX_LEVEL);
  const step = lvl - 1; // 0..5
  const cfg: ExerciseConfig = { ...(meta.config ?? {}) };

  if (cfg.rounds != null) cfg.rounds = clamp(cfg.rounds + step * 2, 8, 40);
  if (cfg.timeout != null) cfg.timeout = clamp(cfg.timeout - step * 350, 1800, 12000);
  if (cfg.startLen != null) cfg.startLen = clamp(cfg.startLen + Math.floor(step / 2), 2, 9);
  if (cfg.maxLen != null) cfg.maxLen = clamp(cfg.maxLen + Math.ceil(step / 2), 4, 12);
  if (typeof cfg.pairs === "number") cfg.pairs = clamp(cfg.pairs + Math.floor(step / 2), 4, 12);
  if (cfg.cycles != null) cfg.cycles = clamp(cfg.cycles + step, 3, 12);
  if (cfg.showMs != null) cfg.showMs = clamp(cfg.showMs - step * 80, 350, 1400);

  return { ...meta, config: cfg, _level: lvl };
}

// ----- Mukofotlar -----

/** Yulduzlar (1..3) — aniqlikdan. */
export function stars(accuracy: number | null): 1 | 2 | 3 {
  if (accuracy == null) return 1;
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  return 1;
}

/** Rag'batlantiruvchi xabar (uz) — hech qachon kamsitmaydi. */
export function encourage(accuracy: number | null): string {
  if (accuracy == null) return "Mashqni yakunlading — barakalla!";
  if (accuracy >= 0.9) return "Ajoyib! Deyarli xatosiz bajarding!";
  if (accuracy >= 0.7) return "Zo'r ish! Tobora yaxshi bo'lyapsan.";
  if (accuracy >= 0.5) return "Yaxshi harakat! Mashq qilgan sari oson bo'ladi.";
  return "Mashqni oxirigacha bajarding — bu eng muhimi. Davom et!";
}

/** Bugun bajarilgan seanslar soni. */
export function todayCount(completedAtList: string[], today: string): number {
  return completedAtList.filter((c) => (c || "").slice(0, 10) === today).length;
}

/** Kun bo'yicha streak: ketma-ket kunlar soni. */
export function computeStreak(daysDescending: string[]): number {
  if (!daysDescending.length) return 0;
  const uniq = Array.from(new Set(daysDescending.map((d) => d.slice(0, 10)))).sort((a, b) =>
    a < b ? 1 : -1,
  );
  let streak = 1;
  for (let i = 1; i < uniq.length; i++) {
    const prev = uniq[i - 1];
    const cur = uniq[i];
    if (!prev || !cur) break;
    const diff = Math.round((new Date(prev).getTime() - new Date(cur).getTime()) / 86_400_000);
    if (diff === 1) streak += 1;
    else break;
  }
  return streak;
}
