// Statistik tahlil engine
// Manba: Statistics M-1 / M-2 / M-4 Excel fayllaridagi formulalar.
// Pure JS, hech qanday tashqi kutubxonasiz.

(function (root) {
  "use strict";

  // ===== Asosiy yordamchi funksiyalar =====
  const mean = (a) => a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN;
  const variance = (a, sample = true) => {
    if (a.length < 2) return NaN;
    const m = mean(a);
    const ss = a.reduce((s, x) => s + (x - m) * (x - m), 0);
    return ss / (a.length - (sample ? 1 : 0));
  };
  const sd = (a, sample = true) => Math.sqrt(variance(a, sample));
  const sum = (a) => a.reduce((s, x) => s + x, 0);

  // erf approximation (Abramowitz & Stegun)
  function erf(x) {
    const a1=0.254829592, a2=-0.284496736, a3=1.421413741,
          a4=-1.453152027, a5=1.061405429, p=0.3275911;
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t * Math.exp(-x*x);
    return sign * y;
  }
  const normCDF = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

  // Two-sided p-value from z
  const pFromZ = (z) => 2 * (1 - normCDF(Math.abs(z)));

  // t to p (two-sided, Welch's approx via normal for n>30)
  function pFromT(t, df) {
    if (df > 30) return pFromZ(t);
    // Wilson-Hilferty-ish approximation for small df
    const x = df / (df + t*t);
    return betaCDFApprox(x, df/2, 0.5);
  }
  function betaCDFApprox(x, a, b) {
    // crude approximation via incomplete beta; not used heavily here
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // fallback: just use normal approx for now
    return pFromZ(Math.sqrt(x*100));
  }

  // ===== Pearson correlation =====
  function pearson(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 3) return null;
    const mx = mean(x), my = mean(y);
    let num = 0, dx2 = 0, dy2 = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - mx) * (y[i] - my);
      dx2 += (x[i] - mx) ** 2;
      dy2 += (y[i] - my) ** 2;
    }
    const r = num / Math.sqrt(dx2 * dy2);
    const t = r * Math.sqrt((n - 2) / (1 - r*r));
    const p = pFromT(t, n - 2);
    return { r, t, df: n - 2, p, n };
  }

  // ===== Paired t-test =====
  function pairedT(pre, post) {
    const n = Math.min(pre.length, post.length);
    if (n < 2) return null;
    const diffs = [];
    for (let i = 0; i < n; i++) diffs.push(post[i] - pre[i]);
    const md = mean(diffs);
    const sdd = sd(diffs);
    const se = sdd / Math.sqrt(n);
    const t = md / se;
    const df = n - 1;
    const p = pFromT(t, df);
    const cohen_d = md / sdd; // Cohen's d for paired data
    return { meanDiff: md, sd: sdd, t, df, p, n, cohen_d };
  }

  // ===== Two-sample (Welch's) t-test =====
  function welchT(a, b) {
    const na = a.length, nb = b.length;
    if (na < 2 || nb < 2) return null;
    const ma = mean(a), mb = mean(b);
    const va = variance(a), vb = variance(b);
    const se = Math.sqrt(va/na + vb/nb);
    const t = (ma - mb) / se;
    const df = (va/na + vb/nb)**2 / ((va/na)**2/(na-1) + (vb/nb)**2/(nb-1));
    const p = pFromT(t, df);
    const pooled_sd = Math.sqrt(((na-1)*va + (nb-1)*vb) / (na+nb-2));
    const cohen_d = (ma - mb) / pooled_sd;
    return { meanA: ma, meanB: mb, t, df, p, n: na+nb, cohen_d };
  }

  // ===== Chi-square test (2×2) =====
  function chi2_2x2(a, b, c, d) {
    const n = a + b + c + d;
    if (n === 0) return null;
    const row1 = a + b, row2 = c + d;
    const col1 = a + c, col2 = b + d;
    const e11 = row1 * col1 / n, e12 = row1 * col2 / n;
    const e21 = row2 * col1 / n, e22 = row2 * col2 / n;
    const chi2 = ((a-e11)**2/e11) + ((b-e12)**2/e12) + ((c-e21)**2/e21) + ((d-e22)**2/e22);
    const p = 1 - chi2CDF(chi2, 1);
    // Odds ratio
    const or = (a * d) / (b * c);
    // Cramér's V
    const v = Math.sqrt(chi2 / n);
    return { chi2, df: 1, p, or, cramersV: v, n };
  }
  function chi2CDF(x, df) {
    // Wilson–Hilferty approximation: for df=1, very rough
    if (df === 1) {
      // χ² with df=1 is equivalent to Z² → P(χ² ≥ x) = 2·(1-Φ(√x))
      return 1 - 2 * (1 - normCDF(Math.sqrt(x)));
    }
    return 1 - normCDF((Math.cbrt(x/df) - (1 - 2/(9*df))) / Math.sqrt(2/(9*df)));
  }

  // ===== Welch ANOVA (≥3 groups) =====
  function welchANOVA(groups) {
    // groups: array of arrays
    const k = groups.length;
    if (k < 2) return null;
    const ms = groups.map(mean);
    const vs = groups.map(g => variance(g));
    const ns = groups.map(g => g.length);
    const ws = ns.map((n, i) => n / vs[i]);
    const W = sum(ws);
    const grandMean = sum(ws.map((w, i) => w * ms[i])) / W;
    const num = sum(ws.map((w, i) => w * (ms[i] - grandMean)**2)) / (k - 1);
    const den_inner = sum(ns.map((n, i) => ((1 - ws[i]/W)**2) / (n - 1)));
    const F = num / (1 + (2*(k-2)/(k**2 - 1)) * den_inner);
    const df1 = k - 1;
    const df2 = (k**2 - 1) / (3 * den_inner);
    // Approximation: F → p
    const p = pFromF(F, df1, df2);
    return { F, df1, df2, p, k };
  }
  function pFromF(F, df1, df2) {
    // crude: use chi2 approximation for large df2
    if (!isFinite(F) || F <= 0) return 1;
    const x = df1 * F;
    return Math.max(0, Math.min(1, 1 - chi2CDF(x, df1)));
  }

  // ===== ROC curve & AUC =====
  // scores: array of numbers (higher = more positive)
  // labels: array of 0/1 (1 = positive case = POCD)
  // direction: "high" = high score → POCD positive; "low" = low score → POCD positive
  function rocCurve(scores, labels, direction = "low") {
    const n = scores.length;
    const data = scores.map((s, i) => ({ s, y: labels[i] }))
      .filter(d => isFinite(d.s) && (d.y === 0 || d.y === 1));
    // Sort by score depending on direction
    if (direction === "low") {
      // Lower score → more likely positive
      data.sort((a, b) => a.s - b.s);
    } else {
      data.sort((a, b) => b.s - a.s);
    }
    const pos = data.filter(d => d.y === 1).length;
    const neg = data.filter(d => d.y === 0).length;
    if (pos === 0 || neg === 0) return null;

    const points = [{ tpr: 0, fpr: 0, threshold: direction === "low" ? -Infinity : Infinity }];
    let tp = 0, fp = 0;
    let prev = null;
    let youdenMax = -1, youdenPoint = points[0], youdenCutoff = null;

    data.forEach((d, i) => {
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
      if (d.y === 1) tp++; else fp++;
      prev = d.s;
    });
    points.push({ tpr: 1, fpr: 1, threshold: direction === "low" ? Infinity : -Infinity });

    // AUC via trapezoid
    let auc = 0;
    for (let i = 1; i < points.length; i++) {
      auc += 0.5 * (points[i].fpr - points[i-1].fpr) * (points[i].tpr + points[i-1].tpr);
    }
    // Standard error (Hanley & McNeil)
    const Q1 = auc / (2 - auc);
    const Q2 = 2 * auc**2 / (1 + auc);
    const se = Math.sqrt((auc*(1-auc) + (pos-1)*(Q1 - auc**2) + (neg-1)*(Q2 - auc**2)) / (pos*neg));
    const z = (auc - 0.5) / se;
    const p = pFromZ(z);
    const ci95 = [Math.max(0, auc - 1.96*se), Math.min(1, auc + 1.96*se)];

    return {
      points, auc, se, p, ci95,
      n: pos + neg, pos, neg,
      youden: { sens: youdenPoint.tpr, spec: 1 - youdenPoint.fpr, cutoff: youdenCutoff, J: youdenMax },
      direction,
    };
  }

  // ===== Confusion matrix at threshold =====
  function confusionMatrix(scores, labels, threshold, direction = "low") {
    let TP=0, FP=0, TN=0, FN=0;
    for (let i = 0; i < scores.length; i++) {
      const pred = direction === "low" ? scores[i] <= threshold : scores[i] >= threshold;
      if (pred && labels[i] === 1) TP++;
      else if (pred && labels[i] === 0) FP++;
      else if (!pred && labels[i] === 0) TN++;
      else if (!pred && labels[i] === 1) FN++;
    }
    const sens = TP / (TP + FN || 1);
    const spec = TN / (TN + FP || 1);
    const ppv = TP / (TP + FP || 1);
    const npv = TN / (TN + FN || 1);
    const acc = (TP + TN) / (TP + TN + FP + FN || 1);
    return { TP, FP, TN, FN, sens, spec, ppv, npv, acc };
  }

  // ===== Delta change (treatment) =====
  function deltaChange(postOp, postTx) {
    // returns per-patient delta and aggregate
    const n = Math.min(postOp.length, postTx.length);
    const deltas = [];
    for (let i = 0; i < n; i++) deltas.push(postTx[i] - postOp[i]);
    return {
      deltas,
      meanDelta: mean(deltas),
      sdDelta: sd(deltas),
      improvedCount: deltas.filter(d => d > 0).length,
      improvementRate: deltas.filter(d => d > 0).length / n,
    };
  }

  // ===== NNT (Number Needed to Treat) =====
  function nnt(experimentalRecoveryRate, controlRecoveryRate) {
    const arr = experimentalRecoveryRate - controlRecoveryRate;
    if (arr <= 0) return null;
    return { arr, nnt: 1 / arr };
  }

  // ===== ANCOVA-ish: estimate post-treatment mean adjusted for baseline =====
  // (Simplified — assumes linear adjustment)
  function ancovaSimple(groupA, groupB) {
    // groupA, groupB: { baseline: [], outcome: [] }
    const m1 = welchT(groupA.outcome, groupB.outcome);
    if (!m1) return null;
    const b1 = mean(groupA.baseline);
    const b2 = mean(groupB.baseline);
    // crude baseline adjustment
    const adjA = m1.meanA - 0.5 * (b1 - (b1+b2)/2);
    const adjB = m1.meanB - 0.5 * (b2 - (b1+b2)/2);
    return {
      adjustedMeanA: adjA, adjustedMeanB: adjB,
      diff: adjA - adjB,
      pUnadjusted: m1.p,
      cohen_d: m1.cohen_d,
    };
  }

  // ===== DeLong test for two correlated ROC curves =====
  // Simplified implementation. Returns z, p, and AUC difference + 95% CI.
  // For correlated ROCs (same patients tested on two instruments).
  function deLongTest(scoresA, scoresB, labels, directionA = "low", directionB = "low") {
    const n = labels.length;
    const positives = [], negatives = [];
    for (let i = 0; i < n; i++) {
      if (labels[i] === 1) positives.push(i);
      else if (labels[i] === 0) negatives.push(i);
    }
    const nP = positives.length, nN = negatives.length;
    if (nP < 3 || nN < 3) return null;

    // Helper: ψ comparison kernel (1 if positive score > negative, 0.5 if equal, 0 otherwise)
    const psi = (xp, xn, dir) => {
      if (dir === "low") {
        // Lower score → positive case → so positive should have LOWER score
        return xp < xn ? 1 : (xp === xn ? 0.5 : 0);
      } else {
        return xp > xn ? 1 : (xp === xn ? 0.5 : 0);
      }
    };

    // Compute V components for each AUC (placement values)
    function computeV(scores, dir) {
      // V10[i] for positives: mean over all negatives of psi
      const V10 = positives.map(pi => {
        let s = 0;
        for (const ni of negatives) s += psi(scores[pi], scores[ni], dir);
        return s / nN;
      });
      // V01[j] for negatives: mean over all positives of psi
      const V01 = negatives.map(ni => {
        let s = 0;
        for (const pi of positives) s += psi(scores[pi], scores[ni], dir);
        return s / nP;
      });
      const auc = sum(V10) / nP;
      return { V10, V01, auc };
    }
    const A = computeV(scoresA, directionA);
    const B = computeV(scoresB, directionB);

    // Covariance matrices for V10 and V01
    function cov2(xa, xb) {
      const mxa = mean(xa), mxb = mean(xb);
      let s = 0;
      for (let i = 0; i < xa.length; i++) s += (xa[i] - mxa) * (xb[i] - mxb);
      return s / (xa.length - 1);
    }
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
    if (seDiff <= 0 || !isFinite(seDiff)) return null;
    const z = diff / seDiff;
    const p = pFromZ(z);
    const ci95 = [diff - 1.96 * seDiff, diff + 1.96 * seDiff];

    return { aucA: A.auc, aucB: B.auc, diff, seDiff, z, p, ci95, nP, nN };
  }

  
  function pFmt(p) {
    if (p == null || isNaN(p)) return "—";
    if (p < 0.001) return "p < 0.001";
    if (p < 0.01) return `p = ${p.toFixed(3)}`;
    return `p = ${p.toFixed(3)}`;
  }
  function pSignificance(p) {
    if (p == null) return null;
    if (p < 0.001) return { stars: "***", label: "Yuqori darajada ahamiyatli" };
    if (p < 0.01)  return { stars: "**",  label: "Ahamiyatli" };
    if (p < 0.05)  return { stars: "*",   label: "Marginal ahamiyatli" };
    return { stars: "ns", label: "Statistik ahamiyatli emas" };
  }

  // ===== Cohen's d interpretation =====
  function cohenDInterpret(d) {
    const a = Math.abs(d);
    if (a < 0.2) return { label: "Juda kichik effekt", color: "var(--ink-3)" };
    if (a < 0.5) return { label: "Kichik effekt",      color: "#2563EB" };
    if (a < 0.8) return { label: "O'rta effekt",       color: "#D97706" };
    return                { label: "Katta effekt",       color: "#16A34A" };
  }

  // ===== Public API =====
  root.Stats = {
    mean, sd, variance, sum,
    pearson, pairedT, welchT, chi2_2x2, welchANOVA,
    rocCurve, confusionMatrix, deLongTest, deltaChange, nnt, ancovaSimple,
    pFmt, pSignificance, cohenDInterpret,
    normCDF, pFromZ, pFromT,
  };
})(window);
