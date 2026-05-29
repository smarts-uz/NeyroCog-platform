// Adaptive difficulty + reward engine for cognitive rehab.
// Pure JS, loaded like knbt.js. No external deps.
//
// Difficulty is stored per patient per exercise in patient.adaptive[exerciseId]
// as an integer level 1..MAX. After each session the level steps up when the
// child does well and down when they struggle — so a 12-session protocol
// actually gets harder as the child improves (clinically essential for
// measuring M-4 treatment efficacy).

(function (root) {
  "use strict";

  const MAX_LEVEL = 6;
  const MIN_LEVEL = 1;

  // Read current difficulty level for an exercise (default 1)
  function getLevel(patient, exerciseId) {
    const a = (patient && patient.adaptive) || {};
    return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, a[exerciseId] || 1));
  }

  // Given last session accuracy, compute the next difficulty level.
  //   accuracy ≥ 0.85 → +1   (mastered, make it harder)
  //   accuracy < 0.50 → −1   (struggling, ease off)
  //   else            → same
  function nextLevel(current, accuracy) {
    let lvl = current;
    if (accuracy != null) {
      if (accuracy >= 0.85) lvl += 1;
      else if (accuracy < 0.50) lvl -= 1;
    }
    return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, lvl));
  }

  // Scale an exercise's config by the patient's difficulty level.
  // Returns a NEW exercise object (does not mutate meta).
  // The scaling is per-knob and clamped to sane bounds.
  function adaptExercise(meta, patient) {
    if (!meta) return meta;
    const lvl = getLevel(patient, meta.id);
    const step = lvl - 1; // 0..5
    const cfg = { ...(meta.config || {}) };

    // Generic knobs present across engines:
    if (cfg.rounds != null)  cfg.rounds  = clamp(cfg.rounds + step * 2, 8, 40);
    if (cfg.timeout != null) cfg.timeout = clamp(cfg.timeout - step * 350, 1800, 12000);
    if (cfg.startLen != null) cfg.startLen = clamp(cfg.startLen + Math.floor(step / 2), 2, 9);
    if (cfg.maxLen != null)   cfg.maxLen   = clamp(cfg.maxLen + Math.ceil(step / 2), 4, 12);
    if (cfg.pairs != null)    cfg.pairs    = clamp(cfg.pairs + Math.floor(step / 2), 4, 12);
    if (cfg.cycles != null)   cfg.cycles   = clamp(cfg.cycles + step, 3, 12);          // breathing
    if (cfg.showMs != null)   cfg.showMs   = clamp(cfg.showMs - step * 80, 350, 1400); // faster flash

    return { ...meta, config: cfg, _level: lvl };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }

  // ----- Rewards -----
  // Stars (1..3) from accuracy.
  function stars(accuracy) {
    if (accuracy == null) return 1;
    if (accuracy >= 0.9) return 3;
    if (accuracy >= 0.7) return 2;
    return 1;
  }

  // Encouraging message (uz), tuned to performance — never shaming.
  function message(accuracy) {
    if (accuracy == null) return "Mashqni yakunlading — barakalla!";
    if (accuracy >= 0.9)  return "Ajoyib! Deyarli xatosiz bajarding! 🌟";
    if (accuracy >= 0.7)  return "Zo'r ish! Tobora yaxshi bo'lyapsan.";
    if (accuracy >= 0.5)  return "Yaxshi harakat! Mashq qilgan sari oson bo'ladi.";
    return "Mashqni oxirigacha bajarding — bu eng muhimi. Davom et!";
  }

  // Day-based streak: returns updated { streak, lastDay }
  function bumpStreak(prev, todayStr) {
    const today = todayStr || new Date().toISOString().slice(0, 10);
    if (!prev || !prev.lastDay) return { streak: 1, lastDay: today };
    if (prev.lastDay === today) return prev; // already counted today
    // consecutive day?
    const d1 = new Date(prev.lastDay), d2 = new Date(today);
    const diffDays = Math.round((d2 - d1) / 86400000);
    return { streak: diffDays === 1 ? (prev.streak || 0) + 1 : 1, lastDay: today };
  }

  // Daily goal: how many sessions today vs target
  function todayCount(sessions, todayStr) {
    const today = todayStr || new Date().toISOString().slice(0, 10);
    return (sessions || []).filter(s => (s.completedAt || "").slice(0, 10) === today).length;
  }

  const LEVEL_NAMES = ["", "Boshlang'ich", "Oson", "O'rta", "Yaxshi", "Qiyin", "Usta"];

  root.KTT_ADAPT = {
    MAX_LEVEL, MIN_LEVEL,
    getLevel, nextLevel, adaptExercise,
    stars, message, bumpStreak, todayCount,
    LEVEL_NAMES,
    DAILY_GOAL: 3,
  };
})(window);
