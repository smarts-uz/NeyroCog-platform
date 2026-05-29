// Clean date formatter — "2013-08-04" → "04.08.2013" (avoids ugly uz-UZ "2013 M08 04").
const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d)) return String(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
};

const TESTS = [
  { id: "TMT",     name: "Trail Making Test", short: "TMT",    desc: "Diqqat, vizual qidiruv va kognitiv moslashuvchanlik. Qatorlarni tartibda bog'lash.",
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
  { id: "Audio",   name: "Audio diqqat testi", short: "Audio",
    desc: "Tovushlarni ajratish, diqqat va reaksiya.",
    icon: "ear", duration: "5–7 daq", available: true, color: "#16A34A", soft: "#DCFCE7" },
  { id: "EEG",     name: "EEG ko'rsatkichlari", short: "EEG",
    desc: "Alfa, teta ritmi va asimmetriya indekslari.",
    icon: "activity", duration: "Asbob orqali", available: true, color: "#DB2777", soft: "#FCE7F3" },
];

// Har bosqich uchun test to'plami. PreOp = 5 ta kognitiv test (TMT, Stroop, DST,
// LMWT, NS). Audio (eshitish gnozisi) va EEG faqat operatsiyadan keyin baholanadi.
const TIMEPOINT_TESTS = {
  PreOp:  ["TMT", "Stroop", "DST", "LMWT", "NS"],
  PostOp: ["TMT", "Stroop", "DST", "LMWT", "NS", "Audio", "EEG"],
  PostTx: ["TMT", "Stroop", "DST", "LMWT", "NS", "Audio", "EEG"],
};
const testsForTp = (tpId) => {
  const ids = TIMEPOINT_TESTS[tpId] || TESTS.map(t => t.id);
  return TESTS.filter(t => ids.includes(t.id));
};

const PatientView = ({ patient, user, activeTimepoint = "PreOp", onChangeTimepoint, initialView = "hub", onChangeView, onBack, onLogout, onStartTest, onStartTraining, onUpdatePatient, onDeleteResult, onDeleteTraining }) => {
  const [view, setViewRaw] = React.useState(initialView); // hub | tests | forecast | rehab
  React.useEffect(() => { setViewRaw(initialView); }, [initialView]);
  const setView = (v) => { setViewRaw(v); onChangeView && onChangeView(v); };
  const [editing, setEditing] = React.useState(false);
  const [blockedTest, setBlockedTest] = React.useState(null); // {test, nextTp} when next stage already started
  const [confirmDelete, setConfirmDelete] = React.useState(null); // {kind:'test'|'rehab', id, name}
  const trainingSessions = patient.training || [];

  // Escape closes any open PatientView modal/overlay.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setBlockedTest(null);
      setConfirmDelete(null);
      setEditing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const exportPatient = () => {
    if (!window.buildPatientReport) { alert("Hisobot moduli yuklanmadi."); return; }
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) { alert("Pop-up bloklashni o'chiring va qaytadan urinib ko'ring."); return; }
    win.document.write(window.buildPatientReport(patient));
    win.document.close();
    setTimeout(() => { try { win.print(); } catch (e) {} }, 500);
  };

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

  // How many tests completed at a given timepoint (only counts tests in that timepoint's set)
  const tpCount = (tpId) => {
    const ids = TIMEPOINT_TESTS[tpId] || TESTS.map(t => t.id);
    let n = 0;
    for (const testId of ids) {
      if (allResults[testId] && allResults[testId][tpId]) n++;
    }
    return n;
  };

  // Per-test status at a timepoint: {id, short, done, z, score, color}
  const zColor = (done, z) => {
    if (!done) return { bg: "var(--surface-3)", fg: "var(--ink-4)" };       // not done
    if (z == null || isNaN(z)) return { bg: "var(--surface-3)", fg: "var(--ink-3)" };
    if (z <= -1.96) return { bg: "var(--err-bg)", fg: "var(--err)" };        // ISPOCD
    if (z < -1.0)   return { bg: "var(--warn-bg)", fg: "var(--warn)" };       // borderline
    return { bg: "var(--ok-bg)", fg: "var(--ok)" };                          // normal
  };
  const tpTestStatuses = (tpId) => testsForTp(tpId).map(t => {
    const r = allResults[t.id] && allResults[t.id][tpId];
    if (!r || !r.raw || !window.KNBT) return { id: t.id, short: t.short, done: false };
    try {
      const s = window.KNBT.summarizeTest(t.id, r.raw, tpId, patient);
      return { id: t.id, short: t.short, done: true, z: s.zScore, score: s.cogScore };
    } catch (e) { return { id: t.id, short: t.short, done: true }; }
  });

  // Composite ISPOCD for a timepoint → true means significant cognitive impairment
  // (PNB positive) at that stage. Used to flag the timepoint card red.
  const tpComposite = (tpId) => {
    if (!window.KNBT) return null;
    const sumByTest = {};
    for (const t of testsForTp(tpId)) {
      const r = allResults[t.id] && allResults[t.id][tpId];
      if (r && r.raw) {
        try { sumByTest[t.id] = window.KNBT.summarizeTest(t.id, r.raw, tpId, patient); } catch (e) {}
      }
    }
    if (Object.keys(sumByTest).length === 0) return null;
    try { return window.KNBT.summarizeComposite(sumByTest, tpId); } catch (e) { return null; }
  };

  // Dynamic breadcrumb trail reflecting the current view.
  const tpLabel = (timepoints.find(t => t.id === activeTimepoint) || {}).label || activeTimepoint;
  const crumbs = [
    { label: "Asosiy", onClick: onBack },
    { label: patient.fish, onClick: () => setView("hub") },
  ];
  if (view === "tests") {
    crumbs.push({ label: "Diagnostika", onClick: () => setView("hub") });
    crumbs.push({ label: tpLabel });
  } else if (view === "forecast") {
    crumbs.push({ label: "Ehtimoli" });
  } else if (view === "rehab") {
    crumbs.push({ label: "Reabilitatsiya" });
  }

  // Bold, centered page title shown in the top header.
  const pageTitle =
    view === "tests" ? "Diagnostik testlar" :
    view === "forecast" ? "PNB rivojlanish ehtimoli" :
    view === "rehab" ? "Operatsiyadan keyingi kognitiv reabilitatsiya" :
    "Bemor klinik kartasi";

  return (
    <>
      <AppHeader user={user} onLogout={onLogout} breadcrumbs={crumbs} title={pageTitle}
        onBack={view === "hub" ? onBack : () => setView("hub")} />
      <main style={{ padding: "24px 32px 48px", maxWidth: "var(--content-max)", margin: "0 auto" }}>


        <div data-grid="patient" style={{ display: "grid", gridTemplateColumns: "340px minmax(0, 1fr)", gap: 24, alignItems: "start" }}>

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
                }}>№ {patient.id}</div>
                <div style={{
                  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)",
                  marginTop: 1,
                }}>Sana: {fmtDate(patient.sana)}</div>
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
                      <Icon name="user" size={13} style={{ color: "var(--ink-3)" }} /> {jinsLabel(patient.jinsi)}
                    </span>
                  : "—"
              } />
              <Field label="Yoshi" value={`${patient.yosh}`} />
              {patient.tugilgan && (
                <Field label="Tug'ilgan sana"
                  value={fmtDate(patient.tugilgan)} />
              )}
              <Field label="Premorbid Fon" value={
                Number(patient.premorbid) > 0
                  ? <span className="pill warn"><span className="pill-dot" /> Mavjud</span>
                  : <span className="pill ok"><span className="pill-dot" /> Yo'q</span>
              } />
              <Field label="Davomiyligi" value={`${patient.davom} daqiqa`} />
              <Field label="Dori soni" value={patient.prep} mono />
            </dl>

            <div style={{ height: 1, background: "var(--divider)" }} />

            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setEditing(true)}>
                <Icon name="edit-3" size={14} /> Tahrirlash
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}
                onClick={exportPatient}>
                <Icon name="download" size={14} /> Eksport
              </button>
            </div>
            </div>{/* end patient info card */}
            {view === "rehab" && <RehabSidebarGoal patient={patient} />}
          </div>{/* end left column */}

          {/* Right: hub or module content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {view === "hub" && (
              <div className="ktt-anim-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Full-width Diagnostik testlar block with 3 timepoint entry links */}
                <div className="card" style={{ padding: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: "var(--primary-soft)", color: "var(--primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Icon name="clipboard-list" size={22} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--ink)", letterSpacing: "-0.01em" }}>Diagnostik testlar</div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)" }}>KNBT batareyasi · bosqichni tanlang</div>
                    </div>
                    {(() => {
                      const total = timepoints.reduce((a, tp) => a + testsForTp(tp.id).length, 0);
                      const done = timepoints.reduce((a, tp) => a + tpCount(tp.id), 0);
                      const pct = total ? Math.round((done / total) * 100) : 0;
                      const R = 18, C = 2 * Math.PI * R;
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                            <span className="num" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 20, color: "var(--primary)", lineHeight: 1, letterSpacing: "-0.02em" }}>{pct}%</span>
                            <span className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, color: "var(--ink-3)" }}>{done}/{total} test</span>
                          </div>
                          <svg width="44" height="44" viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
                            <circle cx="22" cy="22" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="5" />
                            <circle cx="22" cy="22" r={R} fill="none" stroke="#0F766E" strokeWidth="5" strokeLinecap="round"
                              strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)}
                              transform="rotate(-90 22 22)" style={{ transition: "stroke-dashoffset 500ms var(--ease)" }} />
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                  <div data-grid="3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {timepoints.map(tp => {
                      const cnt = tpCount(tp.id);
                      const statuses = tpTestStatuses(tp.id);
                      const comp = tpComposite(tp.id);
                      const pocd = !!(comp && comp.ispcd);
                      return (
                        <button key={tp.id} className="ktt-lift ktt-tap"
                          onClick={() => { onChangeTimepoint?.(tp.id); setView("tests"); }}
                          style={{
                            textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                            background: "var(--surface-2)",
                            border: `1px solid ${tp.color}33`,
                            borderRadius: "var(--r-md)", padding: 16,
                            display: "flex", flexDirection: "column", gap: 10,
                          }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                              <span style={{ width: 9, height: 9, borderRadius: 999, background: pocd ? "var(--err)" : tp.color }} />
                              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{tp.label}</span>
                            </span>
                            {cnt > 0 && (
                              pocd
                                ? <span className="pill" style={{ padding: "1px 8px", background: "var(--err)", color: "#FFF" }}><span className="pill-dot" style={{ background: "#FFF" }} />{cnt}/{testsForTp(tp.id).length} · PNB+</span>
                                : <span className="pill ok" style={{ padding: "1px 8px" }}><span className="pill-dot" />{cnt}/{testsForTp(tp.id).length}</span>
                            )}
                          </div>
                          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.4 }}>{tp.sub}</div>

                          {/* Per-test status chips, colored by Z-score */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {statuses.map(s => {
                              const c = zColor(s.done, s.z);
                              return (
                                <span key={s.id}
                                  title={s.done ? `${s.short}: ${s.score ?? "—"} ball · Z ${s.z != null ? s.z.toFixed(2) : "—"}` : `${s.short}: bajarilmagan`}
                                  className="num"
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: 3,
                                    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 10.5,
                                    padding: "2px 6px", borderRadius: 6,
                                    background: c.bg, color: c.fg,
                                    border: s.done ? "0" : "1px dashed var(--border-strong)",
                                  }}>
                                  {s.short}{s.done && s.score != null ? ` ${Math.round(s.score)}` : ""}
                                </span>
                              );
                            })}
                          </div>

                          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: tp.color, marginTop: "auto" }}>
                            {cnt > 0 ? "Davom etish" : "Boshlash"} <Icon name="arrow-right" size={14} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ehtimol + Rehab — 2 cards below */}
                <div data-grid="2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {(() => {
                    // PNB forecast summary for the card
                    let riskBadge = "Tahlil uchun ma'lumot yetarli emas";
                    let forecast = null;
                    try {
                      if (window.PNBPredictor && patient.davom > 0) {
                        forecast = window.PNBPredictor.forecast(patient);
                        riskBadge = `Xavf ${Math.round(forecast.composite.risk.prob * 100)}% · CogScore ${Math.round(forecast.composite.severity.score)}`;
                      }
                    } catch (e) {}
                    // Completed PreOp tests → per-test risk + predicted cogscore
                    const preopDone = TESTS.filter(t => allResults[t.id] && allResults[t.id].PreOp);
                    // Rehab progress summary
                    const sessions = patient.training || [];
                    const doneExIds = new Set(sessions.map(s => s.exerciseId));
                    const totalEx = Object.keys(window.TRAINING_META || {}).length || 50;
                    const doneEx = doneExIds.size;
                    const pct = Math.round((doneEx / totalEx) * 100);
                    const doneDomains = new Set();
                    doneExIds.forEach(id => { const m = (window.TRAINING_META || {})[id]; if (m) doneDomains.add(m.domain); });
                    const totalDomains = (window.TRAINING_DOMAINS || []).length || 10;
                    const rehabBadge = doneEx > 0
                      ? `${doneDomains.size}/${totalDomains} domen · ${doneEx}/${totalEx} (${pct}%)`
                      : "Boshlanmagan · 0/" + totalEx;
                    // Forecast card tint by PNB probability: <51 default, 51–80 warn, 81+ err.
                    const fcProb = forecast ? Math.round(forecast.composite.risk.prob * 100) : null;
                    const fcTone = fcProb == null ? null : fcProb >= 81 ? "err" : fcProb >= 51 ? "warn" : null;
                    const fcBg = fcTone === "err" ? "var(--err-bg)" : fcTone === "warn" ? "var(--warn-bg)" : "var(--surface)";
                    const fcBorder = fcTone === "err" ? "var(--err)" : fcTone === "warn" ? "var(--warn)" : "var(--border)";
                    return (
                      <>
                        {/* PNB ehtimoli — custom taller card with per-test breakdown */}
                        <button onClick={() => setView("forecast")} className="ktt-lift ktt-tap" style={{
                          textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)",
                          borderRadius: "var(--r-lg)", padding: 20, display: "flex", flexDirection: "column", gap: 12,
                          cursor: "pointer", fontFamily: "inherit",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 13, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon name="trending-up" size={24} />
                            </div>
                            <div>
                              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 17, color: "var(--ink)", letterSpacing: "-0.01em" }}>PNB ehtimoli</div>
                            </div>
                          </div>

                          {forecast ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, borderTop: "1px solid var(--divider)", paddingTop: 14 }}>
                              {(() => {
                                const prob = Math.round(forecast.composite.risk.prob * 100);
                                const cog = Math.round(forecast.composite.severity.score);
                                const probColor = prob >= 70 ? "var(--err)" : prob >= 45 ? "var(--warn)" : "var(--ok)";
                                return (
                                  <>
                                    <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)" }}>PNB ehtimoli</span>
                                      <span style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                                        <span className="num" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 17, lineHeight: 1, color: probColor, letterSpacing: "-0.02em" }}>{prob}</span>
                                        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11, color: probColor }}>%</span>
                                      </span>
                                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--ink-4)" }}>Logistik regressiya</span>
                                    </div>
                                    <div style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-3)" }}>Kutilgan CogScore</span>
                                      <span style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                                        <span className="num" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 17, lineHeight: 1, color: "var(--accent)", letterSpacing: "-0.02em" }}>{cog}</span>
                                        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11, color: "var(--ink-4)" }}>/ 100</span>
                                      </span>
                                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10.5, color: "var(--ink-4)" }}>PostOp (MLR)</span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)", margin: 0, borderTop: "1px solid var(--divider)", paddingTop: 10 }}>
                              Bemor ma'lumotlari (amaliyot davomiyligi) kiritilgach, PNB xavfi va kutilgan CogScore shu yerda ko'rinadi.
                            </p>
                          )}

                          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: "var(--accent)", marginTop: "auto" }}>
                            To'liq tahlil <Icon name="arrow-right" size={15} />
                          </div>
                        </button>

                        <ModuleCard
                          icon="brain" color="#7C3AED" soft="#EDE9FE"
                          title="Reabilitatsiya"
                          desc="50 ta raqamli kognitiv trening, 10 domen, adaptiv qiyinlik."
                          badge={rehabBadge}
                          progress={doneEx > 0 ? pct : null}
                          cta="Davom etish"
                          onClick={() => setView("rehab")}
                          rehabBreakdown={(() => {
                            const totalMin = Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60000);
                            const domains = (window.TRAINING_DOMAINS || []).map(d => {
                              const exs = Object.values(window.TRAINING_META || {}).filter(e => e.domain === d.name);
                              const done = exs.filter(e => doneExIds.has(e.id)).length;
                              return { name: d.name, color: d.color, icon: d.icon, done, total: exs.length };
                            });
                            return { domains, totalMin, doneEx, totalEx, pct };
                          })()} />
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {view === "tests" && (
              <div className="ktt-anim-fade">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
                    {tpLabel} <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>bosqichi</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)" }}>
                    <b style={{ color: "var(--ink)" }}>{Object.keys(completed).length}</b> / {TESTS.length} bajarilgan
                  </div>
                </div>

                <div data-grid="3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 14 }}>
                  {(() => {
                    const order = timepoints.map(tp => tp.id);
                    const ni = order.indexOf(activeTimepoint) + 1;
                    const nextTp = order[ni] || null;
                    const nextStarted = nextTp ? tpCount(nextTp) > 0 : false;
                    return testsForTp(activeTimepoint).map(t => {
                      const done = completed[t.id];
                      return (
                        <TestCard key={t.id}
                          test={t}
                          done={done}
                          patient={patient}
                          timepoint={activeTimepoint}
                          nextStarted={nextStarted}
                          onBlocked={() => setBlockedTest({ test: t, nextTp })}
                          onStart={() => onStartTest(t.id)}
                          onRequestDelete={() => setConfirmDelete({ kind: "test", id: t.id, name: t.name })}
                        />
                      );
                    });
                  })()}
                </div>

                {/* KNBT Composite panel (hero only; per-test breakdown now lives in cards) */}
                <div style={{ marginTop: 18 }}>
                  <Composite patient={patient} timepoint={activeTimepoint} hideBreakdown />
                </div>
              </div>
            )}

            {view === "forecast" && (
              <div className="ktt-anim-fade"><PNBForecast patient={patient} /></div>
            )}

            {view === "rehab" && (
              <div className="ktt-anim-fade"><RehabHub patient={patient} onStartTraining={onStartTraining}
                onRequestDelete={(ex) => setConfirmDelete({ kind: "rehab", id: ex.id, name: ex.name })} /></div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      {editing && window.NewPatientModal && React.createElement(window.NewPatientModal, {
        open: true,
        initial: patient,
        title: "Bemorni tahrirlash",
        saveLabel: "O'zgarishlarni saqlash",
        onClose: () => setEditing(false),
        onSave: (patch) => { onUpdatePatient && onUpdatePatient(patient.id, patch); setEditing(false); },
      })}

      {blockedTest && (
        <div onClick={() => setBlockedTest(null)} style={{
          position: "fixed", inset: 0, zIndex: 150, background: "rgba(15,23,42,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} className="card ktt-anim-scale" style={{
            width: "min(460px, 100%)", padding: 26, display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                background: "var(--warn-bg)", color: "#9A6700",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Icon name="alert-triangle" size={24} /></div>
              <div>
                <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                  Keyingi bosqich testlaridan o'tishni boshladingiz
                </h3>
                <p style={{ margin: "6px 0 0", fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>
                  Bu bemor uchun <b>{(timepoints.find(t => t.id === blockedTest.nextTp) || {}).label || blockedTest.nextTp}</b> bosqichi testlari allaqachon boshlangan.
                  Oldingi bosqich («{tpLabel}») natijalarini o'zgartirish tavsiya etilmaydi.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--divider)", paddingTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setBlockedTest(null)}>Yopish</button>
              <button className="btn btn-primary" onClick={() => {
                const nt = blockedTest.nextTp;
                setBlockedTest(null);
                if (nt) { onChangeTimepoint?.(nt); }
              }}>
                <Icon name="arrow-right" size={15} /> Keyingi bosqichga o'tish
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div onClick={() => setConfirmDelete(null)} style={{
          position: "fixed", inset: 0, zIndex: 150, background: "rgba(15,23,42,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} className="card ktt-anim-scale" style={{
            width: "min(440px, 100%)", padding: 26, display: "flex", flexDirection: "column", gap: 16,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                background: "var(--err-bg)", color: "var(--err)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Icon name="trash-2" size={22} /></div>
              <div>
                <h3 style={{ margin: 0, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                  Natijani o'chirish
                </h3>
                <p style={{ margin: "6px 0 0", fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>
                  <b>{confirmDelete.name}</b> {confirmDelete.kind === "test" ? `(${tpLabel})` : ""} natijalari o'chiriladi va {confirmDelete.kind === "test" ? "test" : "mashq"} qaytadan <b>topshirilmagan</b> holatga o'tadi. Bu amalni bekor qilib bo'lmaydi.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--divider)", paddingTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Bekor qilish</button>
              <button className="btn btn-danger" onClick={() => {
                if (confirmDelete.kind === "test") onDeleteResult && onDeleteResult(patient.id, confirmDelete.id, activeTimepoint);
                else onDeleteTraining && onDeleteTraining(patient.id, confirmDelete.id);
                setConfirmDelete(null);
              }}>
                <Icon name="trash-2" size={15} /> O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


window.PatientView = PatientView;

const ModuleCard = ({ icon, color, soft, title, desc, badge, progress, cta, onClick, rehabBreakdown }) => (
  <button onClick={onClick} className="ktt-lift ktt-tap" style={{
    textAlign: "left", background: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: "var(--r-lg)",
    padding: 20, display: "flex", flexDirection: "column", gap: 12,
    cursor: "pointer", fontFamily: "inherit", minHeight: 180,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: soft, color: color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={26} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 17,
          color: "var(--ink)", letterSpacing: "-0.01em",
        }}>{title}</div>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.45,
          color: "var(--ink-2)", margin: "3px 0 0",
        }}>{desc}</p>
      </div>
    </div>

    {rehabBreakdown && (
      <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>
            {rehabBreakdown.doneEx}/{rehabBreakdown.totalEx} mashq · {rehabBreakdown.pct}%
          </span>
          <span className="num" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--ink-3)" }}>
            <Icon name="clock" size={13} /> {rehabBreakdown.totalMin} daq
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "4px 12px" }}>
          {rehabBreakdown.domains.map(d => {
            const complete = d.done >= d.total && d.total > 0;
            return (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: d.done > 0 ? d.color : "var(--ink-4)", flexShrink: 0, opacity: d.done > 0 ? 1 : 0.4 }} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                <span className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: complete ? "var(--ok)" : "var(--ink-3)", flexShrink: 0 }}>{d.done}/{d.total}</span>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {progress != null && !rehabBreakdown && (
      <div style={{ height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: color, transition: "width 320ms var(--ease)" }} />
      </div>
    )}
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      paddingTop: 10, borderTop: "1px solid var(--divider)", marginTop: rehabBreakdown ? 0 : "auto",
    }}>
      <span className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--ink-3)" }}>{badge}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color, whiteSpace: "nowrap" }}>
        {cta} <Icon name="arrow-right" size={15} />
      </span>
    </div>
  </button>
);
window.ModuleCard = ModuleCard;

const TestCard = ({ test, done, patient, timepoint, onStart, nextStarted, onBlocked, onRequestDelete }) => {
  const disabled = !test.available;
  let summary = null;
  if (done && done.raw && window.KNBT) {
    try { summary = window.KNBT.summarizeTest(test.id, done.raw, timepoint, patient); } catch (e) {}
  }
  const toneMap = {
    great: { bg: "var(--ok-bg)", fg: "#166534" }, good: { bg: "var(--ok-bg)", fg: "#166534" },
    ok: { bg: "var(--info-bg)", fg: "#1E3A8A" }, warn: { bg: "var(--warn-bg)", fg: "#9A6700" },
    bad: { bg: "var(--err-bg)", fg: "var(--err)" }, neutral: { bg: "var(--surface-2)", fg: "var(--ink-3)" },
  };
  const sevTone = summary ? (summary.ispcd ? toneMap.bad : toneMap[summary.tone] || toneMap.ok) : toneMap.neutral;
  const locked = !!done;
  // If the NEXT timepoint has already been started, clicking warns (modal) instead
  // of starting. Otherwise the test is freely (re)takeable — even if already done here.
  const clickable = test.available;
  const Root = clickable ? "button" : "div";
  return (
    <Root
      onClick={clickable ? (nextStarted ? onBlocked : onStart) : undefined}
      className={clickable ? "ktt-lift ktt-tap" : undefined}
      style={{
      textAlign: "left", background: "var(--surface)", width: "100%",
      border: `1px solid ${done ? sevTone.fg + "33" : "var(--border)"}`,
      borderRadius: "var(--r-lg)", padding: 18,
      display: "flex", flexDirection: "column", gap: 12,
      opacity: disabled ? 0.55 : 1, fontFamily: "inherit",
      cursor: clickable ? "pointer" : "default",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: test.soft, color: test.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={test.icon} size={24} style={{ strokeWidth: 2 }} />
        </div>
        {done
          ? <span className="pill ok"><span className="pill-dot" />Bajarilgan</span>
          : !test.available
            ? <span className="pill"><span className="pill-dot" />Tez kunda</span>
            : <span className="pill" style={{ color: "var(--ink-3)" }}><span className="pill-dot" />Topshirilmagan</span>}
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--ink)", letterSpacing: "-0.005em" }}>{test.name}</div>
        <div className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--ink-3)", marginTop: 3, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>{test.short} · {test.duration}</div>
      </div>
      {summary ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "var(--r-md)", background: sevTone.bg }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: sevTone.fg, opacity: 0.8 }}>CogScore</span>
            <span className="num" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 24, lineHeight: 1, color: sevTone.fg }}>{summary.cogScore != null ? Math.round(summary.cogScore) : "—"}</span>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: sevTone.fg + "22" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: sevTone.fg }}>{summary.label}</span>
            <div className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: sevTone.fg, opacity: 0.85, marginTop: 1 }}>Z = {summary.zScore != null ? summary.zScore.toFixed(2) : "—"}{summary.ispcd ? " · ISPOCD" : ""}</div>
          </div>
        </div>
      ) : (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)", margin: 0 }}>{test.desc}</p>
      )}
      {test.available && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto", paddingTop: 6 }}>
          {nextStarted ? (
            <div title="Keyingi bosqich testlari boshlangan" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ink-4)" }}>
              <Icon name="lock" size={14} /> Keyingi bosqich boshlangan
            </div>
          ) : done ? (
            <span className="ktt-tap" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: test.color }}>
              <Icon name="rotate-ccw" size={14} /> Qayta o'tish
            </span>
          ) : (
            <span className="ktt-tap" style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: test.color }}>
              Testni boshlash <Icon name="arrow-right" size={14} />
            </span>
          )}
          {done && onRequestDelete && (
            <span role="button" tabIndex={0} title="Natijani o'chirish" className="ktt-del-btn"
              onClick={(e) => { e.stopPropagation(); onRequestDelete(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onRequestDelete(); } }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
                fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12.5,
                color: "var(--ink-3)", cursor: "pointer", padding: "4px 8px",
                borderRadius: "var(--r-sm)", border: "1px solid var(--border)",
              }}>
              <Icon name="trash-2" size={13} /> O'chirish
            </span>
          )}
        </div>
      )}
    </Root>
  );
};
window.TestCard = TestCard;

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
