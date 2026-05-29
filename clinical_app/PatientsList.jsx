// 4 ta tadqiqot guruhi (Research Plan bo'yicha):
//   1. Asosiy     — PNB-musbat, Pantogam + raqamli kognitiv trening (n≈30)
//   2. Taqqoslov  — PNB-musbat, faol kuzatuv (davolash yo'q) (n≈26)
//   3. Sog'lom    — Operatsiya o'tkazilgan, PNB-manfiy (n≈125)
//   4. Nazorat    — Operatsiya o'tkazilmagan (n≈25)
const TAQSIMOTLAR = [
  { name: "Asosiy",    id: 1, desc: "PNB-musbat · Pantogam + kognitiv trening", color: "#0F766E", soft: "#CCFBF1", textOn: "#134E4A" },
  { name: "Taqqoslov", id: 2, desc: "PNB-musbat · faol kuzatuv (davolash yo'q)", color: "#D97706", soft: "#FEF3C7", textOn: "#92400E" },
  { name: "Sog'lom",   id: 3, desc: "Operatsiya o'tkazilgan · PNB-manfiy",       color: "#16A34A", soft: "#DCFCE7", textOn: "#14532D" },
  { name: "Nazorat",   id: 4, desc: "Operatsiya o'tkazilmagan · sog'lom",       color: "#64748B", soft: "#F1F5F9", textOn: "#334155" },
];
const TAQSIMOT_NAMES = TAQSIMOTLAR.map(t => t.name);
const TAQSIMOT_BY_NAME = Object.fromEntries(TAQSIMOTLAR.map(t => [t.name, t]));
window.TAQSIMOTLAR = TAQSIMOTLAR;
window.TAQSIMOT_BY_NAME = TAQSIMOT_BY_NAME;

const NewPatientModal = ({ open, onClose, onSave }) => {
  const [form, setForm] = React.useState({
    fish: "", jinsi: "Erkak", tugilgan: "", premorbid: "0",
    boshlanish: "", tugash: "", prep: "",
  });
  React.useEffect(() => {
    if (open) setForm({
      fish: "", jinsi: "Erkak", tugilgan: "", premorbid: "0",
      boshlanish: "", tugash: "", prep: "",
    });
  }, [open]);

  // Auto-derived values — hooks MUST come before any early return
  const yoshi = React.useMemo(() => {
    if (!form.tugilgan) return null;
    const dob = new Date(form.tugilgan);
    if (isNaN(dob)) return null;
    const now = new Date();
    let y = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) y--;
    return y;
  }, [form.tugilgan]);

  const davomiyligi = React.useMemo(() => {
    if (!form.boshlanish || !form.tugash) return null;
    const a = new Date(form.boshlanish);
    const b = new Date(form.tugash);
    if (isNaN(a) || isNaN(b)) return null;
    const mins = Math.round((b - a) / 60000);
    return mins;
  }, [form.boshlanish, form.tugash]);

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (yoshi == null || yoshi < 0) { alert("Tug'ilgan sana noto'g'ri"); return; }
    if (davomiyligi == null || davomiyligi <= 0) { alert("Amaliyot vaqtlari noto'g'ri (tugash boshlanishdan keyin bo'lishi kerak)"); return; }
    onSave({
      fish: form.fish,
      jinsi: form.jinsi,
      jinsiId: form.jinsi === "Erkak" ? 1 : 2,
      tugilgan: form.tugilgan,
      yosh: yoshi,
      premorbid: Number(form.premorbid) || 0,
      boshlanish: form.boshlanish,
      tugash: form.tugash,
      davom: davomiyligi,
      prep: Number(form.prep) || 0,
    });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }} onClick={onClose}>
      <form className="card" onClick={e => e.stopPropagation()} onSubmit={submit} style={{
        width: "min(832px, 100%)", padding: 28,
        display: "flex", flexDirection: "column", gap: 18,
        boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h3 style={{
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22,
              letterSpacing: "-0.015em", color: "var(--ink)", margin: 0,
            }}>Yangi bemor</h3>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink-3)", margin: "4px 0 0" }}>
              Bemor ma'lumotlarini kiriting. Hammasini keyin tahrirlash mumkin.
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* F.I.Sh. + Jinsi — bir qatorda */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 14, alignItems: "end" }}>
              <div>
                <label className="label">F.I.Sh. (familiyasi, ismi, sharifi)</label>
                <input className="input" autoFocus required
                  value={form.fish} onChange={e => set("fish", e.target.value)}
                  placeholder="Masalan: Farxodov Og'abek" />
              </div>
              <div>
                <label className="label">Jinsi</label>
                <div role="radiogroup" style={{
                  display: "inline-flex",
                  border: "1px solid var(--border-strong)",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "var(--surface)",
                  height: 42,
                  width: "100%",
                }}>
                  {["Erkak", "Ayol"].map((j, i) => {
                    const active = form.jinsi === j;
                    return (
                      <label key={j} role="radio" aria-checked={active}
                        style={{
                          flex: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                          background: active ? "var(--primary)" : "var(--surface)",
                          color: active ? "#FFFFFF" : "var(--ink)",
                          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14,
                          borderLeft: i > 0 ? "1px solid var(--border-strong)" : "0",
                          transition: "background 120ms var(--ease), color 120ms var(--ease)",
                          userSelect: "none",
                        }}>
                        <input type="radio" name="jinsi" value={j}
                          checked={active}
                          onChange={() => set("jinsi", j)}
                          style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} />
                        {j}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Tug'ilgan vaqti + Yoshi (auto) */}
          <div>
            <label className="label">Tug'ilgan sana</label>
            <input className="input" type="date" required
              value={form.tugilgan} onChange={e => set("tugilgan", e.target.value)} />
          </div>
          <div>
            <label className="label">Yoshi (avtomatik)</label>
            <div style={{
              padding: "10px 12px", borderRadius: 10,
              background: yoshi != null ? "var(--primary-soft)" : "var(--surface-2)",
              border: "1px solid var(--border)",
              color: yoshi != null ? "var(--primary-press)" : "var(--ink-3)",
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15,
              fontVariantNumeric: "tabular-nums",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <Icon name="calendar" size={14} />
              {yoshi != null ? `${yoshi} yosh` : "tug'ilgan sanani kiriting"}
            </div>
          </div>

          {/* Premorbid + Preparatlar — bir qatorda */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
              <div>
                <label className="label">Premorbid nevrologik fon</label>
                <label style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 14px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  cursor: "pointer",
                  userSelect: "none",
                  minHeight: 62,
                }}>
                  <span style={{
                    position: "relative",
                    width: 44, height: 26, flexShrink: 0,
                    background: Number(form.premorbid) === 1 ? "var(--primary)" : "var(--ink-4)",
                    borderRadius: 999,
                    transition: "background 180ms var(--ease)",
                  }}>
                    <input type="checkbox"
                      checked={Number(form.premorbid) === 1}
                      onChange={e => set("premorbid", e.target.checked ? "1" : "0")}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", margin: 0 }} />
                    <span style={{
                      position: "absolute",
                      top: 3, left: Number(form.premorbid) === 1 ? 21 : 3,
                      width: 20, height: 20, borderRadius: 999,
                      background: "#FFFFFF",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      transition: "left 180ms var(--ease)",
                    }} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>
                      {Number(form.premorbid) === 1 ? "Mavjud" : "Yo'q (sog'lom)"}
                    </div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4 }}>
                    </div>
                  </div>
                </label>
              </div>
              <div>
                <label className="label">Preparatlar soni</label>
                <input className="input" type="number" min="0" required
                  value={form.prep} onChange={e => set("prep", e.target.value)} placeholder="5"
                  style={{ height: 62, fontSize: 18, fontWeight: 600, textAlign: "center" }} />
              </div>
            </div>
          </div>

          {/* Amaliyot vaqtlari + davomiyligi — 3 ustun */}
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1.4fr",
              gap: 14,
            }}>
              <div>
                <label className="label">Boshlanish vaqti</label>
                <input className="input" type="time" required
                  value={form.boshlanish ? form.boshlanish.split("T")[1] || "" : ""}
                  onChange={e => {
                    const today = new Date().toISOString().slice(0, 10);
                    set("boshlanish", e.target.value ? `${today}T${e.target.value}` : "");
                  }} />
              </div>
              <div>
                <label className="label">Tugash vaqti</label>
                <input className="input" type="time" required
                  value={form.tugash ? form.tugash.split("T")[1] || "" : ""}
                  onChange={e => {
                    const today = new Date().toISOString().slice(0, 10);
                    set("tugash", e.target.value ? `${today}T${e.target.value}` : "");
                  }} />
              </div>
              <div>
                <label className="label">Davomiyligi (avtomatik)</label>
                <div style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: davomiyligi != null && davomiyligi > 0 ? "var(--primary-soft)" : "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: davomiyligi != null && davomiyligi > 0
                    ? "var(--primary-press)"
                    : davomiyligi != null && davomiyligi <= 0 ? "var(--err)" : "var(--ink-3)",
                  fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
                  fontVariantNumeric: "tabular-nums",
                  display: "flex", alignItems: "center", gap: 6,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  <Icon name="clock" size={14} />
                  {davomiyligi != null
                    ? (davomiyligi > 0
                        ? `${davomiyligi} daq`
                        : "noto'g'ri")
                    : "vaqtlarni kiriting"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          display: "flex", gap: 10, justifyContent: "flex-end",
          paddingTop: 8, borderTop: "1px solid var(--divider)",
        }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor qilish</button>
          <button type="submit" className="btn btn-primary">
            <Icon name="check" size={16} /> Saqlash
          </button>
        </div>
      </form>
    </div>
  );
};

const PatientsList = ({ user, patients, onLogout, onOpen, onAdd, onOpenAnalytics }) => {
  const [showNew, setShowNew] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = patients.filter(p => {
    const q = query.trim().toLowerCase();
    return !q || p.fish.toLowerCase().includes(q) || String(p.id).includes(q);
  });

  return (
    <>
      <AppHeader user={user} onLogout={onLogout} breadcrumbs={[{ label: "Bemorlar" }]} />
      <main style={{ padding: "24px 32px 48px", maxWidth: "var(--content-max)", margin: "0 auto" }}>

        {/* Page title */}
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          marginBottom: 20, gap: 16, flexWrap: "wrap",
        }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Klinik kartochka</div>
            <h1 style={{
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 32,
              letterSpacing: "-0.02em", color: "var(--ink)", margin: 0,
            }}>Bemorlar</h1>
            <p className="num" style={{
              fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-3)",
              margin: "6px 0 0",
            }}>Hammasi <b style={{ color: "var(--ink)" }}>{patients.length}</b> ta · Filtr bo'yicha <b style={{ color: "var(--ink)" }}>{filtered.length}</b> ta</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {onOpenAnalytics && (
              <button className="btn btn-secondary" onClick={onOpenAnalytics}>
                <Icon name="bar-chart-3" size={16} /> <span className="ktt-hide-mobile">Tahlil markazi</span>
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              <Icon name="plus" size={16} /> Yangi bemor
            </button>
          </div>
        </div>

        {/* Stat strip */}
        <div data-grid="stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          <StatTile label="Jami bemorlar" value={patients.length} icon="users" />
          <StatTile label="Testlar o'tgan"
            value={patients.filter(p => p.results && Object.keys(p.results).length > 0).length} icon="check-circle" tone="ok" />
          <StatTile label="Reabilitatsiya"
            value={patients.filter(p => (p.training || []).length > 0).length} icon="brain" tone="primary" />
          <StatTile label="Yangi bu hafta"
            value={patients.filter(p => {
              const days = (Date.now() - new Date(p.sana).getTime()) / 86400000;
              return days <= 7;
            }).length} icon="user-plus" />
        </div>

        {/* Filters */}
        <div className="card" style={{
          padding: "12px 14px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Icon name="search" size={16} style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "var(--ink-4)",
            }} />
            <input className="input" style={{ paddingLeft: 36 }}
              placeholder="Bemor F.I.Sh. yoki № bo'yicha qidirish…"
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: "hidden" }} data-scroll-x>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)", minWidth: 720 }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <Th>№</Th>
                <Th>Bemorning F.I.Sh.</Th>
                <Th align="right">Yoshi</Th>
                <Th align="right">Premorbid Fon</Th>
                <Th align="right">Davomiyligi</Th>
                <Th align="right">Preparatlar</Th>
                <Th>Diagnoz</Th>
                <Th>Davolash</Th>
                <Th>Bashorat</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{
                  padding: "60px 20px", textAlign: "center",
                  color: "var(--ink-3)", fontSize: 14,
                }}>
                  Hech narsa topilmadi. Qidiruv shartini o'zgartiring yoki yangi bemor qo'shing.
                </td></tr>
              )}
              {filtered.map((p, i) => {
                const tests = Object.keys(p.results || {});
                const sessions = (p.training || []).length;
                // Risk prediction (uses PNBPredictor if available)
                let risk = null;
                if (window.PNBPredictor && p.davom > 0) {
                  try { risk = window.PNBPredictor.forecast(p).composite; } catch (e) {}
                }
                return (
                  <tr key={p.id} style={{
                    borderBottom: i === filtered.length - 1 ? 0 : "1px solid var(--divider)",
                    cursor: "pointer",
                    transition: "background var(--dur) var(--ease)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => onOpen(p.id)}>
                    <Td mono>{p.id}</Td>
                    <Td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 999,
                          background: "var(--primary-soft)", color: "var(--primary-press)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12,
                        }}>{p.fish.split(" ").map(s => s[0]).slice(0, 2).join("")}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)" }}>{p.fish}</div>
                          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{p.sana}</div>
                        </div>
                      </div>
                    </Td>
                    <Td align="right" mono>{p.yosh}</Td>
                    <Td align="right">
                      {Number(p.premorbid) === 1
                        ? <span className="pill warn"><span className="pill-dot" /> Mavjud</span>
                        : <span className="pill ok"><span className="pill-dot" /> Yo'q</span>}
                    </Td>
                    <Td align="right" mono>{p.davom} daq</Td>
                    <Td align="right" mono>{p.prep}</Td>
                    <Td>
                      {tests.length > 0
                        ? <span className="pill ok"><span className="pill-dot" /> {tests.length} ta</span>
                        : <span style={{ color: "var(--ink-4)", fontSize: 13 }}>—</span>}
                    </Td>
                    <Td>
                      {sessions > 0
                        ? <span className="pill primary"><span className="pill-dot" /> {sessions} seans</span>
                        : <span style={{ color: "var(--ink-4)", fontSize: 13 }}>—</span>}
                    </Td>
                    <Td>
                      {risk
                        ? <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12,
                            padding: "3px 9px", borderRadius: 999,
                            background: `${risk.category.color}1A`,
                            color: risk.category.color,
                            border: `1px solid ${risk.category.color}33`,
                          }} title={risk.category.label}>
                            <span style={{ width: 6, height: 6, borderRadius: 999, background: risk.category.color }} />
                            {Math.round(risk.risk.prob * 100)}%
                          </span>
                        : <span style={{ color: "var(--ink-4)", fontSize: 13 }}>—</span>}
                    </Td>
                    <Td>
                      <Icon name="chevron-right" size={16} style={{ color: "var(--ink-4)" }} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </main>

      <NewPatientModal open={showNew} onClose={() => setShowNew(false)}
        onSave={(p) => { onAdd(p); setShowNew(false); }} />
    </>
  );
};

const Th = ({ children, align = "left" }) => (
  <th style={{
    textAlign: align, padding: "12px 16px",
    fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12,
    color: "var(--ink-3)", letterSpacing: "0.04em", textTransform: "uppercase",
  }}>{children}</th>
);

const Td = ({ children, align = "left", mono }) => (
  <td className={mono ? "num" : undefined} style={{
    padding: "13px 16px", textAlign: align,
    fontFamily: "var(--font-sans)",
    fontWeight: mono ? 600 : 400,
    fontSize: 13.5, color: "var(--ink)",
  }}>{children}</td>
);

const StatTile = ({ label, sub, value, icon, tone = "neutral" }) => {
  const tones = {
    neutral: { bg: "var(--surface-2)", fg: "var(--ink-2)" },
    primary: { bg: "var(--primary-soft)", fg: "var(--primary-press)" },
    warn:    { bg: "var(--warn-bg)", fg: "#92400E" },
    ok:      { bg: "var(--ok-bg)", fg: "#14532D" },
  };
  const t = tones[tone];
  return (
    <div className="card" style={{
      padding: 14, display: "flex", alignItems: "center", gap: 11,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: t.bg, color: t.fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}><Icon name={icon} size={18} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22,
          color: "var(--ink)", letterSpacing: "-0.01em", lineHeight: 1.05,
          fontVariantNumeric: "tabular-nums",
        }}>{value}</div>
        <div style={{
          fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-2)",
          fontWeight: 500, lineHeight: 1.2,
        }}>{label}</div>
        {sub && (
          <div style={{
            fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--ink-3)",
            lineHeight: 1.2, marginTop: 1,
          }}>{sub}</div>
        )}
      </div>
    </div>
  );
};

const GroupPill = ({ name, small = false }) => {
  const grp = (window.TAQSIMOT_BY_NAME || {})[name];
  if (!grp) {
    return <span className="pill"><span className="pill-dot" /> {name || "—"}</span>;
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: small ? 11 : 12,
      padding: small ? "3px 8px" : "4px 10px", borderRadius: 999,
      background: grp.soft, color: grp.textOn,
      border: `1px solid ${grp.color}22`,
    }} title={grp.desc}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: grp.color }} />
      {grp.name}
    </span>
  );
};

window.GroupPill = GroupPill;

window.PatientsList = PatientsList;
