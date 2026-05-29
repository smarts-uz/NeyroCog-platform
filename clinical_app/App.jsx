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
  const [patients, setPatients]             = React.useState(() => migrateResults(initial?.patients || SEED_PATIENTS));
  const [currentId, setCurrentId]           = React.useState(initial?.currentId || null);
  const [activeTestId, setActiveTestId]     = React.useState(initial?.activeTestId || null);
  const [activeTrainingId, setActiveTrainingId] = React.useState(initial?.activeTrainingId || null);
  const [lastTestResult, setLastTestResult] = React.useState(initial?.lastTestResult || null);
  const [activeTimepoint, setActiveTimepoint] = React.useState(initial?.activeTimepoint || "PreOp");

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      screen, user, patients, currentId, activeTestId, activeTrainingId, lastTestResult, activeTimepoint,
    }));
  }, [screen, user, patients, currentId, activeTestId, activeTrainingId, lastTestResult, activeTimepoint]);

  const currentPatient = patients.find(p => p.id === currentId) || null;

  const handleLogin = (u) => { setUser(u); setScreen("patients"); };
  const handleLogout = () => {
    setUser(null); setCurrentId(null); setScreen("login");
  };

  const addPatient = (p) => {
    const nextId = (patients.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
    const today = new Date().toISOString().slice(0, 10);
    const created = { ...p, id: nextId, sana: today, results: {} };
    setPatients([...patients, created]);
    return created.id;
  };

  const openPatient = (id) => { setCurrentId(id); setScreen("patient"); };
  const openAnalytics = () => setScreen("analytics");
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
  const startTraining = (exerciseId) => { setActiveTrainingId(exerciseId); setScreen("training"); };
  const abortTraining = () => { setActiveTrainingId(null); setScreen("patient"); };
  const finishTraining = (result) => {
    const session = { ...result, completedAt: new Date().toISOString() };
    setPatients(ps => ps.map(p => p.id === currentId
      ? { ...p, training: [...(p.training || []), session] }
      : p));
    setActiveTrainingId(null);
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
    const compName = TRAINING_COMPONENT[activeTrainingId];
    const TrainingComp = compName && window[compName];
    if (!TrainingComp) {
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
    return <TrainingComp patient={currentPatient} onAbort={abortTraining} onFinish={finishTraining} />;
  };

  return (
    <>
      {screen === "login"    && <Login onLogin={handleLogin} />}
      {screen === "patients" && (
        <PatientsList
          user={user}
          patients={patients}
          onLogout={handleLogout}
          onOpen={openPatient}
          onAdd={addPatient}
          onOpenAnalytics={openAnalytics}
        />
      )}
      {screen === "analytics" && (
        <Analytics
          patients={patients}
          user={user}
          onBack={() => setScreen("patients")}
          onLogout={handleLogout}
          onOpenPatient={openPatient}
        />
      )}
      {screen === "patient"  && currentPatient && (
        <PatientView
          patient={currentPatient}
          user={user}
          activeTimepoint={activeTimepoint}
          onChangeTimepoint={setActiveTimepoint}
          onBack={() => setScreen("patients")}
          onLogout={handleLogout}
          onStartTest={startTest}
          onStartTraining={startTraining}
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
