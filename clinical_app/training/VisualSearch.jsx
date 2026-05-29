// Visual Search — Diqqat va selektiv diqqat
// Bemor distraktorlar orasidan TARGET shaklni topib bosishi kerak.
// Har trial — 1 ta target + 15-30 ta distraktor. Daraja oshgan sari distraktorlar ko'payadi.

const VS_SHAPES = ["circle", "square", "triangle", "star", "hexagon"];
const VS_COLORS = ["#DC2626", "#2563EB", "#16A34A", "#D97706", "#9333EA"];
const VS_TRIALS_PER_LEVEL = 5;
const VS_TIME_LIMIT = 10000; // 10s per trial

function renderShape(shape, color, size = 40) {
  const s = size, half = s / 2;
  switch (shape) {
    case "circle":   return <circle cx={half} cy={half} r={half - 2} fill={color} />;
    case "square":   return <rect x="2" y="2" width={s - 4} height={s - 4} fill={color} rx="4" />;
    case "triangle": return <polygon points={`${half},2 ${s-2},${s-2} 2,${s-2}`} fill={color} />;
    case "star":     return <polygon points={starPoints(half, half, half - 2, (half - 2) * 0.4, 5)} fill={color} />;
    case "hexagon":  return <polygon points={hexPoints(half, half, half - 2)} fill={color} />;
    default: return null;
  }
}
function starPoints(cx, cy, rO, rI, n) {
  const pts = []; for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? rI : rO; const a = (i * Math.PI) / n - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  } return pts.join(" ");
}
function hexPoints(cx, cy, r) {
  const pts = []; for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  } return pts.join(" ");
}

function genTrial(level) {
  const distractorCount = 12 + level * 4;       // L1=16, L2=20, ...
  const targetShape = VS_SHAPES[Math.floor(Math.random() * VS_SHAPES.length)];
  const targetColor = VS_COLORS[Math.floor(Math.random() * VS_COLORS.length)];

  const items = [];
  // place target
  const target = randomPlace(items, 80);
  items.push({ ...target, shape: targetShape, color: targetColor, isTarget: true });

  // place distractors — same shape OR same color allowed, but never both
  for (let i = 0; i < distractorCount; i++) {
    let s, c;
    if (Math.random() < 0.5) {
      s = targetShape; do { c = VS_COLORS[Math.floor(Math.random() * VS_COLORS.length)]; } while (c === targetColor);
    } else {
      c = targetColor; do { s = VS_SHAPES[Math.floor(Math.random() * VS_SHAPES.length)]; } while (s === targetShape);
    }
    const pos = randomPlace(items, 80);
    items.push({ ...pos, shape: s, color: c, isTarget: false });
  }
  return { target: { shape: targetShape, color: targetColor }, items };
}
function randomPlace(existing, minDist) {
  const W = 720, H = 440, pad = 30;
  for (let t = 0; t < 60; t++) {
    const x = pad + Math.random() * (W - pad * 2);
    const y = pad + Math.random() * (H - pad * 2);
    if (existing.every(e => Math.hypot(e.x - x, e.y - y) >= minDist)) return { x, y };
  }
  return { x: Math.random() * W, y: Math.random() * H };
}

const VisualSearchTraining = ({ patient, onAbort, onFinish }) => {
  const ex = window.TRAINING_META.visualSearch;
  const [phase, setPhase] = React.useState("intro");
  const [level, setLevel] = React.useState(1);
  const [trialN, setTrialN] = React.useState(0);
  const [trial, setTrial] = React.useState(null);
  const [score, setScore] = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [feedback, setFeedback] = React.useState(null);
  const [trialStart, setTrialStart] = React.useState(0);
  const [sessionStart, setSessionStart] = React.useState(0);
  const [reactionTimes, setReactionTimes] = React.useState([]);

  const startTrial = (lvl = level) => {
    setTrial(genTrial(lvl));
    setTrialStart(Date.now());
    setFeedback(null);
  };

  const start = () => {
    setPhase("running");
    setLevel(1); setTrialN(0); setScore(0); setCorrect(0); setErrors(0);
    setReactionTimes([]);
    setSessionStart(Date.now());
    setTimeout(() => startTrial(1), 50);
  };

  // Trial timeout
  React.useEffect(() => {
    if (phase !== "running" || !trial || feedback) return;
    const t = setTimeout(() => {
      setErrors(e => e + 1);
      setFeedback("timeout");
      setTimeout(advance, 600);
    }, VS_TIME_LIMIT);
    return () => clearTimeout(t);
  }, [phase, trial, feedback]);

  const onItemClick = (item) => {
    if (feedback || phase !== "running") return;
    const rt = Date.now() - trialStart;
    if (item.isTarget) {
      setCorrect(c => c + 1);
      setReactionTimes(rts => [...rts, rt]);
      // Score: faster = more points, bonus for level
      const points = Math.max(10, Math.round(150 - rt / 50)) * level;
      setScore(s => s + points);
      setFeedback("ok");
    } else {
      setErrors(e => e + 1);
      setScore(s => Math.max(0, s - 20));
      setFeedback("err");
    }
    setTimeout(advance, 500);
  };

  const advance = () => {
    const nextN = trialN + 1;
    setTrialN(nextN);
    if (nextN >= VS_TRIALS_PER_LEVEL * 3) {
      // Total 15 trials → finish
      const duration = Date.now() - sessionStart;
      setPhase("done");
      setTimeout(() => onFinish({
        exerciseId: "visualSearch",
        score,
        accuracy: correct / (correct + errors || 1),
        duration,
        level,
        meta: { avgRT: reactionTimes.length ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : null },
      }), 800);
      return;
    }
    // Bump level every 5 trials
    const newLevel = Math.min(3, Math.floor(nextN / VS_TRIALS_PER_LEVEL) + 1);
    if (newLevel !== level) setLevel(newLevel);
    setTimeout(() => startTrial(newLevel), 200);
  };

  return (
    <TrainingShell
      patient={patient} exercise={ex} phase={phase} onAbort={onAbort}
      onSave={() => onFinish({ exerciseId: "visualSearch", score, accuracy: correct / (correct + errors || 1), duration: Date.now() - sessionStart, level })}
      metrics={phase === "running" ? [
        { label: "Daraja", value: level, icon: "trending-up", tone: "primary", mono: true },
        { label: "Trial", value: `${trialN + 1} / 15`, icon: "list", mono: true },
        { label: "Ball", value: score, icon: "star", tone: "ok", mono: true },
        { label: "To'g'ri", value: `${correct} / ${correct + errors}`, icon: "check", mono: true },
      ] : null}
      intro={
        <TrainingIntro exercise={ex}
          description="Ekranda turli rang va shakldagi figuralar paydo bo'ladi. Sizning vazifangiz — ko'rsatilgan TARGET shaklni iloji boricha tezroq topib bosish."
          instructions={[
            "Yuqoridagi nishon (target) shaklini diqqat bilan ko'ring.",
            "Pastdagi maydondan xuddi shu shakl va rangdagi figurani toping.",
            "Topgan zahoti bosing — to'g'ri javob ball oladi.",
            "Noto'g'ri bosish — ball kamayadi. Daraja har 5 trial'da oshadi.",
          ]}
          duration="3–4 daqiqa"
          onStart={start}
        />
      }
      body={trial && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          {/* Target prompt */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "14px 24px",
            background: ex.soft, color: ex.color,
            borderRadius: 16, border: `2px solid ${ex.color}33`,
            boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Toping:
            </div>
            <svg width={48} height={48}>{renderShape(trial.target.shape, trial.target.color, 48)}</svg>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.7 }}>
              ⏱ {Math.max(0, Math.ceil((VS_TIME_LIMIT - (Date.now() - trialStart)) / 1000))} son
            </div>
          </div>

          {/* Field */}
          <div style={{
            width: 760, height: 480, position: "relative",
            background: "var(--surface)",
            border: feedback === "ok" ? "3px solid var(--ok)"
                  : feedback === "err" ? "3px solid var(--err)"
                  : feedback === "timeout" ? "3px solid var(--warn)"
                  : "1px solid var(--border)",
            borderRadius: 18,
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
            transition: "border-color 120ms var(--ease)",
          }}>
            <svg width="100%" height="100%" viewBox="0 0 760 480">
              {trial.items.map((item, i) => (
                <g key={i}
                   transform={`translate(${item.x - 20}, ${item.y - 20})`}
                   onClick={() => onItemClick(item)}
                   style={{ cursor: feedback ? "default" : "pointer" }}>
                  {renderShape(item.shape, item.color, 40)}
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}
      doneSummary={
        <TrainingDone exercise={ex}
          score={score}
          accuracy={correct / (correct + errors || 1)}
          duration={Date.now() - sessionStart}
          level={level}
          onAgain={start}
          onBack={onAbort}
        />
      }
      hint={<span>Target shaklni <b style={{ color: "var(--ink)" }}>iloji boricha tezroq</b> toping</span>}
    />
  );
};

window.VisualSearchTraining = VisualSearchTraining;
