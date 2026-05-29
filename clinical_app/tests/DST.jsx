// Digit Span Test — Forward + Backward.
// Computer shows a sequence of digits one-by-one. User types them back.
// Forward: in the same order. Backward: in reverse.
// Each correct answer → length increases by 1. Two consecutive failures at
// a length → stop and record the LAST PASSED length.

const DST_SHOW_MS = 1000;   // each digit visible
const DST_GAP_MS  = 350;    // gap between digits

function randDigits(len) {
  const arr = [];
  let last = -1;
  while (arr.length < len) {
    const d = Math.floor(Math.random() * 10);
    if (d !== last) { arr.push(d); last = d; }
  }
  return arr;
}

const DSTTest = ({ patient, onAbort, onFinish }) => {
  const test = window.KNBT.TEST_META.DST;
  const [phase, setPhase] = React.useState("intro"); // intro | running | done
  const [mode, setMode]   = React.useState("forward"); // forward | backward
  const [span, setSpan]   = React.useState(3);
  const [failsAtSpan, setFailsAtSpan] = React.useState(0);
  const [sequence, setSequence] = React.useState([]);
  const [showingIdx, setShowingIdx] = React.useState(-1); // -1 = none, n = digit n
  const [showingPhase, setShowingPhase] = React.useState("idle"); // idle | showing | input
  const [input, setInput] = React.useState("");
  const [feedback, setFeedback] = React.useState(null); // "ok" | "err" | null
  const [forwardBest, setForwardBest] = React.useState(0);
  const [backwardBest, setBackwardBest] = React.useState(0);
  const inputRef = React.useRef(null);

  // Show sequence
  const showSequence = (seq) => {
    setShowingPhase("showing");
    setInput("");
    let i = 0;
    const showNext = () => {
      if (i >= seq.length) {
        setTimeout(() => {
          setShowingIdx(-1);
          setShowingPhase("input");
          setTimeout(() => inputRef.current?.focus(), 50);
        }, 300);
        return;
      }
      setShowingIdx(seq[i]);
      i++;
      setTimeout(() => {
        setShowingIdx(-1);
        setTimeout(showNext, DST_GAP_MS);
      }, DST_SHOW_MS);
    };
    showNext();
  };

  // Start running
  const start = () => {
    setPhase("running");
    setMode("forward");
    setSpan(3);
    setFailsAtSpan(0);
    setForwardBest(0);
    setBackwardBest(0);
    const seq = randDigits(3);
    setSequence(seq);
    setTimeout(() => showSequence(seq), 600);
  };

  const submitAnswer = (e) => {
    e?.preventDefault?.();
    if (showingPhase !== "input" || feedback) return;
    const userDigits = input.split("").filter(c => /\d/.test(c)).map(Number);
    const expected = mode === "forward" ? sequence : [...sequence].reverse();
    const ok = userDigits.length === expected.length
      && userDigits.every((d, i) => d === expected[i]);

    setFeedback(ok ? "ok" : "err");

    setTimeout(() => {
      setFeedback(null);
      if (ok) {
        if (mode === "forward") setForwardBest(b => Math.max(b, span));
        else setBackwardBest(b => Math.max(b, span));

        // Next: longer span (or switch to backward at 9)
        if (span >= (mode === "forward" ? 9 : 8)) {
          // Max reached, switch or finish
          nextStage();
        } else {
          const nextSpan = span + 1;
          setSpan(nextSpan);
          setFailsAtSpan(0);
          const seq = randDigits(nextSpan);
          setSequence(seq);
          setTimeout(() => showSequence(seq), 600);
        }
      } else {
        const fails = failsAtSpan + 1;
        setFailsAtSpan(fails);
        if (fails >= 2) {
          // Failed twice at this span → end stage
          nextStage();
        } else {
          // One more try at same span
          const seq = randDigits(span);
          setSequence(seq);
          setTimeout(() => showSequence(seq), 600);
        }
      }
    }, 700);
  };

  const nextStage = () => {
    if (mode === "forward") {
      setMode("backward");
      setSpan(2);
      setFailsAtSpan(0);
      const seq = randDigits(2);
      setSequence(seq);
      setTimeout(() => showSequence(seq), 600);
    } else {
      // Finish
      setPhase("done");
      setTimeout(() => onFinish({
        test: "DST",
        raw: {
          forward:  forwardBest,
          backward: backwardBest,
        },
        completedAt: new Date().toISOString(),
      }), 800);
    }
  };

  const expectedLen = sequence.length;

  return (
    <TestShell
      patient={patient} test={test} phase={phase} onAbort={onAbort}
      metrics={phase !== "intro" ? [
        { label: "Bosqich",      value: mode === "forward" ? "To'g'ri" : "Teskari", icon: "arrow-right" },
        { label: "Hozirgi span", value: span, icon: "list", mono: true },
        { label: "Forward",      value: forwardBest, icon: "check", tone: "ok", mono: true },
        { label: "Backward",     value: backwardBest, icon: "check", tone: "ok", mono: true },
      ] : null}
      intro={
        <TestIntro test={test}
          title="Digit Span Test (DST)"
          description="Ekranda raqamlar ketma-ket ko'rinadi. Sizning vazifangiz — ularni ko'rsatilganidek qaytarib yozish."
          steps={[
            "Birinchi bosqich (Forward) — raqamlarni ko'rsatilgan tartibda yozing.",
            "Ikkinchi bosqich (Backward) — raqamlarni teskari tartibda yozing.",
            "Har safar yozish to'g'ri bo'lsa, navbatdagi ketma-ketlik bir raqamga uzunroq bo'ladi.",
            "Bir uzunlikda ikki marta xato bo'lsa — bosqich tugaydi.",
          ]}
          onStart={start}
        />
      }
      body={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, width: 560 }}>
          {/* Show big digit OR input form */}
          {showingPhase === "showing" && (
            <div style={{
              width: 240, height: 240, borderRadius: 24,
              background: "var(--ink)", color: "var(--bone)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 140,
              letterSpacing: "-0.03em",
              boxShadow: "var(--shadow-lg)",
            }}>
              {showingIdx >= 0 ? showingIdx : ""}
            </div>
          )}

          {showingPhase === "input" && (
            <form onSubmit={submitAnswer} style={{
              width: "100%", display: "flex", flexDirection: "column", gap: 16, alignItems: "center",
            }}>
              <div style={{
                fontFamily: "var(--font-sans)", fontSize: 16, color: "var(--ink-2)", textAlign: "center",
              }}>
                {mode === "forward"
                  ? <>Endi <b style={{ color: "var(--ink)" }}>{expectedLen} ta raqamni</b> ko'rsatilgan tartibda yozing</>
                  : <>Endi <b style={{ color: "var(--ink)" }}>{expectedLen} ta raqamni</b> <b style={{ color: "var(--accent)" }}>teskari</b> tartibda yozing</>
                }
              </div>
              <input ref={inputRef}
                className="input"
                style={{
                  fontSize: 56, fontWeight: 700, textAlign: "center",
                  letterSpacing: "0.2em", padding: "16px 24px",
                  width: 380,
                  borderColor: feedback === "ok" ? "var(--ok)"
                             : feedback === "err" ? "var(--err)"
                             : "var(--border-strong)",
                  fontVariantNumeric: "tabular-nums",
                }}
                value={input}
                onChange={e => setInput(e.target.value.replace(/\D/g, ""))}
                disabled={!!feedback}
                inputMode="numeric"
                maxLength={expectedLen}
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary btn-lg"
                disabled={!input || !!feedback}>
                Tasdiqlash <Icon name="check" size={16} />
              </button>
            </form>
          )}
        </div>
      }
      doneMessage={
        <div style={{ textAlign: "center" }}>
          <Icon name="check-circle" size={64} style={{ color: "var(--ok)" }} />
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 28,
            color: "var(--ink)", marginTop: 12,
          }}>Test yakunlandi</div>
          <div style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 8 }}>
            Forward: <b>{forwardBest}</b> · Backward: <b>{backwardBest}</b>
          </div>
        </div>
      }
      hint={
        showingPhase === "showing"
          ? <span>Raqamlarni eslab qoling…</span>
          : <span>Raqamlarni <b style={{ color: "var(--ink)" }}>{mode === "forward" ? "ko'rsatilgan tartibda" : "TESKARI tartibda"}</b> yozing</span>
      }
    />
  );
};

window.DSTTest = DSTTest;
