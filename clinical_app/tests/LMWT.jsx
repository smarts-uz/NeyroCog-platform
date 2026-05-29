// LMWT — Lurya Memory Word Test (Rey AVLT-style).
// 15 ta so'z 5 marta o'qib beriladi. Har urinishdan keyin bemor eslagan
// so'zlar sonini qayd etamiz. So'ng 30-60 daq dam olishdan keyin yana
// (delayed recall).
//
// Bu test mutlaqo manual: shifokor / texnik so'zlarni o'qib beradi
// va bemor javoblarini hisoblab forma kiritadi.

const LMWT_WORDS = [
  "stol", "g'ildirak", "uy", "qaymoq", "olma",
  "kitob", "tarvuz", "tog'", "shisha", "soat",
  "qaychi", "qor", "tuxum", "yulduz", "qush",
];

const LMWTTest = ({ patient, onAbort, onFinish }) => {
  const test = window.KNBT.TEST_META.LMWT;
  const [phase, setPhase] = React.useState("intro");
  const [vals, setVals] = React.useState({ v1: "", v2: "", v3: "", v4: "", v5: "", vDelay: "" });

  const set = (k, v) => setVals(f => ({ ...f, [k]: v.replace(/\D/g, "") }));

  const submit = (e) => {
    e?.preventDefault?.();
    const raw = {
      v1: +vals.v1 || 0, v2: +vals.v2 || 0, v3: +vals.v3 || 0,
      v4: +vals.v4 || 0, v5: +vals.v5 || 0, vDelay: +vals.vDelay || 0,
    };
    onFinish({
      test: "LMWT",
      raw,
      completedAt: new Date().toISOString(),
    });
  };

  const trials = [
    { key: "v1",     label: "1-urinish (V1)",   max: 15 },
    { key: "v2",     label: "2-urinish (V2)",   max: 15 },
    { key: "v3",     label: "3-urinish (V3)",   max: 15 },
    { key: "v4",     label: "4-urinish (V4)",   max: 15 },
    { key: "v5",     label: "5-urinish (V5)",   max: 15 },
    { key: "vDelay", label: "30–60 daq (V_Delay)", max: 15, accent: true },
  ];

  const total = trials.slice(0, 5).reduce((a, t) => a + (+vals[t.key] || 0), 0);

  return (
    <TestShell
      patient={patient} test={test} phase={phase === "intro" ? "intro" : "running"}
      onAbort={onAbort}
      intro={
        <TestIntro test={test}
          title="Lurya Memory Word Test (LMWT)"
          description="15 ta umumiy so'z bemorga 5 marta ketma-ket o'qib beriladi. Har urinishdan keyin bemor eslab qolgan so'zlar soni qayd etiladi. 30–60 daqiqadan keyin oxirgi marta (delayed recall) yana o'qish so'raladi."
          steps={[
            "So'zlarni bemorga sekin va aniq o'qing — taxminan 1 s/so'z.",
            "Har urinishdan keyin bemordan eslab qolgan so'zlarni so'rang.",
            "Tartib muhim emas — faqat to'g'ri eslab qolingan so'zlar soni.",
            "Yakuniy delayed recall — 30–60 daq dam olishdan keyin (so'zlarni qayta o'qimasdan).",
          ]}
          onStart={() => setPhase("entry")}
          ctaLabel="Natijalarni kiritish"
        />
      }
      body={
        <form onSubmit={submit} className="card" style={{
          width: 720, padding: 32,
          display: "flex", flexDirection: "column", gap: 20,
          boxShadow: "var(--shadow-md)",
        }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>So'zlar ro'yxati</div>
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 6,
              padding: "10px 14px",
              background: "var(--surface-2)",
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}>
              {LMWT_WORDS.map((w, i) => (
                <span key={i} style={{
                  fontFamily: "var(--font-mono)", fontSize: 13,
                  padding: "3px 8px", borderRadius: 6,
                  background: "var(--surface)", color: "var(--ink)",
                  border: "1px solid var(--border)",
                }}>{w}</span>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {trials.map(t => (
              <div key={t.key}>
                <label className="label" style={t.accent ? { color: "var(--primary-press)", fontWeight: 600 } : undefined}>
                  {t.label}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type="number"
                    min="0" max={t.max}
                    value={vals[t.key]}
                    onChange={e => set(t.key, e.target.value)}
                    placeholder="0"
                    style={{
                      paddingRight: 56,
                      fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                    required={t.key !== "vDelay"}
                  />
                  <span style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)",
                  }}>/ {t.max}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
            padding: "14px 16px", background: "var(--surface-2)", borderRadius: 12,
          }}>
            <Stat label="Jami V1–V5" value={total} max={75} />
            <Stat label="O'rganish dinamikasi" value={(+vals.v5 || 0) - (+vals.v1 || 0)} />
            <Stat label="Saqlash %"
              value={
                (+vals.v5 > 0)
                  ? Math.round(((+vals.vDelay || 0) / +vals.v5) * 100) + "%"
                  : "—"
              } />
          </div>

          <div style={{
            display: "flex", gap: 10, justifyContent: "flex-end",
            paddingTop: 8, borderTop: "1px solid var(--divider)",
          }}>
            <button type="button" className="btn btn-secondary" onClick={onAbort}>Bekor qilish</button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={16} /> Saqlash va davom etish
            </button>
          </div>
        </form>
      }
    />
  );
};

const Stat = ({ label, value, max }) => (
  <div>
    <div style={{
      fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)",
      letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600,
      marginBottom: 3,
    }}>{label}</div>
    <div style={{
      fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18,
      color: "var(--ink)", fontVariantNumeric: "tabular-nums",
    }}>{value}{max ? <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500 }}> / {max}</span> : null}</div>
  </div>
);

window.LMWTTest = LMWTTest;
window.LMWT_Stat = Stat;
