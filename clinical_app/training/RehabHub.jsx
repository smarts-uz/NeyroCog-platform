// Cognitive rehabilitation hub — shown on patient view when "Reabilitatsiya" tab is active.
// Lists 5 exercises with stats from completed sessions.

const RehabHub = ({ patient, onStartTraining }) => {
  const sessions = patient.training || [];
  const agg = window.TRAINING_AGGREGATE(sessions);
  const exercises = Object.values(window.TRAINING_META);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Protocol banner */}
      <div className="card" style={{
        padding: 20,
        background: "linear-gradient(135deg, var(--primary-soft-2) 0%, var(--surface) 100%)",
        border: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "var(--primary)", color: "#FFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}><Icon name="brain" size={24} /></div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">2-Dastur · Raqamli kognitiv trening</div>
            <h3 style={{
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18,
              letterSpacing: "-0.01em", color: "var(--ink)", margin: "6px 0 0",
            }}>Operatsiyadan keyingi kognitiv reabilitatsiya</h3>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.55,
              color: "var(--ink-2)", margin: "6px 0 0",
            }}>
              4 hafta · haftasiga 5–6 marta · har seans 15–20 daqiqa.
              Quyidagi 5 ta mashqdan birini tanlang.
            </p>
          </div>
          {agg && (
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: "var(--surface)", border: "1px solid var(--border)",
              display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                Jami
              </span>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {agg.totalSessions}<span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-3)" }}> seans</span>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                {agg.totalMinutes} daq
              </span>
            </div>
          )}
        </div>
      </div>



      {/* Exercise cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {exercises.map(ex => {
          const stat = agg?.byExercise[ex.id];
          return (
            <ExerciseCard key={ex.id}
              exercise={ex}
              stat={stat}
              onStart={() => onStartTraining(ex.id)} />
          );
        })}
      </div>

      {/* Recent sessions log */}
      {sessions.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--divider)" }}>
            <div className="eyebrow">Oxirgi seanslar</div>
          </div>
          <div>
            {sessions.slice(-6).reverse().map((s, i) => {
              const ex = window.TRAINING_META[s.exerciseId];
              if (!ex) return null;
              return (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto auto",
                  alignItems: "center", gap: 14,
                  padding: "12px 18px",
                  borderTop: i === 0 ? 0 : "1px solid var(--divider)",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: ex.soft, color: ex.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}><Icon name={ex.icon} size={16} /></div>
                  <div>
                    <div style={{
                      fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
                      color: "var(--ink)",
                    }}>{ex.name}</div>
                    <div style={{
                      fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)",
                    }}>{ex.domain}</div>
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {new Date(s.completedAt).toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <span className="pill ok"><span className="pill-dot" />{Math.round((s.accuracy || 0) * 100)}%</span>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14,
                    color: "var(--ink)", fontVariantNumeric: "tabular-nums",
                    minWidth: 60, textAlign: "right",
                  }}>{s.score} ball</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ExerciseCard = ({ exercise, stat, onStart }) => (
  <button onClick={onStart}
    style={{
      textAlign: "left",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      padding: 18,
      display: "flex", flexDirection: "column", gap: 12,
      cursor: "pointer",
      boxShadow: "var(--shadow-xs)",
      transition: "transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease), border-color var(--dur) var(--ease)",
      fontFamily: "inherit",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
      e.currentTarget.style.borderColor = "var(--border-strong)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = "var(--shadow-xs)";
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.transform = "translateY(0)";
    }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: exercise.soft, color: exercise.color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={exercise.icon} size={24} />
      </div>
      {stat && stat.sessions > 0 && (
        <span className="pill ok"><span className="pill-dot" />{stat.sessions}× bajarilgan</span>
      )}
    </div>
    <div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 10, color: exercise.color,
        letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600,
        marginBottom: 2,
      }}>{exercise.domain}</div>
      <div style={{
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16,
        color: "var(--ink)", letterSpacing: "-0.005em",
      }}>{exercise.name}</div>
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)",
        marginTop: 2,
      }}>{exercise.short} · {exercise.duration}</div>
    </div>
    <p style={{
      fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5,
      color: "var(--ink-2)", margin: 0,
    }}>{exercise.description}</p>

    {stat && (
      <div style={{
        display: "flex", gap: 12,
        padding: "8px 0", borderTop: "1px solid var(--divider)",
        marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 11,
        color: "var(--ink-3)", fontVariantNumeric: "tabular-nums",
      }}>
        <span>Aniqlik: <b style={{ color: "var(--ink)" }}>{Math.round(stat.avgAccuracy * 100)}%</b></span>
        <span>·</span>
        <span>O'rt ball: <b style={{ color: "var(--ink)" }}>{Math.round(stat.totalScore / stat.sessions)}</b></span>
      </div>
    )}

    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
      color: exercise.color, marginTop: "auto", paddingTop: 4,
    }}>
      {stat ? "Yangi seans boshlash" : "Boshlash"} <Icon name="arrow-right" size={14} />
    </div>
  </button>
);

// Compact sidebar card — domain progress. Goes UNDER the patient info card
// in the left column while the "Reabilitatsiya" tab is active.
const RehabSidebarProgress = ({ patient }) => {
  const sessions = patient.training || [];
  const agg = window.TRAINING_AGGREGATE(sessions);
  const exercises = Object.values(window.TRAINING_META);

  return (
    <div className="card" style={{
      padding: 0, overflow: "hidden",
      background: "var(--surface)",
      border: "1px solid var(--primary)",
      boxShadow: "0 0 0 4px rgba(15, 118, 110, 0.08), var(--shadow-sm)",
    }}>
      {/* Distinct header strip */}
      <div style={{
        padding: "12px 16px",
        background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
        color: "#FFFFFF",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon name="brain" size={16} /></div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13,
            letterSpacing: "-0.005em", color: "#FFFFFF",
          }}>2-Dastur · Reabilitatsiya</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 11, color: "rgba(255,255,255,0.85)",
            marginTop: 1,
          }}>Domenlar bo'yicha rivojlanish</div>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {exercises.map(ex => {
            const stat = agg?.byExercise[ex.id];
            const done = stat?.sessions || 0;
            const pct = Math.min(100, (done / 12) * 100);
            return (
              <div key={ex.id}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: ex.soft, color: ex.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}><Icon name={ex.icon} size={13} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12,
                      color: "var(--ink)", lineHeight: 1.2,
                    }}>{ex.name}</div>
                    <div style={{
                      fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)",
                      lineHeight: 1.2, marginTop: 1,
                    }}>{ex.domain}</div>
                  </div>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-2)",
                    fontVariantNumeric: "tabular-nums", flexShrink: 0, fontWeight: 600,
                  }}>{done}/12</span>
                </div>
                <div style={{
                  height: 5, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`, background: ex.color,
                    transition: "width 320ms var(--ease)",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--divider)",
          fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)",
          lineHeight: 1.45,
        }}>
          Protokol: <b style={{ color: "var(--ink)" }}>4 hafta · har mashq 12 marta</b> (haftasiga 3 marta).
        </div>
      </div>
    </div>
  );
};

window.RehabHub = RehabHub;
window.RehabSidebarProgress = RehabSidebarProgress;
