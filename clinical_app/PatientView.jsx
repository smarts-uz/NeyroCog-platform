const TESTS = [
  { id: "TMT",     name: "Trail Making Test", short: "TMT",
    desc: "Diqqat, vizual qidiruv va kognitiv moslashuvchanlik. Qatorlarni tartibda bog'lash.",
    icon: "git-branch", duration: "3–5 daq", available: true, color: "#0F766E", soft: "#CCFBF1" },
  { id: "Stroop",  name: "Stroop Test", short: "Stroop",
    desc: "Diqqatni boshqarish va interferensiyani yengish.",
    icon: "type", duration: "5–7 daq", available: true, color: "#D97706", soft: "#FEF3C7" },
  { id: "DST",     name: "Digit Span Test", short: "DST",
    desc: "Qisqa muddatli va ishchi xotira.",
    icon: "list-ordered", duration: "4–6 daq", available: true, color: "#2563EB", soft: "#DBEAFE" },
  { id: "LMWT",    name: "Lurya Memory Word", short: "LMWT",
    desc: "Eshitish-og'zaki o'rganish va xotira (Rey AVLT).",
    icon: "book-open", duration: "10–15 daq", available: true, color: "#9333EA", soft: "#F3E8FF" },
  { id: "NS",      name: "Nevrologik holatni baholash", short: "NS",
    desc: "12 ta nevrologik shkala (MRC, DTR, ICARS, …).",
    icon: "stethoscope", duration: "10–15 daq", available: true, color: "#0891B2", soft: "#CFFAFE" },
  { id: "EEG",     name: "EEG ko'rsatkichlari", short: "EEG",
    desc: "Alfa, teta ritmi va asimmetriya indekslari.",
    icon: "activity", duration: "Asbob orqali", available: true, color: "#DB2777", soft: "#FCE7F3" },
  { id: "Audio",   name: "Audio diqqat testi", short: "Audio",
    desc: "Tovushlarni ajratish, diqqat va reaksiya.",
    icon: "ear", duration: "5–7 daq", available: true, color: "#16A34A", soft: "#DCFCE7" },
];

const PatientView = ({ patient, user, activeTimepoint = "PreOp", onChangeTimepoint, onBack, onLogout, onStartTest, onStartTraining }) => {
  const [tab, setTab] = React.useState("tests");
  const trainingSessions = patient.training || [];

  // Build "completed" map for current view: testId → most recent matching result
  const allResults = patient.results || {};
  const completed = React.useMemo(() => {
    const out = {};
    for (const [testId, entry] of Object.entries(allResults)) {
      if (!entry) continue;
      if (activeTimepoint === "latest") {
        // Latest across any timepoint
        let latest = null;
        for (const tp of ["PreOp", "PostOp", "PostTx"]) {
          if (entry[tp] && (!latest || new Date(entry[tp].completedAt) > new Date(latest.completedAt))) {
            latest = entry[tp];
          }
        }
        if (latest) out[testId] = latest;
      } else if (entry[activeTimepoint]) {
        out[testId] = entry[activeTimepoint];
      }
    }
    return out;
  }, [allResults, activeTimepoint]);

  const timepoints = window.TIMEPOINTS || [
    { id: "PreOp", label: "PreOp", sub: "Operatsiyagacha" },
    { id: "PostOp", label: "PostOp", sub: "7–10 kun" },
    { id: "PostTx", label: "PostTx", sub: "Davolashdan keyin" },
  ];

  return (
    <>
      <AppHeader user={user} onLogout={onLogout}
        breadcrumbs={[
          { label: "Bemorlar", onClick: onBack },
          { label: patient.fish },
        ]} />
      <main style={{ padding: "24px 32px 48px", maxWidth: "var(--content-max)", margin: "0 auto" }}>

        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: 14, paddingLeft: 8 }}>
          <Icon name="arrow-left" size={15} /> Bemorlar ro'yxati
        </button>

        {/* Timepoint switcher — research phase selector (single line, scrollable on mobile) */}
        <div data-scroll-x style={{ marginBottom: 18 }}>
          <div style={{
            display: "inline-flex", padding: 4, gap: 2, background: "var(--surface)",
            borderRadius: 14, border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)", width: "max-content",
          }}>
            {timepoints.map(tp => {
              const active = activeTimepoint === tp.id;
              return (
                <button key={tp.id}
                  onClick={() => onChangeTimepoint?.(tp.id)}
                  title={tp.sub}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 10, border: 0, cursor: "pointer",
                    background: active ? (tp.soft || "var(--primary-soft)") : "transparent",
                    color: active ? (tp.textOn || "var(--primary-press)") : "var(--ink-2)",
                    fontFamily: "var(--font-sans)", fontWeight: active ? 700 : 600, fontSize: 13.5,
                    transition: "background 150ms var(--ease), color 150ms var(--ease)",
                    whiteSpace: "nowrap",
                  }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 999,
                    background: active ? (tp.color || "var(--primary)") : "var(--ink-4)",
                    transition: "background 150ms var(--ease)",
                  }} />
                  {tp.label}
                  <span style={{ fontSize: 12, opacity: 0.72, fontWeight: 500 }}>· {tp.sub}</span>
                </button>
              );
            })}
            <button
              onClick={() => onChangeTimepoint?.("latest")}
              title="Har test uchun eng so'nggi natija"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 10, border: 0, cursor: "pointer",
                background: activeTimepoint === "latest" ? "var(--surface-3)" : "transparent",
                color: activeTimepoint === "latest" ? "var(--ink)" : "var(--ink-2)",
                fontFamily: "var(--font-sans)", fontWeight: activeTimepoint === "latest" ? 700 : 600, fontSize: 13.5,
                whiteSpace: "nowrap",
                marginLeft: 4, borderLeft: "1px solid var(--divider)", paddingLeft: 16,
              }}>
              <Icon name="history" size={14} /> Eng so'nggi
            </button>
          </div>
        </div>

        <div data-grid="patient" style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }}>

          {/* Left column: patient info card + (when on rehab tab) rehab progress card as separate sibling */}
          <div className="ktt-patient-aside" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: "calc(var(--header-h) + 16px)" }}>
            <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 999,
                background: "var(--primary-soft)", color: "var(--primary-press)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18,
              }}>{patient.fish.split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
              <div>
                <div style={{
                  fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18,
                  letterSpacing: "-0.01em", color: "var(--ink)",
                }}>{patient.fish}</div>
                <div style={{
                  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)",
                  marginTop: 2,
                }}>№ {patient.id} · ro'yxatga olingan {patient.sana}</div>
              </div>
            </div>

            <div style={{ height: 1, background: "var(--divider)" }} />

            <dl style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", margin: 0 }}>
              <Field label="Jinsi" value={
                patient.jinsi
                  ? <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 13,
                      color: "var(--ink)",
                    }}>
                      <Icon name="user" size={13} style={{ color: "var(--ink-3)" }} /> {patient.jinsi}
                    </span>
                  : "—"
              } />
              <Field label="Yoshi" value={`${patient.yosh}`} />
              {patient.tugilgan && (
                <Field label="Tug'ilgan sana"
                  value={new Date(patient.tugilgan).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" })} />
              )}
              <Field label="Premorbid Fon" value={
                Number(patient.premorbid) > 0
                  ? <span className="pill warn"><span className="pill-dot" /> Mavjud</span>
                  : <span className="pill ok"><span className="pill-dot" /> Yo'q</span>
              } />
              <Field label="Davomiyligi" value={`${patient.davom} daqiqa`} />
              <Field label="Preparatlar soni" value={patient.prep} mono />
            </dl>

            {(patient.boshlanish || patient.tugash) && (
              <>
                <div style={{ height: 1, background: "var(--divider)" }} />
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Amaliyot vaqtlari</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {patient.boshlanish && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <Icon name="play" size={13} style={{ color: "var(--ok)" }} />
                        <span style={{ color: "var(--ink-3)" }}>Boshlanish:</span>
                        <span className="num" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--ink)" }}>
                          {new Date(patient.boshlanish).toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                    {patient.tugash && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <Icon name="square" size={13} style={{ color: "var(--err)" }} />
                        <span style={{ color: "var(--ink-3)" }}>Tugash:</span>
                        <span className="num" style={{ fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--ink)" }}>
                          {new Date(patient.tugash).toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div style={{ height: 1, background: "var(--divider)" }} />

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                <Icon name="edit-3" size={14} /> Tahrirlash
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                <Icon name="download" size={14} /> Eksport
              </button>
            </div>
            </div>{/* end patient info card */}

            {/* Rehab progress — SEPARATE card, sibling to patient info */}
            {tab === "rehab" && <RehabSidebarProgress patient={patient} />}
          </div>{/* end left column */}

          {/* Right: tab content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Tab bar — scrollable on mobile */}
            <div data-scroll-x style={{ alignSelf: "stretch" }}>
            <div style={{
              display: "inline-flex", padding: 4, gap: 2, background: "var(--surface-2)",
              borderRadius: 12, border: "1px solid var(--border)",
              width: "max-content", maxWidth: "100%",
            }}>
              <TabButton active={tab === "tests"} onClick={() => setTab("tests")}
                icon="clipboard-list"
                label="Diagnostik testlar"
                count={`${Object.keys(completed).length}/${TESTS.length}`} />
              <TabButton active={tab === "forecast"} onClick={() => setTab("forecast")}
                icon="trending-up"
                label="PNB prognozi"
                accent />
              <TabButton active={tab === "rehab"} onClick={() => setTab("rehab")}
                icon="brain"
                label="Reabilitatsiya"
                count={trainingSessions.length > 0 ? `${trainingSessions.length}` : null}
                accent />
            </div>
            </div>

            {tab === "tests" && (
              <>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <div>
                    <h2 style={{
                      fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22,
                      letterSpacing: "-0.015em", color: "var(--ink)", margin: 0,
                    }}>Diagnostik testlar</h2>
                    <p style={{
                      fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)",
                      margin: "4px 0 0",
                    }}>Bemor uchun mavjud sinovlar. Bossangiz — test boshlanadi.</p>
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)" }}>
                    <b style={{ color: "var(--ink)" }}>{Object.keys(completed).length}</b> / {TESTS.length} bajarilgan
                  </div>
                </div>

                <div data-grid="3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {TESTS.map(t => {
                    const done = completed[t.id];
                    return (
                      <TestCard key={t.id}
                        test={t}
                        done={done}
                        onStart={() => onStartTest(t.id)}
                      />
                    );
                  })}
                </div>

                {/* KNBT Composite panel */}
                <div style={{ marginTop: 18 }}>
                  <Composite patient={patient} timepoint={activeTimepoint} />
                </div>
              </>
            )}

            {tab === "forecast" && (
              <PNBForecast patient={patient} />
            )}

            {tab === "rehab" && (
              <RehabHub patient={patient} onStartTraining={onStartTraining} />
            )}
          </div>
        </div>
      </main>
    </>
  );
};

const TestCard = ({ test, done, onStart }) => {
  const disabled = !test.available;
  return (
    <button
      onClick={disabled ? undefined : onStart}
      disabled={disabled}
      style={{
        textAlign: "left",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: 18,
        display: "flex", flexDirection: "column", gap: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        boxShadow: "var(--shadow-xs)",
        transition: "transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease), border-color var(--dur) var(--ease)",
        position: "relative",
        fontFamily: "inherit",
      }}
      onMouseEnter={e => {
        if (disabled) return;
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "var(--shadow-xs)";
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: test.soft, color: test.color,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={test.icon} size={24} style={{ strokeWidth: 2 }} />
        </div>
        {done && (
          <span className="pill ok"><span className="pill-dot" />Bajarilgan</span>
        )}
        {!test.available && (
          <span className="pill"><span className="pill-dot" />Tez kunda</span>
        )}
      </div>
      <div>
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16,
          color: "var(--ink)", letterSpacing: "-0.005em",
        }}>{test.name}</div>
        <div className="num" style={{
          fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-3)",
          marginTop: 3, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600,
        }}>{test.short} · {test.duration}</div>
      </div>
      <p style={{
        fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5,
        color: "var(--ink-2)", margin: 0,
      }}>{test.desc}</p>
      {test.available && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
          color: test.color, marginTop: "auto", paddingTop: 6,
        }}>
          {done ? "Qaytadan o'tkazish" : "Testni boshlash"} <Icon name="arrow-right" size={14} />
        </div>
      )}
    </button>
  );
};

window.PatientView = PatientView;

const Field = ({ label, value, mono }) => (
  <div>
    <dt style={{
      fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)",
      letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600,
      marginBottom: 4,
    }}>{label}</dt>
    <dd style={{
      margin: 0,
      fontFamily: mono ? "var(--font-sans)" : "var(--font-sans)",
      fontSize: 14, color: "var(--ink)", fontWeight: 500,
      fontVariantNumeric: mono ? "tabular-nums" : "normal",
    }}>{value}</dd>
  </div>
);

const TabButton = ({ active, onClick, icon, label, count, accent }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 7,
    padding: "8px 14px", borderRadius: 9, border: 0, cursor: "pointer",
    background: active ? "var(--surface)" : "transparent",
    color: active ? (accent ? "var(--primary-press)" : "var(--ink)") : "var(--ink-2)",
    boxShadow: active ? "var(--shadow-sm)" : "none",
    fontFamily: "var(--font-sans)", fontWeight: active ? 700 : 600, fontSize: 13.5,
    transition: "background 150ms var(--ease), color 150ms var(--ease), box-shadow 150ms var(--ease)",
    whiteSpace: "nowrap", letterSpacing: "-0.003em",
  }}>
    <Icon name={icon} size={16} />
    {label}
    {count && (
      <span className="num" style={{
        fontSize: 11.5, fontWeight: 700,
        padding: "1px 7px", borderRadius: 999, minWidth: 18, textAlign: "center",
        background: active ? (accent ? "var(--primary-soft)" : "var(--surface-3)") : "rgba(15,23,42,0.07)",
        color: active && accent ? "var(--primary-press)" : "var(--ink-3)",
      }}>{count}</span>
    )}
  </button>
);
