"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { forecast } from "@/lib/engines/prediction";
import type { PatientListItem, TimepointInfo } from "@/lib/patients/queries";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  FileText,
  Pill as PillIcon,
  Plus,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { NewPatientModal } from "./new-patient-modal";

interface Props {
  initialPatients: SerializablePatient[];
}

// Drizzle Date'ni server'dan kliyentga uzatish — string'lashtirilgan
export type SerializablePatient = Omit<
  PatientListItem,
  "tugilgan" | "boshlanish" | "tugash" | "sana"
> & {
  tugilgan: string;
  boshlanish: string | null;
  tugash: string | null;
  sana: string;
};

const REHAB_TOTAL = 50;
const TP_TOTAL = { PreOp: 5, PostOp: 7, PostTx: 7 } as const;

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function riskOf(p: SerializablePatient) {
  return forecast({
    yosh: p.yosh,
    premorbid: (p.premorbid > 0 ? 1 : 0) as 0 | 1,
    davom: p.davom,
    prep: p.prep,
  }).composite;
}

export function PatientsClient({ initialPatients }: Props) {
  const t = useTranslations("Patients");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialPatients;
    return initialPatients.filter((p) => p.fish.toLowerCase().includes(q));
  }, [initialPatients, query]);

  const stats = useMemo(() => {
    let highRisk = 0;
    let ispcd = 0;
    for (const p of initialPatients) {
      if (riskOf(p).risk.prob >= 0.5) highRisk++;
      const tps = p.timepoints;
      if (tps.PreOp.ispcd || tps.PostOp.ispcd || tps.PostTx.ispcd) ispcd++;
    }
    const total = initialPatients.length;
    const tested = initialPatients.filter((p) => p.testCount > 0).length;
    const inRehab = initialPatients.filter((p) => p.rehabExercises > 0).length;
    const premorbid = initialPatients.filter((p) => p.premorbid > 0).length;
    const pc = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "0%");
    return { total, tested, inRehab, premorbid, highRisk, ispcd, pc };
  }, [initialPatients]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 space-y-5">
      <h1 className="text-2xl font-bold tracking-tight text-ink">{t("title")}</h1>

      {/* Toolbar: search + analytics shortcuts + new patient */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tCommon("search")}
            className="pl-9"
          />
        </div>
        <div className="hidden sm:block sm:flex-1" />
        <div className="flex items-center gap-2">
          <ToolbarLink
            href={{ pathname: "/tahlil", query: { tab: "roc" } }}
            icon={<Activity className="h-4 w-4" />}
            label={t("toolbar.roc")}
          />
          <ToolbarLink
            href={{ pathname: "/tahlil", query: { tab: "treatment" } }}
            icon={<PillIcon className="h-4 w-4" />}
            label={t("toolbar.treatment")}
          />
          <ToolbarLink
            href={{ pathname: "/tahlil", query: { tab: "reports" } }}
            icon={<FileText className="h-4 w-4" />}
            label={t("toolbar.reports")}
          />
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            {t("newPatient")}
          </button>
        </div>
      </div>

      {/* 6 stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatTile
          icon={<Users className="h-[18px] w-[18px]" />}
          tone="neutral"
          value={stats.total}
          label={t("stats.total")}
          sub={query.trim() ? `${filtered.length}` : undefined}
        />
        <StatTile
          icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
          tone="ok"
          value={stats.tested}
          label={t("stats.testsCompleted")}
          sub={stats.pc(stats.tested, stats.total)}
        />
        <StatTile
          icon={<Brain className="h-[18px] w-[18px]" />}
          tone="primary"
          value={stats.inRehab}
          label={t("stats.inRehab")}
          sub={stats.pc(stats.inRehab, stats.total)}
        />
        <StatTile
          icon={<AlertCircle className="h-[18px] w-[18px]" />}
          tone="warn"
          value={stats.ispcd}
          label={t("stats.pocd")}
          sub={stats.pc(stats.ispcd, stats.tested)}
        />
        <StatTile
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          tone="err"
          value={stats.highRisk}
          label={t("stats.highRisk")}
          sub={stats.pc(stats.highRisk, stats.total)}
        />
        <StatTile
          icon={<AlertTriangle className="h-[18px] w-[18px]" />}
          tone="neutral"
          value={stats.premorbid}
          label={t("stats.premorbidPlus")}
          sub={stats.pc(stats.premorbid, stats.total)}
        />
      </div>

      {/* Mobile: card list */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center text-ink-3">{t("empty")}</Card>
        ) : (
          filtered.map((p, idx) => {
            const risk = riskOf(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => router.push(`/bemorlar/${p.id}`)}
                className="text-left w-full"
              >
                <Card className="p-4 active:bg-surface-2 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={p.fish} />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">
                          {idx + 1}. {p.fish}
                        </div>
                        <div className="text-xs text-ink-3 mt-0.5 font-mono tabular-nums">
                          {p.yosh} yosh · {p.davom} daq · {p.prep} dori
                        </div>
                      </div>
                    </div>
                    <RiskPill risk={risk} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <TpPill tp="PreOp" info={p.timepoints.PreOp} />
                    <TpPill tp="PostOp" info={p.timepoints.PostOp} />
                    <TpPill tp="PostTx" info={p.timepoints.PostTx} />
                    <RehabPill done={p.rehabExercises} />
                  </div>
                </Card>
              </button>
            );
          })
        )}
      </div>

      {/* Desktop: full table */}
      <Card className="overflow-hidden hidden md:block p-0">
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <table className="w-full text-sm min-w-[860px]">
            <thead className="sticky top-0 z-10 bg-surface-2 text-ink-3 text-[10.5px] uppercase tracking-wider">
              <tr>
                <Th>{t("columns.number")}</Th>
                <Th>{t("columns.fish")}</Th>
                <Th align="right">{t("columns.age")}</Th>
                <Th align="right">{t("columns.premShort")}</Th>
                <Th align="right">{t("columns.durationShort")}</Th>
                <Th align="right">{t("columns.prep")}</Th>
                <Th>{t("columns.probability")}</Th>
                <Th align="center">PreOp</Th>
                <Th align="center">PostOp</Th>
                <Th align="center">PostTx</Th>
                <Th>{t("columns.training")}</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-ink-3">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const risk = riskOf(p);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/bemorlar/${p.id}`)}
                      className="border-t border-divider hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <Td className="text-ink-3 font-mono tabular-nums">{idx + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.fish} />
                          <span className="font-semibold text-ink whitespace-nowrap">{p.fish}</span>
                        </div>
                      </Td>
                      <Td align="right" className="font-mono tabular-nums">
                        {p.yosh}
                      </Td>
                      <Td align="right">
                        {p.premorbid > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill bg-warn-bg text-warn text-xs font-semibold">
                            <span className="h-1.5 w-1.5 rounded-pill bg-warn" />
                            {t("modal.premorbidOn")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill bg-ok-bg text-ok text-xs font-semibold">
                            <span className="h-1.5 w-1.5 rounded-pill bg-ok" />
                            {tCommon("no")}
                          </span>
                        )}
                      </Td>
                      <Td align="right" className="font-mono tabular-nums">
                        {p.davom} daq
                      </Td>
                      <Td align="right" className="font-mono tabular-nums">
                        {p.prep}
                      </Td>
                      <Td>
                        <RiskPill risk={risk} />
                      </Td>
                      <Td align="center">
                        <TpPill tp="PreOp" info={p.timepoints.PreOp} />
                      </Td>
                      <Td align="center">
                        <TpPill tp="PostOp" info={p.timepoints.PostOp} />
                      </Td>
                      <Td align="center">
                        <TpPill tp="PostTx" info={p.timepoints.PostTx} />
                      </Td>
                      <Td>
                        <RehabPill done={p.rehabExercises} />
                      </Td>
                      <Td>
                        <ChevronRight className="h-4 w-4 text-ink-4" />
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <NewPatientModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function ToolbarLink({
  href,
  icon,
  label,
}: {
  href: { pathname: "/tahlil"; query: { tab: string } };
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 h-10 px-3 rounded-md border border-border-strong bg-surface text-ink text-sm font-medium hover:bg-surface-2 transition-colors whitespace-nowrap"
      title={label}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </Link>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid place-items-center h-8 w-8 rounded-pill bg-primary-soft text-primary-press text-[11px] font-semibold shrink-0">
      {initialsOf(name)}
    </span>
  );
}

const TONES = {
  neutral: "bg-surface-2 text-ink-2",
  primary: "bg-primary-soft text-primary",
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  err: "bg-err-bg text-err",
} as const;

function StatTile({
  icon,
  tone,
  value,
  label,
  sub,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  value: number;
  label: string;
  sub?: string;
}) {
  return (
    <Card className="p-3.5 flex items-center gap-3">
      <span
        className={`grid place-items-center h-[38px] w-[38px] rounded-[10px] shrink-0 ${TONES[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[22px] font-bold tabular-nums text-ink leading-none">{value}</span>
          {sub ? <span className="font-mono text-xs text-ink-3 font-semibold">· {sub}</span> : null}
        </div>
        <div className="text-xs text-ink-2 font-medium leading-tight mt-0.5 truncate">{label}</div>
      </div>
    </Card>
  );
}

function RiskPill({ risk }: { risk: ReturnType<typeof riskOf> }) {
  const color = risk.category.color;
  const pct = Math.round(risk.risk.prob * 100);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-xs font-semibold tabular-nums"
      style={{ background: `${color}1A`, color, border: `1px solid ${color}33` }}
      title={risk.category.label}
    >
      <span className="h-1.5 w-1.5 rounded-pill" style={{ background: color }} />
      {pct}%
    </span>
  );
}

function TpPill({ tp, info }: { tp: keyof typeof TP_TOTAL; info: TimepointInfo }) {
  const total = TP_TOTAL[tp];
  const cls = info.ispcd
    ? "bg-err-bg text-err"
    : info.count >= total
      ? "bg-ok-bg text-ok"
      : info.count > 0
        ? "bg-primary-soft text-primary-press"
        : "bg-surface-2 text-ink-3";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-xs font-semibold ${cls}`}
      title={info.ispcd ? "Composite ISPOCD musbat (PNB)" : tp}
    >
      <span className="h-1.5 w-1.5 rounded-pill" style={{ background: "currentcolor" }} />
      <span className="font-mono tabular-nums">
        {info.count}/{total}
      </span>
    </span>
  );
}

function RehabPill({ done }: { done: number }) {
  const cls =
    done >= REHAB_TOTAL
      ? "bg-ok-bg text-ok"
      : done > 0
        ? "bg-primary-soft text-primary-press"
        : "bg-surface-2 text-ink-3";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-xs font-semibold ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-pill" style={{ background: "currentcolor" }} />
      <span className="font-mono tabular-nums">
        {done}/{REHAB_TOTAL}
      </span>
    </span>
  );
}

function Th({
  children,
  align = "left",
}: { children?: React.ReactNode; align?: "left" | "right" | "center" }) {
  const a = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <th className={`px-3.5 py-2.5 font-semibold whitespace-nowrap ${a}`}>{children}</th>;
}

function Td({
  children,
  align = "left",
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const a = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return <td className={`px-3.5 py-3 ${a} ${className}`}>{children}</td>;
}
