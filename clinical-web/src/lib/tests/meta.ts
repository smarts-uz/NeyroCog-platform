import type { TestName } from "@/lib/engines/types";

export interface TestMeta {
  id: TestName;
  name: string;
  short: string;
  desc: string;
  icon: string;
  duration: string;
  /** Interaktiv (brauzerda o'ynaladi) yoki manual forma */
  mode: "interactive" | "form";
  color: string;
  soft: string;
}

/**
 * 7 ta diagnostik test — prototip PatientView TESTS massiviga mos.
 * Tartib UI'da ham shu.
 */
export const TESTS: TestMeta[] = [
  {
    id: "TMT",
    name: "Trail Making Test",
    short: "TMT",
    desc: "Diqqat, vizual qidiruv va kognitiv moslashuvchanlik. Qatorlarni tartibda bog'lash.",
    icon: "git-branch",
    duration: "3–5 daq",
    mode: "interactive",
    color: "#0F766E",
    soft: "#CCFBF1",
  },
  {
    id: "Stroop",
    name: "Stroop Test",
    short: "Stroop",
    desc: "Diqqatni boshqarish va interferensiyani yengish.",
    icon: "type",
    duration: "5–7 daq",
    mode: "interactive",
    color: "#D97706",
    soft: "#FEF3C7",
  },
  {
    id: "DST",
    name: "Digit Span Test",
    short: "DST",
    desc: "Qisqa muddatli va ishchi xotira.",
    icon: "list-ordered",
    duration: "4–6 daq",
    mode: "interactive",
    color: "#2563EB",
    soft: "#DBEAFE",
  },
  {
    id: "LMWT",
    name: "Lurya Memory Word",
    short: "LMWT",
    desc: "Eshitish-og'zaki o'rganish va xotira (Rey AVLT).",
    icon: "book-open",
    duration: "10–15 daq",
    mode: "form",
    color: "#9333EA",
    soft: "#F3E8FF",
  },
  {
    id: "NS",
    name: "Nevrologik holatni baholash",
    short: "NS",
    desc: "12 ta nevrologik shkala (MRC, DTR, ICARS, …).",
    icon: "stethoscope",
    duration: "10–15 daq",
    mode: "form",
    color: "#0891B2",
    soft: "#CFFAFE",
  },
  {
    id: "EEG",
    name: "EEG ko'rsatkichlari",
    short: "EEG",
    desc: "Alfa, teta ritmi va asimmetriya indekslari.",
    icon: "activity",
    duration: "Asbob orqali",
    mode: "form",
    color: "#DB2777",
    soft: "#FCE7F3",
  },
  {
    id: "Audio",
    name: "Audio diqqat testi",
    short: "Audio",
    desc: "Tovushlarni ajratish, diqqat va reaksiya.",
    icon: "ear",
    duration: "5–7 daq",
    mode: "interactive",
    color: "#16A34A",
    soft: "#DCFCE7",
  },
];

export const TEST_BY_ID: Record<TestName, TestMeta> = Object.fromEntries(
  TESTS.map((t) => [t.id, t]),
) as Record<TestName, TestMeta>;
