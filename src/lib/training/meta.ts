/** Reabilitatsiya — 5 ta kognitiv mashq metadata (2-Dastur). */

export type ExerciseId = "visualSearch" | "nback" | "taskSwitch" | "reactionTime" | "tracking";

export interface ExerciseMeta {
  id: ExerciseId;
  name: string;
  short: string;
  domain: string;
  description: string;
  icon: string;
  color: string;
  soft: string;
  duration: string;
}

export const TRAINING_META: Record<ExerciseId, ExerciseMeta> = {
  visualSearch: {
    id: "visualSearch",
    name: "Vizual qidiruv",
    short: "VS",
    domain: "Diqqat va selektiv diqqat",
    description:
      "Distraktorlar orasidan target shaklni topish. Diqqat tarqalishini cheklash va selektiv e'tiborni mashq qildirish.",
    icon: "search",
    color: "#0F766E",
    soft: "#CCFBF1",
    duration: "3–4 daq",
  },
  nback: {
    id: "nback",
    name: "N-Back xotira",
    short: "NB",
    domain: "Ishchi xotira",
    description:
      "Joriy harf N qadam oldingisi bilan bir xil bo'lsa — match. Ishchi xotira hajmini oshirish.",
    icon: "layers",
    color: "#2563EB",
    soft: "#DBEAFE",
    duration: "3–4 daq",
  },
  taskSwitch: {
    id: "taskSwitch",
    name: "Qoidalar almashinuvi",
    short: "TS",
    domain: "Ijro funksiyalari",
    description:
      "Fon rangiga qarab qoida o'zgaradi. Kognitiv moslashuvchanlik va inhibitsiyani mashq qildirish.",
    icon: "repeat",
    color: "#D97706",
    soft: "#FEF3C7",
    duration: "3 daq",
  },
  reactionTime: {
    id: "reactionTime",
    name: "Reaksiya tezligi",
    short: "RT",
    domain: "Psixomotor tezlik",
    description:
      "GO/NO-GO testi: yashil — bos, qizil — bosma. Reaksiya tezligi va inhibitsiya nazoratini birlashtiradi.",
    icon: "zap",
    color: "#9333EA",
    soft: "#F3E8FF",
    duration: "2–3 daq",
  },
  tracking: {
    id: "tracking",
    name: "Nishon kuzatish",
    short: "TR",
    domain: "Vizual-motor koordinatsiya",
    description:
      "Harakatlanayotgan nishonni kursor bilan kuzatib borish. Ko'rish va qo'l harakati uyg'unligi.",
    icon: "crosshair",
    color: "#DB2777",
    soft: "#FCE7F3",
    duration: "45 son",
  },
};

export const TRAINING_LIST = Object.values(TRAINING_META);

export interface TrainingSessionLite {
  exerciseId: string;
  score: number;
  accuracy: number; // 0-100 (foiz, DB'da integer)
  duration: number; // soniyalar
  completedAt: string;
}

export interface ExerciseAgg {
  sessions: number;
  totalScore: number;
  avgAccuracy: number; // 0-100
  totalDuration: number;
  last: string | null;
}

export interface TrainingAggregate {
  totalSessions: number;
  totalMinutes: number;
  byExercise: Partial<Record<string, ExerciseAgg>>;
}

export function aggregateTraining(sessions: TrainingSessionLite[]): TrainingAggregate | null {
  if (!sessions.length) return null;
  const byExercise: Partial<Record<string, ExerciseAgg>> = {};
  for (const s of sessions) {
    const id = s.exerciseId;
    const b = byExercise[id] ?? {
      sessions: 0,
      totalScore: 0,
      avgAccuracy: 0,
      totalDuration: 0,
      last: null,
    };
    b.sessions += 1;
    b.totalScore += s.score || 0;
    b.avgAccuracy = (b.avgAccuracy * (b.sessions - 1) + (s.accuracy || 0)) / b.sessions;
    b.totalDuration += s.duration || 0;
    if (!b.last || new Date(s.completedAt) > new Date(b.last)) b.last = s.completedAt;
    byExercise[id] = b;
  }
  return {
    totalSessions: sessions.length,
    totalMinutes: Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60),
    byExercise,
  };
}
