"use client";

import { ClinicalIcon } from "@/components/clinical-icon";
import { Card } from "@/components/ui/card";
import { type FactorContribution, type Recommendation, forecast } from "@/lib/engines/prediction";
import type { TestName } from "@/lib/engines/types";
import type { PatientDetail } from "@/lib/patients/detail";
import { TEST_BY_ID } from "@/lib/tests/meta";
import { Activity, Info } from "lucide-react";
import { useMemo } from "react";

function shade(hex: string, percent: number): string {
  const num = Number.parseInt(hex.slice(1), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return `#${((R << 16) | (G << 8) | B).toString(16).padStart(6, "0")}`;
}

export function PnbForecastPanel({ patient }: { patient: PatientDetail }) {
  const F = useMemo(
    () =>
      forecast({
        yosh: patient.yosh,
        jinsi: patient.jinsi === "Ayol" ? "Ayol" : "Erkak",
        premorbid: (patient.premorbid > 0 ? 1 : 0) as 0 | 1,
        davom: patient.davom,
        prep: patient.prep,
      }),
    [patient],
  );
  const comp = F.composite;
  const maxContrib = F.contributions[0]?.logitContribution ?? 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <Card className="p-0 overflow-hidden">
        <div
          className="px-5 py-4 text-white flex items-center gap-3.5"
          style={{
            background: `linear-gradient(135deg, ${comp.category.color} 0%, ${shade(comp.category.color, -0.15)} 100%)`,
          }}
        >
          <div className="h-10 w-10 rounded-[10px] bg-white/20 grid place-items-center">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold tracking-widest uppercase opacity-85">
              PNB rivojlanish prognozi · {patient.fish}
            </div>
            <div className="font-bold text-xl tracking-tight mt-0.5">{comp.category.label}</div>
          </div>
          <div className="font-mono text-[11px] opacity-85">
            n=181 · AUC {comp.risk.auc.toFixed(2)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="px-7 py-6 sm:border-r border-divider flex flex-col gap-3.5">
            <div className="eyebrow">PNB ehtimoli (Logistic Regression)</div>
            <div className="flex items-baseline gap-2">
              <div
                className="font-extrabold text-[64px] tracking-tight leading-none tabular-nums"
                style={{ color: comp.category.color }}
              >
                {Math.round(comp.risk.prob * 100)}
              </div>
              <div className="text-2xl font-semibold text-ink-3">%</div>
            </div>
            <RiskMeter prob={comp.risk.prob} color={comp.category.color} />
            <div className="text-xs text-ink-3 leading-relaxed">
              Bemor profili PNB{" "}
              <b style={{ color: comp.category.color }}>{comp.category.label.toLowerCase()}</b>{" "}
              guruhiga kiradi. Pseudo-R² = <b>{comp.risk.r2.toFixed(2)}</b> · model n=181 da
              o'qitilgan.
            </div>
          </div>

          <div className="px-7 py-6 flex flex-col gap-3.5">
            <div className="eyebrow">Kutilayotgan CogScore (PostOp)</div>
            <div className="flex items-baseline gap-2">
              <div
                className="font-extrabold text-[64px] tracking-tight leading-none tabular-nums"
                style={{ color: comp.sevCategory.color }}
              >
                {Math.round(comp.severity.score)}
              </div>
              <div className="text-lg font-semibold text-ink-3">/ 100</div>
            </div>
            <SeverityBar score={comp.severity.score} color={comp.sevCategory.color} />
            <div className="text-xs text-ink-3 leading-relaxed">
              <b style={{ color: comp.sevCategory.color }}>{comp.sevCategory.label}</b> —
              operatsiyadan 7–10 kun keyin kutilayotgan kognitiv ko'rsatkich (MLR, Adj R²=
              {comp.severity.adjR2.toFixed(2)}).
            </div>
          </div>
        </div>
      </Card>

      {/* Contributions */}
      <Card className="p-5">
        <div className="eyebrow mb-3.5">Xavf omillarining hissasi</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <InputTile
            label="Davomiyligi"
            value={`${F.input.dur} daq`}
            ref="o'rtacha: 90 daq"
            icon="play"
          />
          <InputTile
            label="Preparatlar"
            value={`${F.input.drugs} ta`}
            ref="o'rtacha: 3 ta"
            icon="activity"
          />
          <InputTile
            label="Bemor yoshi"
            value={`${F.input.age} y`}
            ref="o'rtacha: 11 y"
            icon="user"
          />
          <InputTile
            label="Premorbid fon"
            value={F.input.prem ? "Mavjud" : "Yo'q"}
            ref="o'rtacha: Yo'q"
            icon="stethoscope"
          />
        </div>
        <div className="flex flex-col gap-2.5">
          {F.contributions.map((c) => (
            <ContributionRow key={c.key} contrib={c} maxContrib={maxContrib} />
          ))}
        </div>
      </Card>

      {/* Per-instrument */}
      <Card className="p-5">
        <div className="eyebrow mb-3.5">Test bo'yicha bashorat — har bir KNBT instrumenti</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {Object.entries(F.perInstrument).map(([id, data]) => (
            <InstrumentForecast key={id} id={id as TestName} data={data} />
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-5">
        <div className="eyebrow mb-3.5">Klinik tavsiyalar</div>
        <div className="flex flex-col gap-2.5">
          {F.recommendations.map((r) => (
            <RecRow key={r.title} rec={r} />
          ))}
        </div>
      </Card>

      <div className="px-4 py-3 bg-surface-2 border border-border rounded-[10px] text-[11px] text-ink-3 leading-relaxed flex gap-2.5 items-start">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <div>
          Model statistik manba: <b>Statistics M-3 Risk Factors</b> (n=181, pos∪Sog'lom). Logistic
          Regression koeffitsientlari Excel datasetidan olingan. AUC = ROC egri ostidagi maydon.
          Bashorat <b>klinik qaror almashtirmaydi</b> — har holatda shifokor mustaqil baholash
          o'tkazishi kerak.
        </div>
      </div>
    </div>
  );
}

function RiskMeter({ prob, color }: { prob: number; color: string }) {
  const pct = Math.max(0, Math.min(100, prob * 100));
  return (
    <div>
      <div
        className="relative h-3 rounded-pill"
        style={{
          background:
            "linear-gradient(to right, #DCFCE7 0%, #DCFCE7 20%, #DBEAFE 20%, #DBEAFE 45%, #FEF3C7 45%, #FEF3C7 70%, #FEE2E2 70%, #FEE2E2 100%)",
        }}
      >
        <div
          className="absolute -top-1 -bottom-1 w-1.5 rounded-[3px]"
          style={{
            left: `calc(${pct}% - 3px)`,
            background: color,
            boxShadow: "0 0 0 3px rgba(15,23,42,0.12)",
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5 font-mono text-[10px] text-ink-3 tabular-nums">
        <span>0% past</span>
        <span>45% o'rta</span>
        <span>70% yuqori</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function SeverityBar({ score, color }: { score: number; color: string }) {
  return (
    <div>
      <div
        className="relative h-3 rounded-pill"
        style={{
          background:
            "linear-gradient(to right, #FECACA 0%, #FECACA 50%, #FED7AA 50%, #FED7AA 65%, #FEF3C7 65%, #FEF3C7 75%, #DBEAFE 75%, #DBEAFE 85%, #DCFCE7 85%, #DCFCE7 100%)",
        }}
      >
        <div
          className="absolute -top-1 -bottom-1 w-1.5 rounded-[3px]"
          style={{
            left: `calc(${score}% - 3px)`,
            background: color,
            boxShadow: "0 0 0 3px rgba(15,23,42,0.12)",
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5 font-mono text-[10px] text-ink-3 tabular-nums">
        <span>0 og'ir</span>
        <span>50</span>
        <span>75 me'yor</span>
        <span>100 a'lo</span>
      </div>
    </div>
  );
}

function InputTile({
  label,
  value,
  ref,
  icon,
}: {
  label: string;
  value: string;
  ref: string;
  icon: string;
}) {
  return (
    <div className="px-3.5 py-3 bg-surface-2 border border-border rounded-[10px] flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-surface text-ink-2 grid place-items-center shrink-0">
        <ClinicalIcon name={icon} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-ink-3">{label}</div>
        <div className="font-bold text-[15px] text-ink tabular-nums leading-tight">{value}</div>
        <div className="font-mono text-[10px] text-ink-3">{ref}</div>
      </div>
    </div>
  );
}

function ContributionRow({
  contrib,
  maxContrib,
}: {
  contrib: FactorContribution;
  maxContrib: number;
}) {
  const absMax = Math.max(Math.abs(maxContrib || 1), 0.1);
  const widthPct = Math.min(100, (Math.abs(contrib.logitContribution) / absMax) * 100);
  const isProtective = contrib.logitContribution < 0;
  const color = isProtective ? "#16A34A" : "#DC2626";

  return (
    <div className="grid grid-cols-[140px_70px_1fr_120px] items-center gap-3 py-2">
      <div>
        <div className="font-semibold text-[13px] text-ink">{contrib.label}</div>
        <div className="font-mono text-[10px] text-ink-3 tabular-nums">
          OR={contrib.or?.toFixed(2)}
          {contrib.unit ? ` per ${contrib.unit}` : ""}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[13px] font-bold text-ink tabular-nums">
          {contrib.value}
        </span>
        <span className="font-mono text-[10px] text-ink-3">vs {contrib.ref}</span>
      </div>
      <div className="flex items-center gap-1">
        {isProtective ? <div className="flex-1" /> : null}
        <div
          className="h-[18px] opacity-85 min-w-[2px]"
          style={{
            width: `${widthPct}%`,
            background: color,
            borderRadius: isProtective ? "999px 0 0 999px" : "0 999px 999px 0",
          }}
        />
        {!isProtective ? <div className="flex-1" /> : null}
      </div>
      <div className="text-[12px] font-semibold text-right" style={{ color }}>
        {isProtective ? "↓ kamaytiradi" : "↑ oshiradi"}
      </div>
    </div>
  );
}

function InstrumentForecast({
  id,
  data,
}: {
  id: TestName;
  data: {
    risk: { prob: number; auc: number };
    severity: { score: number };
    riskCat: { color: string };
    sevCat: { color: string };
  };
}) {
  const meta = TEST_BY_ID[id];
  return (
    <div className="px-3.5 py-3 bg-surface-2 border border-border rounded-[10px] grid grid-cols-[32px_1fr_auto_auto] items-center gap-3">
      <div
        className="h-8 w-8 rounded-lg grid place-items-center"
        style={{ background: meta.soft, color: meta.color }}
      >
        <ClinicalIcon name={meta.icon} size={15} />
      </div>
      <div>
        <div className="font-semibold text-[13px] text-ink">{meta.name}</div>
        <div className="font-mono text-[10px] text-ink-3">
          AUC {data.risk.auc.toFixed(2)} · {meta.short}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[9px] text-ink-3 uppercase tracking-wider">Xavf</div>
        <div
          className="font-bold text-base tabular-nums leading-none"
          style={{ color: data.riskCat.color }}
        >
          {Math.round(data.risk.prob * 100)}%
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[9px] text-ink-3 uppercase tracking-wider">CogScore</div>
        <div
          className="font-bold text-base tabular-nums leading-none"
          style={{ color: data.sevCat.color }}
        >
          {Math.round(data.severity.score)}
        </div>
      </div>
    </div>
  );
}

const REC_TONE: Record<Recommendation["tone"], { bg: string; fg: string }> = {
  ok: { bg: "var(--color-ok-bg)", fg: "#14532D" },
  warn: { bg: "var(--color-warn-bg)", fg: "#92400E" },
  bad: { bg: "var(--color-err-bg)", fg: "#991B1B" },
  info: { bg: "var(--color-info-bg)", fg: "#1E3A8A" },
};

function RecRow({ rec }: { rec: Recommendation }) {
  const tone = REC_TONE[rec.tone];
  return (
    <div
      className="px-3.5 py-3 rounded-[10px] flex items-start gap-3"
      style={{ background: tone.bg, color: tone.fg }}
    >
      <ClinicalIcon name={rec.icon} size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="font-bold text-sm tracking-tight">{rec.title}</div>
        <div className="text-[13px] leading-relaxed mt-0.5 opacity-90">{rec.text}</div>
      </div>
    </div>
  );
}
