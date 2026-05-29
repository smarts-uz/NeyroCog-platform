// Stroop Test — 40 trials.
// Each trial: a color word printed in a different ink color.
// User must click the INK COLOR (not the word).

const STROOP_COLORS = [
  { name: "Qizil",  word: "QIZIL",  hex: "#DC2626" },
  { name: "Ko'k",   word: "KO'K",   hex: "#2563EB" },
  { name: "Yashil", word: "YASHIL", hex: "#16A34A" },
  { name: "Sariq",  word: "SARIQ",  hex: "#CA8A04" },
];
const STROOP_TRIALS = 40;
const STROOP_TRIAL_TIMEOUT = 6000; // ms — skip if no answer

function generateStroopTrials(n) {
  const trials = [];
  for (let i = 0; i < n; i++) {
    const wordIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let inkIdx;
    // 75% incongruent (interference), 25% congruent
    if (Math.random() < 0.75) {
      do { inkIdx = Math.floor(Math.random() * STROOP_COLORS.length); }
      while (inkIdx === wordIdx);
    } else {
      inkIdx = wordIdx;
    }
    trials.push({ wordIdx, inkIdx });
  }
  return trials;
}

const StroopTest = ({ patient, onAbort, onFinish }) => {
  const test = window.KNBT.TEST_META.Stroop;
  const [phase, setPhase] = React.useState("intro");
  const [trials] = React.useState(() => generateStroopTrials(STROOP_TRIALS));
  const [idx, setIdx] = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [skipped, setSkipped] = React.useState(0);
  const [startTime, setStartTime] = React.useState(null);
  const [trialStart, setTrialStart] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null); // "ok" | "err" | "skip"
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (phase !== "running" || !startTime) return;
    const id = setInterval(() => setElapsed(Date.now() - startTime), 100);
    return () => clearInterval(id);
  }, [phase, startTime]);

  // Trial timeout (skip)
  React.useEffect(() => {
    if (phase !== "running" || feedback) return;
    const t = setTimeout(() => {
      setFeedback("skip");
      setSkipped(s => s + 1);
      setTimeout(advance, 350);
    }, STROOP_TRIAL_TIMEOUT);
    return () => clearTimeout(t);
  }, [phase, idx, feedback]);

  const start = () => {
    const now = Date.now();
    setStartTime(now); setTrialStart(now);
    setIdx(0); setCorrect(0); setErrors(0); setSkipped(0); setElapsed(0);
    setPhase("running");
  };

  const advance = () => {
    setFeedback(null);
    setIdx(prev => {
      const next = prev + 1;
      if (next >= STROOP_TRIALS) {
        // Done — schedule finish
        const finalElapsed = Date.now() - startTime;
        setTimeout(() => {
          setPhase("done");
          setTimeout(() => onFinish({
            test: "Stroop",
            raw: {
              correct, errors, skipped,
              totalTrials: STROOP_TRIALS,
              totalTimeSec: finalElapsed / 1000,
            },
            duration: finalElapsed,
            completedAt: new Date().toISOString(),
          }), 800);
        }, 100);
        return prev;
      }
      setTrialStart(Date.now());
      return next;
    });
  };

  const onAnswer = (chosenIdx) => {
    if (phase !== "running" || feedback) return;
    const trial = trials[idx];
    if (chosenIdx === trial.inkIdx) {
      setCorrect(c => c + 1);
      setFeedback("ok");
    } else {
      setErrors(e => e + 1);
      setFeedback("err");
    }
    setTimeout(advance, 280);
  };

  const trial = trials[idx];

  return (
    <TestShell
      patient={patient} test={test} phase={phase} onAbort={onAbort}
      metrics={phase !== "intro" ? [
        { label: "Vaqt", value: formatMs(elapsed), icon: "clock", mono: true },
        { label: "To'g'ri", value: correct, icon: "check", tone: "ok", mono: true },
        { label: "Xato", value: errors, icon: "x", tone: errors ? "err" : "neutral", mono: true },
        { label: "Trial", value: `${idx + 1} / ${STROOP_TRIALS}`, icon: "list", mono: true },
      ] : null}
      intro={
        <TestIntro test={test}
          title="Stroop testi"
          description="Ekranda rangli so'z paydo bo'ladi. Sizning vazifangiz — so'zning ma'nosini emas, balki yozilgan rangini tanlash."
          steps={[
            "Har bir slayd uchun pastdagi 4 ta tugmadan to'g'ri rangni tanlang.",
            "Iloji boricha tez va aniq javob bering.",
            "Agar 6 soniya javob bermasangiz — slayd o'tkazib yuboriladi.",
            `Jami ${STROOP_TRIALS} ta slayd. So'ng natija ko'rsatiladi.`,
          ]}
          note="Diqqat: so'zning rangi muhim, mazmuni emas!"
          onStart={start}
        />
      }
      body={
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 48,
        }}>
          {/* Stimulus word */}
          <div className="ktt-no-select" style={{
            width: "min(480px, 90vw)", height: 200, maxWidth: "100%",
            background: "var(--surface)", borderRadius: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: feedback === "ok" ? "3px solid var(--ok)"
                  : feedback === "err" ? "3px solid var(--err)"
                  : feedback === "skip" ? "3px solid var(--warn)"
                  : "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
            transition: "border-color 120ms var(--ease)",
            padding: "0 24px",
          }}>
            <div style={{
              fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "clamp(56px, 14vw, 96px)",
              letterSpacing: "-0.03em",
              color: STROOP_COLORS[trial.inkIdx].hex,
              userSelect: "none",
            }}>{STROOP_COLORS[trial.wordIdx].word}</div>
          </div>

          {/* Answer buttons */}
          <div className="ktt-answers" style={{ display: "flex", gap: 14, width: "min(560px, 92vw)", justifyContent: "center" }}>
            {STROOP_COLORS.map((c, i) => (
              <button key={i} onPointerDown={() => onAnswer(i)}
                disabled={!!feedback}
                style={{
                  flex: 1, minWidth: 0, height: 72,
                  border: 0, borderRadius: 16,
                  background: c.hex, color: "#FFF",
                  fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 17,
                  letterSpacing: "0.03em",
                  cursor: feedback ? "default" : "pointer",
                  boxShadow: "var(--shadow-sm)",
                  opacity: feedback && i !== trial.inkIdx && feedback === "err" ? 0.5 : 1,
                  transition: "opacity 120ms var(--ease), transform 80ms var(--ease)",
                }}>
                {c.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      }
      doneMessage={
        <div style={{ textAlign: "center" }}>
          <Icon name="check-circle" size={64} style={{ color: "var(--ok)" }} />
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 28,
            color: "var(--ink)", marginTop: 12,
          }}>Test yakunlandi</div>
        </div>
      }
      hint={
        <>
          <span>So'zning <b style={{ color: "var(--ink)" }}>RANGINI</b> tanlang, mazmunini emas.</span>
        </>
      }
    />
  );
};

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

window.StroopTest = StroopTest;
