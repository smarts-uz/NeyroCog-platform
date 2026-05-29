// Hisobotlar moduli — PDF/CSV eksport.
// Bemor uchun bitta klinik hisobot + butun datasetni CSV ga.

const ReportsModule = ({ patients, onOpenPatient }) => {
  const downloadCSV = () => {
    const headers = [
      "ID", "F.I.Sh.", "Yoshi", "Jinsi", "Tug'ilgan sana",
      "Premorbid fon", "Davomiyligi (daq)", "Dori soni",
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
        p.id, p.fish, p.yosh, (window.jinsLabel ? window.jinsLabel(p.jinsi) : p.jinsi) || "", p.tugilgan || "",
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

      {/* Demografik taqsimot + eksport — bitta qatorda */}
      {(() => {
        const ageGroups = { "≤9": 0, "10-12": 0, "13-15": 0, "16+": 0 };
        const sexCounts = { Erkak: 0, Ayol: 0 };
        patients.forEach(p => {
          const a = p.yosh || 0;
          if (a <= 9) ageGroups["≤9"]++; else if (a <= 12) ageGroups["10-12"]++;
          else if (a <= 15) ageGroups["13-15"]++; else ageGroups["16+"]++;
          if (p.jinsi) sexCounts[p.jinsi] = (sexCounts[p.jinsi] || 0) + 1;
        });
        const D = window.AnalyticsDonut;
        return (
          <div data-grid="3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, alignItems: "stretch" }}>
            <div className="card" style={{ padding: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Yosh taqsimoti</div>
              {D && <D data={Object.entries(ageGroups).map(([k, v], i) => ({ label: k, value: v, color: ["#0F766E","#14857A","#2DA8A0","#7DD3C8"][i] }))} centerLabel="bemor" />}
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Jins taqsimoti</div>
              {D && <D data={Object.entries(sexCounts).map(([k, v]) => ({ label: window.jinsLabel ? window.jinsLabel(k) : k, value: v, color: k === "Erkak" ? "#2563EB" : "#DB2777" }))} centerLabel="bemor" />}
            </div>
            <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column" }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Kohort eksport</div>
              <div style={{ flex: 1 }}>
                <ExportCard
                  icon="file-spreadsheet" color="#16A34A" soft="#DCFCE7"
                  title="CSV (Excel)" desc="Barcha bemorlar — demografik + KNBT natijalari + ehtimol."
                  cta={`${patients.length} bemor`}
                  onClick={downloadCSV}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Per-patient reports */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--divider)" }}>
          <div className="eyebrow">Bemor bo'yicha hisobotlar</div>
          <p style={{
            fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--ink-3)",
            margin: "4px 0 0",
          }}>Har bemor uchun alohida PDF hisobot. Demografik + barcha testlar + Z-scores + ehtimol + reabilitatsiya tarixi.</p>
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
                  <ATd><b>{p.fish}</b><br/><span style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.yosh} y · {window.jinsLabel ? window.jinsLabel(p.jinsi) : (p.jinsi || "—")}</span></ATd>
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
window.buildPatientReport = buildPatientReport;
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
  @page { size: A4; margin: 14mm 16mm 20mm; }
  * { box-sizing: border-box; }
  body { font-family: "Outfit", -apple-system, "Segoe UI", sans-serif; color: #1F2328; line-height: 1.5; margin: 0; }
  h1 { font-size: 21px; margin: 0 0 3px; letter-spacing: -0.02em; font-weight: 800; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #0F766E; margin: 22px 0 8px; font-weight: 700; }
  h3 { font-size: 13px; margin: 12px 0 4px; }
  .num { font-variant-numeric: tabular-nums; }

  /* Branded letterhead band */
  .letterhead {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; border-radius: 10px;
    background: linear-gradient(135deg, #0F766E 0%, #14857A 60%, #1FA6B0 100%);
    color: #FFF; margin-bottom: 18px;
  }
  .letterhead .lh-logo { width: 40px; height: 40px; flex-shrink: 0; }
  .letterhead .lh-name { font-size: 19px; font-weight: 800; letter-spacing: -0.02em; }
  .letterhead .lh-sub { font-size: 11px; opacity: 0.85; letter-spacing: 0.04em; }
  .letterhead .lh-right { margin-left: auto; text-align: right; font-size: 11px; opacity: 0.92; }

  .patient-head { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid #D1D9E0; padding-bottom: 12px; margin-bottom: 16px; }
  .meta { color: #59636E; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  table th, table td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #E4E8EC; }
  table th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #59636E; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { font-size: 12px; }
  .field-label { color: #59636E; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
  .field-value { font-weight: 600; font-size: 14px; color: #1F2328; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .pill-warn { background: #FFF8C5; color: #7D4E00; }
  .pill-ok { background: #DAFBE1; color: #166534; }
  .pill-err { background: #FFEBE9; color: #CF222E; }
  .verdict {
    padding: 14px 18px; border-radius: 8px; margin: 12px 0;
    border: 1px solid ${composite?.ispcd ? "#FFCECE" : "#A7E8B8"};
    background: ${composite?.ispcd ? "#FFEBE9" : "#DAFBE1"};
    color: ${composite?.ispcd ? "#CF222E" : "#166534"};
  }
  /* Signature + footer */
  .sign-row { display: flex; justify-content: space-between; margin-top: 40px; gap: 40px; }
  .sign-box { flex: 1; }
  .sign-line { border-top: 1px solid #1F2328; margin-top: 38px; padding-top: 4px; font-size: 11px; color: #59636E; }
  .footer { margin-top: 26px; padding-top: 12px; border-top: 1px solid #E4E8EC; color: #818B98; font-size: 10px; display: flex; justify-content: space-between; align-items: center; }
  .footer .qr { width: 54px; height: 54px; }
</style>
</head><body>

<div class="letterhead">
  <svg class="lh-logo" viewBox="0 0 32 32" fill="none">
    <path d="M11 6.6c1.4-1.9 4.6-2 6.1-.2 1.6-.7 3.7.1 4.4 1.8 2.1-.3 4 1.4 4 3.5 1.6.5 2.6 2.2 2.2 3.9 1.2 1 1.4 2.9.3 4.1.5 1.7-.7 3.5-2.5 3.7-.5 1.8-2.6 2.7-4.3 1.9-1.2 1.5-3.6 1.5-4.8 0-1.6.8-3.7-.1-4.3-1.8-1.9.2-3.6-1.3-3.5-3.2-1.6-.5-2.5-2.2-2-3.8-1.1-1.1-1.1-2.9 0-4-.5-1.7.6-3.5 2.4-3.8.2-1.9 2.1-3.2 3.9-2.8z" fill="rgba(255,255,255,0.16)"/>
    <g stroke="#FFF" stroke-width="1.3" stroke-linecap="round" opacity="0.96">
      <line x1="12" y1="11.5" x2="17" y2="10"/><line x1="17" y1="10" x2="20.5" y2="13.5"/>
      <line x1="12" y1="11.5" x2="14.5" y2="17"/><line x1="14.5" y1="17" x2="20.5" y2="13.5"/>
      <line x1="14.5" y1="17" x2="18" y2="21"/>
    </g>
    <g fill="#FFF"><circle cx="12" cy="11.5" r="1.7"/><circle cx="17" cy="10" r="1.7"/><circle cx="20.5" cy="13.5" r="1.7"/><circle cx="14.5" cy="17" r="1.7"/><circle cx="18" cy="21" r="1.7"/></g>
  </svg>
  <div>
    <div class="lh-name">NeyroCog</div>
    <div class="lh-sub">Neyrokognitiv diagnostika va reabilitatsiya tizimi</div>
  </div>
  <div class="lh-right">
    Klinik hisobot<br/>${today}
  </div>
</div>

<div class="patient-head">
  <div>
    <h1>${p.fish}</h1>
    <div class="meta">№ ${p.id} · ${p.yosh} yosh · ${(window.jinsLabel ? window.jinsLabel(p.jinsi) : p.jinsi) || ""} · Ro'yxatga olingan: ${p.sana || ""}</div>
  </div>
  <div class="meta">Hujjat ID: NC-${String(p.id).padStart(4, "0")}-${today.replace(/\D/g, "").slice(0, 8)}</div>
</div>

<h2>Demografik ma'lumotlar</h2>
<div class="grid2">
  <div class="field"><div class="field-label">F.I.Sh.</div><div class="field-value">${p.fish}</div></div>
  <div class="field"><div class="field-label">Yoshi</div><div class="field-value">${p.yosh}</div></div>
  <div class="field"><div class="field-label">Jinsi</div><div class="field-value">${(window.jinsLabel ? window.jinsLabel(p.jinsi) : p.jinsi) || "—"}</div></div>
  <div class="field"><div class="field-label">Tug'ilgan sana</div><div class="field-value">${p.tugilgan || "—"}</div></div>
  <div class="field"><div class="field-label">Premorbid fon</div><div class="field-value">${Number(p.premorbid) === 1 ? "Mavjud" : "Yo'q (sog'lom)"}</div></div>
  <div class="field"><div class="field-label">Davomiyligi</div><div class="field-value">${p.davom} daqiqa</div></div>
  <div class="field"><div class="field-label">Anestetik dori</div><div class="field-value">${p.prep} ta</div></div>
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
<h2>PNB rivojlanish ehtimoli</h2>
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
  NeyroCog · Klinik hisobot · ${today} · Loyiha rahbari: Zakirova D.A. · dr.durdona.zakirova@gmail.com · +998 99 816 74 77
</div>
</body></html>`;
}

window.ReportsModule = ReportsModule;
