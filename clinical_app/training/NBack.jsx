// N-Back — Ishchi xotira
// Bemorga ketma-ket raqamlar / shakllar ko'rsatiladi. U "MATCH" tugmasini
// bosadi agar joriy element N qadam oldingisi bilan bir xil bo'lsa.

const NB_STIMULI = ["A", "B", "C", "D", "E", "F", "G", "H"]; // letters
const NB_TOTAL = 24;
const NB_SHOW_MS = 1500;
const NB_GAP_MS = 800;
const NB_TARGET_RATE = 0.33; // ~⅓ of trials are matches

function genNBackSeq(n, total) {
  const seq = [];
  for (let i = 0; i < total; i++) {
    if (i >= n && Math.random() < NB_TARGET_RATE) {
      // make this a match
      seq.push(seq[i - n]);
    } else {
      let next;
      do { next = NB_STIMULI[Math.floor(Math.random() * NB_STIMULI.length)]; }
      while (i >= n && next === seq[i - n]); // ensure non-match unless intended
      seq.push(next);
    }
  }
  return seq;
}

const NBackTraining = ({ patient, onAbort, onFinish }) => {
  const ex = window.TRAINING_META.nback;
  const [phase, setPhase] = React.useState("intro");
  const [n, setN] = React.useState(2); // 2-back default
  const [seq, setSeq] = React.useState([]);
  const [idx, setIdx] = React.useState(-1);
  const [showing, setShowing] = React.useState(false);
  const [responded, setResponded] = React.useState(false);
  const [hits, setHits] = React.useState(0);
  const [misses, setMisses] = React.useState(0);
  const [falseAlarms, setFalseAlarms] = React.useState(0);
  const [correctRejs, setCorrectRejs] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [sessionStart, setSessionStart] = React.useState(0);
  const [flash, setFlash] = React.useState(null);

  const start = (level = n) => {
    setN(level);
    const s = genNBackSeq(level, NB_TOTAL);
    setSeq(s);
    setIdx(-1);
    setHits(0); setMisses(0); setFalseAlarms(0); setCorrectRejs(0); setScore(0);
    setSessionStart(Date.now());
    setPhase("running");
    setTimeout(() => advance(s, -1, level), 600);
  };

  const advance = (s, current, lvl) => {
    const next = current + 1;
    if (next >= NB_TOTAL) {
      // Done
      const duration = Date.now() - sessionStart;
      // Score based on d-prime-ish: hits - false alarms
      const finalScore = score;
      setPhase("done");
      setTimeout(() => onFinish({
        exerciseId: "nback",
        score: finalScore,
        accuracy: (hits + correctRejs) / NB_TOTAL,
        duration,
        level: lvl,
        meta: { hits, misses, falseAlarms, correctRejs, n: lvl },
      }), 800);
      return;
    }
    setIdx(next);
    setShowing(true);
    setResponded(false);

    // Show stimulus
    setTimeout(() => {
      // Hide
      setShowing(false);
      // Check if user responded (within show window)
      // We'll evaluate at gap end
      setTimeout(() => {
        // End of trial — score it
        evaluateTrial(s, next, lvl);
        advance(s, next, lvl);
      }, NB_GAP_MS);
    }, NB_SHOW_MS);
  };

  // We need a ref-like state for "responded" to be captured at eval time.
  // Use refs:
  const respondedRef = React.useRef(false);
  const idxRef = React.useRef(-1);
  React.useEffect(() => { idxRef.current = idx; }, [idx]);

  const evaluateTrial = (s, i, lvl) => {
    const isMatch = i >= lvl && s[i] === s[i - lvl];
    const userResponded = respondedRef.current;
    if (isMatch && userResponded)       { setHits(h => h + 1);          setScore(p => p + 20); }
    else if (isMatch && !userResponded) { setMisses(m => m + 1);        setScore(p => Math.max(0, p - 5)); }
    else if (!isMatch && userResponded) { setFalseAlarms(f => f + 1);   setScore(p => Math.max(0, p - 15)); }
    else                                 { setCorrectRejs(c => c + 1);  setScore(p => p + 5); }
    respondedRef.current = false;
  };

  const onMatchClick = () => {
    if (!showing || respondedRef.current) return;
    respondedRef.current = true;
    setResponded(true);
    setFlash("press");
    setTimeout(() => setFlash(null), 200);
  };

  // Keyboard: space = match
  React.useEffect(() => {
    if (phase !== "running") return;
    const h = (e) => { if (e.code === "Space") { e.preventDefault(); onMatchClick(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase, showing]);

  return (
    <TrainingShell
      patient={patient} exercise={ex} phase={phase} onAbort={onAbort}
      metrics={phase === "running" ? [
        { label: `${n}-Back`, value: `${idx + 1} / ${NB_TOTAL}`, icon: "list", tone: "primary", mono: true },
        { label: "Hit", value: hits, icon: "check", tone: "ok", mono: true },
        { label: "Xato", value: falseAlarms + misses, icon: "x", tone: misses + falseAlarms ? "err" : "neutral", mono: true },
        { label: "Ball", value: score, icon: "star", mono: true },
      ] : null}
      intro={
        <TrainingIntro exercise={ex}
          description={`Ekranda harflar ketma-ket ko'rinadi. Joriy harf ${n} ta oldingisi bilan bir xil bo'lsa — MATCH tugmasini bosing (yoki space).`}
          instructions={[
            `Birinchi ${n} ta harfni eslab qoling — javob bermang.`,
            `${n + 1}-harfdan boshlab — agar joriy harf ${n} qadam oldingisi bilan bir xil bo'lsa, MATCH bosing.`,
            "Tugmani harf ko'rinib turgan vaqtda bosing. Keyin kech.",
            "Aniqlik va tezlik — ikkalasi ham muhim.",
          ]}
          duration="3–4 daqiqa"
          onStart={() => start(2)}
        />
      }
      body={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
          {/* Stimulus */}
          <div style={{
            width: 280, height: 280, borderRadius: 28,
            background: showing ? "var(--ink)" : "var(--surface-2)",
            color: showing ? "var(--bone)" : "var(--ink-4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 168,
            letterSpacing: "-0.02em",
            border: "2px solid var(--border)",
            boxShadow: showing ? "var(--shadow-lg)" : "var(--shadow-xs)",
            transition: "background 80ms, color 80ms, box-shadow 80ms",
            userSelect: "none",
          }}>
            {showing ? seq[idx] : "·"}
          </div>

          {/* N indicator + match button */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{
              padding: "10px 16px", borderRadius: 12,
              background: "var(--primary-soft)", color: "var(--primary-press)",
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}>{n}-Back</div>

            <button onClick={onMatchClick}
              disabled={!showing}
              style={{
                padding: "18px 36px", borderRadius: 16, border: 0,
                background: responded ? "var(--ok)" : (flash === "press" ? "var(--primary-press)" : "var(--primary)"),
                color: "#FFF",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18,
                letterSpacing: "0.04em", textTransform: "uppercase",
                cursor: showing ? "pointer" : "not-allowed",
                opacity: showing ? 1 : 0.4,
                boxShadow: "var(--shadow-md)",
                transition: "background 120ms, opacity 120ms",
                minWidth: 220,
              }}>
              {responded ? "✓ MATCH" : "MATCH"} <span style={{ opacity: 0.5, fontSize: 12, marginLeft: 8, fontFamily: "var(--font-mono)" }}>SPACE</span>
            </button>
          </div>
        </div>
      }
      doneSummary={
        <TrainingDone exercise={ex}
          score={score}
          accuracy={(hits + correctRejs) / NB_TOTAL}
          duration={Date.now() - sessionStart}
          level={`${n}-back`}
          onAgain={() => start(n)}
          onBack={onAbort}
        />
      }
      hint={<span>Joriy harf <b style={{ color: "var(--ink)" }}>{n}</b> ta oldingisi bilan bir xil bo'lsa — MATCH bosing</span>}
    />
  );
};

window.NBackTraining = NBackTraining;
