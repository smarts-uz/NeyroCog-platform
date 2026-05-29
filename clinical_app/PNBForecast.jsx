// PNB Bashorat moduli — bemor sahifasidagi alohida tab.
// Bemor kiritilgan zahoti uning PNB xavfi va kutilayotgan og'irligi
// avtomatik hisoblanadi.

const PNBForecast = ({ patient }) => {
  const F = window.PNBPredictor.forecast(patient);
  const comp = F.composite;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Hero — composite risk + severity */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "18px 22px",
          background: `linear-gradient(135deg, ${comp.category.color} 0%, ${shade(comp.category.color, -0.15)} 100%)`,
          color: "#FFFFFF",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="activity" size={20} /></div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.85,
            }}>PNB rivojlanish prognozi · {patient.fish}</div>
            <div style={{
              fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20,
              letterSpacing: "-0.01em", marginTop: 2,
            }}>{comp.category.label}</div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.85 }}>
            n=181 · AUC {comp.risk.auc.toFixed(2)}
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
        }}>
          {/* Risk gauge */}
          <div style={{
            padding: "24px 28px", borderRight: "1px solid var(--divider)",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div className="eyebrow">PNB ehtimoli (Logistic Regression)</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 64,
                letterSpacing: "-0.025em", lineHeight: 1, color: comp.category.color,
                fontVariantNumeric: "tabular-nums",
              }}>{Math.round(comp.risk.prob * 100)}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 24, fontWeight: 600, color: "var(--ink-3)" }}>%</div>
            </div>
            <RiskMeter prob={comp.risk.prob} color={comp.category.color} />
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)",
              lineHeight: 1.5,
            }}>
              Bemor profili PNB <b style={{ color: comp.category.color }}>{comp.category.label.toLowerCase()}</b> guruhiga kiradi.
              Pseudo-R² = <b>{comp.risk.r2.toFixed(2)}</b> · model n=181 da o'qitilgan.
            </div>
          </div>

          {/* Severity forecast */}
          <div style={{
            padding: "24px 28px",
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            <div className="eyebrow">Kutilayotgan CogScore (PostOp)</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={{
                fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 64,
                letterSpacing: "-0.025em", lineHeight: 1, color: comp.sevCategory.color,
                fontVariantNumeric: "tabular-nums",
              }}>{Math.round(comp.severity.score)}</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 600, color: "var(--ink-3)" }}>/ 100</div>
            </div>
            <SeverityBar score={comp.severity.score} color={comp.sevCategory.color} />
            <div style={{
              fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)",
              lineHeight: 1.5,
            }}>
              <b style={{ color: comp.sevCategory.color }}>{comp.sevCategory.label}</b> — operatsiyadan 7–10 kun keyin kutilayotgan kognitiv ko'rsatkich (Multiple Linear Regression, Adj R²={comp.severity.adjR2.toFixed(2)}).
            </div>
          </div>
        </div>
      </div>

      {/* Input snapshot + contributions */}
      <div className="card" style={{ padding: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Xavf omillarining hissasi</div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 18,
        }}>
          <InputTile label="Davomiyligi" value={`${F.input.dur} daq`} refValue={`o'rtacha: 90 daq`} icon="clock" />
          <InputTile label="Preparatlar" value={`${F.input.drugs} ta`} refValue={`o'rtacha: 3 ta`} icon="pill" />
          <InputTile label="Bemor yoshi" value={`${F.input.age} y`} refValue={`o'rtacha: 11 y`} icon="user" />
          <InputTile label="Premorbid fon" value={F.input.prem ? "Mavjud" : "Yo'q"} refValue={`o'rtacha: Yo'q`} icon="alert-circle" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {F.contributions.map((c, i) => (
            <ContributionRow key={c.key} contrib={c} maxContrib={F.contributions[0]?.logitContribution} />
          ))}
        </div>
      </div>

      {/* Per-instrument forecast */}
      <div className="card" style={{ padding: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          Test bo'yicha bashorat — har bir KNBT instrumenti
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {Object.entries(F.perInstrument).map(([id, data]) => (
            <InstrumentForecast key={id} id={id} data={data} />
          ))}
        </div>
      </div>

      {/* Clinical recommendations */}
      <div className="card" style={{ padding: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Klinik tavsiyalar</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {F.recommendations.map((r, i) => <Recommendation key={i} rec={r} />)}
        </div>
      </div>

      {/* Methodology footnote */}
      <div style={{
        padding: "12px 16px",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--ink-3)",
        lineHeight: 1.5,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <Icon name="info" size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          Model statistik manba: <b>Statistics M-3 Risk Factors</b> (n=181, pos∪Sog'lom).
          Logistic Regression koeffitsientlari (β₀, β_dur, β_drugs, β_age, β_prem) Excel datasetidan olingan.
          AUC = ROC egri ostidagi maydon (diagnostik aniqlik).
          Bashorat <b>klinik qaror almashtirmaydi</b> — har holatda shifokor mustaqil baholash o'tkazishi kerak.
        </div>
      </div>
    </div>
  );
};

// ----- Sub-components -----

const RiskMeter = ({ prob, color }) => {
  const pct = Math.max(0, Math.min(100, prob * 100));
  return (
    <div>
      <div style={{
        position: "relative", height: 12, borderRadius: 999,
        background: "linear-gradient(to right, #DCFCE7 0%, #DCFCE7 20%, #DBEAFE 20%, #DBEAFE 45%, #FEF3C7 45%, #FEF3C7 70%, #FEE2E2 70%, #FEE2E2 100%)",
      }}>
        <div style={{
          position: "absolute", top: -4, bottom: -4,
          left: `calc(${pct}% - 3px)`, width: 6,
          background: color, borderRadius: 3,
          boxShadow: "0 0 0 3px rgba(15, 23, 42, 0.12)",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 6,
        fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)",
        fontVariantNumeric: "tabular-nums",
      }}>
        <span>0% past</span>
        <span>45% o'rta</span>
        <span>70% yuqori</span>
        <span>100%</span>
      </div>
    </div>
  );
};

const SeverityBar = ({ score, color }) => {
  return (
    <div>
      <div style={{
        position: "relative", height: 12, borderRadius: 999,
        background: "linear-gradient(to right, #FECACA 0%, #FECACA 50%, #FED7AA 50%, #FED7AA 65%, #FEF3C7 65%, #FEF3C7 75%, #DBEAFE 75%, #DBEAFE 85%, #DCFCE7 85%, #DCFCE7 100%)",
      }}>
        <div style={{
          position: "absolute", top: -4, bottom: -4,
          left: `calc(${score}% - 3px)`, width: 6,
          background: color, borderRadius: 3,
          boxShadow: "0 0 0 3px rgba(15, 23, 42, 0.12)",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 6,
        fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)",
        fontVariantNumeric: "tabular-nums",
      }}>
        <span>0 og'ir</span>
        <span>50</span>
        <span>75 me'yor</span>
        <span>100 a'lo</span>
      </div>
    </div>
  );
};

const InputTile = ({ label, value, refValue, icon }) => (
  <div style={{
    padding: "12px 14px",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    display: "flex", alignItems: "center", gap: 10,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: "var(--surface)", color: "var(--ink-2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}><Icon name={icon} size={16} /></div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--ink-3)",
        letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600,
      }}>{label}</div>
      <div style={{
        fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15,
        color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2,
      }}>{value}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>{refValue}</div>
    </div>
  </div>
);

const ContributionRow = ({ contrib, maxContrib }) => {
  const absMax = Math.max(Math.abs(maxContrib || 1), 0.1);
  const widthPct = Math.min(100, (Math.abs(contrib.logitContribution) / absMax) * 100);
  const isProtective = contrib.logitContribution < 0;
  const color = isProtective ? "#16A34A" : "#DC2626";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "180px 80px 1fr 130px",
      alignItems: "center", gap: 12,
      padding: "8px 0",
    }}>
      <div>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>
          {contrib.label}
        </div>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)",
          fontVariantNumeric: "tabular-nums",
        }}>
          OR={contrib.or?.toFixed(2)}{contrib.unit ? ` per ${contrib.unit}` : ""}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
          color: "var(--ink)", fontVariantNumeric: "tabular-nums",
        }}>{contrib.value ?? 0}</span>
        {contrib.ref !== undefined && contrib.ref !== "Yo'q" && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)",
          }}>vs {contrib.ref}</span>
        )}
        {contrib.ref === "Yo'q" && (
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)",
          }}>vs Yo'q</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {isProtective && <div style={{ flex: 1 }} />}
        <div style={{
          height: 18,
          width: `${widthPct}%`,
          background: color,
          opacity: 0.85,
          borderRadius: isProtective ? "999px 0 0 999px" : "0 999px 999px 0",
          minWidth: 2,
          transition: "width 320ms var(--ease)",
        }} />
        {!isProtective && <div style={{ flex: 1 }} />}
      </div>

      <div style={{
        fontFamily: "var(--font-sans)", fontSize: 12, color: color, fontWeight: 600,
        textAlign: "right",
      }}>
        {isProtective ? "↓ xavfni kamaytiradi" : "↑ xavfni oshiradi"}
      </div>
    </div>
  );
};

const InstrumentForecast = ({ id, data }) => {
  const meta = window.KNBT?.TEST_META?.[id] || { name: id, short: id, color: "#64748B", soft: "#F1F5F9", icon: "circle" };
  return (
    <div style={{
      padding: "12px 14px",
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      display: "grid",
      gridTemplateColumns: "32px 1fr auto auto",
      alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: meta.soft, color: meta.color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><Icon name={meta.icon} size={15} /></div>
      <div>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>
          {meta.name}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>
          AUC {data.risk.auc.toFixed(2)} · {meta.short}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-3)",
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>Xavf</div>
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16,
          color: data.riskCat.color, fontVariantNumeric: "tabular-nums", lineHeight: 1,
        }}>{Math.round(data.risk.prob * 100)}%</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-3)",
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>CogScore</div>
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16,
          color: data.sevCat.color, fontVariantNumeric: "tabular-nums", lineHeight: 1,
        }}>{Math.round(data.severity.score)}</div>
      </div>
    </div>
  );
};

const Recommendation = ({ rec }) => {
  const tones = {
    ok:   { bg: "var(--ok-bg)",   fg: "#14532D" },
    warn: { bg: "var(--warn-bg)", fg: "#92400E" },
    bad:  { bg: "var(--err-bg)",  fg: "#991B1B" },
    info: { bg: "var(--info-bg)", fg: "#1E3A8A" },
  };
  const t = tones[rec.tone] || tones.info;
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 10,
      background: t.bg, color: t.fg,
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <Icon name={rec.icon} size={18} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14,
          letterSpacing: "-0.005em",
        }}>{rec.title}</div>
        <div style={{
          fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5,
          marginTop: 3, opacity: 0.92,
        }}>{rec.text}</div>
      </div>
    </div>
  );
};

// Helper: darken/lighten color for gradient
function shade(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0xFF) + amt));
  return "#" + ((R << 16) | (G << 8) | B).toString(16).padStart(6, "0");
}

window.PNBForecast = PNBForecast;
