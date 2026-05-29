// Cognitive rehabilitation training — shared shell + session tracking
// All 5 exercises wrap this. It provides:
//   • Header with patient + exercise + close button
//   • Session timer (counts up)
//   • Score/progress display
//   • Intro panel + Done panel
//   • onFinish({ exerciseId, score, accuracy, duration, level }) callback

const TrainingShell = ({ patient, exercise, phase, onAbort, intro, body, metrics, doneSummary, hint }) => (
  <div style={{
    minHeight: "100vh", display: "flex", flexDirection: "column",
    background: "var(--bg)",
  }}>
    <header style={{
      height: 64, padding: "0 24px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: exercise.soft, color: exercise.color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><Icon name={exercise.icon} size={18} /></div>
      <div>
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15,
          color: "var(--ink)", letterSpacing: "-0.005em",
        }}>{exercise.name}</div>
        <div style={{
          fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)",
        }}>Kognitiv trening · {patient.fish} · № {patient.id}</div>
      </div>
      <div style={{ flex: 1 }} />
      {metrics && (
        <div style={{ display: "flex", gap: 8 }}>
          {metrics.map((m, i) => <TestMetric key={i} {...m} />)}
        </div>
      )}
      <button className="btn btn-secondary btn-sm" onClick={onAbort}>
        <Icon name="x" size={14} /> Chiqish
      </button>
    </header>

    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, overflow: "auto",
    }}>
      {phase === "intro" ? intro : (phase === "done" ? doneSummary : body)}
    </div>

    {hint && phase === "running" && (
      <div style={{
        padding: "12px 24px",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 18,
        fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-2)",
      }}>{hint}</div>
    )}
  </div>
);

const TrainingIntro = ({ exercise, description, instructions, duration, onStart }) => (
  <div className="card" style={{
    maxWidth: 580, padding: 36,
    display: "flex", flexDirection: "column", gap: 16,
    boxShadow: "var(--shadow-md)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: exercise.soft, color: exercise.color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><Icon name={exercise.icon} size={32} /></div>
      <div>
        <div className="eyebrow">Kognitiv trening · {exercise.domain}</div>
        <h2 style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 24,
          letterSpacing: "-0.015em", color: "var(--ink)", margin: "4px 0 0",
        }}>{exercise.name}</h2>
      </div>
    </div>
    <p style={{
      fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.55,
      color: "var(--ink-2)", margin: 0,
    }}>{description}</p>
    <ul style={{
      listStyle: "none", padding: 0, margin: 0,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {instructions.map((s, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{
            flexShrink: 0,
            width: 22, height: 22, borderRadius: 999,
            background: exercise.soft, color: exercise.color,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12,
            marginTop: 1,
          }}>{i + 1}</span>
          <span style={{
            fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.5,
            color: "var(--ink-2)",
          }}>{s}</span>
        </li>
      ))}
    </ul>
    <div style={{
      padding: "10px 12px", borderRadius: 10,
      background: "var(--primary-soft-2)", color: "var(--primary-press)",
      fontFamily: "var(--font-sans)", fontSize: 13,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <Icon name="clock" size={14} /> Seans davomiyligi taxminan <b>{duration}</b>
    </div>
    <button className="btn btn-primary btn-lg" onClick={onStart}
      style={{ justifyContent: "center", marginTop: 6 }}>
      <Icon name="play" size={16} /> Mashqni boshlash
    </button>
  </div>
);

const TrainingDone = ({ exercise, score, accuracy, duration, level, onAgain, onBack }) => (
  <div className="card" style={{
    maxWidth: 520, padding: 36,
    display: "flex", flexDirection: "column", gap: 18,
    alignItems: "center", textAlign: "center",
    boxShadow: "var(--shadow-md)",
  }}>
    <div style={{
      width: 88, height: 88, borderRadius: 999,
      background: "var(--ok-bg)", color: "#14532D",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}><Icon name="check-circle" size={48} /></div>
    <div>
      <div className="eyebrow">Seans yakunlandi</div>
      <div style={{
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 24,
        letterSpacing: "-0.015em", color: "var(--ink)", margin: "6px 0 0",
      }}>Yaxshi ish!</div>
    </div>
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10,
      width: "100%",
    }}>
      <Stat label="Ball" value={score} />
      <Stat label="Aniqlik" value={accuracy != null ? `${Math.round(accuracy * 100)}%` : "—"} />
      <Stat label="Vaqt" value={`${Math.round(duration / 1000)} s`} />
    </div>
    {level != null && (
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)",
      }}>Erishilgan daraja: <b style={{ color: "var(--ink)" }}>{level}</b></div>
    )}
    <div style={{ display: "flex", gap: 10, width: "100%" }}>
      <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={onAgain}>
        <Icon name="rotate-cw" size={16} /> Yana bir bor
      </button>
      <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={onBack}>
        <Icon name="check" size={16} /> Saqlash va chiqish
      </button>
    </div>
  </div>
);

const Stat = ({ label, value }) => (
  <div style={{
    padding: 12, background: "var(--surface-2)",
    border: "1px solid var(--border)", borderRadius: 10,
  }}>
    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>{label}</div>
    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22, fontVariantNumeric: "tabular-nums", color: "var(--ink)", marginTop: 2 }}>{value}</div>
  </div>
);

window.TrainingShell = TrainingShell;
window.TrainingIntro = TrainingIntro;
window.TrainingDone = TrainingDone;
