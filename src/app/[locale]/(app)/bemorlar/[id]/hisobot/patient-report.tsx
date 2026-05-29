"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { summarizeComposite } from "@/lib/engines/knbt";
import { forecast } from "@/lib/engines/prediction";
import type { TestName, TestSummary } from "@/lib/engines/types";
import type { PatientDetailBundle } from "@/lib/patients/detail";
import { TESTS, TEST_BY_ID } from "@/lib/tests/meta";
import { type ExerciseId, TRAINING_META } from "@/lib/training/meta";
import { ArrowLeft, Printer } from "lucide-react";
import { useMemo } from "react";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function PatientReport({
  bundle,
  doctorName,
}: {
  bundle: PatientDetailBundle;
  doctorName: string;
}) {
  const { patient, results, training } = bundle;

  const summaries = useMemo(() => {
    const map: Partial<Record<TestName, TestSummary>> = {};
    for (const r of results) if (!map[r.test]) map[r.test] = r.scored as TestSummary;
    return map;
  }, [results]);

  const composite = useMemo(() => summarizeComposite(summaries, "PreOp"), [summaries]);
  const fc = useMemo(
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

  return (
    <div className="report-root max-w-[820px] mx-auto px-8 py-8 bg-white text-ink print:px-0 print:py-0">
      {/* Toolbar — chop etishda yashirin */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/bemorlar/${patient.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-3.5 w-3.5" />
            Orqaga
          </Button>
        </Link>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Chop etish / PDF saqlash
        </Button>
      </div>

      {/* Sarlavha */}
      <header className="border-b-2 border-ink pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink-3 font-semibold">
              NeyroCog · Kognitiv Test Tizimi
            </div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Klinik hisobot</h1>
          </div>
          <div className="text-right text-xs text-ink-3">
            <div>Sana: {fmtDate(new Date().toISOString())}</div>
            <div>Shifokor: {doctorName}</div>
          </div>
        </div>
      </header>

      {/* Demografik */}
      <Section title="Bemor ma'lumotlari">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Row label="F.I.Sh." value={patient.fish} />
          <Row label="Jinsi" value={patient.jinsi} />
          <Row label="Yoshi" value={`${patient.yosh} yosh`} />
          <Row label="Tug'ilgan sana" value={fmtDate(patient.tugilgan)} />
          <Row label="Premorbid fon" value={patient.premorbid > 0 ? "Mavjud" : "Yo'q"} />
          <Row label="Anesteziya davomiyligi" value={`${patient.davom} daqiqa`} />
          <Row label="Anestetik preparatlar" value={String(patient.prep)} />
          <Row label="Ro'yxatga olingan" value={fmtDate(patient.sana)} />
        </dl>
      </Section>

      {/* KNBT natijalari */}
      <Section title="KNBT diagnostik natijalari">
        {results.length === 0 ? (
          <p className="text-sm text-ink-3">Test natijalari yo'q.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink/20 text-left text-ink-3 text-xs uppercase tracking-wider">
                <th className="py-1.5">Test</th>
                <th className="py-1.5 text-right">CogScore</th>
                <th className="py-1.5 text-right">Z-score</th>
                <th className="py-1.5">Kognitiv holat</th>
                <th className="py-1.5 text-center">ISPOCD</th>
              </tr>
            </thead>
            <tbody>
              {TESTS.map((meta) => {
                const s = summaries[meta.id];
                if (!s) return null;
                return (
                  <tr key={meta.id} className="border-b border-ink/10">
                    <td className="py-1.5 font-medium">{meta.name}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums">
                      {s.cogScore ?? "—"}
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums">
                      {s.zScore?.toFixed(2) ?? "—"}
                    </td>
                    <td className="py-1.5">{s.cognitiveHealth}</td>
                    <td className="py-1.5 text-center">{s.ispcd ? "Musbat" : "Manfiy"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {composite ? (
          <div className="mt-4 p-3 border border-ink/20 rounded-md bg-ink/[0.03] flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-ink-3 font-semibold">
                KNBT Composite
              </div>
              <div className="text-lg font-bold">
                {composite.compositeScore} / 100 · {composite.cognitiveHealth}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-ink-3 font-semibold">
                ISPOCD
              </div>
              <div className={`text-lg font-bold ${composite.ispcd ? "text-err" : "text-ok"}`}>
                {composite.ispcd ? "Musbat" : "Manfiy"}
              </div>
              <div className="text-[11px] text-ink-3 font-mono">
                {composite.ispcdCount}/4 core test · Z ≤ −1.96
              </div>
            </div>
          </div>
        ) : null}
      </Section>

      {/* PNB prognoz */}
      <Section title="PNB rivojlanish prognozi">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border border-ink/20 rounded-md">
            <div className="text-xs uppercase tracking-wider text-ink-3 font-semibold">
              PNB ehtimoli (LR)
            </div>
            <div className="text-2xl font-bold">{Math.round(fc.composite.risk.prob * 100)}%</div>
            <div className="text-sm">{fc.composite.category.label}</div>
          </div>
          <div className="p-3 border border-ink/20 rounded-md">
            <div className="text-xs uppercase tracking-wider text-ink-3 font-semibold">
              Kutilgan CogScore (MLR)
            </div>
            <div className="text-2xl font-bold">
              {Math.round(fc.composite.severity.score)} / 100
            </div>
            <div className="text-sm">{fc.composite.sevCategory.label}</div>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm list-disc pl-5">
          {fc.recommendations.map((r) => (
            <li key={r.title}>
              <b>{r.title}.</b> {r.text}
            </li>
          ))}
        </ul>
      </Section>

      {/* Reabilitatsiya */}
      {training.length > 0 ? (
        <Section title="Reabilitatsiya tarixi (2-Dastur)">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-ink/20 text-left text-ink-3 text-xs uppercase tracking-wider">
                <th className="py-1.5">Mashq</th>
                <th className="py-1.5 text-right">Ball</th>
                <th className="py-1.5 text-right">Aniqlik</th>
                <th className="py-1.5 text-right">Sana</th>
              </tr>
            </thead>
            <tbody>
              {training.slice(0, 12).map((s) => {
                const ex = TRAINING_META[s.exerciseId as ExerciseId];
                return (
                  <tr key={s.id} className="border-b border-ink/10">
                    <td className="py-1.5">{ex?.name ?? s.exerciseId}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums">{s.score}</td>
                    <td className="py-1.5 text-right font-mono tabular-nums">{s.accuracy}%</td>
                    <td className="py-1.5 text-right font-mono tabular-nums text-ink-3">
                      {fmtDate(s.completedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      ) : null}

      <footer className="mt-8 pt-4 border-t border-ink/20 text-[11px] text-ink-3 leading-relaxed">
        Bu hisobot NeyroCog (Kognitiv Test Tizimi) tomonidan avtomatik yaratildi. Statistik
        bashoratlar (LR/MLR — Statistics M-3, n=181) <b>klinik qarorni almashtirmaydi</b>; yakuniy
        baho shifokor zimmasida. Imzo: __________________ · Sana:{" "}
        {fmtDate(new Date().toISOString())}
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="text-sm font-bold uppercase tracking-wider text-ink-2 border-b border-ink/15 pb-1 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink/5 py-0.5">
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
