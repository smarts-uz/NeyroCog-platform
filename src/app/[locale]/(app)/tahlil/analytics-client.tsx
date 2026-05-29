"use client";

import { ClinicalIcon } from "@/components/clinical-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useRouter } from "@/i18n/navigation";
import type { CohortPatient } from "@/lib/analytics/cohort";
import {
  INSTRUMENTS,
  INSTRUMENT_LABEL,
  type Instrument,
  ROC_REFERENCE,
  TREATMENT_RESULTS,
} from "@/lib/analytics/constants";
import {
  cohenDInterpret,
  confusionMatrix,
  deLongTest,
  nnt,
  pFmt,
  pFromZ,
  pSignificance,
  rocCurve,
} from "@/lib/engines/stats";
import { ArrowLeft, Download } from "lucide-react";
import { useMemo, useState } from "react";

const mean = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export function AnalyticsClient({
  cohort,
  initialTab = "dashboard",
}: {
  cohort: CohortPatient[];
  initialTab?: "dashboard" | "roc" | "treatment" | "reports";
}) {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-7">
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="eyebrow mb-1.5">Statistik tahlil</div>
          <h1 className="font-bold text-3xl tracking-tight text-ink m-0">Tahlil markazi</h1>
          <p className="text-sm text-ink-3 mt-1.5">
            Kohort statistikasi, diagnostik aniqlik, davolash samaradorligi va hisobotlar.
          </p>
        </div>
        <Link href="/bemorlar">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Bemorlar
          </Button>
        </Link>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="dashboard">
            <ClinicalIcon name="clipboard-list" size={15} />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="roc">
            <ClinicalIcon name="activity" size={15} />
            ROC tahlili
          </TabsTrigger>
          <TabsTrigger value="treatment">
            <ClinicalIcon name="pill" size={15} />
            Davolash effekti
          </TabsTrigger>
          <TabsTrigger value="reports">
            <ClinicalIcon name="download" size={15} />
            Hisobotlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Dashboard cohort={cohort} />
        </TabsContent>
        <TabsContent value="roc">
          <ROCModule cohort={cohort} />
        </TabsContent>
        <TabsContent value="treatment">
          <TreatmentModule />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsModule cohort={cohort} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────
function Dashboard({ cohort }: { cohort: CohortPatient[] }) {
  const router = useRouter();
  const stats = useMemo(() => {
    const total = cohort.length;
    const withTests = cohort.filter((p) => p.testCount > 0).length;
    const withTraining = cohort.filter((p) => p.trainingCount > 0).length;
    const ispcdCount = cohort.filter((p) => p.ispcd).length;
    const highRisk = cohort.filter((p) => p.riskProb >= 0.5).length;
    const premorbidPos = cohort.filter((p) => p.premorbid > 0).length;
    const ageGroups = { "≤9": 0, "10-12": 0, "13-15": 0, "16+": 0 };
    const sexCounts = { Erkak: 0, Ayol: 0 } as Record<string, number>;
    for (const p of cohort) {
      const a = p.yosh;
      if (a <= 9) ageGroups["≤9"]++;
      else if (a <= 12) ageGroups["10-12"]++;
      else if (a <= 15) ageGroups["13-15"]++;
      else ageGroups["16+"]++;
      if (p.jinsi) sexCounts[p.jinsi] = (sexCounts[p.jinsi] ?? 0) + 1;
    }
    return {
      total,
      withTests,
      withTraining,
      ispcdCount,
      highRisk,
      premorbidPos,
      ageGroups,
      sexCounts,
      avgAge: mean(cohort.map((p) => p.yosh)),
      avgDur: mean(cohort.map((p) => p.davom)),
      avgPrep: mean(cohort.map((p) => p.prep)),
    };
  }, [cohort]);

  const risky = cohort.filter((p) => p.riskProb >= 0.5).sort((a, b) => b.riskProb - a.riskProb);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <KPI label="Jami bemorlar" value={stats.total} icon="user" />
        <KPI
          label="Testlar bajarilgan"
          value={stats.withTests}
          sub={`${pct(stats.withTests, stats.total)}%`}
          icon="check-circle"
          tone="ok"
        />
        <KPI
          label="Reabilitatsiyada"
          value={stats.withTraining}
          sub={`${pct(stats.withTraining, stats.total)}%`}
          icon="brain"
          tone="primary"
        />
        <KPI
          label="POCD aniqlangan"
          value={stats.ispcdCount}
          sub={`${pct(stats.ispcdCount, stats.withTests)}%`}
          icon="alert-circle"
          tone="warn"
        />
        <KPI
          label="Yuqori xavf"
          value={stats.highRisk}
          sub={`${pct(stats.highRisk, stats.total)}%`}
          icon="trending-up"
          tone="err"
        />
        <KPI
          label="Premorbid +"
          value={stats.premorbidPos}
          sub={`${pct(stats.premorbidPos, stats.total)}%`}
          icon="alert-triangle"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-4">
        <Card className="p-5">
          <div className="eyebrow mb-3.5">Yosh taqsimoti</div>
          <BarChart
            data={Object.entries(stats.ageGroups).map(([k, v]) => ({ label: k, value: v }))}
            color="#0F766E"
          />
        </Card>
        <Card className="p-5">
          <div className="eyebrow mb-3.5">Jins taqsimoti</div>
          <BarChart
            data={Object.entries(stats.sexCounts).map(([k, v]) => ({ label: k, value: v }))}
            color="#2563EB"
          />
        </Card>
        <Card className="p-5">
          <div className="eyebrow mb-3.5">O'rtachalar</div>
          <div className="flex flex-col gap-3">
            <RowStat label="Yoshi" value={`${stats.avgAge.toFixed(1)} y`} />
            <RowStat label="Davomiyligi" value={`${stats.avgDur.toFixed(0)} daq`} />
            <RowStat label="Preparatlar" value={stats.avgPrep.toFixed(1)} />
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-divider">
          <div className="eyebrow">Yuqori xavfli bemorlar (prognoz ≥ 50%)</div>
        </div>
        {risky.length === 0 ? (
          <div className="px-5 py-8 text-center text-ink-3 text-sm">Yuqori xavfli bemor yo'q.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-ink-3 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">F.I.Sh.</th>
                <th className="px-4 py-2.5 text-center font-semibold">Yoshi</th>
                <th className="px-4 py-2.5 text-center font-semibold">Premorbid</th>
                <th className="px-4 py-2.5 text-right font-semibold">PNB ehtimoli</th>
                <th className="px-4 py-2.5 text-right font-semibold">Kutilgan CogScore</th>
              </tr>
            </thead>
            <tbody>
              {risky.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/bemorlar/${p.id}`)}
                  className="border-t border-divider hover:bg-surface-2 cursor-pointer"
                >
                  <td className="px-4 py-2.5 font-medium">{p.fish}</td>
                  <td className="px-4 py-2.5 text-center">{p.yosh}</td>
                  <td className="px-4 py-2.5 text-center">
                    {p.premorbid > 0 ? (
                      <Pill tone="warn">Mavjud</Pill>
                    ) : (
                      <Pill tone="ok">Yo'q</Pill>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums text-err">
                    {Math.round(p.riskProb * 100)}%
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {Math.round(p.expectedCogScore)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ─── ROC ──────────────────────────────────────────────────────
const ROC_MIN = 5; // har sinfdan kamida shuncha namuna bo'lsa, real hisoblanadi

function collectScores(cohort: CohortPatient[], instr: Instrument) {
  const scores: number[] = [];
  const labels: number[] = [];
  for (const p of cohort) {
    const s = p.scores[instr];
    if (s != null && p.label != null) {
      scores.push(s);
      labels.push(p.label);
    }
  }
  const pos = labels.filter((l) => l === 1).length;
  const neg = labels.length - pos;
  return { scores, labels, pos, neg };
}

function ROCModule({ cohort }: { cohort: CohortPatient[] }) {
  const [selected, setSelected] = useState<Instrument>("KNBT");
  const [compareWith, setCompareWith] = useState<Instrument>("EEG");

  // Real (kohort) yoki referens (Excel n=181) — qaysi biri yetarli bo'lsa
  const analysis = useMemo(() => {
    const ref = ROC_REFERENCE[selected];
    const { scores, labels, pos, neg } = collectScores(cohort, selected);
    if (pos >= ROC_MIN && neg >= ROC_MIN) {
      // pastroq CogScore → POCD musbat → direction "low"
      const roc = rocCurve(scores, labels, "low");
      if (roc) {
        const cutoff = roc.youden.cutoff ?? ref.cutoff;
        const cm = confusionMatrix(scores, labels, cutoff, "low");
        return {
          source: "real" as const,
          n: roc.n,
          auc: roc.auc,
          ci: roc.ci95,
          se: roc.se,
          p: roc.p,
          cutoff: Math.round(cutoff),
          sens: roc.youden.sens,
          spec: roc.youden.spec,
          cm: { TP: cm.TP, FN: cm.FN, FP: cm.FP, TN: cm.TN, ppv: cm.ppv, npv: cm.npv, acc: cm.acc },
        };
      }
    }
    // Referens (sintetik confusion matrix, prevalentlik 40%, n=181)
    const n = 181;
    const p2 = Math.round(n * 0.4);
    const ng = n - p2;
    const TP = Math.round(ref.sens * p2);
    const FN = p2 - TP;
    const TN = Math.round(ref.spec * ng);
    const FP = ng - TN;
    return {
      source: "reference" as const,
      n,
      auc: ref.auc,
      ci: ref.ci,
      se: ref.se,
      p: ref.p,
      cutoff: ref.cutoff,
      sens: ref.sens,
      spec: ref.spec,
      cm: {
        TP,
        FN,
        FP,
        TN,
        ppv: TP / (TP + FP || 1),
        npv: TN / (TN + FN || 1),
        acc: (TP + TN) / n,
      },
    };
  }, [cohort, selected]);

  const ref = analysis;
  const cm = analysis.cm;

  // ROC egri nuqtalari: (0,0)→(1-spec, sens)→(1,1)
  const points = useMemo(() => {
    const fpr = 1 - analysis.spec;
    const tpr = analysis.sens;
    return `0,1 ${fpr.toFixed(3)},${(1 - tpr).toFixed(3)} 1,0`;
  }, [analysis]);

  // DeLong — real bo'lsa haqiqiy, aks holda referens (r=0.6 korrelyatsiya)
  const delong = useMemo(() => {
    if (compareWith === selected) return null;
    // Real: ikkala instrument ham bir bemorlarda mavjud bo'lsa
    const paired = cohort.filter(
      (p) => p.label != null && p.scores[selected] != null && p.scores[compareWith] != null,
    );
    const pos = paired.filter((p) => p.label === 1).length;
    const neg = paired.length - pos;
    if (pos >= ROC_MIN && neg >= ROC_MIN) {
      const a = paired.map((p) => p.scores[selected] as number);
      const b = paired.map((p) => p.scores[compareWith] as number);
      const labels = paired.map((p) => p.label as number);
      const dl = deLongTest(a, b, labels, "low", "low");
      if (dl)
        return {
          diff: dl.diff,
          z: dl.z,
          p: dl.p,
          sig: pSignificance(dl.p),
          source: "real" as const,
        };
    }
    const a = ROC_REFERENCE[selected];
    const b = ROC_REFERENCE[compareWith];
    const r = 0.6;
    const seDiff = Math.sqrt(a.se ** 2 + b.se ** 2 - 2 * r * a.se * b.se);
    if (seDiff <= 0) return null;
    const diff = a.auc - b.auc;
    const z = diff / seDiff;
    const p = pFromZ(z);
    return { diff, z, p, sig: pSignificance(p), source: "reference" as const };
  }, [cohort, selected, compareWith]);

  const sorted = [...INSTRUMENTS].sort((x, y) => ROC_REFERENCE[y].auc - ROC_REFERENCE[x].auc);

  return (
    <div className="flex flex-col gap-4">
      <InstrumentSelector value={selected} onChange={setSelected} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ROC curve */}
        <Card className="p-5">
          <div className="eyebrow mb-3.5">ROC egri chizig'i — {INSTRUMENT_LABEL[selected]}</div>
          <svg
            viewBox="0 0 1 1"
            className="w-full max-w-[360px] mx-auto block aspect-square"
            style={{ transform: "scaleY(1)" }}
            role="img"
            aria-label="ROC curve"
          >
            <rect x="0" y="0" width="1" height="1" fill="var(--color-surface-2)" />
            <line
              x1="0"
              y1="1"
              x2="1"
              y2="0"
              stroke="rgba(15,23,42,0.2)"
              strokeWidth="0.006"
              strokeDasharray="0.02 0.02"
            />
            <polyline
              points={points}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="0.012"
              strokeLinejoin="round"
            />
            <polygon points={`0,1 ${points} 1,1`} fill="rgba(15,118,110,0.12)" />
            <circle cx={1 - ref.spec} cy={1 - ref.sens} r="0.02" fill="var(--color-accent)" />
          </svg>
          <div className="flex justify-between mt-2 text-[11px] font-mono text-ink-3">
            <span>0 — 1-Specificity →</span>
            <span>↑ Sensitivity</span>
          </div>
        </Card>

        {/* AUC + confusion matrix */}
        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="eyebrow">Diagnostik aniqlik</div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-pill ${
                  ref.source === "real"
                    ? "bg-ok-bg text-green-900"
                    : "bg-surface-2 text-ink-3 border border-border"
                }`}
              >
                {ref.source === "real" ? `Mahalliy · n=${ref.n}` : "Referens · n=181"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-5xl tabular-nums text-primary">
                {ref.auc.toFixed(3)}
              </span>
              <span className="text-ink-3 text-sm">AUC</span>
            </div>
            <div className="text-[13px] text-ink-2 mt-2">
              95% CI [{ref.ci[0].toFixed(3)}, {ref.ci[1].toFixed(3)}] · {pFmt(ref.p)}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <MiniStat label="Cut-off" value={ref.cutoff} />
              <MiniStat label="Sezgirlik" value={`${Math.round(ref.sens * 100)}%`} />
              <MiniStat label="Aniqlik" value={`${Math.round(ref.spec * 100)}%`} />
            </div>
            <div className="text-[11px] text-ink-3 mt-3">
              {ref.source === "real"
                ? "Mahalliy kohort ma'lumotidan Youden indeksi bo'yicha optimal cut-off."
                : "Mahalliy namuna yetarli emas — Statistics M-2 referens qiymatlari (n=181)."}
            </div>
          </Card>

          <Card className="p-5">
            <div className="eyebrow mb-3">
              Confusion matrix{" "}
              {ref.source === "real" ? `(mahalliy, n=${ref.n})` : "(n=181, prevalentlik 40%)"}
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-[280px]">
              <CMCell label="TP" value={cm.TP} tone="ok" />
              <CMCell label="FN" value={cm.FN} tone="warn" />
              <CMCell label="FP" value={cm.FP} tone="warn" />
              <CMCell label="TN" value={cm.TN} tone="ok" />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <MiniStat label="PPV" value={`${Math.round(cm.ppv * 100)}%`} />
              <MiniStat label="NPV" value={`${Math.round(cm.npv * 100)}%`} />
              <MiniStat label="Aniqlik" value={`${Math.round(cm.acc * 100)}%`} />
            </div>
          </Card>
        </div>
      </div>

      {/* DeLong comparison */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="eyebrow">DeLong test — ikki ROC ni solishtirish</div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{INSTRUMENT_LABEL[selected]}</span>
            <span className="text-ink-3">vs</span>
            <select
              value={compareWith}
              onChange={(e) => setCompareWith(e.target.value as Instrument)}
              className="h-8 px-2 rounded-md border border-border-strong bg-surface text-sm"
            >
              {INSTRUMENTS.filter((i) => i !== selected).map((i) => (
                <option key={i} value={i}>
                  {INSTRUMENT_LABEL[i]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {delong ? (
          <div className="flex items-center gap-6 flex-wrap">
            <MiniStat label="ΔAUC" value={delong.diff.toFixed(3)} />
            <MiniStat label="z" value={delong.z.toFixed(2)} />
            <MiniStat label="p" value={pFmt(delong.p)} />
            <div className="text-sm">
              <span className="font-mono font-bold mr-2">{delong.sig?.stars}</span>
              {delong.p < 0.05
                ? `${INSTRUMENT_LABEL[selected]} ${INSTRUMENT_LABEL[compareWith]} ga nisbatan ahamiyatli farq qiladi`
                : "Statistik ahamiyatli farq yo'q"}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Comparison table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-divider">
          <div className="eyebrow">Barcha instrumentlar — AUC bo'yicha</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-ink-3 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Instrument</th>
              <th className="px-4 py-2.5 text-right font-semibold">AUC</th>
              <th className="px-4 py-2.5 text-right font-semibold">95% CI</th>
              <th className="px-4 py-2.5 text-right font-semibold">Sezgirlik</th>
              <th className="px-4 py-2.5 text-right font-semibold">Aniqlik</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((i) => {
              const r = ROC_REFERENCE[i];
              return (
                <tr
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`border-t border-divider cursor-pointer hover:bg-surface-2 ${i === selected ? "bg-primary-soft-2" : ""}`}
                >
                  <td className="px-4 py-2.5 font-medium">{INSTRUMENT_LABEL[i]}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums">
                    {r.auc.toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs text-ink-3 tabular-nums">
                    {r.ci[0].toFixed(2)}–{r.ci[1].toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {Math.round(r.sens * 100)}%
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {Math.round(r.spec * 100)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Treatment ────────────────────────────────────────────────
function TreatmentModule() {
  const [selected, setSelected] = useState<Instrument>("KNBT");
  const r = TREATMENT_RESULTS[selected];
  const nntCalc = nnt(r.recoveryExp, r.recoveryCtl);
  const dInterp = cohenDInterpret(r.d);

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-0 overflow-hidden">
        <div
          className="px-6 py-5 text-white flex items-center gap-4"
          style={{ background: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)" }}
        >
          <div className="h-12 w-12 rounded-xl bg-white/20 grid place-items-center">
            <ClinicalIcon name="pill" size={24} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold tracking-widest uppercase opacity-85">
              Pantogam + raqamli kognitiv trening (4 hafta)
            </div>
            <div className="font-bold text-xl tracking-tight mt-0.5">
              Davolash samaradorligi statistik tasdiqlandi
            </div>
          </div>
          <div className="font-mono text-[11px] opacity-95 text-right">
            <div className="font-bold text-sm">n = 30 vs 26</div>
            <div>Asosiy vs Taqqoslov</div>
          </div>
        </div>
      </Card>

      <InstrumentSelector value={selected} onChange={setSelected} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="eyebrow mb-3.5">PostOp → PostTx (CogScore o'zgarishi)</div>
          <LineCompare exp={[r.exp.post, r.exp.postTx]} ctl={[r.ctl.post, r.ctl.postTx]} />
          <div className="flex gap-4 mt-3 text-[12px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-pill bg-ok inline-block" /> Asosiy (davolangan)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-pill bg-ink-4 inline-block" /> Taqqoslov
              (kuzatuv)
            </span>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <div className="eyebrow mb-2">Effekt o'lchami (Cohen's d)</div>
            <div className="flex items-baseline gap-2">
              <span
                className="font-extrabold text-4xl tabular-nums"
                style={{ color: dInterp.color }}
              >
                {r.d.toFixed(2)}
              </span>
              <span className="text-sm font-medium" style={{ color: dInterp.color }}>
                {dInterp.label}
              </span>
            </div>
            <div className="text-[13px] text-ink-2 mt-2">{pFmt(r.p)} · guruhlararo farq</div>
          </Card>

          <Card className="p-5">
            <div className="eyebrow mb-3">Tiklanish foizi va NNT</div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Asosiy tiklanish" value={`${Math.round(r.recoveryExp * 100)}%`} />
              <MiniStat label="Taqqoslov tiklanish" value={`${Math.round(r.recoveryCtl * 100)}%`} />
              <MiniStat label="ARR" value={nntCalc ? `${Math.round(nntCalc.arr * 100)}%` : "—"} />
              <MiniStat label="NNT" value={nntCalc ? nntCalc.nnt.toFixed(1) : "—"} />
            </div>
            <div className="text-[11px] text-ink-3 mt-3">
              NNT — bitta qo'shimcha tiklanishga erishish uchun davolanishi kerak bo'lgan bemorlar
              soni.
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-divider">
          <div className="eyebrow">Barcha instrumentlar bo'yicha</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-ink-3 text-[11px] uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Instrument</th>
              <th className="px-4 py-2.5 text-right font-semibold">Asosiy Δ</th>
              <th className="px-4 py-2.5 text-right font-semibold">Taqqoslov Δ</th>
              <th className="px-4 py-2.5 text-right font-semibold">Cohen's d</th>
              <th className="px-4 py-2.5 text-right font-semibold">NNT</th>
            </tr>
          </thead>
          <tbody>
            {INSTRUMENTS.map((i) => {
              const t = TREATMENT_RESULTS[i];
              const n = nnt(t.recoveryExp, t.recoveryCtl);
              return (
                <tr
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`border-t border-divider cursor-pointer hover:bg-surface-2 ${i === selected ? "bg-primary-soft-2" : ""}`}
                >
                  <td className="px-4 py-2.5 font-medium">{INSTRUMENT_LABEL[i]}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-ok">
                    +{t.exp.postTx - t.exp.post}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-ink-3">
                    +{t.ctl.postTx - t.ctl.post}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums">
                    {t.d.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {n ? n.nnt.toFixed(1) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────
function ReportsModule({ cohort }: { cohort: CohortPatient[] }) {
  const exportCsv = () => {
    const headers = [
      "F.I.Sh.",
      "Jinsi",
      "Yoshi",
      "Premorbid",
      "Davomiyligi",
      "Preparatlar",
      "Testlar",
      "CompositeScore",
      "ISPOCD",
      "PNB_ehtimoli_%",
      "Kutilgan_CogScore",
    ];
    const rows = cohort.map((p) => [
      `"${p.fish}"`,
      p.jinsi,
      p.yosh,
      p.premorbid > 0 ? "Mavjud" : "Yo'q",
      p.davom,
      p.prep,
      p.testCount,
      p.compositeScore ?? "",
      p.ispcd ? "Musbat" : "Manfiy",
      Math.round(p.riskProb * 100),
      Math.round(p.expectedCogScore),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    // UTF-8 BOM — Excel'da to'g'ri ochilishi uchun
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ktt-kohort-${cohort.length}-bemor.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-6">
        <div className="eyebrow mb-2">CSV eksport</div>
        <p className="text-sm text-ink-2 max-w-prose">
          Butun kohort bo'yicha demografik ma'lumotlar, KNBT Composite, ISPOCD verdikti va PNB
          prognozi bitta CSV faylga eksport qilinadi. UTF-8 BOM bilan — Excel'da to'g'ri ochiladi.
        </p>
        <Button className="mt-4" onClick={exportCsv} disabled={cohort.length === 0}>
          <Download className="h-4 w-4" />
          CSV yuklab olish ({cohort.length} bemor)
        </Button>
      </Card>

      <Card className="p-6">
        <div className="eyebrow mb-2">Bemor hisoboti (PDF)</div>
        <p className="text-sm text-ink-2 max-w-prose">
          Har bir bemorning to'liq klinik hisoboti — demografik ma'lumotlar, KNBT natijalari,
          Z-score'lar, ISPOCD verdikti, PNB prognozi va reabilitatsiya tarixi. Bemor sahifasidan
          "Eksport" tugmasi orqali chop etish (yoki PDF saqlash) mumkin.
        </p>
        <Link href="/bemorlar" className="inline-block mt-4">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Bemorlar ro'yxatiga o'tish
          </Button>
        </Link>
      </Card>
    </div>
  );
}

// ─── Shared bits ──────────────────────────────────────────────
function KPI({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  sub?: string;
  icon: string;
  tone?: "neutral" | "ok" | "warn" | "err" | "primary";
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: "var(--color-surface-2)", fg: "var(--color-ink-2)" },
    ok: { bg: "var(--color-ok-bg)", fg: "#14532D" },
    warn: { bg: "var(--color-warn-bg)", fg: "#92400E" },
    err: { bg: "var(--color-err-bg)", fg: "#991B1B" },
    primary: { bg: "var(--color-primary-soft)", fg: "var(--color-primary-press)" },
  };
  const t = tones[tone] ?? tones.neutral;
  return (
    <Card className="p-3.5 flex items-center gap-2.5">
      <div
        className="h-9 w-9 rounded-[9px] grid place-items-center shrink-0"
        style={{ background: t?.bg, color: t?.fg }}
      >
        <ClinicalIcon name={icon} size={17} />
      </div>
      <div className="min-w-0">
        <div className="font-bold text-xl text-ink tabular-nums leading-none">{value}</div>
        <div className="text-[11px] text-ink-2 font-medium">{label}</div>
        {sub ? <div className="font-mono text-[10px] text-ink-3">{sub}</div> : null}
      </div>
    </Card>
  );
}

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[60px_1fr_36px] items-center gap-2.5">
          <span className="font-mono text-[11px] text-ink-2 font-semibold">{d.label}</span>
          <div className="h-[18px] bg-surface-2 rounded-md overflow-hidden">
            <div
              className="h-full transition-[width]"
              style={{ width: `${(d.value / max) * 100}%`, background: color }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-ink tabular-nums text-right">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function RowStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-ink-3">{label}</span>
      <span className="font-mono text-base font-bold text-ink tabular-nums">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-2 rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-3 font-semibold">{label}</div>
      <div className="font-mono font-bold text-base text-ink tabular-nums">{value}</div>
    </div>
  );
}

function CMCell({ label, value, tone }: { label: string; value: number; tone: "ok" | "warn" }) {
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{
        background: tone === "ok" ? "var(--color-ok-bg)" : "var(--color-warn-bg)",
        color: tone === "ok" ? "#14532D" : "#92400E",
      }}
    >
      <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">{label}</div>
      <div className="font-mono font-bold text-2xl tabular-nums">{value}</div>
    </div>
  );
}

function InstrumentSelector({
  value,
  onChange,
}: {
  value: Instrument;
  onChange: (i: Instrument) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap p-1.5 bg-surface-2 border border-border rounded-xl">
      {INSTRUMENTS.map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
            i === value ? "bg-primary text-white" : "text-ink-2 hover:bg-surface"
          }`}
        >
          {INSTRUMENT_LABEL[i]}
        </button>
      ))}
    </div>
  );
}

function LineCompare({ exp, ctl }: { exp: number[]; ctl: number[] }) {
  const all = [...exp, ...ctl];
  const min = Math.min(...all) - 5;
  const max = Math.max(...all) + 5;
  const norm = (v: number) => 1 - (v - min) / (max - min);
  const x = [0.12, 0.88];
  const line = (vals: number[]) => vals.map((v, i) => `${x[i]},${norm(v).toFixed(3)}`).join(" ");
  return (
    <svg
      viewBox="0 0 1 1"
      className="w-full aspect-[2/1]"
      preserveAspectRatio="none"
      role="img"
      aria-label="treatment line chart"
    >
      <line x1="0.12" y1="0" x2="0.12" y2="1" stroke="rgba(15,23,42,0.1)" strokeWidth="0.004" />
      <polyline points={line(ctl)} fill="none" stroke="var(--color-ink-4)" strokeWidth="0.012" />
      <polyline points={line(exp)} fill="none" stroke="var(--color-ok)" strokeWidth="0.012" />
      {exp.map((v, i) => (
        <circle key={`e${i}`} cx={x[i]} cy={norm(v)} r="0.018" fill="var(--color-ok)" />
      ))}
      {ctl.map((v, i) => (
        <circle key={`c${i}`} cx={x[i]} cy={norm(v)} r="0.018" fill="var(--color-ink-4)" />
      ))}
    </svg>
  );
}
