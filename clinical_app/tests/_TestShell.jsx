// Shared header + intro panel + bottom hint bar used by every test screen.
// Each test renders its own body; this provides the chrome.

const TestShell = ({ patient, test, phase, onAbort, onSave, intro, body, hint, metrics, doneMessage }) => {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg)",
    }}>
      <header style={{
        height: 64, padding: "0 24px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 14, position: "relative",
      }}>
        {/* Left: brand + breadcrumb (same as main pages) */}
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
        <div className="ktt-hide-mobile" style={{
          display: "flex", alignItems: "center", gap: 7, minWidth: 0,
          fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-3)",
          paddingLeft: 8, borderLeft: "1px solid var(--divider)",
        }}>
          {[
            { label: "Asosiy", onClick: onAbort },
            { label: patient.fish, onClick: onAbort },
            { label: "Diagnostika" },
          ].map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: "var(--ink-4)", flexShrink: 0 }}>/</span>}
              {b.onClick
                ? <button onClick={b.onClick} style={{
                    background: "transparent", border: 0, padding: 0, cursor: "pointer",
                    font: "inherit", color: "var(--ink-3)", whiteSpace: "nowrap", flexShrink: 0,
                  }}>{b.label}</button>
                : <span style={{ color: "var(--ink)", fontWeight: 600, whiteSpace: "nowrap" }}>{b.label}</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Right: metrics + exit */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {metrics && (
            <div className="ktt-hide-mobile" style={{ display: "flex", gap: 8, marginRight: 20, paddingRight: 20, borderRight: "1px solid var(--border)" }}>
              {metrics.map((m, i) => <TestMetric key={i} {...m} />)}
            </div>
          )}
          {onSave && phase === "running"
            ? <ExitSaveControls onSave={onSave} onAbort={onAbort} />
            : <button className="btn btn-secondary btn-sm" onClick={onAbort}>
                <Icon name="x" size={14} /> Chiqish
              </button>}
        </div>
      </header>

      {phase === "intro" ? (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, overflow: "auto",
        }}>{intro}</div>
      ) : phase === "done" ? (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24, overflow: "auto",
        }}>{doneMessage}</div>
      ) : (
        <div className="ktt-run-layout" style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <GuidePanel intro={intro} test={test} />
          <div className="ktt-run-body" style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, minWidth: 0,
          }}>{body}</div>
        </div>
      )}

      {hint && phase === "running" && (
        <div style={{
          padding: "12px 24px",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 18,
          fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-2)",
        }}>{hint}</div>
      )}
      <Footer />
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

// Persistent instruction panel shown during the running phase.
// Reads title/description/steps/note straight from the intro element's props,
// so no per-test wiring is needed.
const GuidePanel = ({ intro, test }) => {
  const p = (intro && intro.props) || {};
  const title = p.title || (test && test.name) || "Yo'riqnoma";
  const steps = p.steps || p.instructions || [];
  const desc = p.description;
  const note = p.note;
  if (!steps.length && !desc) return null;
  return (
    <aside className="ktt-guide" style={{
      width: 290, flexShrink: 0, borderRight: "1px solid var(--border)",
      background: "var(--surface-2)", padding: 20, overflow: "auto",
    }}>
      <div className="eyebrow" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="info" size={13} /> Yo'riqnoma
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 8 }}>{title}</div>
      {desc && <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--ink-2)", margin: "0 0 12px" }}>{desc}</p>}
      {steps.length > 0 && (
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              <span style={{
                flexShrink: 0, width: 20, height: 20, borderRadius: 999,
                background: "var(--primary-soft)", color: "var(--primary-press)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 11, marginTop: 1,
              }}>{i + 1}</span>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, lineHeight: 1.45, color: "var(--ink-2)" }}>{s}</span>
            </li>
          ))}
        </ol>
      )}
      {note && (
        <div style={{
          marginTop: 12, padding: "9px 11px", borderRadius: 9,
          background: "var(--warn-bg)", color: "#92400E",
          fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.45,
          display: "flex", gap: 7,
        }}><Icon name="info" size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {note}</div>
      )}
    </aside>
  );
};
window.GuidePanel = GuidePanel;
