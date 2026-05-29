// Hisobotlar moduli — PDF/CSV eksport.
// Bemor uchun bitta klinik hisobot + butun datasetni CSV ga.

const ReportsModule = ({ patients, onOpenPatient }) => {
  const downloadCSV = () => {
    const headers = [
      "ID", "F.I.Sh.", "Yoshi", "Jinsi", "Tug'ilgan sana",
      "Premorbid fon", "Davomiyligi (daq)", "Preparatlar soni",
      "Amaliyot boshlanish", "Amaliyot tugash",
      "Testlar bajarilgan", "Reabilitatsiya seanslari",
      "PNB xavfi (%)", "Kutilgan CogScore",
      "Stroop", "TMT", "DST", "LMWT", "NS", "EEG", "Audio",
    ];
    const rows = patients.map(p => {
      let risk = "", sev = "";
      if (window.PNBPredictor && p.davom > 0) {
        try {
          const f = window.PNBPredictor.forecast(p);
          risk = Math.round(f.composite.risk.prob * 100);
          sev = Math.round(f.composite.severity.score);
        } catch (e) {}
      }
      const r = p.results || {};
      const sc = (k) => {
        if (!r[k]?.raw) return "";
        try {
          const s = window.KNBT.summarizeTest(k, r[k].raw, "PreOp", p);
          return s.cogScore?.toFixed(1) || "";
        } catch (e) { return ""; }
      };
      return [
        p.id, p.fish, p.yosh, p.jinsi || "", p.tugilgan || "",
        Number(p.premorbid) === 1 ? "Mavjud" : "Yo'q",
        p.davom, p.prep,
        p.boshlanish || "", p.tugash || "",
        Object.keys(r).length, (p.training || []).length,
        risk, sev,
        sc("Stroop"), sc("TMT"), sc("DST"), sc("LMWT"), sc("NS"), sc("EEG"), sc("Audio"),
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(c => {
        const s = String(c ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(","))
      .join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bemorlar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPatientPDF = (patient) => {
    // Generate a printable HTML report and open in new window for print
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) { alert("Pop-up bloklash o'chiring va qaytadan urinib ko'ring."); return; }
    const html = buildPatientReport(patient);
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Bulk exports */}
      <div className="card" style={{ padding: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Kohort eksport</div>
        <div data-grid="3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <ExportCard
            icon="file-spreadsheet" color="#16A34A" soft="#DCFCE7"
            title="CSV (Excel)" desc="Barcha bemorlar — demografik + KNBT natijalari + prognoz."
            cta={`${patients.length} bemor`}
            onClick={downloadCSV}
          />
          <ExportCard
            icon="file-text" color="#2563EB" soft="#DBEAFE"
            title="SPSS uchun" desc="Statistik tahlil uchun keng formatdagi CSV."
            cta="Tez kunda"
            disabled
          />
          <ExportCard
            icon="bar-chart-3" color="#9333EA" soft="#F3E8FF"
            title="Tadqiqot xulosasi" desc="ROC + Davolash effekti + Dashboard — bir PDF da."
            cta="Tez kunda"
            disabled
          />
        </div>
      </div>

      {/* Per-patient reports */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
          <div className="eyebrow">Bemor bo'yicha hisobotlar</div>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)",
            margin: "4px 0 0",
          }}>Har bemor uchun alohida PDF hisobot. Demografik + barcha testlar + Z-scores + prognoz + reabilitatsiya tarixi.</p>
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <ATh>№</ATh>
              <ATh>Bemor</ATh>
              <ATh align="right">Testlar</ATh>
              <ATh align="right">Reab.</ATh>
              <ATh align="right">PNB %</ATh>
              <ATh align="right">Yaratish</ATh>
            </tr>
          </thead>
          <tbody>
            {patients.map((p, i) => {
              let risk = null;
              if (window.PNBPredictor && p.davom > 0) {
                try { risk = window.PNBPredictor.forecast(p).composite; } catch (e) {}
              }
              return (
                <tr key={p.id} style={{
                  borderBottom: i === patients.length - 1 ? 0 : "1px solid var(--divider)",
                  transition: "background 120ms",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <ATd mono>{p.id}</ATd>
                  <ATd><b>{p.fish}</b><br/><span style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.yosh} y · {p.jinsi || "—"}</span></ATd>
                  <ATd align="right" mono>{Object.keys(p.results || {}).length}</ATd>
                  <ATd align="right" mono>{(p.training || []).length}</ATd>
                  <ATd align="right" mono>
                    {risk
                      ? <span style={{ color: risk.category.color, fontWeight: 700 }}>{Math.round(risk.risk.prob * 100)}%</span>
                      : "—"}
                  </ATd>
                  <ATd align="right">
                    <button className="btn btn-secondary btn-sm" onClick={() => downloadPatientPDF(p)}>
                      <Icon name="printer" size={13} /> PDF
                    </button>
                  </ATd>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

const ExportCard = ({ icon, color, soft, title, desc, cta, onClick, disabled }) => (
  <button onClick={disabled ? undefined : onClick}
    disabled={disabled}
    style={{
      textAlign: "left", padding: 18, borderRadius: 12,
      background: "var(--surface)",
      border: "1px solid var(--border)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      display: "flex", flexDirection: "column", gap: 10,
      fontFamily: "inherit",
      transition: "transform 120ms, box-shadow 120ms, border-color 120ms",
    }}
    onMouseEnter={e => {
      if (disabled) return;
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
      e.currentTarget.style.borderColor = "var(--border-strong)";
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.transform = "translateY(0)";
    }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10,
      background: soft, color: color,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}><Icon name={icon} size={22} /></div>
    <div>
      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{title}</div>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)", margin: "4px 0 0" }}>{desc}</p>
    </div>
    <div style={{
      display: "flex", alignItems: "center", gap: 6, marginTop: "auto", paddingTop: 6,
      fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 12,
      color: disabled ? "var(--ink-4)" : color,
    }}>
      {cta} {!disabled && <Icon name="download" size={13} />}
    </div>
  </button>
);

// Generate a complete printable HTML report for a patient.
function buildPatientReport(p) {
  const r = p.results || {};
  const training = p.training || [];
  let composite = null;
  let risk = null;
  if (window.KNBT && Object.keys(r).length) {
    try {
      const sumByTest = {};
      for (const [k, v] of Object.entries(r)) {
        if (v.raw) sumByTest[k] = window.KNBT.summarizeTest(k, v.raw, "PreOp", p);
      }
      composite = window.KNBT.summarizeComposite(sumByTest, "PreOp");
    } catch (e) {}
  }
  if (window.PNBPredictor && p.davom > 0) {
    try { risk = window.PNBPredictor.forecast(p); } catch (e) {}
  }

  const today = new Date().toLocaleDateString("uz-UZ", { day: "2-digit", month: "long", year: "numeric" });

  return `<!doctype html>
<html lang="uz"><head>
<meta charset="utf-8">
<title>Klinik hisobot — ${p.fish}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: -apple-system, "Segoe UI", sans-serif; color: #0F172A; line-height: 1.5; }
  h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: -0.01em; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #0F766E; margin: 24px 0 8px; }
  h3 { font-size: 13px; margin: 12px 0 4px; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0F766E; padding-bottom: 12px; margin-bottom: 16px; }
  .meta { color: #64748B; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table th, table td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #E2E8F0; }
  table th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748B; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { font-size: 12px; }
  .field-label { color: #64748B; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
  .field-value { font-weight: 600; font-size: 14px; color: #0F172A; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .pill-warn { background: #FEF3C7; color: #92400E; }
  .pill-ok { background: #DCFCE7; color: #14532D; }
  .pill-err { background: #FEE2E2; color: #991B1B; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #E2E8F0; color: #94A3B8; font-size: 10px; }
  .verdict {
    padding: 14px 18px; border-radius: 8px; margin: 12px 0;
    background: ${composite?.ispcd ? "#FEE2E2" : "#DCFCE7"};
    color: ${composite?.ispcd ? "#991B1B" : "#14532D"};
  }
</style>
</head><body>
<div class="header">
  <div>
    <h1>${p.fish}</h1>
    <div class="meta">№ ${p.id} · ${p.yosh} yosh · ${p.jinsi || ""} · Ro'yxatga olingan: ${p.sana || ""}</div>
  </div>
  <div class="meta">Hisobot sanasi: ${today}</div>
</div>

<h2>Demografik ma'lumotlar</h2>
<div class="grid2">
  <div class="field"><div class="field-label">F.I.Sh.</div><div class="field-value">${p.fish}</div></div>
  <div class="field"><div class="field-label">Yoshi</div><div class="field-value">${p.yosh}</div></div>
  <div class="field"><div class="field-label">Jinsi</div><div class="field-value">${p.jinsi || "—"}</div></div>
  <div class="field"><div class="field-label">Tug'ilgan sana</div><div class="field-value">${p.tugilgan || "—"}</div></div>
  <div class="field"><div class="field-label">Premorbid fon</div><div class="field-value">${Number(p.premorbid) === 1 ? "Mavjud" : "Yo'q (sog'lom)"}</div></div>
  <div class="field"><div class="field-label">Davomiyligi</div><div class="field-value">${p.davom} daqiqa</div></div>
  <div class="field"><div class="field-label">Anestetik preparatlar</div><div class="field-value">${p.prep} ta</div></div>
  <div class="field"><div class="field-label">Amaliyot vaqti</div><div class="field-value">${p.boshlanish ? new Date(p.boshlanish).toLocaleString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "—"} → ${p.tugash ? new Date(p.tugash).toLocaleString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "—"}</div></div>
</div>

${composite ? `
<h2>KNBT Composite (PreOp)</h2>
<div class="verdict">
  <strong>${composite.cognitiveHealth}</strong> · CogScore: <strong>${composite.compositeScore} / 100</strong> · Z-score: <strong>${composite.zScore?.toFixed(2) || "—"}</strong> · ISPOCD: <strong>${composite.ispcd ? "Musbat" : "Manfiy"}</strong>
</div>
<table>
  <thead><tr><th>Test</th><th>CogScore</th><th>Z-score</th><th>Cognitive Health</th><th>ISPOCD</th></tr></thead>
  <tbody>
    ${Object.entries(r).filter(([_, v]) => v.raw).map(([k, v]) => {
      const s = window.KNBT.summarizeTest(k, v.raw, "PreOp", p);
      return `<tr>
        <td><strong>${k}</strong></td>
        <td>${s.cogScore ?? "—"} / 100</td>
        <td>${s.zScore?.toFixed(2) ?? "—"}</td>
        <td>${s.cognitiveHealth}</td>
        <td>${s.ispcd ? '<span class="pill pill-warn">Musbat</span>' : '<span class="pill pill-ok">Manfiy</span>'}</td>
      </tr>`;
    }).join("")}
  </tbody>
</table>
` : "<p><em>Diagnostik testlar hali bajarilmagan.</em></p>"}

${risk ? `
<h2>PNB rivojlanish prognozi</h2>
<div class="verdict" style="background: ${risk.composite.category.color}22; color: ${risk.composite.category.color};">
  <strong>${risk.composite.category.label}</strong> · PNB ehtimoli: <strong>${Math.round(risk.composite.risk.prob * 100)}%</strong> · Kutilgan CogScore (PostOp): <strong>${Math.round(risk.composite.severity.score)} / 100</strong>
</div>
<h3>Klinik tavsiyalar</h3>
<ul style="font-size: 12px; line-height: 1.6;">
  ${risk.recommendations.map(rec => `<li><strong>${rec.title}.</strong> ${rec.text}</li>`).join("")}
</ul>
` : ""}

${training.length ? `
<h2>Reabilitatsiya tarixi</h2>
<table>
  <thead><tr><th>Sana</th><th>Mashq</th><th>Aniqlik</th><th>Ball</th></tr></thead>
  <tbody>
    ${training.slice(-10).reverse().map(s => {
      const ex = window.TRAINING_META?.[s.exerciseId] || { name: s.exerciseId };
      return `<tr>
        <td>${new Date(s.completedAt).toLocaleDateString("uz-UZ")}</td>
        <td>${ex.name}</td>
        <td>${Math.round((s.accuracy || 0) * 100)}%</td>
        <td>${s.score}</td>
      </tr>`;
    }).join("")}
  </tbody>
</table>
<p style="font-size: 11px; color: #64748B; margin-top: 6px;">Jami ${training.length} seans · oxirgi 10 ko'rsatilmoqda</p>
` : ""}

<div class="footer">
  Kognitiv Test Tizimi · Klinik hisobot · ${today}
</div>
</body></html>`;
}

window.ReportsModule = ReportsModule;
