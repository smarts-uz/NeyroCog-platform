// Klinik Test Tizimi — App root + navigation state.
// Screens: "login" → "patients" → "patient" → "test" → "results"

const STORAGE_KEY = "ktt_state_v1";

// 3 bosqich (timepoint) — Research Plan'dan
const TIMEPOINTS = [
  { id: "PreOp",  label: "PreOp",   sub: "Operatsiyagacha",     color: "#0F766E", soft: "#CCFBF1", textOn: "#134E4A" },
  { id: "PostOp", label: "PostOp",  sub: "7–10 kun keyin",       color: "#D97706", soft: "#FEF3C7", textOn: "#92400E" },
  { id: "PostTx", label: "PostTx",  sub: "Davolashdan keyin",    color: "#9333EA", soft: "#F3E8FF", textOn: "#581C87" },
];
window.TIMEPOINTS = TIMEPOINTS;

// Migrate older flat results to timepoint-keyed
// Old: results.Stroop = { test, raw, ... }
// New: results.Stroop = { PreOp: { test, raw, ... } }
function migrateResults(patients) {
  if (!Array.isArray(patients)) return patients;
  return patients.map(p => {
    if (!p.results) return p;
    const r = {};
    let migrated = false;
    for (const [k, v] of Object.entries(p.results)) {
      if (!v) continue;
      // If already keyed by timepoint
      if (v.PreOp || v.PostOp || v.PostTx) {
        r[k] = v;
      } else if (v.raw || v.test) {
        // Flat — assume PreOp
        r[k] = { PreOp: { ...v, timepoint: "PreOp" } };
        migrated = true;
      } else {
        r[k] = v;
      }
    }
    return migrated ? { ...p, results: r } : p;
  });
}

// SEED bemorlar — namuna ma'lumotlar.
const SEED_PATIENTS = [
  { id: 1, fish: "Farxodov Og'abek",  jinsi: "Erkak", tugilgan: "2016-03-12", yosh: 10, premorbid: 0, davom: 125, prep: 5, boshlanish: "2026-05-20T09:00", tugash: "2026-05-20T11:05", sana: "2026-05-20", results: {} },
  { id: 2, fish: "Yusupova Madina",   jinsi: "Ayol",  tugilgan: "2013-08-04", yosh: 12, premorbid: 1, davom: 110, prep: 4, boshlanish: "2026-05-21T10:30", tugash: "2026-05-21T12:20", sana: "2026-05-21", results: {} },
  { id: 3, fish: "Karimov Sherzod",   jinsi: "Erkak", tugilgan: "2017-01-22", yosh:  9, premorbid: 0, davom: 140, prep: 5, boshlanish: "2026-05-22T08:15", tugash: "2026-05-22T10:35", sana: "2026-05-22", results: {} },
  { id: 4, fish: "Tursunova Nilufar", jinsi: "Ayol",  tugilgan: "2014-11-09", yosh: 11, premorbid: 1, davom: 130, prep: 6, boshlanish: "2026-05-24T11:00", tugash: "2026-05-24T13:10", sana: "2026-05-24", results: {} },
  { id: 5, fish: "Salimov Bekzod",    jinsi: "Erkak", tugilgan: "2012-06-30", yosh: 13, premorbid: 0, davom:  85, prep: 3, boshlanish: "2026-05-25T09:30", tugash: "2026-05-25T10:55", sana: "2026-05-25", results: {} },
  { id: 6, fish: "Akbarova Dilnoza",  jinsi: "Ayol",  tugilgan: "2011-02-14", yosh: 14, premorbid: 0, davom:  95, prep: 4, boshlanish: "2026-05-26T10:00", tugash: "2026-05-26T11:35", sana: "2026-05-26", results: {} },
];

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
};

// Map test id → component name on window
const TEST_COMPONENT = {
  TMT:    "TMTTest",
  Stroop: "StroopTest",
  DST:    "DSTTest",
  LMWT:   "LMWTTest",
  NS:     "NSTest",
  EEG:    "EEGTest",
  Audio:  "AudioTest",
};

// Map training id → component name on window
const TRAINING_COMPONENT = {
  visualSearch: "VisualSearchTraining",
  nback:        "NBackTraining",
  taskSwitch:   "TaskSwitchTraining",
  reactionTime: "RTimeTraining",
  tracking:     "TrackingTraining",
};

const App = () => {
  const initial = loadState();
  const [screen, setScreen]                 = React.useState(initial?.screen || "login");
  const [user, setUser]                     = React.useState(initial?.user || null);
  const [editProfile, setEditProfile]       = React.useState(false);
  const [listFilter, setListFilter]         = React.useState(null);
  const [patients, setPatients]             = React.useState(() => migrateResults(initial?.patients || SEED_PATIENTS));
  const [currentId, setCurrentId]           = React.useState(initial?.currentId || null);
  const [activeTestId, setActiveTestId]     = React.useState(initial?.activeTestId || null);
  const [activeTrainingId, setActiveTrainingId] = React.useState(initial?.activeTrainingId || null);
  const [lastTestResult, setLastTestResult] = React.useState(initial?.lastTestResult || null);
  const [activeTimepoint, setActiveTimepoint] = React.useState(initial?.activeTimepoint || "PreOp");
  const [patientView, setPatientView] = React.useState(initial?.patientView || "hub");

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      screen, user, patients, currentId, activeTestId, activeTrainingId, lastTestResult, activeTimepoint, patientView,
    }));
  }, [screen, user, patients, currentId, activeTestId, activeTrainingId, lastTestResult, activeTimepoint, patientView]);

  const currentPatient = patients.find(p => p.id === currentId) || null;

  const handleLogin = (u) => {
    setUser(u);
    // Honor a deep-link target captured before login; otherwise go to the list.
    if (screen === "login" || !screen) setScreen("patients");
  };
  const handleLogout = () => {
    setUser(null); setCurrentId(null); setAnalyticsTab(null); setEditProfile(false);
    setScreen("login");
  };

  // Global "go home" → patients list (Bosh sahifa). Used by the header logo.
  React.useEffect(() => {
    window.__kttGoHome = () => { setCurrentId(null); setAnalyticsTab(null); setScreen("patients"); };
    window.__kttEditProfile = () => setEditProfile(true);
    window.__kttOpenAnalytics = (tab) => setAnalyticsTab(typeof tab === "string" ? tab : "roc");
    return () => { delete window.__kttGoHome; delete window.__kttEditProfile; delete window.__kttOpenAnalytics; };
  }, []);

  const addPatient = (p) => {
    const nextId = (patients.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
    const today = new Date().toISOString().slice(0, 10);
    const created = { ...p, id: nextId, sana: today, results: {} };
    setPatients([...patients, created]);
    return created.id;
  };

  const updatePatient = (id, patch) => {
    setPatients(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));
  };

  // Delete one test result for a given timepoint → test becomes "not taken" again.
  const deleteResult = (patientId, testId, tp) => {
    setPatients(ps => ps.map(p => {
      if (p.id !== patientId) return p;
      const results = { ...(p.results || {}) };
      if (results[testId]) {
        const byTp = { ...results[testId] };
        delete byTp[tp];
        if (Object.keys(byTp).length === 0) delete results[testId];
        else results[testId] = byTp;
      }
      return { ...p, results };
    }));
  };

  // Delete all sessions for a rehab exercise → exercise becomes "not completed".
  const deleteTraining = (patientId, exerciseId) => {
    setPatients(ps => ps.map(p => {
      if (p.id !== patientId) return p;
      return { ...p, training: (p.training || []).filter(s => s.exerciseId !== exerciseId) };
    }));
  };

  const openPatient = (id) => { setCurrentId(id); setPatientView("hub"); setScreen("patient"); };
  const [analyticsTab, setAnalyticsTab] = React.useState(null);
  const openAnalytics = (tab) => setAnalyticsTab(typeof tab === "string" ? tab : "roc");

  // ===== Hash-based routing =====
  // Every screen/tab is reflected in window.location.hash so a URL can be pasted
  // into another browser and reopen the exact same tab.
  const buildHash = () => {
    if (analyticsTab) return `/analytics/${analyticsTab}`;
    if (screen === "login") return "/login";
    if (screen === "patients") return listFilter ? `/patients/filter/${listFilter}` : "/patients";
    if (screen === "patient" && currentId) {
      const base = `/patient/${currentId}`;
      if (patientView === "tests") return `${base}/tests/${activeTimepoint}`;
      if (patientView === "forecast") return `${base}/forecast`;
      if (patientView === "rehab") return `${base}/rehab`;
      return base;
    }
    if (screen === "test" && currentId) return `/patient/${currentId}/test/${activeTestId}/${activeTimepoint}`;
    if (screen === "training" && currentId) return `/patient/${currentId}/training/${activeTrainingId}`;
    if (screen === "results" && currentId) return `/patient/${currentId}/results`;
    return "/patients";
  };

  const applyHash = (raw) => {
    const h = (raw || "").replace(/^#/, "").replace(/^\//, "");
    const parts = h.split("/").filter(Boolean);
    if (parts.length === 0) return false;
    const [a, b, c, d, e] = parts;
    if (a === "login") { setAnalyticsTab(null); setScreen("login"); return true; }
    if (a === "analytics") { setAnalyticsTab(b || "roc"); setScreen("patients"); return true; }
    if (a === "patients") {
      setAnalyticsTab(null); setCurrentId(null);
      setListFilter(b === "filter" && c ? c : null);
      setScreen("patients"); return true;
    }
    if (a === "patient" && b) {
      const id = Number(b);
      setAnalyticsTab(null); setCurrentId(id);
      if (c === "tests")        { setPatientView("tests"); if (d) setActiveTimepoint(d); setScreen("patient"); }
      else if (c === "forecast"){ setPatientView("forecast"); setScreen("patient"); }
      else if (c === "rehab")   { setPatientView("rehab"); setScreen("patient"); }
      else if (c === "test" && d) { setActiveTestId(d); if (e) setActiveTimepoint(e); setScreen("test"); }
      else if (c === "training" && d) { setActiveTrainingId(d); setPatientView("rehab"); setScreen("training"); }
      else if (c === "results") { setScreen("results"); }
      else { setPatientView("hub"); setScreen("patient"); }
      return true;
    }
    return false;
  };

  const bootHash = React.useRef(typeof window !== "undefined" ? window.location.hash : "");
  const hydrated = React.useRef(false);

  // On mount: apply the pasted/initial hash (overrides localStorage) + listen for
  // external hash edits / back-forward navigation.
  React.useEffect(() => {
    if (bootHash.current && bootHash.current.replace(/[#/]/g, "").length > 0) {
      applyHash(bootHash.current);
    }
    hydrated.current = true;
    const onHash = () => applyHash(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Reflect state → hash (replaceState avoids history spam and does NOT refire hashchange).
  React.useEffect(() => {
    if (!hydrated.current) return;
    const desired = "#" + buildHash();
    if (window.location.hash !== desired) {
      try { history.replaceState(null, "", desired); } catch (e) { window.location.hash = desired; }
    }
  }, [screen, currentId, patientView, activeTimepoint, activeTestId, activeTrainingId, analyticsTab, listFilter]);

  // Escape key → close any open overlay (analytics modal, profile modal).
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setAnalyticsTab(null);
      setEditProfile(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const startTest   = (testId) => { setActiveTestId(testId); setScreen("test"); };
  const abortTest   = () => { setActiveTestId(null); setScreen("patient"); };
  const finishTest  = (result) => {
    const testId = result.test;
    const tp = activeTimepoint;
    const tagged = { ...result, timepoint: tp };
    setPatients(ps => ps.map(p => p.id === currentId
      ? { ...p, results: {
          ...(p.results || {}),
          [testId]: { ...((p.results || {})[testId] || {}), [tp]: tagged },
        }}
      : p));
    setLastTestResult(tagged);
    setActiveTestId(null);
    setScreen("results");
  };
  const backToPatient = () => setScreen("patient");

  // Training
  const startTraining = (exerciseId) => { setActiveTrainingId(exerciseId); setPatientView("rehab"); setScreen("training"); };
  const abortTraining = () => { setActiveTrainingId(null); setPatientView("rehab"); setScreen("patient"); };
  const finishTraining = (result) => {
    const session = { ...result, completedAt: new Date().toISOString() };
    setPatients(ps => ps.map(p => {
      if (p.id !== currentId) return p;
      // Adaptive difficulty: step level by performance
      const A = window.KTT_ADAPT;
      const adaptive = { ...(p.adaptive || {}) };
      if (A && result.exerciseId) {
        const cur = A.getLevel(p, result.exerciseId);
        adaptive[result.exerciseId] = A.nextLevel(cur, result.accuracy);
      }
      // Daily streak
      const streak = A ? A.bumpStreak(p.streak, session.completedAt.slice(0, 10)) : p.streak;
      return { ...p, training: [...(p.training || []), session], adaptive, streak };
    }));
    setActiveTrainingId(null);
    setPatientView("rehab");
    setScreen("patient");
  };

  // Dynamic test component lookup
  const renderTest = () => {
    if (!currentPatient || !activeTestId) return null;
    const compName = TEST_COMPONENT[activeTestId];
    const TestComp = compName && window[compName];
    if (!TestComp) {
      return (
        <div style={{ padding: 60, textAlign: "center" }}>
          <Icon name="alert-circle" size={48} style={{ color: "var(--err)" }} />
          <div style={{ marginTop: 16, fontFamily: "var(--font-sans)", fontSize: 16, color: "var(--ink)" }}>
            Test komponenti topilmadi: <b>{activeTestId}</b>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={abortTest}>
            Bemorga qaytish
          </button>
        </div>
      );
    }
    return <TestComp patient={currentPatient} onAbort={abortTest} onFinish={finishTest} />;
  };

  const renderTraining = () => {
    if (!currentPatient || !activeTrainingId) return null;
    const meta = (window.TRAINING_META || {})[activeTrainingId];
    // Config-driven engine first, then flagship component fallback.
    const compName = (meta && meta.engine) || TRAINING_COMPONENT[activeTrainingId] || (meta && meta.component);
    const TrainingComp = compName && window[compName];
    if (!meta || !TrainingComp) {
      return (
        <div style={{ padding: 60, textAlign: "center" }}>
          <Icon name="alert-circle" size={48} style={{ color: "var(--err)" }} />
          <div style={{ marginTop: 16, fontFamily: "var(--font-sans)", fontSize: 16, color: "var(--ink)" }}>
            Trening komponenti topilmadi: <b>{activeTrainingId}</b>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={abortTraining}>
            Bemorga qaytish
          </button>
        </div>
      );
    }
    return <TrainingComp patient={currentPatient} exercise={window.KTT_ADAPT ? window.KTT_ADAPT.adaptExercise(meta, currentPatient) : meta} onAbort={abortTraining} onFinish={finishTraining} />;
  };

  // ===== RBAC guard =====
  // No authenticated user → ONLY the login screen may render. Any private screen
  // reached via a pasted hash or persisted state is blocked until login. The hash
  // target stays in state, so after a successful login the user lands there.
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      {screen === "login"    && <Login onLogin={handleLogin} />}
      {editProfile && (
        <DoctorProfileModal
          user={user}
          onClose={() => setEditProfile(false)}
          onSave={(u) => { setUser(u); setEditProfile(false); }}
        />
      )}
      {screen === "patients" && (
        <PatientsList
          user={user}
          patients={patients}
          initialFilter={listFilter}
          onLogout={handleLogout}
          onOpen={openPatient}
          onAdd={addPatient}
          onOpenAnalytics={openAnalytics}
        />
      )}
      {analyticsTab && (
        <div onClick={() => setAnalyticsTab(null)} style={{
          position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,0.45)",
          display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "3vh 16px",
        }}>
          <div onClick={e => e.stopPropagation()} className="ktt-anim-scale" style={{
            width: "min(1100px, 100%)", maxHeight: "94vh", overflow: "auto",
            background: "var(--bg)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)",
            position: "relative",
          }}>
            <button onClick={() => setAnalyticsTab(null)} aria-label="Yopish" className="ktt-modal-close"
              style={{
                position: "sticky", top: 16, float: "right", marginRight: 16, zIndex: 5,
                width: 38, height: 38, flexShrink: 0, display: "inline-flex",
                alignItems: "center", justifyContent: "center", borderRadius: 999,
                border: "1px solid var(--border)", background: "var(--surface)",
                color: "var(--ink-2)", cursor: "pointer", boxShadow: "var(--shadow-xs)",
                transition: "background 120ms var(--ease), color 120ms var(--ease), transform 120ms var(--ease)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--ink)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--ink-2)"; }}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.92)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}>
              <Icon name="x" size={18} />
            </button>
            <Analytics
              patients={patients}
              user={user}
              embedded
              initialTab={analyticsTab}
              onOpenPatients={(f) => { setListFilter(f || null); setAnalyticsTab(null); setScreen("patients"); }}
              onLogout={handleLogout}
              onOpenPatient={(id) => { setAnalyticsTab(null); openPatient(id); }}
            />
          </div>
        </div>
      )}
      {screen === "patient"  && currentPatient && (
        <PatientView
          patient={currentPatient}
          user={user}
          activeTimepoint={activeTimepoint}
          onChangeTimepoint={setActiveTimepoint}
          initialView={patientView}
          onChangeView={setPatientView}
          onBack={() => { setPatientView("hub"); setScreen("patients"); }}
          onLogout={handleLogout}
          onStartTest={startTest}
          onStartTraining={startTraining}
          onUpdatePatient={updatePatient}
          onDeleteResult={deleteResult}
          onDeleteTraining={deleteTraining}
        />
      )}
      {screen === "test" && currentPatient && renderTest()}
      {screen === "training" && currentPatient && renderTraining()}
      {screen === "results" && currentPatient && lastTestResult && (
        <Results
          patient={currentPatient}
          result={lastTestResult}
          onBackToPatient={backToPatient}
          onBackToList={() => setScreen("patients")}
        />
      )}
    </>
  );
};

window.App = App;