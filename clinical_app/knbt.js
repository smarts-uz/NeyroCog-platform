// ===================================================================
// KNBT — Kognitiv-Neyrobiologik Test scoring engine
//
// Excel "Dataset ALL.xlsx" asosida qurilgan. Har bir test uchun:
//   1) raw → CogScore (0–100)
//   2) CogScore → Cognitive Health label
//   3) CogScore → Z-Score (population mean/sd)
//   4) Z-Score ≤ -1.96 → ISPOCD (significant cognitive impairment)
//   5) Z-Change between timepoints → Interpretation
//
// Composite (KNBT) darajada:
//   - Composite CogScore = AVERAGE(Stroop, TMT, DST, LMWT, NS)
//   - Composite Z-Score  = standardize against population
//   - Composite ISPOCD   = ≥2 of 4 core tests (Stroop/TMT/DST/LMWT) ISPOCD
//
// Bu modul to'liq pure-JS — React'siz, DOM'siz.
// ===================================================================

(function (root) {
  "use strict";

  // ---------- Labels ----------
  const COG_LABELS = [
    { min: 90, max: 101, label: "A'lo",            tone: "great"   },
    { min: 80, max:  90, label: "Yaxshi",          tone: "good"    },
    { min: 70, max:  80, label: "O'rtacha",        tone: "ok"      },
    { min: 60, max:  70, label: "Pastroq",         tone: "warn"    },
    { min: 50, max:  60, label: "Past",            tone: "warn"    },
    { min: 40, max:  50, label: "Juda past",       tone: "bad"     },
    { min:  0, max:  40, label: "Jiddiy buzilish", tone: "bad"     },
  ];

  function cogLabel(score) {
    if (score == null || isNaN(score)) return { label: "—", tone: "neutral" };
    for (const b of COG_LABELS) if (score >= b.min && score < b.max) return b;
    return COG_LABELS[COG_LABELS.length - 1];
  }

  // ---------- Z-change interpretation ----------
  // Symmetric thresholds (Excel ZCHANGE_LABEL approximation):
  //   ≥ +1.96  → Kuchli yaxshilanish
  //   ≥ +1.0   → Sezilarli yaxshilanish
  //   between  → Sezilarli o'zgarish yo'q
  //   ≤ -1.0   → Sezilarli yomonlashuv
  //   ≤ -1.96  → Kuchli yomonlashuv
  function interpretZChange(z) {
    if (z == null || isNaN(z)) return { label: "—", tone: "neutral" };
    if (z >= 1.96)  return { label: "Kuchli yaxshilanish",      tone: "great" };
    if (z >= 1.0)   return { label: "Sezilarli yaxshilanish",   tone: "good"  };
    if (z >  -1.0)  return { label: "Sezilarli o'zgarish yo'q", tone: "ok"    };
    if (z >  -1.96) return { label: "Sezilarli yomonlashuv",    tone: "warn"  };
    return                  { label: "Kuchli yomonlashuv",      tone: "bad"   };
  }

  // ---------- Z-score ----------
  function zScore(value, mean, sd) {
    if (value == null || isNaN(value) || !sd || sd === 0) return null;
    return (value - mean) / sd;
  }

  function isISPOCD(z) {
    return z != null && !isNaN(z) && z <= -1.96;
  }

  // ---------- Reference normative populations (per test, per timepoint) ----------
  // Excel App!$B$675 ko'rsatkichlari asosida (Composite + per-test). Soddalashtirilgan:
  // Population mean ~75, sd ~12. Real klinik foydalanishda haqiqiy datasetdan
  // qayta hisoblang.
  const NORM = {
    Stroop: { PreOp:{m:80, sd:10}, PostOp:{m:60, sd:12}, PostTx:{m:75, sd:11} },
    TMT:    { PreOp:{m:78, sd:11}, PostOp:{m:58, sd:13}, PostTx:{m:72, sd:12} },
    DST:    { PreOp:{m:76, sd:10}, PostOp:{m:60, sd:12}, PostTx:{m:73, sd:11} },
    LMWT:   { PreOp:{m:75, sd:11}, PostOp:{m:55, sd:14}, PostTx:{m:72, sd:12} },
    NS:     { PreOp:{m:82, sd: 8}, PostOp:{m:72, sd:10}, PostTx:{m:80, sd: 9} },
    EEG:    { PreOp:{m:78, sd: 9}, PostOp:{m:72, sd:10}, PostTx:{m:80, sd: 9} },
    Audio:  { PreOp:{m:80, sd:10}, PostOp:{m:68, sd:12}, PostTx:{m:76, sd:11} },
    Composite: { PreOp:{m:78, sd:8}, PostOp:{m:62, sd:10}, PostTx:{m:75, sd:9} },
  };

  // ---------- Per-test CogScore computation ----------
  // Har bir test xom javoblar → 0–100 score.
  // Yosh tuzatishi: 8 yoshdan kichik bemorlar uchun +5, 16 yoshdan katta uchun -3.
  function ageAdjust(score, age) {
    if (age == null) return score;
    if (age <= 8)  return Math.min(100, score + 5);
    if (age >= 16) return Math.max(0,   score - 3);
    return score;
  }

  // ----- Stroop -----
  // raw = { correct, errors, skipped, totalTimeSec, totalTrials }
  function stroopCogScore(raw, patient) {
    if (!raw || raw.correct == null) return null;
    const n = raw.totalTrials || 40;
    // Nothing attempted (e.g. saved immediately) → 0, not an inflated speed score.
    const attempted = (raw.correct || 0) + (raw.errors || 0) + (raw.skipped || 0);
    if (attempted === 0) return 0;
    const accuracy = raw.correct / n;
    const skipPct  = (raw.skipped || 0) / n;
    const avgRT    = raw.totalTimeSec / n;
    // Speed component: 1.0s/trial → 100%, 4.0s/trial → 0%
    const speed = Math.max(0, Math.min(1, (4 - avgRT) / 3));
    // Combine: 60% accuracy, 30% speed, 10% no-skip
    const score = (accuracy * 0.6 + speed * 0.3 + (1 - skipPct) * 0.1) * 100;
    return ageAdjust(round1(score), patient?.yosh);
  }

  // ----- TMT -----
  // raw = { aTime, aErrors, bTime, bErrors, completed, total }
  // Lower time = better. Reference: A ≈ 30s, B ≈ 75s.
  // NOTE: our interactive form runs Part A only — when bTime is null the score is
  // based purely on Part A (no free credit). Incomplete trails (saved early) are
  // scaled by the completion ratio so abandoning the test cannot yield a high score.
  function tmtCogScore(raw, patient) {
    if (!raw || raw.aTime == null) return null;
    const aRef = 30, bRef = 75;
    const aPct = Math.max(0, Math.min(1, (aRef * 2 - raw.aTime) / aRef));
    const errPenalty = Math.min(0.3, ((raw.aErrors || 0) + (raw.bErrors || 0)) * 0.03);
    let base;
    if (raw.bTime != null) {
      const bPct = Math.max(0, Math.min(1, (bRef * 2 - raw.bTime) / bRef));
      base = (aPct * 0.4 + bPct * 0.6) * 100 - errPenalty * 100;
    } else {
      base = aPct * 100 - errPenalty * 100;
    }
    // Completion ratio: a trail saved before all nodes are connected is penalised.
    const ratio = (raw.completed != null && raw.total)
      ? Math.max(0, Math.min(1, raw.completed / raw.total))
      : 1;
    return ageAdjust(round1(Math.max(0, base) * ratio), patient?.yosh);
  }

  // ----- DST -----
  // raw = { forward, backward }  — span lengths (3–9 forward, 2–8 backward typically)
  function dstCogScore(raw, patient) {
    if (!raw || raw.forward == null) return null;
    const total = (raw.forward || 0) + (raw.backward || 0);
    // Ideal total ~14 (8 forward + 6 backward). Min ~5.
    const score = Math.max(0, Math.min(100, ((total - 4) / 10) * 100));
    return ageAdjust(round1(score), patient?.yosh);
  }

  // ----- LMWT -----
  // raw = { v1, v2, v3, v4, v5, vDelay }  — Rey AVLT-style word recall counts (0–15 each)
  function lmwtCogScore(raw, patient) {
    if (!raw || raw.v1 == null) return null;
    const trials = [raw.v1, raw.v2, raw.v3, raw.v4, raw.v5].map(v => v || 0);
    const learning = trials.reduce((a, b) => a + b, 0); // 0–75
    const delay = raw.vDelay || 0; // 0–15
    // 70% learning total, 30% delayed recall
    const score = (learning / 75) * 70 + (delay / 15) * 30;
    return ageAdjust(round1(score), patient?.yosh);
  }

  // ----- NS (Neurological scoring) -----
  // raw = { mrc, dtr, icars, etdrs, pta, dhi, omf, fois, fda, psqi, cn, asa }
  // Each is 0–N (see Excel). We compute total / max.
  const NS_MAX = { mrc:5, dtr:4, icars:10, etdrs:10, pta:10, dhi:4, omf:6, fois:4, fda:10, psqi:10, cn:12, asa:10 };
  const NS_MAX_TOTAL = Object.values(NS_MAX).reduce((a, b) => a + b, 0); // 95
  function nsCogScore(raw, patient) {
    if (!raw) return null;
    let total = 0, hasAny = false;
    for (const k of Object.keys(NS_MAX)) {
      if (raw[k] != null && !isNaN(raw[k])) { total += +raw[k]; hasAny = true; }
    }
    if (!hasAny) return null;
    const score = (total / NS_MAX_TOTAL) * 100;
    return ageAdjust(round1(score), patient?.yosh);
  }

  // ----- EEG -----
  // raw = { alphaAmp, thetaAmp, ihaAlpha, swiAnt, alphaPost, iaf, thetaAlpha }
  // Simplified: weighted normalization of each channel.
  function eegCogScore(raw, patient) {
    if (!raw || raw.alphaAmp == null) return null;
    // Target ranges from Excel norms (children/teens):
    //   alphaAmp 20–40 μV → linear 0–1
    //   thetaAmp <20 μV good, >40 bad → inverted
    //   ihaAlpha 0–15% good (symmetric)
    //   alphaPost 25–60% good
    //   iaf 8–12 Hz good
    const aA = clamp((raw.alphaAmp - 5) / 30, 0, 1);
    const tA = 1 - clamp((raw.thetaAmp - 10) / 40, 0, 1);
    const iha = 1 - clamp((Math.abs(raw.ihaAlpha || 0) - 5) / 25, 0, 1);
    const aP = clamp(((raw.alphaPost || 30) - 10) / 50, 0, 1);
    const iaf = 1 - clamp(Math.abs((raw.iaf || 10) - 10) / 4, 0, 1);
    const score = (aA * 0.25 + tA * 0.25 + iha * 0.15 + aP * 0.2 + iaf * 0.15) * 100;
    return round1(score);
  }

  // ----- Audio -----
  // raw = { correct, errors, totalTimeSec, totalTrials = 30 }
  function audioCogScore(raw, patient) {
    if (!raw || raw.correct == null) return null;
    const n = raw.totalTrials || 30;
    // Nothing attempted → 0, not an inflated speed score.
    const attempted = (raw.correct || 0) + (raw.errors || 0);
    if (attempted === 0) return 0;
    const accuracy = raw.correct / n;
    const avgRT = raw.totalTimeSec / n;
    const speed = Math.max(0, Math.min(1, (8 - avgRT) / 7));
    const errPenalty = Math.min(0.3, (raw.errors || 0) * 0.02);
    const score = (accuracy * 0.7 + speed * 0.3) * 100 - errPenalty * 100;
    return ageAdjust(round1(Math.max(0, score)), patient?.yosh);
  }

  // ---------- Master dispatcher ----------
  function computeCogScore(testName, raw, patient) {
    switch (testName) {
      case "Stroop": return stroopCogScore(raw, patient);
      case "TMT":    return tmtCogScore(raw, patient);
      case "DST":    return dstCogScore(raw, patient);
      case "LMWT":   return lmwtCogScore(raw, patient);
      case "NS":     return nsCogScore(raw, patient);
      case "EEG":    return eegCogScore(raw, patient);
      case "Audio":  return audioCogScore(raw, patient);
      default: return null;
    }
  }

  // ---------- Full per-test pipeline ----------
  // results = { TMT: { raw:{}, timepoint:"PreOp" }, Stroop: {...}, ... }
  // returns per-test summary with score, label, z, ispcd.
  function summarizeTest(testName, raw, timepoint, patient) {
    const cog = computeCogScore(testName, raw, patient);
    const label = cogLabel(cog);
    const norm = NORM[testName]?.[timepoint] || NORM[testName]?.PreOp || { m: 75, sd: 12 };
    const z = zScore(cog, norm.m, norm.sd);
    return {
      cogScore: cog,
      cognitiveHealth: label.label,
      tone: label.tone,
      zScore: z,
      ispcd: isISPOCD(z),
      timepoint,
      normRef: norm,
    };
  }

  // ---------- Composite (KNBT) ----------
  // tests = { Stroop: summary, TMT: summary, ... }  (each from summarizeTest)
  function summarizeComposite(tests, timepoint) {
    const core = ["Stroop", "TMT", "DST", "LMWT"];
    const fifth = ["NS"];
    const extra = ["EEG", "Audio"];

    const coreScores = core
      .map(t => tests[t]?.cogScore)
      .filter(s => s != null);
    if (coreScores.length === 0) return null;

    const allCoreScores = [...core, ...fifth]
      .map(t => tests[t]?.cogScore)
      .filter(s => s != null);

    const composite = allCoreScores.reduce((a, b) => a + b, 0) / allCoreScores.length;
    const label = cogLabel(composite);
    const norm = NORM.Composite[timepoint] || NORM.Composite.PreOp;
    const z = zScore(composite, norm.m, norm.sd);

    // ISPOCD: ≥2 of 4 core tests individually ISPOCD
    const ispcdCount = core.filter(t => tests[t]?.ispcd).length;
    const composite_ispcd = ispcdCount >= 2;

    return {
      compositeScore: round1(composite),
      cognitiveHealth: label.label,
      tone: label.tone,
      zScore: z,
      ispcd: composite_ispcd,
      ispcdCount,
      ispcdRequired: 2,
      includedTests: allCoreScores.length,
      timepoint,
    };
  }

  // ---------- Test metadata (for UI rendering) ----------
  const TEST_META = {
    Stroop: { name: "Stroop Test", short: "Stroop", icon: "type",
              desc: "Diqqatni boshqarish va interferensiyani yengish.",
              duration: "5–7 daq", color: "#D97706", soft: "#FEF3C7" },
    TMT:    { name: "Trail Making Test", short: "TMT", icon: "git-branch",
              desc: "Vizual qidiruv va kognitiv moslashuvchanlik.",
              duration: "3–5 daq", color: "#0F766E", soft: "#CCFBF1" },
    DST:    { name: "Digit Span Test", short: "DST", icon: "list-ordered",
              desc: "Qisqa muddatli va ishchi xotira.",
              duration: "4–6 daq", color: "#2563EB", soft: "#DBEAFE" },
    LMWT:   { name: "Lurya Memory Word Test", short: "LMWT", icon: "book-open",
              desc: "Eshitish-og'zaki o'rganish va xotira (Rey AVLT).",
              duration: "10–15 daq", color: "#9333EA", soft: "#F3E8FF" },
    NS:     { name: "Nevrologik holatni baholash", short: "NS", icon: "stethoscope",
              desc: "12 ta nevrologik shkala (MRC, DTR, ICARS, …).",
              duration: "10–15 daq", color: "#0891B2", soft: "#CFFAFE" },
    EEG:    { name: "EEG ko'rsatkichlari", short: "EEG", icon: "activity",
              desc: "Alfa, teta ritmi va asimmetriya indekslari.",
              duration: "Asbob orqali", color: "#DB2777", soft: "#FCE7F3" },
    Audio:  { name: "Audio diqqat testi", short: "Audio", icon: "ear",
              desc: "Tovushlarni ajratish, diqqat va reaksiya.",
              duration: "5–7 daq", color: "#16A34A", soft: "#DCFCE7" },
  };

  // ---------- Helpers ----------
  function round1(n) { return n == null ? null : Math.round(n * 10) / 10; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ---------- Export ----------
  root.KNBT = {
    cogLabel, interpretZChange, zScore, isISPOCD,
    computeCogScore, summarizeTest, summarizeComposite,
    NORM, TEST_META, NS_MAX,
    COG_LABELS,
  };
})(window);
