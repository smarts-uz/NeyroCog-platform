/**
 * Statistik tahlil engine (TypeScript port).
 *
 * Manba: Statistics M-1 / M-2 / M-4 Excel formulalari.
 * Pure functions, tashqi kutubxonasiz.
 */

// ─── Asosiy yordamchi funksiyalar ─────────────────────────────
export const mean = (a: number[]): number =>
  a.length ? a.reduce((s, x) => s + x, 0) / a.length : Number.NaN;

export const variance = (a: number[], sample = true): number => {
  if (a.length < 2) return Number.NaN;
  const m = mean(a);
  const ss = a.reduce((s, x) => s + (x - m) * (x - m), 0);
  return ss / (a.length - (sample ? 1 : 0));
};

export const sd = (a: number[], sample = true): number => Math.sqrt(variance(a, sample));

export const sum = (a: number[]): number => a.reduce((s, x) => s + x, 0);

// ─── erf approximation (Abramowitz & Stegun) ──────────────────
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

export const normCDF = (z: number): number => 0.5 * (1 + erf(z / Math.SQRT2));
export const pFromZ = (z: number): number => 2 * (1 - normCDF(Math.abs(z)));

function betaCDFApprox(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return pFromZ(Math.sqrt(x * 100));
}

export function pFromT(t: number, df: number): number {
  if (df > 30) return pFromZ(t);
  const x = df / (df + t * t);
  return betaCDFApprox(x);
}

// ─── Pearson correlation ──────────────────────────────────────
export interface PearsonResult {
  r: number;
  t: number;
  df: number;
  p: number;
  n: number;
}

export function pearson(x: number[], y: number[]): PearsonResult | null {
  const n = Math.min(x.length, y.length);
  if (n < 3) return null;
  const xs = x.slice(0, n);
  const ys = y.slice(0, n);
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const xi = xs[i] ?? 0;
    const yi = ys[i] ?? 0;
    num += (xi - mx) * (yi - my);
    dx2 += (xi - mx) ** 2;
    dy2 += (yi - my) ** 2;
  }
  const r = num / Math.sqrt(dx2 * dy2);
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  const p = pFromT(t, n - 2);
  return { r, t, df: n - 2, p, n };
}

// ─── Paired t-test ────────────────────────────────────────────
export interface PairedTResult {
  meanDiff: number;
  sd: number;
  t: number;
  df: number;
  p: number;
  n: number;
  cohen_d: number;
}

export function pairedT(pre: number[], post: number[]): PairedTResult | null {
  const n = Math.min(pre.length, post.length);
  if (n < 2) return null;
  const diffs: number[] = [];
  for (let i = 0; i < n; i++) diffs.push((post[i] ?? 0) - (pre[i] ?? 0));
  const md = mean(diffs);
  const sdd = sd(diffs);
  const se = sdd / Math.sqrt(n);
  const t = md / se;
  const df = n - 1;
  const p = pFromT(t, df);
  const cohen_d = md / sdd;
  return { meanDiff: md, sd: sdd, t, df, p, n, cohen_d };
}

// ─── Two-sample (Welch) t-test ────────────────────────────────
export interface WelchTResult {
  meanA: number;
  meanB: number;
  t: number;
  df: number;
  p: number;
  n: number;
  cohen_d: number;
}

export function welchT(a: number[], b: number[]): WelchTResult | null {
  const na = a.length;
  const nb = b.length;
  if (na < 2 || nb < 2) return null;
  const ma = mean(a);
  const mb = mean(b);
  const va = variance(a);
  const vb = variance(b);
  const se = Math.sqrt(va / na + vb / nb);
  const t = (ma - mb) / se;
  const df = (va / na + vb / nb) ** 2 / ((va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1));
  const p = pFromT(t, df);
  const pooled_sd = Math.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2));
  const cohen_d = (ma - mb) / pooled_sd;
  return { meanA: ma, meanB: mb, t, df, p, n: na + nb, cohen_d };
}

// ─── Chi-square (2×2) ─────────────────────────────────────────
export interface Chi2Result {
  chi2: number;
  df: number;
  p: number;
  or: number;
  cramersV: number;
  n: number;
}

export function chi2_2x2(a: number, b: number, c: number, d: number): Chi2Result | null {
  const n = a + b + c + d;
  if (n === 0) return null;
  const row1 = a + b;
  const row2 = c + d;
  const col1 = a + c;
  const col2 = b + d;
  const e11 = (row1 * col1) / n;
  const e12 = (row1 * col2) / n;
  const e21 = (row2 * col1) / n;
  const e22 = (row2 * col2) / n;
  const chi2 =
    (a - e11) ** 2 / e11 + (b - e12) ** 2 / e12 + (c - e21) ** 2 / e21 + (d - e22) ** 2 / e22;
  const p = 1 - chi2CDF(chi2, 1);
  const or = (a * d) / (b * c);
  const v = Math.sqrt(chi2 / n);
  return { chi2, df: 1, p, or, cramersV: v, n };
}

export function chi2CDF(x: number, df: number): number {
  if (df === 1) {
    return 1 - 2 * (1 - normCDF(Math.sqrt(x)));
  }
  return 1 - normCDF((Math.cbrt(x / df) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df)));
}

// ─── Welch ANOVA ─────────────────────────────────────────────
export interface WelchANOVAResult {
  F: number;
  df1: number;
  df2: number;
  p: number;
  k: number;
}

export function welchANOVA(groups: number[][]): WelchANOVAResult | null {
  const k = groups.length;
  if (k < 2) return null;
  const ms = groups.map(mean);
  const vs = groups.map((g) => variance(g));
  const ns = groups.map((g) => g.length);
  const ws = ns.map((n, i) => n / (vs[i] ?? 1));
  const W = sum(ws);
  const grandMean = sum(ws.map((w, i) => w * (ms[i] ?? 0))) / W;
  const num = sum(ws.map((w, i) => w * ((ms[i] ?? 0) - grandMean) ** 2)) / (k - 1);
  const den_inner = sum(ns.map((n, i) => (1 - (ws[i] ?? 0) / W) ** 2 / (n - 1)));
  const F = num / (1 + ((2 * (k - 2)) / (k ** 2 - 1)) * den_inner);
  const df1 = k - 1;
  const df2 = (k ** 2 - 1) / (3 * den_inner);
  const p = pFromF(F, df1);
  return { F, df1, df2, p, k };
}

function pFromF(F: number, df1: number): number {
  if (!Number.isFinite(F) || F <= 0) return 1;
  const x = df1 * F;
  return Math.max(0, Math.min(1, 1 - chi2CDF(x, df1)));
}

// ─── ROC curve & AUC ─────────────────────────────────────────
export interface ROCPoint {
  tpr: number;
  fpr: number;
  threshold: number;
}

export interface ROCResult {
  points: ROCPoint[];
  auc: number;
  se: number;
  p: number;
  ci95: [number, number];
  n: number;
  pos: number;
  neg: number;
  youden: { sens: number; spec: number; cutoff: number | null; J: number };
  direction: "low" | "high";
}

export function rocCurve(
  scores: number[],
  labels: number[],
  direction: "low" | "high" = "low",
): ROCResult | null {
  const data = scores
    .map((s, i) => ({ s, y: labels[i] ?? -1 }))
    .filter((d) => Number.isFinite(d.s) && (d.y === 0 || d.y === 1));

  if (direction === "low") data.sort((a, b) => a.s - b.s);
  else data.sort((a, b) => b.s - a.s);

  const pos = data.filter((d) => d.y === 1).length;
  const neg = data.filter((d) => d.y === 0).length;
  if (pos === 0 || neg === 0) return null;

  const start: ROCPoint = {
    tpr: 0,
    fpr: 0,
    threshold: direction === "low" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  };
  const points: ROCPoint[] = [start];
  let tp = 0;
  let fp = 0;
  let prev: number | null = null;
  let youdenMax = -1;
  let youdenPoint: { tpr: number; fpr: number } = { tpr: 0, fpr: 0 };
  let youdenCutoff: number | null = null;

  for (const d of data) {
    if (prev != null && d.s !== prev) {
      const tpr = tp / pos;
      const fpr = fp / neg;
      points.push({ tpr, fpr, threshold: d.s });
      const youden = tpr - fpr;
      if (youden > youdenMax) {
        youdenMax = youden;
        youdenPoint = { tpr, fpr };
        youdenCutoff = d.s;
      }
    }
    if (d.y === 1) tp++;
    else fp++;
    prev = d.s;
  }
  points.push({
    tpr: 1,
    fpr: 1,
    threshold: direction === "low" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY,
  });

  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    const cur = points[i];
    const prevPt = points[i - 1];
    if (!cur || !prevPt) continue;
    auc += 0.5 * (cur.fpr - prevPt.fpr) * (cur.tpr + prevPt.tpr);
  }

  const Q1 = auc / (2 - auc);
  const Q2 = (2 * auc ** 2) / (1 + auc);
  const se = Math.sqrt(
    (auc * (1 - auc) + (pos - 1) * (Q1 - auc ** 2) + (neg - 1) * (Q2 - auc ** 2)) / (pos * neg),
  );
  const z = (auc - 0.5) / se;
  const p = pFromZ(z);
  const ci95: [number, number] = [Math.max(0, auc - 1.96 * se), Math.min(1, auc + 1.96 * se)];

  return {
    points,
    auc,
    se,
    p,
    ci95,
    n: pos + neg,
    pos,
    neg,
    youden: {
      sens: youdenPoint.tpr,
      spec: 1 - youdenPoint.fpr,
      cutoff: youdenCutoff,
      J: youdenMax,
    },
    direction,
  };
}

// ─── Confusion matrix at threshold ───────────────────────────
export interface ConfusionMatrix {
  TP: number;
  FP: number;
  TN: number;
  FN: number;
  sens: number;
  spec: number;
  ppv: number;
  npv: number;
  acc: number;
}

export function confusionMatrix(
  scores: number[],
  labels: number[],
  threshold: number,
  direction: "low" | "high" = "low",
): ConfusionMatrix {
  let TP = 0;
  let FP = 0;
  let TN = 0;
  let FN = 0;
  for (let i = 0; i < scores.length; i++) {
    const score = scores[i] ?? 0;
    const label = labels[i] ?? 0;
    const pred = direction === "low" ? score <= threshold : score >= threshold;
    if (pred && label === 1) TP++;
    else if (pred && label === 0) FP++;
    else if (!pred && label === 0) TN++;
    else if (!pred && label === 1) FN++;
  }
  const sens = TP / (TP + FN || 1);
  const spec = TN / (TN + FP || 1);
  const ppv = TP / (TP + FP || 1);
  const npv = TN / (TN + FN || 1);
  const acc = (TP + TN) / (TP + TN + FP + FN || 1);
  return { TP, FP, TN, FN, sens, spec, ppv, npv, acc };
}

// ─── Treatment effect helpers ─────────────────────────────────
export interface DeltaResult {
  deltas: number[];
  meanDelta: number;
  sdDelta: number;
  improvedCount: number;
  improvementRate: number;
}

export function deltaChange(postOp: number[], postTx: number[]): DeltaResult {
  const n = Math.min(postOp.length, postTx.length);
  const deltas: number[] = [];
  for (let i = 0; i < n; i++) deltas.push((postTx[i] ?? 0) - (postOp[i] ?? 0));
  return {
    deltas,
    meanDelta: mean(deltas),
    sdDelta: sd(deltas),
    improvedCount: deltas.filter((d) => d > 0).length,
    improvementRate: deltas.filter((d) => d > 0).length / n,
  };
}

export interface NNTResult {
  arr: number;
  nnt: number;
}

export function nnt(
  experimentalRecoveryRate: number,
  controlRecoveryRate: number,
): NNTResult | null {
  const arr = experimentalRecoveryRate - controlRecoveryRate;
  if (arr <= 0) return null;
  return { arr, nnt: 1 / arr };
}

export interface AncovaSimpleResult {
  adjustedMeanA: number;
  adjustedMeanB: number;
  diff: number;
  pUnadjusted: number;
  cohen_d: number;
}

export function ancovaSimple(
  groupA: { baseline: number[]; outcome: number[] },
  groupB: { baseline: number[]; outcome: number[] },
): AncovaSimpleResult | null {
  const m1 = welchT(groupA.outcome, groupB.outcome);
  if (!m1) return null;
  const b1 = mean(groupA.baseline);
  const b2 = mean(groupB.baseline);
  const adjA = m1.meanA - 0.5 * (b1 - (b1 + b2) / 2);
  const adjB = m1.meanB - 0.5 * (b2 - (b1 + b2) / 2);
  return {
    adjustedMeanA: adjA,
    adjustedMeanB: adjB,
    diff: adjA - adjB,
    pUnadjusted: m1.p,
    cohen_d: m1.cohen_d,
  };
}

// ─── DeLong test for two correlated ROC curves ────────────────
export interface DeLongResult {
  aucA: number;
  aucB: number;
  diff: number;
  seDiff: number;
  z: number;
  p: number;
  ci95: [number, number];
  nP: number;
  nN: number;
}

export function deLongTest(
  scoresA: number[],
  scoresB: number[],
  labels: number[],
  directionA: "low" | "high" = "low",
  directionB: "low" | "high" = "low",
): DeLongResult | null {
  const n = labels.length;
  const positives: number[] = [];
  const negatives: number[] = [];
  for (let i = 0; i < n; i++) {
    if (labels[i] === 1) positives.push(i);
    else if (labels[i] === 0) negatives.push(i);
  }
  const nP = positives.length;
  const nN = negatives.length;
  if (nP < 3 || nN < 3) return null;

  const psi = (xp: number, xn: number, dir: "low" | "high"): number => {
    if (dir === "low") {
      return xp < xn ? 1 : xp === xn ? 0.5 : 0;
    }
    return xp > xn ? 1 : xp === xn ? 0.5 : 0;
  };

  const computeV = (scores: number[], dir: "low" | "high") => {
    const V10 = positives.map((pi) => {
      let s = 0;
      for (const ni of negatives) s += psi(scores[pi] ?? 0, scores[ni] ?? 0, dir);
      return s / nN;
    });
    const V01 = negatives.map((ni) => {
      let s = 0;
      for (const pi of positives) s += psi(scores[pi] ?? 0, scores[ni] ?? 0, dir);
      return s / nP;
    });
    const auc = sum(V10) / nP;
    return { V10, V01, auc };
  };

  const A = computeV(scoresA, directionA);
  const B = computeV(scoresB, directionB);

  const cov2 = (xa: number[], xb: number[]) => {
    const mxa = mean(xa);
    const mxb = mean(xb);
    let s = 0;
    for (let i = 0; i < xa.length; i++) s += ((xa[i] ?? 0) - mxa) * ((xb[i] ?? 0) - mxb);
    return s / (xa.length - 1);
  };

  const S10_AA = cov2(A.V10, A.V10);
  const S10_BB = cov2(B.V10, B.V10);
  const S10_AB = cov2(A.V10, B.V10);
  const S01_AA = cov2(A.V01, A.V01);
  const S01_BB = cov2(B.V01, B.V01);
  const S01_AB = cov2(A.V01, B.V01);

  const varA = S10_AA / nP + S01_AA / nN;
  const varB = S10_BB / nP + S01_BB / nN;
  const covAB = S10_AB / nP + S01_AB / nN;

  const diff = A.auc - B.auc;
  const seDiff = Math.sqrt(varA + varB - 2 * covAB);
  if (seDiff <= 0 || !Number.isFinite(seDiff)) return null;
  const z = diff / seDiff;
  const p = pFromZ(z);
  const ci95: [number, number] = [diff - 1.96 * seDiff, diff + 1.96 * seDiff];

  return { aucA: A.auc, aucB: B.auc, diff, seDiff, z, p, ci95, nP, nN };
}

// ─── p-value formatting ───────────────────────────────────────
export function pFmt(p: number | null | undefined): string {
  if (p == null || Number.isNaN(p)) return "—";
  if (p < 0.001) return "p < 0.001";
  return `p = ${p.toFixed(3)}`;
}

export function pSignificance(p: number | null) {
  if (p == null) return null;
  if (p < 0.001) return { stars: "***", label: "Yuqori darajada ahamiyatli" };
  if (p < 0.01) return { stars: "**", label: "Ahamiyatli" };
  if (p < 0.05) return { stars: "*", label: "Marginal ahamiyatli" };
  return { stars: "ns", label: "Statistik ahamiyatli emas" };
}

// ─── Cohen's d interpretation ────────────────────────────────
export function cohenDInterpret(d: number) {
  const a = Math.abs(d);
  if (a < 0.2) return { label: "Juda kichik effekt", color: "var(--color-ink-3)" };
  if (a < 0.5) return { label: "Kichik effekt", color: "#2563EB" };
  if (a < 0.8) return { label: "O'rta effekt", color: "#D97706" };
  return { label: "Katta effekt", color: "#16A34A" };
}
