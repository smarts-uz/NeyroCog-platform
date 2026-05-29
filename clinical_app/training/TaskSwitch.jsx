// Task Switching / Inhibition — Ijro funksiyalari
// Har trial — raqam ko'rsatiladi va ekran orqa fon rangiga qarab QOIDA o'zgaradi:
//   • Sariq fon → JUFT/TOQ tanlash (parity)
//   • Ko'k fon → KICHIK/KATTA (5 dan kichik yoki katta)
// Daraja oshganda — qoida tez-tez almashadi.

const TS_TRIALS = 24;
const TS_TIMEOUT = 4500;

function genTSTrials() {
  const trials = [];
  let lastRule = "parity";
  for (let i = 0; i < TS_TRIALS; i++) {
    // 50% switch
    const rule = (i === 0 || Math.random() < 0.5) ? (lastRule === "parity" ? "magnitude" : "parity") : lastRule;
    const num = Math.floor(Math.random() * 9) + 1; // 1..9 (skip 5 for magnitude clarity)
    const finalNum = num === 5 ? (Math.random() < 0.5 ? 4 : 6) : num;
    let answer;
    if (rule === "parity") answer = finalNum % 2 === 0 ? "even" : "odd";
    else answer = finalNum < 5 ? "low" : "high";
    trials.push({ rule, num: finalNum, answer, isSwitch: i > 0 && rule !== lastRule });
    lastRule = rule;
  }
  return trials;
}

const TaskSwitchTraining = ({ patient, onAbort, onFinish }) => {
  const ex = window.TRAINING_META.taskSwitch;
  const [phase, setPhase] = React.useState("intro");
  const [trials, setTrials] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [feedback, setFeedback] = React.useState(null);
  const [score, setScore] = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [sessionStart, setSessionStart] = React.useState(0);
  const [trialStart, setTrialStart] = React.useState(0);
  const [switchCostRT, setSwitchCostRT] = React.useState([]);

  const start = () => {
    setTrials(genTSTrials());
    setIdx(0); setScore(0); setCorrect(0); setErrors(0);
    setSwitchCostRT([]);
    setSessionStart(Date.now()); setTrialStart(Date.now());
    setFeedback(null);
    setPhase("running");
  };

  // Timeout per trial
  React.useEffect(() => {
    if (phase !== "running" || feedback) return;
    const t = setTimeout(() => {
      setErrors(e => e + 1);
      setFeedback("timeout");
      setTimeout(advance, 500);
    }, TS_TIMEOUT);
    return () => clearTimeout(t);
  }, [phase, idx, feedback]);

  const trial = trials[idx];

  const onAnswer = (ans) => {
    if (feedback || !trial) return;
    const rt = Date.now() - trialStart;
    const ok = ans === trial.answer;
    if (ok) {
      setCorrect(c => c + 1);
      const speedBonus = Math.max(0, Math.round((TS_TIMEOUT - rt) / 30));
      const switchBonus = trial.isSwitch ? 30 : 10;
      setScore(s => s + 30 + speedBonus + switchBonus);
      setFeedback("ok");
      if (trial.isSwitch) setSwitchCostRT(arr => [...arr, rt]);
    } else {
      setErrors(e => e + 1);
      setScore(s => Math.max(0, s - 20));
      setFeedback("err");
    }
    setTimeout(advance, 450);
  };

  const advance = () => {
    setFeedback(null);
    const next = idx + 1;
    if (next >= TS_TRIALS) {
      const duration = Date.now() - sessionStart;
      setPhase("done");
      setTimeout(() => onFinish({
        exerciseId: "taskSwitch",
        score,
        accuracy: correct / (correct + errors || 1),
        duration,
        level: 1,
        meta: { avgSwitchRT: switchCostRT.length ? switchCostRT.reduce((a, b) => a + b, 0) / switchCostRT.length : null },
      }), 800);
    } else {
      setIdx(next);
      setTrialStart(Date.now());
    }
  };

  const ruleConfig = trial && trial.rule === "parity"
    ? { bg: "#FEF3C7", fg: "#92400E", border: "#FCD34D", title: "JUFT yoki TOQ?", optA: { label: "JUFT", val: "even" }, optB: { label: "TOQ", val: "odd" } }
    : { bg: "#DBEAFE", fg: "#1E3A8A", border: "#93C5FD", title: "5 dan KICHIK yoki KATTA?", optA: { label: "< 5", val: "low" }, optB: { label: "> 5", val: "high" } };

  return (
    <TrainingShell
      patient={patient} exercise={ex} phase={phase} onAbort={onAbort}
      onSave={() => onFinish({ exerciseId: "taskSwitch", score, accuracy: correct / (correct + errors || 1), duration: Date.now() - sessionStart, level: 1 })}
      metrics={phase === "running" ? [
        { label: "Trial", value: `${idx + 1} / ${TS_TRIALS}`, icon: "list", mono: true },
        { label: "To'g'ri", value: correct, icon: "check", tone: "ok", mono: true },
        { label: "Xato", value: errors, icon: "x", tone: errors ? "err" : "neutral", mono: true },
        { label: "Ball", value: score, icon: "star", tone: "primary", mono: true },
      ] : null}
      intro={
        <TrainingIntro exercise={ex}
          description="Ekranda raqam paydo bo'ladi. Fon rangi qoidani belgilaydi: SARIQ — juft yoki toq tanlang, KO'K — 5 dan kichik yoki katta. Qoida tez-tez almashadi!"
          instructions={[
            "SARIQ fon: raqam JUFT bo'lsa chap, TOQ bo'lsa o'ng tugmani bosing.",
            "KO'K fon: raqam 5 dan KICHIK bo'lsa chap, KATTA bo'lsa o'ng tugmani bosing.",
            "Qoida har trial almashishi mumkin — fon rangiga e'tibor bering!",
            "Tezlik va aniqlik birga muhim. Qoida o'zgarganda ball ko'paytirilgan.",
          ]}
          duration="3 daqiqa"
          onStart={start}
        />
      }
      body={trial && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          {/* Rule indicator */}
          <div style={{
            padding: "8px 18px", borderRadius: 999,
            background: ruleConfig.bg, color: ruleConfig.fg,
            border: `1px solid ${ruleConfig.border}`,
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
            letterSpacing: "0.06em", textTransform: "uppercase",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {trial.isSwitch && <Icon name="repeat" size={14} />}
            {ruleConfig.title}
          </div>

          {/* Stimulus card */}
          <div style={{
            width: 360, height: 280, borderRadius: 24,
            background: ruleConfig.bg, color: ruleConfig.fg,
            border: feedback === "ok" ? "4px solid var(--ok)"
                  : feedback === "err" ? "4px solid var(--err)"
                  : feedback === "timeout" ? "4px solid var(--warn)"
                  : `2px solid ${ruleConfig.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 200,
            letterSpacing: "-0.03em", lineHeight: 1,
            boxShadow: "var(--shadow-lg)",
            transition: "background 200ms var(--ease), border-color 120ms var(--ease)",
          }}>
            {trial.num}
          </div>

          {/* Answer buttons */}
          <div style={{ display: "flex", gap: 14 }}>
            <button onClick={() => onAnswer(ruleConfig.optA.val)}
              disabled={!!feedback}
              style={{
                width: 200, height: 80, borderRadius: 14, border: 0,
                background: "var(--ink)", color: "#FFFFFF",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26,
                letterSpacing: "0.02em",
                cursor: feedback ? "default" : "pointer", boxShadow: "var(--shadow-md)",
                opacity: feedback ? 0.6 : 1,
                transition: "background var(--dur) var(--ease), transform var(--dur) var(--ease)",
              }}
              onMouseDown={e => { if (!feedback) e.currentTarget.style.background = "#000"; }}
              onMouseUp={e => e.currentTarget.style.background = "var(--ink)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--ink)"}>
              {ruleConfig.optA.label}
            </button>
            <button onClick={() => onAnswer(ruleConfig.optB.val)}
              disabled={!!feedback}
              style={{
                width: 200, height: 80, borderRadius: 14, border: 0,
                background: "var(--ink)", color: "#FFFFFF",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26,
                letterSpacing: "0.02em",
                cursor: feedback ? "default" : "pointer", boxShadow: "var(--shadow-md)",
                opacity: feedback ? 0.6 : 1,
                transition: "background var(--dur) var(--ease), transform var(--dur) var(--ease)",
              }}
              onMouseDown={e => { if (!feedback) e.currentTarget.style.background = "#000"; }}
              onMouseUp={e => e.currentTarget.style.background = "var(--ink)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--ink)"}>
              {ruleConfig.optB.label}
            </button>
          </div>
        </div>
      )}
      doneSummary={
        <TrainingDone exercise={ex}
          score={score}
          accuracy={correct / (correct + errors || 1)}
          duration={Date.now() - sessionStart}
          onAgain={start}
          onBack={onAbort}
        />
      }
      hint={<span>Fon <b style={{ color: "#92400E" }}>SARIQ</b> bo'lsa — juft/toq · <b style={{ color: "#1E3A8A" }}>KO'K</b> bo'lsa — 5 dan kichik/katta</span>}
    />
  );
};

window.TaskSwitchTraining = TaskSwitchTraining;
