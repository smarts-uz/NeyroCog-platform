// Klinika tahlil markazi — 4 ta yuqori darajadagi modul
//   1. Dashboard       — barcha bemorlar bo'yicha kohort statistikasi
//   2. ROC tahlili     — diagnostik aniqlik (har KNBT instrumenti)
//   3. Davolash effekti — Pantogam + trening samaradorligi
//   4. Hisobotlar      — PDF / CSV eksport
//
// Foydalanish: bemorlar ro'yxati ekranida "Tahlil" tugmasi orqali ochiladi.

const Analytics = ({ patients, user, initialTab, embedded, onOpenPatients, onLogout, onOpenPatient }) => {
  const [tab, setTab] = React.useState(initialTab || "roc");
  React.useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);

  return (
    <>
      {!embedded && <AppHeader user={user} onLogout={onLogout} breadcrumbs={[{ label: "Tahlil" }]} title="Statistik tahlil" />}
      <main className="ktt-anim-fade" style={{ padding: embedded ? "20px 24px 32px" : "24px 32px 48px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Tahlil markazi</div>
          <h1 style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 24,
            letterSpacing: "-0.02em", color: "var(--ink)", margin: 0,
          }}>{tab === "treatment" ? "Davolash effekti" : tab === "reports" ? "Hisobotlar" : "ROC tahlili"}</h1>
        </div>

        {tab === "roc"       && <ROCModule       patients={patients} />}
        {tab === "treatment" && <TreatmentModule patients={patients} />}
        {tab === "reports"   && <ReportsModule   patients={patients} onOpenPatient={onOpenPatient} />}
      </main>
      <Footer />
    </>
  );
};

const AnalyticsTab = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 8,
    padding: "9px 16px", borderRadius: 9, border: 0, cursor: "pointer",
    background: active ? "var(--surface)" : "transparent",
    color: active ? "var(--ink)" : "var(--ink-2)",
    boxShadow: active ? "var(--shadow-xs)" : "none",
    fontFamily: "var(--font-sans)", fontWeight: active ? 600 : 500, fontSize: 13,
    transition: "background 120ms var(--ease)",
  }}>
    <Icon name={icon} size={15} /> {label}
  </button>
);

// ============================================================
// MODUL 1: KOHORT DASHBOARD
// ============================================================
const CohortDashboard = ({ patients, onOpenPatient, onOpenPatients }) => {
  const stats = React.useMemo(() => {
    const total = patients.length;
    const withTests = patients.filter(p => Object.keys(p.results || {}).length > 0);
    const withTraining = patients.filter(p => (p.training || []).length > 0);

    // PNB prevalence (composite ispcd)
    let ispcdCount = 0;
    let highRiskCount = 0;
    const ageGroups = { "≤9": 0, "10-12": 0, "13-15": 0, "16+": 0 };
    const sexCounts = { Erkak: 0, Ayol: 0 };
    const premorbidPos = patients.filter(p => Number(p.premorbid) === 1).length;

    patients.forEach(p => {
      const a = p.yosh || 0;
      if (a <= 9) ageGroups["≤9"]++;
      else if (a <= 12) ageGroups["10-12"]++;
      else if (a <= 15) ageGroups["13-15"]++;
      else ageGroups["16+"]++;
      if (p.jinsi) sexCounts[p.jinsi] = (sexCounts[p.jinsi] || 0) + 1;

      // Predicted risk
      if (window.PNBPredictor && p.davom > 0) {
        try {
          const f = window.PNBPredictor.forecast(p);
          if (f.composite.risk.prob >= 0.5) highRiskCount++;
        } catch (e) {}
      }
      // ISPCD from results
      if (window.KNBT && Object.keys(p.results || {}).length > 0) {
        try {
          const sumByTest = {};
          for (const [k, v] of Object.entries(p.results)) {
            if (v.raw) sumByTest[k] = window.KNBT.summarizeTest(k, v.raw, "PreOp", p);
          }
          const comp = window.KNBT.summarizeComposite(sumByTest, "PreOp");
          if (comp?.ispcd) ispcdCount++;
        } catch (e) {}
      }
    });

    const avgAge = patients.length ? stats_mean(patients.map(p => p.yosh || 0)) : 0;
    const avgDur = patients.length ? stats_mean(patients.map(p => p.davom || 0)) : 0;
    const avgPrep = patients.length ? stats_mean(patients.map(p => p.prep || 0)) : 0;

    return {
      total, withTests: withTests.length, withTraining: withTraining.length,
      ispcdCount, highRiskCount, premorbidPos,
      ageGroups, sexCounts,
      avgAge, avgDur, avgPrep,
    };
  }, [patients]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* KPI row */}
      <div data-grid="stats" className="ktt-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
        <KPI label="Jami bemorlar" value={stats.total} icon="users" onClick={() => onOpenPatients()} />
        <KPI label="Testlar bajarilgan" value={stats.withTests} sub={`${pct(stats.withTests, stats.total)}%`} icon="check-circle" tone="ok" onClick={() => onOpenPatients("tested")} />
        <KPI label="Reabilitatsiyada" value={stats.withTraining} sub={`${pct(stats.withTraining, stats.total)}%`} icon="brain" tone="primary" onClick={() => onOpenPatients("rehab")} />
        <KPI label="PNB aniqlangan" value={stats.ispcdCount} sub={`${pct(stats.ispcdCount, stats.withTests)}%`} icon="alert-circle" tone="warn" onClick={() => onOpenPatients("pocd")} />
        <KPI label="Yuqori xavf" value={stats.highRiskCount} sub={`${pct(stats.highRiskCount, stats.total)}%`} icon="trending-up" tone="err" onClick={() => onOpenPatients("highrisk")} />
        <KPI label="Premorbid +" value={stats.premorbidPos} sub={`${pct(stats.premorbidPos, stats.total)}%`} icon="alert-triangle" onClick={() => onOpenPatients("premorbid")} />
      </div>

      {/* Demographics */}
      <div data-grid="3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Yosh taqsimoti</div>
          <DonutChart
            data={Object.entries(stats.ageGroups).map(([k, v], i) => ({ label: k, value: v, color: ["#0F766E", "#14857A", "#2DA8A0", "#7DD3C8"][i] }))}
            centerLabel="bemor" />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>Jins taqsimoti</div>
          <DonutChart
            data={Object.entries(stats.sexCounts).map(([k, v]) => ({ label: jinsLabel(k), value: v, color: k === "Erkak" ? "#2563EB" : "#DB2777" }))}
            centerLabel="bemor" />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 16 }}>O'rtachalar</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Stat label="Yoshi" value={`${stats.avgAge.toFixed(1)} y`} />
            <Stat label="Davomiyligi" value={`${stats.avgDur.toFixed(0)} daq`} />
            <Stat label="Dori" value={stats.avgPrep.toFixed(1)} />
          </div>
        </div>
      </div>

      {/* High-risk patients table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
          <div className="eyebrow">Yuqori xavfli bemorlar (ehtimol ≥ 50%)</div>
        </div>
        <div data-scroll-x>
        <HighRiskTable patients={patients} onOpen={onOpenPatient} />
        </div>
      </div>
    </div>
  );
};

function stats_mean(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0; }
function pct(a, b) { return b > 0 ? Math.round((a/b)*100) : 0; }

const KPI = ({ label, value, sub, icon, tone = "neutral", onClick }) => {
  const tones = {
    neutral: { bg: "var(--surface-2)", fg: "var(--ink-2)" },
    ok:      { bg: "var(--ok-bg)", fg: "#14532D" },
    warn:    { bg: "var(--warn-bg)", fg: "#92400E" },
    err:     { bg: "var(--err-bg)", fg: "#991B1B" },
    primary: { bg: "var(--primary-soft)", fg: "var(--primary-press)" },
  };
  const t = tones[tone];
  return (
    <button onClick={onClick} className="card ktt-lift ktt-tap" style={{
      padding: 14, display: "flex", alignItems: "center", gap: 10,
      cursor: onClick ? "pointer" : "default", textAlign: "left",
      fontFamily: "inherit", width: "100%",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: t.bg, color: t.fg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><Icon name={icon} size={17} /></div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20,
          color: "var(--ink)", letterSpacing: "-0.01em", lineHeight: 1.05,
          fontVariantNumeric: "tabular-nums",
        }}>{value}</div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-2)", fontWeight: 500 }}>{label}</div>
        {sub && <div className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--ink-3)" }}>{sub}</div>}
      </div>
    </button>
  );
};

const BarChart = ({ data, color = "#0F766E" }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 36px", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-2)", fontWeight: 600 }}>{d.label}</span>
            <div style={{ height: 18, background: "var(--surface-2)", borderRadius: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 320ms var(--ease)" }} />
            </div>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
              color: "var(--ink)", fontVariantNumeric: "tabular-nums", textAlign: "right",
            }}>{d.value}</span>
          </div>
        );
      })}
    </div>
  );
};

// Professional donut chart — SVG, animated, with legend
const DonutChart = ({ data, centerLabel = "" }) => {
  const total = data.reduce((a, d) => a + d.value, 0);
  const size = 132, stroke = 20, R = (size - stroke) / 2, C = 2 * Math.PI * R;
  let offset = 0;
  const segments = data.map(d => {
    const frac = total > 0 ? d.value / total : 0;
    const seg = { ...d, frac, dash: C * frac, gap: C * (1 - frac), rot: (offset / total) * 360 };
    offset += d.value;
    return seg;
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
          {total > 0 && segments.map((s, i) => (
            <circle key={i} cx={size/2} cy={size/2} r={R} fill="none"
              stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={-(s.rot / 360) * C}
              transform={`rotate(-90 ${size/2} ${size/2})`}
              style={{ transition: "stroke-dasharray 600ms var(--ease)" }} />
          ))}
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span className="num" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 26, color: "var(--ink)", lineHeight: 1, letterSpacing: "-0.02em" }}>{total}</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)", fontWeight: 600 }}>{centerLabel}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 120 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>{s.label}</span>
            <span className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{s.value}</span>
            <span className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)", minWidth: 34, textAlign: "right" }}>
              {total > 0 ? Math.round(s.frac * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
    <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)" }}>{label}</span>
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--ink)",
      fontVariantNumeric: "tabular-nums",
    }}>{value}</span>
  </div>
);

const HighRiskTable = ({ patients, onOpen }) => {
  const risky = React.useMemo(() => {
    const out = [];
    for (const p of patients) {
      if (!window.PNBPredictor || !p.davom) continue;
      try {
        const f = window.PNBPredictor.forecast(p);
        if (f.composite.risk.prob >= 0.5) {
          out.push({ p, risk: f.composite });
        }
      } catch (e) {}
    }
    out.sort((a, b) => b.risk.risk.prob - a.risk.risk.prob);
    return out;
  }, [patients]);

  if (risky.length === 0) {
    return (
      <div style={{
        padding: "40px 20px", textAlign: "center",
        color: "var(--ink-3)", fontSize: 14, fontFamily: "var(--font-sans)",
      }}>
        Hozircha yuqori xavfli bemorlar yo'q.
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", minWidth: 640 }}>
      <thead>
        <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
          <ATh>№</ATh>
          <ATh>Bemor</ATh>
          <ATh align="right">Yosh</ATh>
          <ATh align="right">Davomiyligi</ATh>
          <ATh align="right">Dori</ATh>
          <ATh align="right">PNB xavfi</ATh>
          <ATh align="right">Kutilgan CogScore</ATh>
          <ATh></ATh>
        </tr>
      </thead>
      <tbody>
        {risky.map(({ p, risk }, i) => (
          <tr key={p.id} style={{
            borderBottom: i === risky.length - 1 ? 0 : "1px solid var(--divider)",
            cursor: "pointer", transition: "background 120ms var(--ease)",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            onClick={() => onOpen && onOpen(p.id)}>
            <ATd mono>{p.id}</ATd>
            <ATd><b>{p.fish}</b></ATd>
            <ATd align="right" mono>{p.yosh}</ATd>
            <ATd align="right" mono>{p.davom} daq</ATd>
            <ATd align="right" mono>{p.prep}</ATd>
            <ATd align="right">
              <span style={{
                fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14,
                color: risk.category.color, fontVariantNumeric: "tabular-nums",
              }}>{Math.round(risk.risk.prob * 100)}%</span>
            </ATd>
            <ATd align="right" mono>{Math.round(risk.severity.score)}</ATd>
            <ATd><Icon name="chevron-right" size={14} style={{ color: "var(--ink-4)" }} /></ATd>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ATh = ({ children, align = "left" }) => (
  <th style={{
    textAlign: align, padding: "10px 14px",
    fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11,
    color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase",
  }}>{children}</th>
);
const ATd = ({ children, align = "left", mono }) => (
  <td style={{
    padding: "10px 14px", textAlign: align,
    fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
    fontSize: 13, color: "var(--ink)", fontVariantNumeric: mono ? "tabular-nums" : "normal",
  }}>{children}</td>
);

window.Analytics = Analytics;
window.AnalyticsDonut = DonutChart;
window.AnalyticsKPI = KPI;
window.AnalyticsBarChart = BarChart;
window.AnalyticsATh = ATh;
window.AnalyticsATd = ATd;
window.analytics_stats_mean = stats_mean;
window.analytics_pct = pct;
