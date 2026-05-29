// Reaction Time — Psixomotor tezlik
// "GO/NO-GO" varianti: yashil doira → BOS, qizil doira → BOSMA.
// 25 trial. Tasodifiy 1-3 son kechikish bilan stimul chiqadi.

const RT_TRIALS = 25;
const RT_GO_RATE = 0.75;
const RT_MIN_DELAY = 1000;
const RT_MAX_DELAY = 2800;
const RT_RESPONSE_WINDOW = 1200; // ms

const RTimeTraining = ({ patient, onAbort, onFinish }) => {
  const ex = window.TRAINING_META.reactionTime;
  const [phase, setPhase] = React.useState("intro");
  const [idx, setIdx] = React.useState(0);
  const [stage, setStage] = React.useState("wait"); // wait | go | nogo | feedback
  const [feedback, setFeedback] = React.useState(null);
  const [score, setScore] = React.useState(0);
  const [hits, setHits] = React.useState(0);
  const [misses, setMisses] = React.useState(0);
  const [falseAlarms, setFalseAlarms] = React.useState(0);
  const [correctRejs, setCorrectRejs] = React.useState(0);
  const [rts, setRts] = React.useState([]);
  const [sessionStart, setSessionStart] = React.useState(0);
  const stageStartRef = React.useRef(0);
  const trialRef = React.useRef({ go: true });

  const start = () => {
    setIdx(0); setScore(0); setHits(0); setMisses(0); setFalseAlarms(0); setCorrectRejs(0);
    setRts([]);
    setSessionStart(Date.now());
    setPhase("running");
    setTimeout(() => beginTrial(0), 600);
  };

  const beginTrial = (i) => {
    if (i >= RT_TRIALS) {
      const duration = Date.now() - sessionStart;
      const avgRT = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : null;
      setPhase("done");
      setTimeout(() => onFinish({
        exerciseId: "reactionTime",
        score,
        accuracy: (hits + correctRejs) / RT_TRIALS,
        duration,
        level: 1,
        meta: { hits, misses, falseAlarms, correctRejs, avgRT },
      }), 800);
      return;
    }
    setIdx(i);
    setStage("wait");
    setFeedback(null);
    const isGo = Math.random() < RT_GO_RATE;
    trialRef.current = { go: isGo };
    const delay = RT_MIN_DELAY + Math.random() * (RT_MAX_DELAY - RT_MIN_DELAY);
    setTimeout(() => {
      setStage(isGo ? "go" : "nogo");
      stageStartRef.current = Date.now();
      // response window
      setTimeout(() => {
        // If still in go/nogo state and no response was received
        // we evaluate inside onTap or fall through here.
        endTrialIfNoResponse(i, isGo);
      }, RT_RESPONSE_WINDOW);
    }, delay);
  };

  const endTrialIfNoResponse = (i, isGo) => {
    setStage(prev => {
      if (prev !== "go" && prev !== "nogo") return prev; // already handled
      // no response
      if (isGo) {
        setMisses(m => m + 1);
        setScore(s => Math.max(0, s - 10));
        setFeedback("miss");
      } else {
        setCorrectRejs(c => c + 1);
        setScore(s => s + 15);
        setFeedback("correctRej");
      }
      setTimeout(() => beginTrial(i + 1), 700);
      return "feedback";
    });
  };

  const onTap = () => {
    setStage(prev => {
      if (prev === "wait") {
        // Anticipatory press — penalty
        setFalseAlarms(f => f + 1);
        setScore(s => Math.max(0, s - 30));
        setFeedback("early");
        setTimeout(() => beginTrial(idx + 1), 700);
        return "feedback";
      }
      if (prev === "go") {
        const rt = Date.now() - stageStartRef.current;
        setHits(h => h + 1);
        setRts(arr => [...arr, rt]);
        setScore(s => s + Math.max(20, Math.round(220 - rt / 3)));
        setFeedback("ok");
        setTimeout(() => beginTrial(idx + 1), 600);
        return "feedback";
      }
      if (prev === "nogo") {
        // Pressed on no-go — false alarm
        setFalseAlarms(f => f + 1);
        setScore(s => Math.max(0, s - 25));
        setFeedback("noGoErr");
        setTimeout(() => beginTrial(idx + 1), 700);
        return "feedback";
      }
      return prev;
    });
  };

  // Spacebar
  React.useEffect(() => {
    if (phase !== "running") return;
    const h = (e) => { if (e.code === "Space") { e.preventDefault(); onTap(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase, idx]);

  const lastRT = rts.length ? rts[rts.length - 1] : null;
  const avgRT = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;

  let circleColor = "var(--surface-2)";
  let circleBorder = "var(--border)";
  let label = "Kuting…";
  let labelColor = "var(--ink-3)";
  if (stage === "go") { circleColor = "#16A34A"; circleBorder = "#15803D"; label = "BOS!"; labelColor = "#FFF"; }
  if (stage === "nogo") { circleColor = "#DC2626"; circleBorder = "#991B1B"; label = "BOSMA"; labelColor = "#FFF"; }
  if (feedback === "ok") { circleColor = "#16A34A"; label = "✓"; labelColor = "#FFF"; }
  if (feedback === "miss") { circleColor = "#D97706"; label = "Kech qoldingiz"; labelColor = "#FFF"; }
  if (feedback === "noGoErr") { circleColor = "#DC2626"; label = "✗ BOSMASLIK kerak edi"; labelColor = "#FFF"; }
  if (feedback === "early") { circleColor = "#D97706"; label = "Erta bosildi"; labelColor = "#FFF"; }
  if (feedback === "correctRej") { circleColor = "#16A34A"; label = "✓ To'g'ri to'xtatildi"; labelColor = "#FFF"; }

  return (
    <TrainingShell
      patient={patient} exercise={ex} phase={phase} onAbort={onAbort}
      metrics={phase === "running" ? [
        { label: "Trial", value: `${idx + 1} / ${RT_TRIALS}`, icon: "list", mono: true },
        { label: "Hit", value: hits, icon: "check", tone: "ok", mono: true },
        { label: "Xato", value: falseAlarms + misses, icon: "x", tone: (falseAlarms + misses) ? "err" : "neutral", mono: true },
        { label: "Oxirgi RT", value: lastRT ? `${lastRT} ms` : "—", icon: "zap", mono: true },
        { label: "O'rt RT", value: avgRT ? `${avgRT} ms` : "—", icon: "activity", mono: true },
      ] : null}
      intro={
        <TrainingIntro exercise={ex}
          description="GO/NO-GO testi. YASHIL doira paydo bo'lsa — iloji boricha tezroq doirani bosing. QIZIL doira chiqsa — bosmang!"
          instructions={[
            "Doira yashil rangda chiqsa — darhol katta tugmani bosing (yoki SPACE).",
            "Doira qizil rangda chiqsa — bosmang. Kuting yangi trial uchun.",
            "Erta bosish (doira chiqishidan oldin) ham xato hisoblanadi.",
            "Tezlik MUHIM — har 100 ms tezlik = qo'shimcha ball.",
          ]}
          duration="2–3 daqiqa"
          onStart={start}
        />
      }
      body={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          <button onClick={onTap}
            style={{
              width: 360, height: 360, borderRadius: 999,
              background: circleColor, color: labelColor,
              border: `4px solid ${circleBorder}`,
              fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 36,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              boxShadow: "var(--shadow-lg)",
              transition: "background 80ms, border-color 80ms",
              outline: "none",
              userSelect: "none",
            }}>
            {label}
          </button>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)",
            letterSpacing: "0.04em",
          }}>SPACE bilan ham bosish mumkin</div>
        </div>
      }
      doneSummary={
        <TrainingDone exercise={ex}
          score={score}
          accuracy={(hits + correctRejs) / RT_TRIALS}
          duration={Date.now() - sessionStart}
          level={avgRT ? `O'rt RT ${avgRT} ms` : "—"}
          onAgain={start}
          onBack={onAbort}
        />
      }
      hint={<span><b style={{ color: "#16A34A" }}>YASHIL</b> = bos · <b style={{ color: "#DC2626" }}>QIZIL</b> = bosma</span>}
    />
  );
};

window.RTimeTraining = RTimeTraining;
