// EEG — measurements form. Clinician enters values read from EEG equipment.

const EEG_FIELDS = [
  { key: "alphaAmp",  name: "O'rtacha alfa-ritm amplituda",  short: "α-amp (EC)", unit: "μV", min: 0, max: 80, step: 0.5, ref: "15–40 μV" },
  { key: "thetaAmp",  name: "O'rtacha teta-ritm amplituda",  short: "θ-amp (EC)", unit: "μV", min: 0, max: 80, step: 0.5, ref: "<25 μV" },
  { key: "ihaAlpha",  name: "Yarimsharchalararo asimmetriya", short: "IHA-α (EC)", unit: "%",  min: -50, max: 50, step: 1, ref: "−10 … +10%" },
  { key: "swiAnt",    name: "Old sohalardagi sekin to'lqin",  short: "SWI-Ant",    unit: "%",  min: 0, max: 100, step: 1, ref: "<20%" },
  { key: "alphaPost", name: "Orqa alfa-ritm indeksi",         short: "α-Idx-Post", unit: "%",  min: 0, max: 100, step: 1, ref: "25–60%" },
  { key: "iaf",       name: "Individual alfa chastotasi",     short: "IAF",        unit: "Hz", min: 4, max: 14, step: 0.1, ref: "8–12 Hz" },
];

const EEGTest = ({ patient, onAbort, onFinish }) => {
  const test = window.KNBT.TEST_META.EEG;
  const [phase, setPhase] = React.useState("intro");
  const [vals, setVals] = React.useState(Object.fromEntries(EEG_FIELDS.map(f => [f.key, ""])));
  const set = (k, v) => setVals(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e?.preventDefault?.();
    const raw = Object.fromEntries(EEG_FIELDS.map(f => [f.key, parseFloat(vals[f.key]) || 0]));
    raw.thetaAlpha = raw.alphaAmp > 0 ? raw.thetaAmp / raw.alphaAmp : 0;
    onFinish({ test: "EEG", raw, completedAt: new Date().toISOString() });
  };

  return (
    <TestShell
      patient={patient} test={test} phase={phase === "intro" ? "intro" : "running"}
      onAbort={onAbort}
      intro={
        <TestIntro test={test}
          title="EEG ko'rsatkichlari"
          description="EEG qurilmasidan o'qilgan asosiy ritm ko'rsatkichlarini kiriting. Ko'rsatkichlar ko'zlar yumuq (EC) holatda olingan bo'lishi kerak."
          steps={[
            "Bemorni tinch holatda, ko'zlar yumuq holda yozib oling (2–3 daq).",
            "Qurilma dasturidan keltirilgan asosiy ko'rsatkichlarni o'qing.",
            "Har bir maydonga aniq qiymat kiriting.",
          ]}
          note="Bu asboblardan olingan ma'lumotlar — formula automatic hisoblanadi."
          onStart={() => setPhase("entry")}
          ctaLabel="Ko'rsatkichlarni kiritish"
        />
      }
      body={
        <form onSubmit={submit} className="card" style={{
          width: 720, padding: 32,
          display: "flex", flexDirection: "column", gap: 16,
          boxShadow: "var(--shadow-md)",
        }}>
          <div className="eyebrow">EEG ma'lumotlari (EC — ko'zlar yumuq)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {EEG_FIELDS.map(f => (
              <div key={f.key}>
                <label className="label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{f.name}</span>
                  <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{f.short}</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type="number" step={f.step} min={f.min} max={f.max}
                    value={vals[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.ref}
                    style={{
                      paddingRight: 48,
                      fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums",
                    }}
                    required
                  />
                  <span style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)",
                  }}>{f.unit}</span>
                </div>
                <div style={{ marginTop: 4, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)" }}>
                  Me'yor: {f.ref}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            display: "flex", gap: 10, justifyContent: "flex-end",
            paddingTop: 12, borderTop: "1px solid var(--divider)",
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

window.EEGTest = EEGTest;
