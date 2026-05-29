// Tracking — Vizual-motor koordinatsiya
// Bemor sichqoncha/barmoq bilan harakatlanayotgan nishonni kuzatib boradi.

const TR_DURATION = 45000;
const TR_TARGET_RADIUS = 28;
const TR_LEVEL_MS = 10000;

const TrackingTraining = ({ patient, onAbort, onFinish }) => {
  const ex = window.TRAINING_META.tracking;
  const [phase, setPhase] = React.useState("intro");
  const [elapsed, setElapsed] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [sessionStart, setSessionStart] = React.useState(0);
  const [cursorPos, setCursorPos] = React.useState({ x: 0, y: 0 });
  const [inside, setInside] = React.useState(false);
  const fieldRef = React.useRef(null);
  const targetRef = React.useRef({ x: 360, y: 240, vx: 60, vy: 50 });
  const lastTickRef = React.useRef(0);
  const insideAccumRef = React.useRef(0);
  const cursorRef = React.useRef({ x: 0, y: 0 });
  const scoreRef = React.useRef(0);

  const start = () => {
    setElapsed(0); setScore(0);
    insideAccumRef.current = 0;
    scoreRef.current = 0;
    targetRef.current = { x: 360, y: 240, vx: 60, vy: 50 };
    setSessionStart(Date.now());
    lastTickRef.current = Date.now();
    setPhase("running");
  };

  React.useEffect(() => {
    if (phase !== "running") return;
    let raf, stopped = false;
    const W = 720, H = 480;
    const tick = () => {
      if (stopped) return;
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      const el = now - sessionStart;
      setElapsed(el);

      const t = targetRef.current;
      const speedMul = 1 + Math.floor(el / TR_LEVEL_MS) * 0.35;
      t.x += t.vx * dt * speedMul;
      t.y += t.vy * dt * speedMul;
      if (Math.random() < 0.02) t.vx += (Math.random() - 0.5) * 80;
      if (Math.random() < 0.02) t.vy += (Math.random() - 0.5) * 80;
      if (t.x < TR_TARGET_RADIUS) { t.x = TR_TARGET_RADIUS; t.vx = Math.abs(t.vx); }
      if (t.x > W - TR_TARGET_RADIUS) { t.x = W - TR_TARGET_RADIUS; t.vx = -Math.abs(t.vx); }
      if (t.y < TR_TARGET_RADIUS) { t.y = TR_TARGET_RADIUS; t.vy = Math.abs(t.vy); }
      if (t.y > H - TR_TARGET_RADIUS) { t.y = H - TR_TARGET_RADIUS; t.vy = -Math.abs(t.vy); }
      const maxV = 220 + Math.floor(el / TR_LEVEL_MS) * 60;
      const vmag = Math.hypot(t.vx, t.vy);
      if (vmag > maxV) { t.vx = (t.vx / vmag) * maxV; t.vy = (t.vy / vmag) * maxV; }

      const dx = cursorRef.current.x - t.x, dy = cursorRef.current.y - t.y;
      const dist = Math.hypot(dx, dy);
      const isInside = dist < TR_TARGET_RADIUS;
      setInside(isInside);
      if (isInside) {
        insideAccumRef.current += dt * 1000;
        scoreRef.current += Math.round(dt * 60 * speedMul);
        setScore(scoreRef.current);
      }

      if (el >= TR_DURATION) {
        stopped = true;
        const duration = el;
        const accuracy = insideAccumRef.current / duration;
        setPhase("done");
        setTimeout(() => onFinish({
          exerciseId: "tracking",
          score: scoreRef.current,
          accuracy,
          duration,
          level: Math.floor(duration / TR_LEVEL_MS) + 1,
          meta: { insideMs: insideAccumRef.current },
        }), 800);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, [phase, sessionStart]);

  const onPointerMove = (e) => {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    cursorRef.current = { x, y };
    setCursorPos({ x, y });
  };

  const t = targetRef.current;
  const remainSec = Math.max(0, Math.ceil((TR_DURATION - elapsed) / 1000));
  const accuracy = elapsed > 0 ? insideAccumRef.current / elapsed : 0;
  const level = Math.floor(elapsed / TR_LEVEL_MS) + 1;

  return (
    <TrainingShell
      patient={patient} exercise={ex} phase={phase} onAbort={onAbort}
      onSave={() => onFinish({ exerciseId: "tracking", score: scoreRef.current, accuracy: insideAccumRef.current / Math.max(1, Date.now() - sessionStart), duration: Date.now() - sessionStart, level: Math.floor((Date.now() - sessionStart) / TR_LEVEL_MS) + 1 })}
      metrics={phase === "running" ? [
        { label: "Daraja", value: level, icon: "trending-up", tone: "primary", mono: true },
        { label: "Vaqt", value: `${remainSec} s`, icon: "clock", mono: true },
        { label: "Aniqlik", value: `${Math.round(accuracy * 100)}%`, icon: "target", tone: accuracy > 0.5 ? "ok" : "neutral", mono: true },
        { label: "Ball", value: score, icon: "star", mono: true },
      ] : null}
      intro={
        <TrainingIntro exercise={ex}
          description="Ekran bo'ylab harakatlanayotgan nishonni sichqoncha (yoki barmoq) bilan kuzatib boring. Kursoringiz nishon ichida bo'lganda — ball oladi."
          instructions={[
            "Maydonga sichqonchani olib boring va nishon ustiga yo'naltiring.",
            "Nishon harakatlanadi — uni doimo kuzatib turing.",
            "Kursor nishon ichida bo'lgan har sekund uchun ball beriladi.",
            "Daraja har 10 sonda oshadi — nishon tezroq harakatlanadi.",
          ]}
          duration="45 son"
          onStart={start}
        />
      }
      body={
        <div ref={fieldRef}
          onMouseMove={onPointerMove}
          onTouchMove={onPointerMove}
          style={{
            width: 720, height: 480, position: "relative",
            background: "var(--surface)",
            border: inside ? "3px solid var(--ok)" : "1px solid var(--border)",
            borderRadius: 18,
            boxShadow: "var(--shadow-md)",
            cursor: "none",
            overflow: "hidden",
            backgroundImage: "radial-gradient(circle, rgba(15, 118, 110, 0.04) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            transition: "border-color 80ms",
          }}>

          <div style={{
            position: "absolute",
            left: t.x - TR_TARGET_RADIUS, top: t.y - TR_TARGET_RADIUS,
            width: TR_TARGET_RADIUS * 2, height: TR_TARGET_RADIUS * 2,
            borderRadius: 999,
            background: inside ? "var(--ok)" : "var(--primary)",
            boxShadow: inside ? "0 0 0 12px rgba(22, 163, 74, 0.15)" : "0 0 0 12px rgba(15, 118, 110, 0.10)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 80ms, box-shadow 80ms",
            pointerEvents: "none",
          }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.8)" }} />
          </div>

          <div style={{
            position: "absolute",
            left: cursorPos.x - 8, top: cursorPos.y - 8,
            width: 16, height: 16, borderRadius: 999,
            border: "2px solid var(--ink)", pointerEvents: "none",
            background: "rgba(255,255,255,0.5)",
          }} />
        </div>
      }
      doneSummary={
        <TrainingDone exercise={ex}
          score={score} accuracy={accuracy} duration={elapsed} level={level}
          onAgain={start} onBack={onAbort}
        />
      }
      hint={<span>Nishonni doimo <b style={{ color: "var(--ink)" }}>kursor ichida</b> ushlab turing</span>}
    />
  );
};

window.TrackingTraining = TrackingTraining;
