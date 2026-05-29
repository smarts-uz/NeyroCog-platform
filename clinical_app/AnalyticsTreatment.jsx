// Davolash effekti moduli — Pantogam + raqamli kognitiv trening samaradorligi.
// Manba: Statistics M-4 Treatment Efficacy (n=56).

const TREATMENT_RESULTS = {
  // From Statistics M-4 (Asosiy vs Taqqoslov, 4 hafta keyin)
  Stroop: { exp: { post: 60, postTx: 78, n: 30 }, ctl: { post: 58, postTx: 64, n: 26 }, p: 0.001, d: 1.34, recoveryExp: 0.733, recoveryCtl: 0.231 },
  TMT:    { exp: { post: 58, postTx: 76, n: 30 }, ctl: { post: 56, postTx: 62, n: 26 }, p: 0.001, d: 1.42, recoveryExp: 0.700, recoveryCtl: 0.192 },
  DST:    { exp: { post: 60, postTx: 77, n: 30 }, ctl: { post: 58, postTx: 64, n: 26 }, p: 0.001, d: 1.28, recoveryExp: 0.667, recoveryCtl: 0.231 },
  LMWT:   { exp: { post: 55, postTx: 74, n: 30 }, ctl: { post: 54, postTx: 60, n: 26 }, p: 0.001, d: 1.51, recoveryExp: 0.700, recoveryCtl: 0.192 },
  NS:     { exp: { post: 72, postTx: 82, n: 30 }, ctl: { post: 71, postTx: 75, n: 26 }, p: 0.001, d: 0.94, recoveryExp: 0.633, recoveryCtl: 0.346 },
  Audio:  { exp: { post: 68, postTx: 79, n: 30 }, ctl: { post: 67, postTx: 71, n: 26 }, p: 0.005, d: 0.88, recoveryExp: 0.600, recoveryCtl: 0.269 },
  EEG:    { exp: { post: 72, postTx: 83, n: 30 }, ctl: { post: 71, postTx: 76, n: 26 }, p: 0.001, d: 1.06, recoveryExp: 0.667, recoveryCtl: 0.346 },
  KNBT:   { exp: { post: 62, postTx: 78, n: 30 }, ctl: { post: 61, postTx: 65, n: 26 }, p: 0.001, d: 1.38, recoveryExp: 0.733, recoveryCtl: 0.231 },
};

const TREATMENT_INSTRUMENTS = ["KNBT", "EEG", "TMT", "DST", "LMWT", "Stroop", "NS", "Audio"];

const TreatmentModule = ({ patients }) => {
  const [selected, setSelected] = React.useState("KNBT");
  const r = TREATMENT_RESULTS[selected];
  const meta = window.KNBT?.TEST_META?.[selected] || { name: selected };

  const nntCalc = window.Stats?.nnt(r.recoveryExp, r.recoveryCtl);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Hero — overall claim */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
          color: "#FFFFFF",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="pill" size={24} /></div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.85,
            }}>Pantogam + raqamli kognitiv trening (4 hafta)</div>
            <div style={{
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22,
              letterSpacing: "-0.01em", marginTop: 2,
            }}>Davolash samaradorligi statistik tasdiqlandi</div>
          </div>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "flex-end",
            fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.95,
          }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>n = 30 vs 26</span>
            <span>Asosiy vs Taqqoslov</span>
          </div>
        </div>
      </div>

      {/* Instrument selector */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap",
        padding: 6, background: "var(--surface-2)",
        border: "1px solid var(--border)", borderRadius: 12,
      }}>
        {TREATMENT_INSTRUMENTS.map(t => {
          const m = window.KNBT?.TEST_META?.[t] || { color: "#0F766E", short: t };
          const active = selected === t;
          return (
            <button key={t} onClick={() => setSelected(t)} style={{
              padding: "8px 16px", borderRadius: 9, border: 0, cursor: "pointer",
              background: active ? "var(--surface)" : "transparent",
              color: active ? m.color : "var(--ink-2)",
              boxShadow: active ? "var(--shadow-xs)" : "none",
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
            }}>
              {t === "KNBT" ? "KNBT Composite" : (m.short || t)}
            </button>
          );
        })}
      </div>

      <div data-grid="2" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        {/* PrePost line chart */}
        <div className="card" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            CogScore o'zgarishi — {selected === "KNBT" ? "KNBT Composite" : meta.name}
          </div>
          <PrePostChart result={r} />
          <div style={{
            display: "flex", justifyContent: "center", gap: 24, marginTop: 16,
            fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-2)",
          }}>
            <LegendDot color="#0F766E" label="Asosiy guruh (Pantogam + trening)" />
            <LegendDot color="#94A3B8" label="Taqqoslov guruh (kuzatuv)" />
          </div>
        </div>

        {/* Effect size & metrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Effekt o'lchami (Cohen's d)</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 52,
                letterSpacing: "-0.025em", lineHeight: 1,
                color: "#16A34A", fontVariantNumeric: "tabular-nums",
              }}>{r.d.toFixed(2)}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--ink-3)" }}>
                {window.Stats?.cohenDInterpret(r.d)?.label}
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
              {window.Stats?.pFmt(r.p)} · 4 hafta keyin
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Tiklanish foizi</div>
            <RecoveryBars expRate={r.recoveryExp} ctlRate={r.recoveryCtl} />
          </div>

          {nntCalc && (
            <div className="card" style={{ padding: 22 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Klinik samaradorlik</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <CutoffBox label="ARR (Absolute Risk Reduction)" value={`${Math.round(nntCalc.arr * 100)}%`} color="#16A34A" />
                <CutoffBox label="NNT (Number Needed to Treat)" value={Math.ceil(nntCalc.nnt)} color="#0F766E" mono />
              </div>
              <p style={{
                fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.5,
                color: "var(--ink-3)", margin: "12px 0 0",
              }}>
                Har <b>{Math.ceil(nntCalc.nnt)}</b> bemorni davolash — 1 ta qo'shimcha tiklanish beradi.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* All-tests comparison */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
          <div className="eyebrow">Barcha instrumentlar — davolash samaradorligi</div>
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <ATh>Test</ATh>
              <ATh align="right">Asosiy Δ</ATh>
              <ATh align="right">Taqqoslov Δ</ATh>
              <ATh align="right">Cohen's d</ATh>
              <ATh align="right">p</ATh>
              <ATh align="right">Tiklanish (Asosiy)</ATh>
              <ATh align="right">Tiklanish (Taqq.)</ATh>
              <ATh align="right">NNT</ATh>
            </tr>
          </thead>
          <tbody>
            {TREATMENT_INSTRUMENTS.map((t, i) => {
              const r = TREATMENT_RESULTS[t];
              const dExp = r.exp.postTx - r.exp.post;
              const dCtl = r.ctl.postTx - r.ctl.post;
              const nn = window.Stats?.nnt(r.recoveryExp, r.recoveryCtl);
              const meta = window.KNBT?.TEST_META?.[t] || { name: t, color: "#0F766E" };
              return (
                <tr key={t} style={{
                  borderBottom: i === TREATMENT_INSTRUMENTS.length - 1 ? 0 : "1px solid var(--divider)",
                  background: selected === t ? "var(--primary-soft-2)" : "transparent",
                  cursor: "pointer",
                }} onClick={() => setSelected(t)}>
                  <ATd>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 999, background: meta.color }} />
                      <b>{t === "KNBT" ? "KNBT Composite" : meta.name}</b>
                    </div>
                  </ATd>
                  <ATd align="right" mono>
                    <span style={{ color: "#16A34A", fontWeight: 700 }}>+{dExp}</span>
                  </ATd>
                  <ATd align="right" mono>+{dCtl}</ATd>
                  <ATd align="right" mono>
                    <span style={{ color: window.Stats?.cohenDInterpret(r.d)?.color, fontWeight: 700 }}>{r.d.toFixed(2)}</span>
                  </ATd>
                  <ATd align="right" mono>{r.p < 0.001 ? "<0.001" : r.p.toFixed(3)}</ATd>
                  <ATd align="right" mono>{Math.round(r.recoveryExp * 100)}%</ATd>
                  <ATd align="right" mono>{Math.round(r.recoveryCtl * 100)}%</ATd>
                  <ATd align="right" mono>{nn ? Math.ceil(nn.nnt) : "—"}</ATd>
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

const PrePostChart = ({ result }) => {
  const W = 460, H = 280, pad = 50;
  const plotW = W - pad * 2, plotH = H - pad * 2;
  const xPostOp = pad;
  const xPostTx = pad + plotW;
  const yScale = (v) => pad + (1 - (v - 40) / 50) * plotH; // 40-90 range

  const expPoints = [
    [xPostOp, yScale(result.exp.post)],
    [xPostTx, yScale(result.exp.postTx)],
  ];
  const ctlPoints = [
    [xPostOp, yScale(result.ctl.post)],
    [xPostTx, yScale(result.ctl.postTx)],
  ];

  return (
    <svg width={W} height={H} style={{ display: "block", maxWidth: "100%" }}>
      {/* Y grid */}
      {[40, 50, 60, 70, 80, 90].map(y => (
        <g key={y}>
          <line x1={pad} y1={yScale(y)} x2={pad + plotW} y2={yScale(y)}
            stroke="var(--divider)" strokeWidth="1" />
          <text x={pad - 8} y={yScale(y) + 4} textAnchor="end"
            fontFamily="JetBrains Mono" fontSize="10" fill="var(--ink-3)">{y}</text>
        </g>
      ))}

      {/* X labels */}
      <text x={xPostOp} y={pad + plotH + 18} textAnchor="middle"
        fontFamily="Outfit" fontWeight="600" fontSize="12" fill="var(--ink)">PostOp</text>
      <text x={xPostTx} y={pad + plotH + 18} textAnchor="middle"
        fontFamily="Outfit" fontWeight="600" fontSize="12" fill="var(--ink)">PostTx (4 hafta keyin)</text>

      {/* Axes */}
      <line x1={pad} y1={pad + plotH} x2={pad + plotW} y2={pad + plotH} stroke="var(--ink-3)" strokeWidth="1.5" />
      <line x1={pad} y1={pad} x2={pad} y2={pad + plotH} stroke="var(--ink-3)" strokeWidth="1.5" />

      {/* Lines */}
      <line x1={ctlPoints[0][0]} y1={ctlPoints[0][1]} x2={ctlPoints[1][0]} y2={ctlPoints[1][1]}
        stroke="#94A3B8" strokeWidth="3" />
      <line x1={expPoints[0][0]} y1={expPoints[0][1]} x2={expPoints[1][0]} y2={expPoints[1][1]}
        stroke="#0F766E" strokeWidth="3" />

      {/* Points */}
      {[...ctlPoints, ...expPoints].map((pt, i) => {
        const color = i < 2 ? "#94A3B8" : "#0F766E";
        return <circle key={i} cx={pt[0]} cy={pt[1]} r="6" fill="#FFFFFF" stroke={color} strokeWidth="3" />;
      })}

      {/* Value labels */}
      <text x={xPostOp - 12} y={yScale(result.exp.post) - 8} textAnchor="end" fontFamily="JetBrains Mono" fontWeight="700" fontSize="12" fill="#0F766E">{result.exp.post}</text>
      <text x={xPostTx + 12} y={yScale(result.exp.postTx) - 8} fontFamily="JetBrains Mono" fontWeight="700" fontSize="12" fill="#0F766E">{result.exp.postTx}</text>
      <text x={xPostOp - 12} y={yScale(result.ctl.post) + 18} textAnchor="end" fontFamily="JetBrains Mono" fontWeight="700" fontSize="12" fill="#64748B">{result.ctl.post}</text>
      <text x={xPostTx + 12} y={yScale(result.ctl.postTx) + 18} fontFamily="JetBrains Mono" fontWeight="700" fontSize="12" fill="#64748B">{result.ctl.postTx}</text>

      {/* Y label */}
      <text x={14} y={pad + plotH/2} textAnchor="middle"
        fontFamily="Outfit" fontWeight="500" fontSize="12" fill="var(--ink-2)"
        transform={`rotate(-90, 14, ${pad + plotH/2})`}>CogScore</text>
    </svg>
  );
};

const LegendDot = ({ color, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: 12, height: 12, borderRadius: 999, background: color, border: "2px solid #FFFFFF", boxShadow: `0 0 0 2px ${color}` }} />
    {label}
  </span>
);

const RecoveryBars = ({ expRate, ctlRate }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <RecoveryRow label="Asosiy (Pantogam + trening)" rate={expRate} color="#0F766E" />
      <RecoveryRow label="Taqqoslov (kuzatuv)" rate={ctlRate} color="#94A3B8" />
      <div style={{
        marginTop: 4, paddingTop: 8, borderTop: "1px solid var(--divider)",
        fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)",
      }}>
        Δ tiklanish: <b style={{ color: "#16A34A" }}>+{Math.round((expRate - ctlRate) * 100)} foiz</b>
      </div>
    </div>
  );
};

const RecoveryRow = ({ label, rate, color }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-2)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
        {Math.round(rate * 100)}%
      </span>
    </div>
    <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${rate * 100}%`, background: color, transition: "width 320ms var(--ease)" }} />
    </div>
  </div>
);

window.TreatmentModule = TreatmentModule;
window.TREATMENT_RESULTS = TREATMENT_RESULTS;
