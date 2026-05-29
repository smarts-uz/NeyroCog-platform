// Audio attention test.
// 30 trials. Each trial: play a sine tone (one of 4 frequencies). User picks
// which one they heard. Uses Web Audio API — no external assets needed.

const AUDIO_TONES = [
  { name: "Past",   freq: 220 },  // A3
  { name: "O'rta",  freq: 440 },  // A4
  { name: "Baland", freq: 880 },  // A5
  { name: "Tepa",   freq: 1320 }, // E6
];
const AUDIO_TRIALS = 30;
const AUDIO_TONE_DUR = 700;  // ms
const AUDIO_TIMEOUT  = 6000; // ms before skip

function playTone(freq, durMs = AUDIO_TONE_DUR) {
  try {
    const ctx = window.__audioCtx || (window.__audioCtx = new (window.AudioContext || window.webkitAudioContext)());
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durMs / 1000 + 0.05);
  } catch (e) {
    console.warn("Audio playback failed:", e);
  }
}

function generateAudioTrials(n) {
  const trials = [];
  for (let i = 0; i < n; i++) trials.push(Math.floor(Math.random() * AUDIO_TONES.length));
  return trials;
}

const AudioTest = ({ patient, onAbort, onFinish }) => {
  const test = window.KNBT.TEST_META.Audio;
  const [phase, setPhase] = React.useState("intro");
  const [trials] = React.useState(() => generateAudioTrials(AUDIO_TRIALS));
  const [idx, setIdx] = React.useState(0);
  const [correct, setCorrect] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [played, setPlayed] = React.useState(false);
  const [startTime, setStartTime] = React.useState(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [feedback, setFeedback] = React.useState(null);

  React.useEffect(() => {
    if (phase !== "running" || !startTime) return;
    const id = setInterval(() => setElapsed(Date.now() - startTime), 100);
    return () => clearInterval(id);
  }, [phase, startTime]);

  const playCurrent = () => {
    if (idx >= trials.length) return;
    playTone(AUDIO_TONES[trials[idx]].freq);
    setPlayed(true);
  };

  // Auto-play tone when trial changes (after a short pause)
  React.useEffect(() => {
    if (phase !== "running") return;
    setPlayed(false);
    setFeedback(null);
    const t = setTimeout(() => playCurrent(), 400);
    return () => clearTimeout(t);
  }, [phase, idx]);

  const start = () => {
    setStartTime(Date.now());
    setIdx(0); setCorrect(0); setErrors(0); setElapsed(0);
    setPhase("running");
  };

  const onAnswer = (chosen) => {
    if (!played || feedback) return;
    const expected = trials[idx];
    if (chosen === expected) { setCorrect(c => c + 1); setFeedback("ok"); }
    else { setErrors(e => e + 1); setFeedback("err"); }

    setTimeout(() => {
      const next = idx + 1;
      if (next >= AUDIO_TRIALS) {
        const finalElapsed = Date.now() - startTime;
        setPhase("done");
        setTimeout(() => onFinish({
          test: "Audio",
          raw: {
            correct: chosen === expected ? correct + 1 : correct,
            errors: chosen === expected ? errors : errors + 1,
            totalTrials: AUDIO_TRIALS,
            totalTimeSec: finalElapsed / 1000,
          },
          duration: finalElapsed,
          completedAt: new Date().toISOString(),
        }), 800);
      } else {
        setIdx(next);
      }
    }, 450);
  };

  return (
    <TestShell
      patient={patient} test={test} phase={phase} onAbort={onAbort}
      metrics={phase !== "intro" ? [
        { label: "Vaqt", value: formatMs(elapsed), icon: "clock", mono: true },
        { label: "To'g'ri", value: correct, icon: "check", tone: "ok", mono: true },
        { label: "Xato", value: errors, icon: "x", tone: errors ? "err" : "neutral", mono: true },
        { label: "Trial", value: `${idx + 1} / ${AUDIO_TRIALS}`, icon: "list", mono: true },
      ] : null}
      intro={
        <TestIntro test={test}
          title="Audio diqqat testi"
          description="Quloqchin orqali tovush yangraydi. Sizning vazifangiz — qaysi balandlikdagi tovush yangraganini tanlash."
          steps={[
            "Quloqchin yoki dinamikni ulaning va ovozni tinglovchi darajaga sozlang.",
            "Har trial avtomatik tovush yangraydi. Kerak bo'lsa qayta tinglash mumkin.",
            "Pastdagi 4 ta tugmadan to'g'ri balandlikni tanlang.",
            `Jami ${AUDIO_TRIALS} ta trial.`,
          ]}
          note="Brauzerda audio ishlashi uchun sahifani bosgan bo'lishingiz kerak."
          onStart={start}
          ctaLabel="Testni boshlash"
        />
      }
      body={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          {/* Big speaker icon + replay */}
          <div style={{
            width: 220, height: 220, borderRadius: 999,
            background: feedback === "ok" ? "var(--ok-bg)"
                       : feedback === "err" ? "var(--err-bg)"
                       : played ? "var(--primary-soft)" : "var(--surface)",
            border: "2px solid " + (feedback === "ok" ? "var(--ok)"
                                  : feedback === "err" ? "var(--err)"
                                  : played ? "var(--primary)" : "var(--border-strong)"),
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12,
            transition: "background 200ms var(--ease), border-color 200ms var(--ease)",
            boxShadow: "var(--shadow-md)",
            cursor: "pointer",
          }} onClick={playCurrent}>
            <Icon name={played ? "volume-2" : "headphones"} size={72}
              style={{ color: played ? "var(--primary-press)" : "var(--ink-3)" }} />
            <div style={{
              fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
              color: "var(--ink-3)",
            }}>{played ? "Qayta tinglash" : "Tinglash"}</div>
          </div>

          {/* 4 answer buttons */}
          <div className="ktt-answers" style={{ display: "flex", gap: 14, width: "min(580px, 92vw)", justifyContent: "center" }}>
            {AUDIO_TONES.map((t, i) => (
              <button key={i} onPointerDown={() => onAnswer(i)}
                disabled={!played || !!feedback}
                style={{
                  flex: 1, minWidth: 0, height: 88,
                  border: "1px solid var(--border-strong)",
                  borderRadius: 16,
                  background: "var(--surface)", color: "var(--ink)",
                  fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 16,
                  cursor: !played || feedback ? "not-allowed" : "pointer",
                  opacity: !played || feedback ? 0.5 : 1,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  boxShadow: "var(--shadow-xs)",
                  transition: "background var(--dur) var(--ease)",
                }}>
                <span>{t.name}</span>
                <span className="num" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{t.freq} Hz</span>
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
      hint={<span>Qaysi balandlikdagi tovush yangraganini tanlang</span>}
    />
  );
};

window.AudioTest = AudioTest;
