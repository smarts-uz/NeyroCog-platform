// Test-agnostic Results screen.
// Uses window.KNBT to derive CogScore, Cognitive Health label, Z-score, ISPOCD.
// Shows the just-completed test's summary + provides links back.

const Results = ({ patient, result, onBackToPatient, onBackToList }) => {
  const K = window.KNBT;
  const TIMEPOINT = "PreOp"; // single timepoint for now

  const testId = result.test;
  const meta = K.TEST_META[testId] || { name: testId, short: testId, icon: "check", color: "#0F766E", soft: "#CCFBF1" };

  // Re-derive summary from raw values stored in result
  const summary = result.raw
    ? K.summarizeTest(testId, result.raw, TIMEPOINT, patient)
    : null;

  const toneStyles = {
    great:   { bg: "var(--ok-bg)",   fg: "#14532D", border: "#86EFAC" },
    good:    { bg: "var(--info-bg)", fg: "#1E3A8A", border: "#93C5FD" },
    ok:      { bg: "var(--surface-2)", fg: "var(--ink)", border: "var(--border-strong)" },
    warn:    { bg: "var(--warn-bg)", fg: "#92400E", border: "#FCD34D" },
    bad:     { bg: "var(--err-bg)",  fg: "#991B1B", border: "#FCA5A5" },
    neutral: { bg: "var(--surface-2)", fg: "var(--ink-2)", border: "var(--border)" },
  };
  const tone = summary ? toneStyles[summary.tone] : toneStyles.neutral;

  return (
    <>
      <AppHeader user={null} onLogout={onBackToList}
        breadcrumbs={[
          { label: "Bemorlar", onClick: onBackToList },
          { label: patient.fish, onClick: onBackToPatient },
          { label: `${meta.short} natijasi` },
        ]} />
      <main style={{ padding: "28px 32px", maxWidth: 1180, margin: "0 auto" }}>

        {/* Hero */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: meta.soft, color: meta.color,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name={meta.icon} size={28} /></div>
          <div>
            <div className="eyebrow">Test yakunlandi</div>
            <h1 style={{
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 30,
              letterSpacing: "-0.02em", color: "var(--ink)", margin: "4px 0 0",
            }}>{meta.name} — natija</h1>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)",
              margin: "4px 0 0",
            }}>
              {patient.fish} · № {patient.id} · {patient.yosh} yosh ·{" "}
              {new Date(result.completedAt).toLocaleString("uz-UZ")}
            </p>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              <Icon name="printer" size={16} /> Chop etish
            </button>
            <button className="btn btn-primary" onClick={onBackToPatient}>
              <Icon name="arrow-left" size={16} /> Bemorga qaytish
            </button>
          </div>
        </div>

        {/* Verdict banner */}
        {summary && (
          <div style={{
            padding: "20px 24px", borderRadius: 14,
            background: tone.bg, color: tone.fg,
            border: `1px solid ${tone.border}`,
            marginBottom: 24,
            display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 20,
          }}>
            <Icon name="sparkles" size={26} />
            <div>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20,
                letterSpacing: "-0.005em",
              }}>{summary.cognitiveHealth}</div>
              <div style={{
                fontFamily: "var(--font-sans)", fontSize: 13, marginTop: 2,
                opacity: 0.85,
              }}>
                {summary.ispcd
                  ? "Bu test bo'yicha sezilarli kognitiv buzilish aniqlandi (ISPOCD musbat)."
                  : "Bu test bo'yicha sezilarli kognitiv buzilish aniqlanmadi."
                }
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>CogScore</div>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 36,
                lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
              }}>{summary.cogScore ?? "—"}</div>
            </div>
            <div style={{ textAlign: "center", paddingLeft: 18, borderLeft: "1px solid currentColor", opacity: 0.85 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>Z-Score</div>
              <div style={{
                fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22,
                lineHeight: 1, fontVariantNumeric: "tabular-nums",
              }}>{summary.zScore?.toFixed(2) ?? "—"}</div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>

          {/* Left: raw metrics + scale */}
          <div className="card" style={{ padding: 28 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Test ko'rsatkichlari</div>
            <RawMetrics testId={testId} result={result} />

            {summary && summary.zScore != null && (
              <div style={{ marginTop: 24 }}>
                <div style={{
                  display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  marginBottom: 8,
                }}>
                  <span style={{
                    fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
                    color: "var(--ink-2)",
                  }}>Yosh me'yoriga taqqoslash (Z-score scale)</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)",
                  }}>Z = {summary.zScore.toFixed(2)}</span>
                </div>
                <ZScoreBar z={summary.zScore} />
              </div>
            )}
          </div>

          {/* Right: details */}
          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Test tafsilotlari</div>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18,
                color: "var(--ink)", letterSpacing: "-0.005em",
              }}>{meta.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
                {meta.short} · {TIMEPOINT}
              </div>
            </div>

            <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <DetailRow label="Yakunlangan vaqt"
                value={new Date(result.completedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })} />
              <DetailRow label="Sana"
                value={new Date(result.completedAt).toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" })} />
              {summary && (
                <>
                  <DetailRow label="CogScore" value={`${summary.cogScore} / 100`} mono />
                  <DetailRow label="Z-Score (yosh me'yoriga)" value={summary.zScore?.toFixed(3) ?? "—"} mono />
                  <DetailRow label="ISPOCD"
                    value={
                      <span className={`pill ${summary.ispcd ? "warn" : "ok"}`}>
                        <span className="pill-dot" />
                        {summary.ispcd ? "Musbat" : "Manfiy"}
                      </span>
                    } />
                </>
              )}
            </dl>

            <div style={{ height: 1, background: "var(--divider)" }} />

            <div style={{
              fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.55,
              color: "var(--ink-2)",
            }}>
              Natija bemor kartochkasiga avtomatik saqlandi. KNBT Composite
              hisoblanishi uchun bemor sahifasiga qayting.
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                <Icon name="download" size={14} /> PDF
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                <Icon name="file-text" size={14} /> Hisobot
              </button>
            </div>
          </div>
        </div>

      </main>
    </>
  );
};

// ---------- Raw metrics block — varies by test ----------
const RawMetrics = ({ testId, result }) => {
  const raw = result.raw || {};
  let items = [];
  switch (testId) {
    case "TMT":
      items = [
        { label: "TMT-A vaqti", value: `${raw.aTime?.toFixed(2) ?? "—"} son`, icon: "clock" },
        { label: "TMT-A xatolar", value: raw.aErrors ?? 0, icon: "x-circle" },
        { label: "Bog'langan",   value: `${result.total ?? 25} / ${result.total ?? 25}`, icon: "check-circle" },
      ];
      break;
    case "Stroop":
      items = [
        { label: "To'g'ri", value: `${raw.correct} / ${raw.totalTrials}`, icon: "check" },
        { label: "Xatolar", value: raw.errors, icon: "x" },
        { label: "O'tkazib yub.", value: raw.skipped ?? 0, icon: "skip-forward" },
        { label: "O'rtacha RT", value: `${(raw.totalTimeSec / raw.totalTrials).toFixed(2)} son`, icon: "timer" },
      ];
      break;
    case "DST":
      items = [
        { label: "Forward span", value: raw.forward, icon: "arrow-right" },
        { label: "Backward span", value: raw.backward, icon: "arrow-left" },
        { label: "Jami", value: (raw.forward || 0) + (raw.backward || 0), icon: "sigma" },
      ];
      break;
    case "LMWT":
      items = [
        { label: "V1", value: raw.v1 }, { label: "V2", value: raw.v2 },
        { label: "V3", value: raw.v3 }, { label: "V4", value: raw.v4 }, { label: "V5", value: raw.v5 },
        { label: "Delay", value: raw.vDelay },
      ];
      break;
    case "NS":
      items = [
        { label: "Jami yig'indi", value: `${raw.total} / 95`, icon: "sigma" },
        { label: "MRC", value: raw.mrc }, { label: "DTR", value: raw.dtr },
        { label: "ICARS", value: raw.icars }, { label: "PTA", value: raw.pta },
      ];
      break;
    case "EEG":
      items = [
        { label: "α-amp",  value: raw.alphaAmp + " μV" },
        { label: "θ-amp",  value: raw.thetaAmp + " μV" },
        { label: "IHA-α",  value: raw.ihaAlpha + " %" },
        { label: "SWI-Ant", value: raw.swiAnt + " %" },
        { label: "α-Post", value: raw.alphaPost + " %" },
        { label: "IAF",    value: raw.iaf + " Hz" },
      ];
      break;
    case "Audio":
      items = [
        { label: "To'g'ri", value: `${raw.correct} / ${raw.totalTrials}`, icon: "check" },
        { label: "Xatolar", value: raw.errors, icon: "x" },
        { label: "O'rtacha RT", value: `${(raw.totalTimeSec / raw.totalTrials).toFixed(2)} son`, icon: "timer" },
      ];
      break;
    default:
      items = Object.entries(raw).map(([k, v]) => ({ label: k, value: String(v) }));
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
      {items.map((it, i) => (
        <div key={i} style={{
          padding: 14, background: "var(--surface-2)",
          border: "1px solid var(--border)", borderRadius: 12,
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)",
          }}>{it.label}</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22,
            color: "var(--ink)", letterSpacing: "-0.01em", lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
          }}>{it.value ?? "—"}</div>
        </div>
      ))}
    </div>
  );
};

const DetailRow = ({ label, value, mono }) => (
  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
    <dt style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)" }}>{label}</dt>
    <dd style={{
      margin: 0,
      fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
      fontSize: 13, fontWeight: 500, color: "var(--ink)",
      fontVariantNumeric: mono ? "tabular-nums" : "normal",
      textAlign: "right",
    }}>{value}</dd>
  </div>
);

const ZScoreBar = ({ z }) => {
  // Map z from -4 to +4 onto 0–100%
  const pct = Math.max(0, Math.min(100, ((z + 4) / 8) * 100));
  return (
    <div>
      <div style={{
        position: "relative", height: 14, borderRadius: 999,
        background: `linear-gradient(to right,
            #FECACA 0%, #FECACA 25.5%,
            #FED7AA 25.5%, #FED7AA 37.5%,
            #BFDBFE 37.5%, #BFDBFE 62.5%,
            #BBF7D0 62.5%, #BBF7D0 100%)`,
      }}>
        <div style={{
          position: "absolute", top: -3, bottom: -3,
          left: `calc(${pct}% - 2px)`, width: 4,
          background: "var(--ink)", borderRadius: 2,
          boxShadow: "0 0 0 3px rgba(15, 23, 42, 0.12)",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 8,
        fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)",
        fontVariantNumeric: "tabular-nums",
      }}>
        <span>−4</span><span>−1.96 (ISPOCD)</span><span>0</span><span>+1.96</span><span>+4</span>
      </div>
      <div style={{
        display: "flex", gap: 14, marginTop: 12,
        fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)",
      }}>
        <Legend swatch="#FECACA" label="ISPOCD" />
        <Legend swatch="#FED7AA" label="Past" />
        <Legend swatch="#BFDBFE" label="Me'yor" />
        <Legend swatch="#BBF7D0" label="Yuqori" />
      </div>
    </div>
  );
};

const Legend = ({ swatch, label }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: 10, height: 10, borderRadius: 3, background: swatch }} />
    {label}
  </span>
);

window.Results = Results;
