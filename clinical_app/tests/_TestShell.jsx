// Shared header + intro panel + bottom hint bar used by every test screen.
// Each test renders its own body; this provides the chrome.

const TestShell = ({ patient, test, phase, onAbort, intro, body, hint, metrics, doneMessage }) => {
  return (
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
          background: test.soft, color: test.color,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon name={test.icon} size={18} /></div>
        <div>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15,
            color: "var(--ink)", letterSpacing: "-0.005em",
          }}>{test.name}</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)",
          }}>{patient.fish} · № {patient.id} · {patient.yosh} yosh</div>
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
        {phase === "intro" ? intro : (phase === "done" ? doneMessage : body)}
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
};

const TestMetric = ({ label, value, icon, tone = "neutral", mono }) => {
  const tones = {
    neutral: { bg: "var(--surface-2)", fg: "var(--ink-2)" },
    err:     { bg: "var(--err-bg)",    fg: "var(--err)"   },
    ok:      { bg: "var(--ok-bg)",     fg: "#15803D"     },
    primary: { bg: "var(--primary-soft)", fg: "var(--primary-press)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 12px", borderRadius: 10,
      background: t.bg, color: t.fg,
      border: "1px solid var(--border)",
    }}>
      {icon && <Icon name={icon} size={14} />}
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

const TestIntro = ({ test, title, description, steps, note, onStart, ctaLabel = "Testni boshlash" }) => (
  <div className="card" style={{
    maxWidth: 620, padding: 36,
    display: "flex", flexDirection: "column", gap: 16,
    boxShadow: "var(--shadow-md)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: test.soft, color: test.color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><Icon name={test.icon} size={28} /></div>
      <div>
        <div className="eyebrow">Diagnostik test</div>
        <h2 style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 24,
          letterSpacing: "-0.015em", color: "var(--ink)", margin: "4px 0 0",
        }}>{title}</h2>
      </div>
    </div>

    {description && (
      <p style={{
        fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.55,
        color: "var(--ink-2)", margin: 0,
      }}>{description}</p>
    )}

    {steps && (
      <ul style={{
        listStyle: "none", padding: 0, margin: 0,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        {steps.map((s, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{
              flexShrink: 0,
              width: 22, height: 22, borderRadius: 999,
              background: "var(--primary-soft)", color: "var(--primary-press)",
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
    )}

    {note && (
      <div style={{
        padding: "10px 12px", borderRadius: 10,
        background: "var(--warn-bg)", color: "#92400E",
        fontFamily: "var(--font-sans)", fontSize: 13,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Icon name="info" size={14} /> {note}
      </div>
    )}

    <button className="btn btn-primary btn-lg" onClick={onStart}
      style={{ justifyContent: "center", marginTop: 6 }}>
      <Icon name="play" size={16} /> {ctaLabel}
    </button>
  </div>
);

window.TestShell = TestShell;
window.TestMetric = TestMetric;
window.TestIntro = TestIntro;
