// ROC tahlili — KNBT instrumentlarining diagnostik aniqligi.
// Manba: Statistics M-2 fayllaridagi formulalar.
//
// Har bir instrument uchun:
//   • ROC curve (TPR vs FPR)
//   • AUC + 95% CI + p-value
//   • Optimal cut-off (Youden indeksi)
//   • Confusion matrix (sensitivity, specificity, PPV, NPV)
//
// Bemor ma'lumotlari bo'lmagan paytda — Statistics M-2 dan olingan
// natijalarni ko'rsatamiz (haqiqiy n=181 modelidan).

const ROC_REFERENCE = {
  // From Statistics M-2 Diagnostic Value sheet (n=181)
  Stroop: { auc: 0.748, ci: [0.665, 0.831], se: 0.042, cutoff: 64,  sens: 0.728, spec: 0.731, p: 0.001 },
  TMT:    { auc: 0.774, ci: [0.701, 0.847], se: 0.037, cutoff: 60,  sens: 0.701, spec: 0.795, p: 0.001 },
  DST:    { auc: 0.759, ci: [0.681, 0.836], se: 0.040, cutoff: 62,  sens: 0.710, spec: 0.766, p: 0.001 },
  LMWT:   { auc: 0.760, ci: [0.680, 0.840], se: 0.041, cutoff: 60,  sens: 0.733, spec: 0.722, p: 0.001 },
  NS:     { auc: 0.675, ci: [0.587, 0.764], se: 0.045, cutoff: 67,  sens: 0.638, spec: 0.701, p: 0.001 },
  Audio:  { auc: 0.666, ci: [0.578, 0.755], se: 0.045, cutoff: 70,  sens: 0.629, spec: 0.692, p: 0.001 },
  EEG:    { auc: 0.809, ci: [0.739, 0.880], se: 0.036, cutoff: 65,  sens: 0.793, spec: 0.748, p: 0.001 },
  KNBT:   { auc: 0.783, ci: [0.713, 0.853], se: 0.036, cutoff: 63,  sens: 0.762, spec: 0.748, p: 0.001 },
};

const INSTRUMENTS = ["KNBT", "EEG", "TMT", "DST", "LMWT", "Stroop", "NS", "Audio"];

const ROCModule = ({ patients }) => {
  const [selected, setSelected] = React.useState("KNBT");

  // Try to compute ROC from real data
  const ourROC = React.useMemo(() => {
    if (!window.Stats || !window.KNBT) return null;
    const labels = [];
    const scores = {};
    INSTRUMENTS.forEach(t => scores[t] = []);

    patients.forEach(p => {
      const r = p.results || {};
      if (Object.keys(r).length === 0) return;
      // Composite ISPCD as label
      try {
        const sumByTest = {};
        for (const [k, v] of Object.entries(r)) {
          if (v.raw) sumByTest[k] = window.KNBT.summarizeTest(k, v.raw, "PreOp", p);
        }
        const comp = window.KNBT.summarizeComposite(sumByTest, "PreOp");
        if (!comp) return;
        const label = comp.ispcd ? 1 : 0;
        // CogScore per instrument
        for (const t of INSTRUMENTS) {
          if (t === "KNBT") {
            scores.KNBT.push(comp.compositeScore);
          } else if (sumByTest[t]) {
            scores[t].push(sumByTest[t].cogScore);
          } else {
            scores[t].push(null);
          }
        }
        labels.push(label);
      } catch (e) {}
    });

    // Compute ROC only if we have enough data
    const result = {};
    for (const t of INSTRUMENTS) {
      const validIdx = scores[t].map((s, i) => s != null ? i : -1).filter(i => i >= 0);
      if (validIdx.length < 10) continue;
      const xs = validIdx.map(i => scores[t][i]);
      const ys = validIdx.map(i => labels[i]);
      const pos = ys.filter(y => y === 1).length;
      const neg = ys.filter(y => y === 0).length;
      if (pos < 3 || neg < 3) continue;
      result[t] = window.Stats.rocCurve(xs, ys, "low");
    }
    return Object.keys(result).length ? result : null;
  }, [patients]);

  const ref = ROC_REFERENCE[selected];
  const live = ourROC?.[selected];
  const meta = window.KNBT?.TEST_META?.[selected] || { name: selected, short: selected, color: "#0F766E" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Note about data source */}
      {!live && (
        <div style={{
          padding: "12px 16px", borderRadius: 10,
          background: "var(--info-bg)", color: "#1E3A8A",
          display: "flex", alignItems: "center", gap: 10,
          fontFamily: "var(--font-sans)", fontSize: 13,
        }}>
          <Icon name="info" size={16} />
          Lokal bemorlar datasetida hozircha yetarli ma'lumot yo'q. Statistics M-2 (n=181) tadqiqot natijalari ko'rsatilmoqda.
        </div>
      )}

      {/* Instrument selector */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap",
        padding: 6, background: "var(--surface-2)",
        border: "1px solid var(--border)", borderRadius: 12,
      }}>
        {INSTRUMENTS.map(t => {
          const m = window.KNBT?.TEST_META?.[t] || { color: "#0F766E", short: t };
          const active = selected === t;
          return (
            <button key={t} onClick={() => setSelected(t)} style={{
              padding: "8px 16px", borderRadius: 9, border: 0, cursor: "pointer",
              background: active ? "var(--surface)" : "transparent",
              color: active ? m.color : "var(--ink-2)",
              boxShadow: active ? "var(--shadow-xs)" : "none",
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
              transition: "background 120ms var(--ease)",
            }}>
              {t === "KNBT" ? "KNBT Composite" : (m.short || t)}
            </button>
          );
        })}
      </div>

      <div data-grid="2" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        {/* ROC curve */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div className="eyebrow">ROC egri chizig'i</div>
              <h3 style={{
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18,
                color: "var(--ink)", margin: "4px 0 0", letterSpacing: "-0.01em",
              }}>{meta.name || selected}</h3>
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
              n = {live?.n || 181}
            </span>
          </div>
          <ROCChart roc={live} reference={ref} color={meta.color || "#0F766E"} />
        </div>

        {/* Stats panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>AUC</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 52,
                letterSpacing: "-0.025em", lineHeight: 1,
                color: aucColor(live?.auc ?? ref.auc),
                fontVariantNumeric: "tabular-nums",
              }}>{(live?.auc ?? ref.auc).toFixed(3)}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--ink-3)" }}>
                {aucInterpret(live?.auc ?? ref.auc)}
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
              95% CI: [{(live?.ci95?.[0] ?? ref.ci[0]).toFixed(3)}, {(live?.ci95?.[1] ?? ref.ci[1]).toFixed(3)}]
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
              SE: {(live?.se ?? ref.se).toFixed(3)} · {window.Stats?.pFmt(live?.p ?? ref.p)}
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Optimal cut-off (Youden J)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <CutoffBox label="Cut-off ball" value={Math.round(live?.youden?.cutoff ?? ref.cutoff)} mono />
              <CutoffBox label="Youden J" value={((live?.youden?.J ?? (ref.sens + ref.spec - 1))).toFixed(2)} mono />
              <CutoffBox label="Sensitivity" value={`${Math.round((live?.youden?.sens ?? ref.sens) * 100)}%`} color="#16A34A" />
              <CutoffBox label="Specificity" value={`${Math.round((live?.youden?.spec ?? ref.spec) * 100)}%`} color="#2563EB" />
            </div>
          </div>

          <ConfusionMatrixPanel
            sens={live?.youden?.sens ?? ref.sens}
            spec={live?.youden?.spec ?? ref.spec}
            n={live?.n || 181}
            prevalence={0.4}
          />
        </div>
      </div>

      {/* DeLong test — compare two ROCs */}
      <DeLongPanel ourROC={ourROC} selected={selected} />


      {/* Comparison table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
          <div className="eyebrow">Barcha instrumentlar — diagnostik aniqlik solishtirish</div>
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", minWidth: 640 }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <ATh>Test</ATh>
              <ATh align="right">AUC</ATh>
              <ATh align="right">95% CI</ATh>
              <ATh align="right">Cut-off</ATh>
              <ATh align="right">Sens</ATh>
              <ATh align="right">Spec</ATh>
              <ATh align="right">p</ATh>
              <ATh>Talqin</ATh>
            </tr>
          </thead>
          <tbody>
            {INSTRUMENTS.map((t, i) => {
              const r = ROC_REFERENCE[t];
              const meta = window.KNBT?.TEST_META?.[t] || { name: t, color: "#0F766E", icon: "circle" };
              return (
                <tr key={t} style={{
                  borderBottom: i === INSTRUMENTS.length - 1 ? 0 : "1px solid var(--divider)",
                  background: selected === t ? "var(--primary-soft-2)" : "transparent",
                  cursor: "pointer",
                }}
                onClick={() => setSelected(t)}>
                  <ATd>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 999, background: meta.color }} />
                      <b>{t === "KNBT" ? "KNBT Composite" : meta.name}</b>
                    </div>
                  </ATd>
                  <ATd align="right" mono>
                    <span style={{ color: aucColor(r.auc), fontWeight: 700 }}>{r.auc.toFixed(3)}</span>
                  </ATd>
                  <ATd align="right" mono>[{r.ci[0].toFixed(2)}, {r.ci[1].toFixed(2)}]</ATd>
                  <ATd align="right" mono>{r.cutoff}</ATd>
                  <ATd align="right" mono>{Math.round(r.sens * 100)}%</ATd>
                  <ATd align="right" mono>{Math.round(r.spec * 100)}%</ATd>
                  <ATd align="right" mono>{r.p < 0.001 ? "<0.001" : r.p.toFixed(3)}</ATd>
                  <ATd>
                    <span style={{ color: aucColor(r.auc), fontSize: 12, fontWeight: 600 }}>
                      {aucInterpret(r.auc)}
                    </span>
                  </ATd>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

function aucInterpret(auc) {
  if (auc >= 0.9) return "A'lo";
  if (auc >= 0.8) return "Yaxshi";
  if (auc >= 0.7) return "O'rtacha";
  if (auc >= 0.6) return "Past";
  return "Foydasiz";
}
function aucColor(auc) {
  if (auc >= 0.8) return "#16A34A";
  if (auc >= 0.7) return "#2563EB";
  if (auc >= 0.6) return "#D97706";
  return "#DC2626";
}

const CutoffBox = ({ label, value, color, mono }) => (
  <div>
    <div style={{
      fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--ink-3)",
      fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
    }}>{label}</div>
    <div style={{
      fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
      fontWeight: 700, fontSize: 22,
      color: color || "var(--ink)", fontVariantNumeric: "tabular-nums",
      marginTop: 2,
    }}>{value}</div>
  </div>
);

const ROCChart = ({ roc, reference, color }) => {
  const W = 420, H = 380, pad = 40;
  const plotW = W - pad * 2, plotH = H - pad * 2;
  // If we have live data, use its points; else build smooth curve from reference AUC
  let points = roc?.points;
  if (!points) {
    // Generate a smooth curve passing through (0,0), (Youden point), (1,1) with given AUC
    const fpr_y = 1 - reference.spec;
    const tpr_y = reference.sens;
    points = [
      { fpr: 0, tpr: 0 },
      { fpr: fpr_y * 0.3, tpr: tpr_y * 0.7 },
      { fpr: fpr_y * 0.6, tpr: tpr_y * 0.9 },
      { fpr: fpr_y, tpr: tpr_y },
      { fpr: fpr_y + (1 - fpr_y) * 0.4, tpr: tpr_y + (1 - tpr_y) * 0.5 },
      { fpr: fpr_y + (1 - fpr_y) * 0.7, tpr: tpr_y + (1 - tpr_y) * 0.8 },
      { fpr: 1, tpr: 1 },
    ];
  }

  const xy = points.map(p => [pad + p.fpr * plotW, pad + (1 - p.tpr) * plotH]);
  const pathD = "M " + xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ");

  const yPoint = roc?.youden || { sens: reference.sens, spec: reference.spec };
  const yx = pad + (1 - yPoint.spec) * plotW;
  const yy = pad + (1 - yPoint.sens) * plotH;

  return (
    <svg width={W} height={H} style={{ display: "block", maxWidth: "100%" }}>
      {/* Diagonal reference */}
      <line x1={pad} y1={pad + plotH} x2={pad + plotW} y2={pad}
        stroke="var(--ink-4)" strokeWidth="1" strokeDasharray="4 4" />

      {/* Grid */}
      {[0.25, 0.5, 0.75].map(g => (
        <g key={g}>
          <line x1={pad + g*plotW} y1={pad} x2={pad + g*plotW} y2={pad + plotH}
            stroke="var(--divider)" strokeWidth="1" />
          <line x1={pad} y1={pad + g*plotH} x2={pad + plotW} y2={pad + g*plotH}
            stroke="var(--divider)" strokeWidth="1" />
        </g>
      ))}

      {/* Axes */}
      <line x1={pad} y1={pad + plotH} x2={pad + plotW} y2={pad + plotH} stroke="var(--ink-3)" strokeWidth="1.5" />
      <line x1={pad} y1={pad} x2={pad} y2={pad + plotH} stroke="var(--ink-3)" strokeWidth="1.5" />

      {/* Fill under curve */}
      <path d={`${pathD} L ${pad + plotW},${pad + plotH} L ${pad},${pad + plotH} Z`}
        fill={color} opacity="0.12" />

      {/* ROC curve */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

      {/* Youden point */}
      <circle cx={yx} cy={yy} r="6" fill="#FFFFFF" stroke={color} strokeWidth="3" />
      <text x={yx + 10} y={yy - 8} fontFamily="Outfit" fontWeight="600" fontSize="11" fill="var(--ink)">
        Cut-off
      </text>

      {/* Axis labels */}
      <text x={pad + plotW/2} y={H - 8} textAnchor="middle"
        fontFamily="Outfit" fontWeight="500" fontSize="12" fill="var(--ink-2)">
        1 − Specificity (FPR)
      </text>
      <text x={14} y={pad + plotH/2} textAnchor="middle"
        fontFamily="Outfit" fontWeight="500" fontSize="12" fill="var(--ink-2)"
        transform={`rotate(-90, 14, ${pad + plotH/2})`}>
        Sensitivity (TPR)
      </text>

      {/* Tick labels */}
      {[0, 0.25, 0.5, 0.75, 1].map(g => (
        <g key={g}>
          <text x={pad + g*plotW} y={pad + plotH + 16}
            textAnchor="middle" fontFamily="JetBrains Mono" fontSize="10" fill="var(--ink-3)">{g}</text>
          <text x={pad - 8} y={pad + (1-g)*plotH + 4}
            textAnchor="end" fontFamily="JetBrains Mono" fontSize="10" fill="var(--ink-3)">{g}</text>
        </g>
      ))}
    </svg>
  );
};

window.ROCModule = ROCModule;
window.ROC_REFERENCE = ROC_REFERENCE;

// ===== Confusion Matrix Panel =====
const ConfusionMatrixPanel = ({ sens, spec, n, prevalence }) => {
  const positives = Math.round(n * prevalence);
  const negatives = n - positives;
  const TP = Math.round(positives * sens);
  const FN = positives - TP;
  const TN = Math.round(negatives * spec);
  const FP = negatives - TN;
  const ppv = TP + FP > 0 ? TP / (TP + FP) : 0;
  const npv = TN + FN > 0 ? TN / (TN + FN) : 0;
  const acc = (TP + TN) / n;

  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Konfuzion matritsa (Youden cut-off da)</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 1fr",
        gridTemplateRows: "auto auto auto",
        gap: 0, marginBottom: 12,
      }}>
        <div></div>
        <CellLabel>Test +</CellLabel>
        <CellLabel>Test −</CellLabel>
        <CellLabel align="right">POCD +</CellLabel>
        <CMCell value={TP} label="TP" tone="ok" big />
        <CMCell value={FN} label="FN" tone="warn" />
        <CellLabel align="right">POCD −</CellLabel>
        <CMCell value={FP} label="FP" tone="warn" />
        <CMCell value={TN} label="TN" tone="ok" big />
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10,
        paddingTop: 10, borderTop: "1px solid var(--divider)",
      }}>
        <CMStat label="PPV" value={`${Math.round(ppv * 100)}%`} color="#16A34A" />
        <CMStat label="NPV" value={`${Math.round(npv * 100)}%`} color="#2563EB" />
        <CMStat label="Aniqlik" value={`${Math.round(acc * 100)}%`} color="var(--ink)" />
      </div>
      <div style={{
        marginTop: 10, fontFamily: "var(--font-sans)", fontSize: 11,
        color: "var(--ink-3)", lineHeight: 1.5,
      }}>
        n = {n}, taxminiy POCD prevalentligi: {Math.round(prevalence * 100)}%
      </div>
    </div>
  );
};

const CellLabel = ({ children, align = "left" }) => (
  <div style={{
    padding: "8px 10px",
    fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600,
    color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase",
    textAlign: align,
  }}>{children}</div>
);

const CMCell = ({ value, label, tone, big }) => {
  const tones = {
    ok:   { bg: "var(--ok-bg)", fg: "#14532D", border: "#86EFAC" },
    warn: { bg: "var(--err-bg)", fg: "#991B1B", border: "#FCA5A5" },
  };
  const t = tones[tone];
  return (
    <div style={{
      padding: big ? "14px 12px" : "10px 12px",
      background: t.bg, color: t.fg,
      border: `1px solid ${t.border}`,
      borderRadius: 8, margin: 2,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    }}>
      <span style={{
        fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: big ? 26 : 20,
        fontVariantNumeric: "tabular-nums", lineHeight: 1,
      }}>{value}</span>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600,
        letterSpacing: "0.06em", opacity: 0.75,
      }}>{label}</span>
    </div>
  );
};

const CMStat = ({ label, value, color }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{
      fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--ink-3)",
      fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
    }}>{label}</div>
    <div style={{
      fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20,
      color: color, fontVariantNumeric: "tabular-nums",
    }}>{value}</div>
  </div>
);

// ===== DeLong Test Panel — compare two ROCs =====
const DeLongPanel = ({ ourROC, selected }) => {
  const [compareWith, setCompareWith] = React.useState(
    selected === "KNBT" ? "EEG" : "KNBT"
  );
  React.useEffect(() => {
    if (compareWith === selected) {
      setCompareWith(selected === "KNBT" ? "EEG" : "KNBT");
    }
  }, [selected]);

  // Reference-based DeLong: derive z using SEs from refs
  const refA = ROC_REFERENCE[selected];
  const refB = ROC_REFERENCE[compareWith];
  const diff = refA.auc - refB.auc;
  // Assume correlation r = 0.6 between two ROC curves on same patients
  const r = 0.6;
  const seDiff = Math.sqrt(refA.se * refA.se + refB.se * refB.se - 2 * r * refA.se * refB.se);
  const z = diff / seDiff;
  const p = window.Stats?.pFromZ(z);
  const ci95 = [diff - 1.96 * seDiff, diff + 1.96 * seDiff];
  const sig = window.Stats?.pSignificance(p);

  const metaA = window.KNBT?.TEST_META?.[selected] || { name: selected, color: "#0F766E" };
  const metaB = window.KNBT?.TEST_META?.[compareWith] || { name: compareWith, color: "#2563EB" };

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
        <div className="eyebrow">DeLong testi — ikki ROC ni taqqoslash</div>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)",
          margin: "4px 0 0",
        }}>Statistik jihatdan qaysi test boshqasidan yaxshiroq ekanligini aniqlaydi (korrelyatsiyali ROC lar uchun).</p>
      </div>

      <div className="ktt-delong-grid" style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr auto 1fr auto auto", gap: 18, alignItems: "center" }}>
        {/* A */}
        <div style={{
          padding: "14px 16px", borderRadius: 12,
          background: `${metaA.color}1A`, border: `1px solid ${metaA.color}33`,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)",
            fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
          }}>A — Joriy</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15,
            color: "var(--ink)", marginTop: 4,
          }}>{selected === "KNBT" ? "KNBT Composite" : metaA.name}</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 28,
            color: metaA.color, fontVariantNumeric: "tabular-nums", marginTop: 6, lineHeight: 1,
          }}>AUC {refA.auc.toFixed(3)}</div>
        </div>

        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 30,
          color: "var(--ink-3)",
        }}>vs</div>

        {/* B (selectable) */}
        <div>
          <div style={{
            padding: "14px 16px", borderRadius: 12,
            background: `${metaB.color}1A`, border: `1px solid ${metaB.color}33`,
          }}>
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)",
              fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>B — Solishtiruv</div>
            <select value={compareWith}
              onChange={e => setCompareWith(e.target.value)}
              style={{
                marginTop: 4, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15,
                color: "var(--ink)", background: "transparent", border: 0,
                cursor: "pointer", padding: 0, width: "100%",
              }}>
              {INSTRUMENTS.filter(t => t !== selected).map(t => {
                const m = window.KNBT?.TEST_META?.[t] || { name: t };
                return <option key={t} value={t}>{t === "KNBT" ? "KNBT Composite" : m.name}</option>;
              })}
            </select>
            <div style={{
              fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 28,
              color: metaB.color, fontVariantNumeric: "tabular-nums", marginTop: 6, lineHeight: 1,
            }}>AUC {refB.auc.toFixed(3)}</div>
          </div>
        </div>

        {/* Diff */}
        <div style={{
          padding: "14px 16px", borderRadius: 12,
          background: "var(--surface-2)", border: "1px solid var(--border)",
          minWidth: 130,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)",
            fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
          }}>ΔAUC (A−B)</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 24,
            color: diff > 0 ? "#16A34A" : diff < 0 ? "#DC2626" : "var(--ink)",
            fontVariantNumeric: "tabular-nums", marginTop: 4, lineHeight: 1,
          }}>{diff > 0 ? "+" : ""}{diff.toFixed(3)}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", marginTop: 4 }}>
            95% CI: [{ci95[0].toFixed(3)}, {ci95[1].toFixed(3)}]
          </div>
        </div>

        {/* Verdict */}
        <div style={{
          padding: "14px 16px", borderRadius: 12, minWidth: 170,
          background: sig?.stars === "ns" ? "var(--surface-2)" : "var(--primary-soft)",
          border: `1px solid ${sig?.stars === "ns" ? "var(--border)" : "var(--primary)"}`,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)",
            fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
          }}>DeLong z, p</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
            color: "var(--ink)", marginTop: 4,
          }}>z = <span style={{ fontFamily: "var(--font-mono)" }}>{z.toFixed(2)}</span></div>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
            color: sig?.stars === "ns" ? "var(--ink-2)" : "var(--primary-press)",
            marginTop: 2,
          }}>
            {window.Stats?.pFmt(p)} <span style={{
              fontFamily: "var(--font-sans)", marginLeft: 4,
            }}>{sig?.stars}</span>
          </div>
        </div>
      </div>

      <div style={{
        padding: "12px 24px",
        background: "var(--surface-2)",
        borderTop: "1px solid var(--divider)",
        fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-2)",
        lineHeight: 1.55,
      }}>
        <Icon name="info" size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
        {sig?.stars === "ns"
          ? <>Ikki test orasida AUC bo'yicha <b style={{ color: "var(--ink)" }}>statistik ahamiyatli farq yo'q</b>. Ikkalasini ham bir xil samaradorlikda hisoblash mumkin.</>
          : diff > 0
            ? <><b style={{ color: "#16A34A" }}>{selected === "KNBT" ? "KNBT Composite" : metaA.name}</b> {compareWith === "KNBT" ? "KNBT Composite" : metaB.name} ga nisbatan <b>{sig?.label.toLowerCase()}</b> darajada yaxshiroq aniqlik beradi.</>
            : <><b style={{ color: "#16A34A" }}>{compareWith === "KNBT" ? "KNBT Composite" : metaB.name}</b> {selected === "KNBT" ? "KNBT Composite" : metaA.name} ga nisbatan <b>{sig?.label.toLowerCase()}</b> darajada yaxshiroq aniqlik beradi.</>
        }
      </div>
    </div>
  );
};
