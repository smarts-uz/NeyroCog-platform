// Composite (KNBT) panel — shown inside PatientView when ≥2 tests done.
// Reads patient.results[testId][timepoint] structure and runs the KNBT engine.
//
// Props:
//   timepoint: "PreOp" | "PostOp" | "PostTx" | "latest"
//   "latest" = for each test, use the most recent completed result.

const Composite = ({ patient, timepoint = "PreOp" }) => {
  const K = window.KNBT;

  const results = patient.results || {};
  const testIds = ["Stroop", "TMT", "DST", "LMWT", "NS", "EEG", "Audio"];

  // Pick result per test based on timepoint mode
  const pickResult = (testEntry) => {
    if (!testEntry) return null;
    if (timepoint === "latest") {
      // Find the most recent across all timepoints
      let latest = null;
      for (const tp of ["PreOp", "PostOp", "PostTx"]) {
        const r = testEntry[tp];
        if (!r) continue;
        if (!latest || new Date(r.completedAt) > new Date(latest.completedAt)) {
          latest = { ...r, _tp: tp };
        }
      }
      return latest;
    }
    return testEntry[timepoint] ? { ...testEntry[timepoint], _tp: timepoint } : null;
  };

  // Summarize each test using its picked result
  const summaries = {};
  testIds.forEach(t => {
    const r = pickResult(results[t]);
    if (r && r.raw) {
      const tpForScoring = r._tp;
      summaries[t] = K.summarizeTest(t, r.raw, tpForScoring, patient);
      summaries[t]._tp = r._tp;
    }
  });

  // For composite, use the active timepoint; for "latest" mode use most common tp
  const effectiveTp = timepoint === "latest"
    ? (Object.values(summaries)[0]?._tp || "PreOp")
    : timepoint;
  const composite = K.summarizeComposite(summaries, effectiveTp);
  const hasAny = Object.keys(summaries).length > 0;

  if (!hasAny) {
    return (
      <div className="card" style={{
        padding: 24, display: "flex", flexDirection: "column", gap: 8,
        background: "var(--surface-2)", border: "1px dashed var(--border-strong)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="bar-chart-3" size={20} style={{ color: "var(--ink-3)" }} />
          <div className="eyebrow">KNBT Composite</div>
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-2)" }}>
          Hech bo'lmaganda <b style={{ color: "var(--ink)" }}>bitta test</b> bajarilgandan keyin
          KNBT Composite hisoblanadi.
        </div>
      </div>
    );
  }

  const compTone = composite
    ? (composite.ispcd ? "err" : composite.tone === "bad" ? "err" : composite.tone === "warn" ? "warn" : "ok")
    : "neutral";

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Hero — composite headline */}
      <div style={{
        padding: "24px 28px",
        background: compTone === "err" ? "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)"
                  : compTone === "warn" ? "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"
                  : compTone === "ok" ? "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)"
                  : "var(--surface-2)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ color: "var(--ink-2)" }}>
              KNBT Composite · {timepoint === "latest" ? "Eng so'nggi" : timepoint}
            </div>
            {composite ? (
              <>
                <div style={{
                  fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 56,
                  letterSpacing: "-0.025em", color: "var(--ink)", lineHeight: 1,
                  marginTop: 6, fontVariantNumeric: "tabular-nums",
                }}>
                  {composite.compositeScore}
                  <span style={{ fontSize: 22, fontWeight: 500, color: "var(--ink-3)", marginLeft: 6 }}>/ 100</span>
                </div>
                <div style={{
                  fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 18,
                  color: "var(--ink)", marginTop: 8,
                }}>{composite.cognitiveHealth}</div>
                <div style={{
                  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-2)",
                  marginTop: 4,
                }}>
                  Z-score: <b style={{ fontFamily: "var(--font-mono)" }}>{composite.zScore?.toFixed(2) ?? "—"}</b>
                  {" · "}
                  {composite.includedTests} ta test ishtirok etgan
                </div>
              </>
            ) : (
              <div style={{
                fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-2)",
                marginTop: 12,
              }}>
                Composite uchun yetarli ma'lumot yo'q.
              </div>
            )}
          </div>

          {/* ISPOCD verdict */}
          {composite && (
            <div style={{
              padding: "12px 16px", borderRadius: 12,
              background: composite.ispcd ? "var(--err)" : "rgba(255,255,255,0.6)",
              color: composite.ispcd ? "#FFF" : "var(--ink)",
              display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4,
              border: composite.ispcd ? "0" : "1px solid var(--border-strong)",
            }}>
              <div style={{
                fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                opacity: 0.85,
              }}>ISPOCD</div>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 22,
                letterSpacing: "-0.01em",
              }}>{composite.ispcd ? "Musbat" : "Manfiy"}</div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.8,
                fontVariantNumeric: "tabular-nums",
              }}>
                {composite.ispcdCount} / 4 testda Z ≤ −1.96
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Per-test breakdown */}
      <div style={{ padding: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Test bo'yicha taqsimot</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {testIds.map(t => {
            const sum = summaries[t];
            const meta = K.TEST_META[t];
            return <TestTile key={t} test={meta} testId={t} summary={sum} />;
          })}
        </div>

        {composite && (
          <div style={{
            marginTop: 14, padding: "10px 14px",
            background: "var(--surface-2)", borderRadius: 10,
            fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Icon name="info" size={14} />
            <span>
              <b style={{ color: "var(--ink)" }}>ISPOCD = Musbat</b> bo'lishi uchun
              Stroop / TMT / DST / LMWT to'rttasidan kamida 2 tasida Z-score ≤ −1.96 bo'lishi kerak.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const TestTile = ({ test, testId, summary }) => {
  const tones = {
    great:   { bg: "#DCFCE7", fg: "#14532D" },
    good:    { bg: "#DBEAFE", fg: "#1E3A8A" },
    ok:      { bg: "#E0E7FF", fg: "#3730A3" },
    warn:    { bg: "#FEF3C7", fg: "#92400E" },
    bad:     { bg: "#FEE2E2", fg: "#991B1B" },
    neutral: { bg: "var(--surface-2)", fg: "var(--ink-3)" },
  };
  const t = summary ? tones[summary.tone] : tones.neutral;
  return (
    <div style={{
      padding: 14, borderRadius: 12,
      background: t.bg, color: t.fg,
      border: "1px solid var(--border)",
      display: "flex", flexDirection: "column", gap: 6,
      opacity: summary ? 1 : 0.5,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name={test.icon} size={14} />
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>{test.short}</span>
        {summary?.ispcd && (
          <span style={{
            marginLeft: "auto",
            padding: "1px 6px", borderRadius: 4,
            background: "var(--err)", color: "#FFF",
            fontFamily: "var(--font-sans)", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
          }}>ISPOCD</span>
        )}
      </div>
      <div style={{
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22,
        fontVariantNumeric: "tabular-nums", lineHeight: 1,
      }}>
        {summary?.cogScore != null ? summary.cogScore : "—"}
      </div>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 11,
        opacity: 0.8,
      }}>
        {summary ? summary.cognitiveHealth : "Bajarilmagan"}
      </div>
      {summary && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.7,
          fontVariantNumeric: "tabular-nums",
        }}>
          z = {summary.zScore?.toFixed(2) ?? "—"}
        </div>
      )}
    </div>
  );
};

window.Composite = Composite;
