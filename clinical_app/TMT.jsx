// Trail Making Test (TMT-A) — connect 1 to 25 in order.

const TMT_N = 25;
const TMT_W = 1000;
const TMT_H = 580;

function generateNodes(n) {
  // Grid with jitter, then shuffle node ids.
  const cols = 6, rows = 5;
  const padX = 70, padY = 60;
  const cellW = (TMT_W - padX * 2) / (cols - 1);
  const cellH = (TMT_H - padY * 2) / (rows - 1);
  const pts = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pts.length >= n) break;
      const jx = (Math.random() - 0.5) * cellW * 0.45;
      const jy = (Math.random() - 0.5) * cellH * 0.55;
      pts.push({ x: padX + c * cellW + jx, y: padY + r * cellH + jy });
    }
  }
  // Fisher–Yates
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  return pts.slice(0, n).map((p, i) => ({ id: i + 1, x: p.x, y: p.y }));
}

const formatTime = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

const TMTTest = ({ patient, onAbort, onFinish }) => {
  const [phase, setPhase] = React.useState("intro");   // intro | running | done
  const [current, setCurrent] = React.useState(1);
  const [completed, setCompleted] = React.useState([]); // array of nodes (in order)
  const [errors, setErrors] = React.useState(0);
  const [startTime, setStartTime] = React.useState(null);
  const [elapsed, setElapsed] = React.useState(0);
  const [wrongFlash, setWrongFlash] = React.useState(null);

  const nodes = React.useMemo(() => generateNodes(TMT_N), [phase === "intro"]);

  const saveNow = () => {
    const final = startTime ? Date.now() - startTime : elapsed;
    onFinish({
      test: "TMT",
      variant: "A",
      duration: final,
      errors,
      total: TMT_N,
      completedAt: new Date().toISOString(),
      raw: { aTime: final / 1000, aErrors: errors, bTime: null, bErrors: 0, completed: completed.length, total: TMT_N },
    });
  };

  // Timer tick
  React.useEffect(() => {
    if (phase !== "running" || !startTime) return;
    const id = setInterval(() => setElapsed(Date.now() - startTime), 50);
    return () => clearInterval(id);
  }, [phase, startTime]);

  const start = () => {
    setStartTime(Date.now());
    setCurrent(1);
    setCompleted([]);
    setErrors(0);
    setElapsed(0);
    setPhase("running");
  };

  const onNodeClick = (n) => {
    if (phase !== "running") return;
    if (n.id === current) {
      const next = [...completed, n];
      setCompleted(next);
      if (n.id === TMT_N) {
        const final = Date.now() - startTime;
        setElapsed(final);
        setPhase("done");
        setTimeout(() => onFinish({
          test: "TMT",
          variant: "A",
          duration: final,
          errors,
          total: TMT_N,
          completedAt: new Date().toISOString(),
          raw: {
            aTime: final / 1000,
            aErrors: errors,
            // TMT-B not implemented in interactive form yet
            bTime: null, bErrors: 0,
            completed: TMT_N, total: TMT_N,
          },
        }), 800);
      } else {
        setCurrent(c => c + 1);
      }
    } else {
      setErrors(e => e + 1);
      setWrongFlash(n.id);
      setTimeout(() => setWrongFlash(curr => (curr === n.id ? null : curr)), 400);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg)",
    }}>
      {/* Test header */}
      <header style={{
        height: 64, padding: "0 24px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 16, position: "relative",
      }}>
        {/* Left: brand (click to exit) */}
        <button onClick={onAbort} title="Chiqish" style={{
          display: "flex", alignItems: "center", gap: 9, flexShrink: 0,
          background: "transparent", border: 0, padding: 0, cursor: "pointer",
        }}>
          <Logo size={28} />
          <div className="ktt-hide-mobile" style={{
            fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 16,
            color: "var(--ink)", letterSpacing: "-0.02em", whiteSpace: "nowrap",
          }}>Neyro<span style={{ color: "var(--primary)" }}>Cog</span></div>
        </button>

        {/* Center: breadcrumb trail */}
        <div className="ktt-train-crumbs" style={{
          position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
          display: "flex", alignItems: "center", gap: 7, maxWidth: "46vw",
          fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-3)",
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8, flexShrink: 0,
            background: "var(--primary-soft)", color: "var(--primary-press)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="git-branch" size={15} /></div>
          {[
            { label: "Asosiy", onClick: onAbort },
            { label: patient.fish, onClick: onAbort },
            { label: "Diagnostika", onClick: onAbort },
            { label: "Trail Making Test (TMT-A)" },
          ].map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: "var(--ink-4)", flexShrink: 0 }}>/</span>}
              {b.onClick
                ? <button onClick={b.onClick} className="ktt-hide-mobile" style={{
                    background: "transparent", border: 0, padding: 0, cursor: "pointer",
                    font: "inherit", color: "var(--ink-3)", whiteSpace: "nowrap", flexShrink: 0,
                  }}>{b.label}</button>
                : <span style={{
                    color: "var(--ink)", fontWeight: 700, whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                  }}>{b.label}</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Right: metrics + exit */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {phase !== "intro" && (
            <div className="ktt-hide-mobile" style={{ display: "flex", gap: 8, marginRight: 20, paddingRight: 20, borderRight: "1px solid var(--border)" }}>
              <Metric label="Vaqt" value={formatTime(elapsed)} icon="clock" mono />
              <Metric label="Xato" value={errors} icon="x-circle"
                tone={errors > 0 ? "err" : "neutral"} mono />
              <Metric label="Bog'langan" value={`${completed.length} / ${TMT_N}`}
                icon="check" mono />
            </div>
          )}

          {phase === "running"
            ? <ExitSaveControls onSave={saveNow} onAbort={onAbort} />
            : <button className="btn btn-secondary btn-sm" onClick={onAbort}>
                <Icon name="x" size={14} /> Chiqish
              </button>}
        </div>
      </header>

      {/* Body */}
      {phase === "intro" ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <IntroPanel onStart={start} />
        </div>
      ) : (
        <div className="ktt-run-layout" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {window.GuidePanel && window.GuidePanel({
            test: { name: "Trail Making Test", icon: "git-branch", color: "var(--primary)", soft: "var(--primary-soft)" },
            intro: { props: {
              title: "Trail Making Test, qism A",
              description: "Ekranda 1 dan 25 gacha sonlar tartibsiz joylashgan. Ularni tartib bo'yicha bosib chiqing.",
              steps: [
                "Sichqoncha yoki barmoq bilan doiralarni bosing.",
                "Tartib bo'yicha: avval 1, keyin 2, keyin 3 va hokazo.",
                "Noto'g'ri doira bosilsa — xatolar soni ortadi, davom eting.",
                "25-doiraga yetib borganingizda test yakunlanadi.",
              ],
              note: "Joriy bosish kerak bo'lgan son sariq rangda belgilanadi.",
            } },
          })}
          <div className="ktt-run-body" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, minWidth: 0 }}>
            <TMTBoard
              nodes={nodes}
              current={current}
              completed={completed}
              wrongFlash={wrongFlash}
              onClick={onNodeClick}
              phase={phase}
            />
          </div>
        </div>
      )}

      {/* Bottom hint bar */}
      {phase === "running" && (
        <div style={{
          padding: "12px 24px",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
          fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-2)",
        }}>
          <span>Keyingisi:</span>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minWidth: 44, height: 44, padding: "0 12px",
            borderRadius: 999, background: "var(--primary)", color: "#FFF",
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18,
            fontVariantNumeric: "tabular-nums",
          }}>{current}</span>
          <span style={{ color: "var(--ink-3)" }}>
            Doiralarni <b style={{ color: "var(--ink)" }}>tartibda</b> bosib chiqing — 1 dan 25 gacha.
          </span>
        </div>
      )}
      <Footer />
    </div>
  );
};

// ===== Sub-components =====

const Metric = ({ label, value, icon, tone = "neutral", mono }) => {
  const tones = {
    neutral: { bg: "var(--surface-2)", fg: "var(--ink-2)" },
    err:     { bg: "var(--err-bg)",    fg: "var(--err)" },
  };
  const t = tones[tone];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 12px", borderRadius: 10,
      background: t.bg, color: t.fg,
      border: "1px solid var(--border)",
    }}>
      <Icon name={icon} size={14} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span style={{
          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 9,
          letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)",
        }}>{label}</span>
        <span style={{
          fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
          fontWeight: 600, fontSize: 14, color: "var(--ink)",
          fontVariantNumeric: "tabular-nums",
        }}>{value}</span>
      </div>
    </div>
  );
};

const IntroPanel = ({ onStart }) => (
  <div className="card" style={{
    maxWidth: 580, padding: 36,
    display: "flex", flexDirection: "column", gap: 16,
    boxShadow: "var(--shadow-md)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: "var(--primary-soft)", color: "var(--primary-press)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><Icon name="git-branch" size={28} /></div>
      <div>
        <div className="eyebrow">Diagnostik test</div>
        <h2 style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 26,
          letterSpacing: "-0.015em", color: "var(--ink)", margin: "4px 0 0",
        }}>Trail Making Test, qism A</h2>
      </div>
    </div>

    <p style={{
      fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.55,
      color: "var(--ink-2)", margin: 0,
    }}>
      Ekranda <b>1</b> dan <b>25</b> gacha sonlar tartibsiz joylashgan doiralar
      paydo bo'ladi. Vazifa — ularni <b>tartib bo'yicha</b> bosib chiqish:
      avval 1, keyin 2, keyin 3 va hokazo.
    </p>

    <ul style={{
      listStyle: "none", padding: 0, margin: 0,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <Step n="1" text="Sichqoncha yoki barmoq bilan doiralarni bosing." />
      <Step n="2" text="Noto'g'ri doira bosilsa — xatolar soni ortadi, davom eting." />
      <Step n="3" text="25-doiraga yetib borganingizda test yakunlanadi." />
    </ul>

    <div style={{
      padding: "10px 12px", borderRadius: 10,
      background: "var(--warn-bg)", color: "#92400E",
      fontFamily: "var(--font-sans)", fontSize: 13,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <Icon name="info" size={14} />
      Test taymeri "Boshlash" tugmasini bosgan paytdan boshlanadi.
    </div>

    <button className="btn btn-primary btn-lg" onClick={onStart}
      style={{ justifyContent: "center", marginTop: 6 }}>
      <Icon name="play" size={16} /> Testni boshlash
    </button>
  </div>
);

const Step = ({ n, text }) => (
  <li style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
    <span style={{
      flexShrink: 0,
      width: 22, height: 22, borderRadius: 999,
      background: "var(--primary-soft)", color: "var(--primary-press)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12,
      marginTop: 1,
    }}>{n}</span>
    <span style={{
      fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.5,
      color: "var(--ink-2)",
    }}>{text}</span>
  </li>
);

const TMTBoard = ({ nodes, current, completed, wrongFlash, onClick, phase }) => {
  // completed node ids set
  const completedIds = new Set(completed.map(n => n.id));

  return (
    <div className="card" style={{
      padding: 0, overflow: "hidden",
      boxShadow: "var(--shadow-sm)",
      background:
        "radial-gradient(circle at 50% 0%, rgba(15, 118, 110, 0.04), transparent 60%)," +
        "var(--surface)",
    }}>
      <svg className="ktt-board" viewBox={`0 0 ${TMT_W} ${TMT_H}`} width={TMT_W} height={TMT_H} style={{ display: "block" }}>
        {/* Subtle dotted grid */}
        <defs>
          <pattern id="tmt-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="0.5" cy="0.5" r="0.5" fill="rgba(15, 23, 42, 0.08)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tmt-grid)" />

        {/* Path connecting completed nodes */}
        {completed.length >= 2 && (
          <polyline
            points={completed.map(n => `${n.x},${n.y}`).join(" ")}
            fill="none"
            stroke="#0F766E"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.7"
          />
        )}

        {/* Nodes */}
        {nodes.map(n => {
          const isCompleted = completedIds.has(n.id);
          const isCurrent = phase === "running" && n.id === current;
          const isWrong = wrongFlash === n.id;
          const r = 26;

          let fill = "#FFFFFF";
          let stroke = "rgba(15, 23, 42, 0.18)";
          let textColor = "#0F172A";
          let strokeWidth = 2;

          if (isCompleted) {
            fill = "#0F766E";
            stroke = "#0F766E";
            textColor = "#FFFFFF";
          } else if (isCurrent) {
            fill = "#FEF3C7";
            stroke = "#D97706";
            strokeWidth = 3;
            textColor = "#92400E";
          }
          if (isWrong) {
            fill = "#FEE2E2";
            stroke = "#DC2626";
            strokeWidth = 3;
            textColor = "#991B1B";
          }

          return (
            <g key={n.id}
               style={{ cursor: phase === "running" && !isCompleted ? "pointer" : "default" }}
               onPointerDown={() => !isCompleted && onClick(n)}>
              {isCurrent && (
                <circle cx={n.x} cy={n.y} r={r + 8}
                  fill="none" stroke="#D97706" strokeWidth="2" opacity="0.4">
                  <animate attributeName="r" values={`${r+4};${r+14};${r+4}`} dur="1.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite"/>
                </circle>
              )}
              <circle cx={n.x} cy={n.y} r={r}
                fill={fill} stroke={stroke} strokeWidth={strokeWidth}
                style={{ transition: "fill 200ms var(--ease), stroke 200ms var(--ease)" }}
              />
              <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontFamily="Outfit" fontSize="16" fontWeight="700"
                fill={textColor}
                style={{ pointerEvents: "none", userSelect: "none", fontVariantNumeric: "tabular-nums" }}>
                {n.id}
              </text>
            </g>
          );
        })}

        {/* Done overlay */}
        {phase === "done" && (
          <g>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(15, 118, 110, 0.10)" />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
              fontFamily="Outfit" fontSize="42" fontWeight="800" fill="#0F766E"
              letterSpacing="-0.02em">
              Test yakunlandi
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

window.TMTTest = TMTTest;
