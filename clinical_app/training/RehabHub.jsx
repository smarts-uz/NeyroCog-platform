// Cognitive rehabilitation hub — shown on patient view when "Reabilitatsiya" tab is active.
// Lists 5 exercises with stats from completed sessions.

const RehabHub = ({ patient, onStartTraining, onRequestDelete }) => {
  const sessions = patient.training || [];
  const agg = window.TRAINING_AGGREGATE(sessions);
  const allEx = Object.values(window.TRAINING_META);
  const domains = window.TRAINING_DOMAINS || [];
  const [openDomain, setOpenDomain] = React.useState(null);

  // group exercises by domain
  const byDomain = {};
  allEx.forEach(ex => { (byDomain[ex.domain] = byDomain[ex.domain] || []).push(ex); });

  const totalEx = allEx.length;
  const doneEx = allEx.filter(ex => agg?.byExercise[ex.id]?.sessions > 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Protocol banner */}
      <div className="card" style={{
        padding: "12px 16px",
        background: "linear-gradient(135deg, var(--primary-soft-2) 0%, var(--surface) 100%)",
        border: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "var(--primary)", color: "#FFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}><Icon name="brain" size={20} /></div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{
              fontFamily: "var(--font-sans)", fontSize: 12.5, lineHeight: 1.45,
              color: "var(--ink-2)", margin: 0,
            }}>
              4 hafta · haftasiga 5–6 marta · har seans 15–20 daqiqa.
              <b style={{ color: "var(--ink)" }}> {domains.length} domen · {totalEx} ta mashq.</b>
            </p>
          </div>
          <div style={{
            padding: "7px 12px", borderRadius: 9,
            background: "var(--surface)", border: "1px solid var(--border)",
            display: "flex", gap: 16,
          }}>
            <MiniStat label="Mashqlar" value={`${doneEx}/${totalEx}`} />
            <MiniStat label="Seanslar" value={agg?.totalSessions || 0} />
            <MiniStat label="Daqiqa" value={agg?.totalMinutes || 0} />
            <MiniStat label="Streak" value={`${patient.streak?.streak || 0} 🔥`} />
          </div>
        </div>
      </div>

      {/* Domain cards — responsive multi-column grid */}
      <div className="ktt-domain-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 14, alignItems: "start",
      }}>
        {domains.map(dom => {
          const list = byDomain[dom.name] || [];
          const domDone = list.filter(ex => agg?.byExercise[ex.id]?.sessions > 0).length;
          const complete = domDone === list.length && list.length > 0;
          const open = openDomain === dom.name;
          return (
            <div key={dom.name} className="card" style={{
              overflow: "hidden", gridColumn: open ? "1 / -1" : "auto",
              borderColor: open ? dom.color + "55" : "var(--border)",
              transition: "border-color var(--dur) var(--ease)",
            }}>
              <button onClick={() => setOpenDomain(open ? null : dom.name)} className="ktt-tap" style={{
                width: "100%", display: "flex", alignItems: "center", gap: 13,
                padding: "14px 16px", border: 0, cursor: "pointer", background: "transparent",
                textAlign: "left",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 11,
                  background: dom.soft, color: dom.color,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}><Icon name={dom.icon} size={21} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14.5, color: "var(--ink)", lineHeight: 1.25 }}>{dom.name}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)" }}>{list.length} ta mashq</div>
                </div>
                <span className="num" style={{
                  fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12.5,
                  padding: "3px 10px", borderRadius: 999, flexShrink: 0,
                  background: complete ? "var(--ok-bg)" : "var(--surface-2)",
                  color: complete ? "var(--ok)" : "var(--ink-3)",
                }}>{domDone}/{list.length}</span>
                <Icon name={open ? "chevron-up" : "chevron-down"} size={18} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
              </button>

              {/* Mini progress bar (collapsed state cue) */}
              {!open && (
                <div style={{ height: 4, background: "var(--surface-2)", margin: "0 16px 14px", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${list.length ? (domDone / list.length) * 100 : 0}%`, background: complete ? "var(--ok)" : dom.color, transition: "width 320ms var(--ease)" }} />
                </div>
              )}

              {open && (
                <div data-grid="3" style={{
                  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12,
                  padding: "0 16px 16px",
                }}>
                  {list.map(ex => (
                    <ExerciseCard key={ex.id} exercise={ex} stat={agg?.byExercise[ex.id]}
                      onStart={() => onStartTraining(ex.id)}
                      onRequestDelete={onRequestDelete} />
                  ))}
                </div>
              )}
            </div>
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
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{ex.name}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)" }}>{ex.domain}</div>
                  </div>
                  <div className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)" }}>
                    {new Date(s.completedAt).toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <span className="pill ok"><span className="pill-dot" />{Math.round((s.accuracy || 0) * 100)}%</span>
                  <span className="num" style={{
                    fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
                    color: "var(--ink)", minWidth: 60, textAlign: "right",
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

const MiniStat = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <span className="num" style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>{value}</span>
    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-3)" }}>{label}</span>
  </div>
);

const ExerciseCard = ({ exercise, stat, onStart, onRequestDelete }) => (
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
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: exercise.soft, color: exercise.color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={exercise.icon} size={24} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
        }}>
          <div style={{
            fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16,
            color: "var(--ink)", letterSpacing: "-0.005em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{exercise.name}</div>
          {stat && stat.sessions > 0 && (
            <span className="pill ok" style={{ flexShrink: 0 }}><span className="pill-dot" />{stat.sessions}×</span>
          )}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)",
          marginTop: 2,
        }}>{exercise.short} · {exercise.duration}</div>
      </div>
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
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13,
      marginTop: "auto", paddingTop: 4,
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: exercise.color }}>
        {stat ? "Yangi seans boshlash" : "Boshlash"} <Icon name="arrow-right" size={14} />
      </span>
      {stat && stat.sessions > 0 && onRequestDelete && (
        <span role="button" tabIndex={0} title="Mashq natijalarini o'chirish" className="ktt-del-btn"
          onClick={(e) => { e.stopPropagation(); onRequestDelete(exercise); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onRequestDelete(exercise); } }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
            fontWeight: 600, fontSize: 12.5, color: "var(--ink-3)", cursor: "pointer",
            padding: "4px 8px", borderRadius: "var(--r-sm)", border: "1px solid var(--border)",
          }}>
          <Icon name="trash-2" size={13} /> O'chirish
        </span>
      )}
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
          }}>Reabilitatsiya</div>
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 11, color: "rgba(255,255,255,0.85)",
            marginTop: 1,
          }}>Domenlar bo'yicha rivojlanish</div>
        </div>
      </div>

      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(window.TRAINING_DOMAINS || []).map(dom => {
            const list = Object.values(window.TRAINING_META).filter(e => e.domain === dom.name);
            const done = list.filter(e => agg?.byExercise[e.id]?.sessions > 0).length;
            const pct = list.length ? (done / list.length) * 100 : 0;
            return (
              <div key={dom.name}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: dom.soft, color: dom.color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}><Icon name={dom.icon} size={12} /></div>
                  <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12, color: "var(--ink)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dom.name}</div>
                  <span className="num" style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-2)", flexShrink: 0, fontWeight: 700 }}>{done}/{list.length}</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: dom.color, transition: "width 320ms var(--ease)" }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--divider)",
          fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)", lineHeight: 1.45,
        }}>
          Protokol: <b style={{ color: "var(--ink)" }}>4 hafta · 50 mashq</b> (haftasiga 5–6 marta).
        </div>
      </div>
    </div>
  );
};

window.RehabHub = RehabHub;
window.RehabSidebarProgress = RehabSidebarProgress;

// Compact daily-goal card for the left sidebar (Reabilitatsiya tab).
const RehabSidebarGoal = ({ patient }) => {
  const sessions = patient.training || [];
  const A = window.KTT_ADAPT;
  if (!A) return null;
  const done = A.todayCount(sessions);
  const goal = A.DAILY_GOAL;
  const pct = Math.min(100, (done / goal) * 100);
  const hit = done >= goal;
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--primary)", boxShadow: "0 0 0 4px rgba(15, 118, 110, 0.08), var(--shadow-sm)" }}>
      <div style={{
        padding: "12px 16px",
        background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
        color: "#FFF", display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="target" size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 13, color: "#FFF" }}>Bugungi maqsad</div>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "rgba(255,255,255,0.85)", marginTop: 1 }}>Kunlik trening rejasi</div>
        </div>
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="num" style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 26, lineHeight: 1, color: hit ? "var(--ok)" : "var(--ink)" }}>{done}<span style={{ fontSize: 16, color: "var(--ink-3)", fontWeight: 700 }}> / {goal}</span></span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, color: hit ? "var(--ok)" : "var(--ink-3)" }}>{hit ? "Bajarildi ✓" : "mashq"}</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: hit ? "var(--ok)" : "var(--primary)", transition: "width 320ms var(--ease)" }} />
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 14, fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)" }}>
          <span>Streak: <b style={{ color: "var(--ink)" }}>{patient.streak?.streak || 0} 🔥</b></span>
        </div>
      </div>
    </div>
  );
};
window.RehabSidebarGoal = RehabSidebarGoal;
