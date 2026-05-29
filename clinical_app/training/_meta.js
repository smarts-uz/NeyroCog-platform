// Cognitive rehabilitation training metadata.
// 5 exercises mapping to 5 cognitive domains from the protocol.

window.TRAINING_META = {
  visualSearch: {
    id: "visualSearch",
    name: "Vizual qidiruv",
    short: "VS",
    domain: "Diqqat va selektiv diqqat",
    description: "Distraktorlar orasidan target shaklni topish. Diqqat tarqalishini cheklash va selektiv e'tiborni mashq qildirish.",
    icon: "search",
    color: "#0F766E",
    soft: "#CCFBF1",
    duration: "3–4 daq",
    component: "VisualSearchTraining",
  },
  nback: {
    id: "nback",
    name: "N-Back xotira",
    short: "NB",
    domain: "Ishchi xotira",
    description: "Joriy harf N qadam oldingisi bilan bir xil bo'lsa — match. Ishchi xotira hajmini oshirish.",
    icon: "layers",
    color: "#2563EB",
    soft: "#DBEAFE",
    duration: "3–4 daq",
    component: "NBackTraining",
  },
  taskSwitch: {
    id: "taskSwitch",
    name: "Qoidalar almashinuvi",
    short: "TS",
    domain: "Ijro funksiyalari",
    description: "Fon rangiga qarab qoida o'zgaradi. Kognitiv moslashuvchanlik va inhibitsiyani mashq qildirish.",
    icon: "repeat",
    color: "#D97706",
    soft: "#FEF3C7",
    duration: "3 daq",
    component: "TaskSwitchTraining",
  },
  reactionTime: {
    id: "reactionTime",
    name: "Reaksiya tezligi",
    short: "RT",
    domain: "Psixomotor tezlik",
    description: "GO/NO-GO testi: yashil — bos, qizil — bosma. Reaksiya tezligi va inhibitsiya nazoratini birlashtiradi.",
    icon: "zap",
    color: "#9333EA",
    soft: "#F3E8FF",
    duration: "2–3 daq",
    component: "RTimeTraining",
  },
  tracking: {
    id: "tracking",
    name: "Nishon kuzatish",
    short: "TR",
    domain: "Vizual-motor koordinatsiya",
    description: "Harakatlanayotgan nishonni kursor bilan kuzatib borish. Ko'rish va qo'l harakati uyg'unligi.",
    icon: "crosshair",
    color: "#DB2777",
    soft: "#FCE7F3",
    duration: "45 son",
    component: "TrackingTraining",
  },
};

// Aggregate training stats from patient.training (array of sessions)
window.TRAINING_AGGREGATE = function(sessions = []) {
  if (!sessions.length) return null;
  const byExercise = {};
  for (const s of sessions) {
    const id = s.exerciseId;
    if (!byExercise[id]) byExercise[id] = { sessions: 0, totalScore: 0, avgAccuracy: 0, totalDuration: 0, last: null };
    const b = byExercise[id];
    b.sessions += 1;
    b.totalScore += s.score || 0;
    b.avgAccuracy = (b.avgAccuracy * (b.sessions - 1) + (s.accuracy || 0)) / b.sessions;
    b.totalDuration += s.duration || 0;
    if (!b.last || new Date(s.completedAt) > new Date(b.last)) b.last = s.completedAt;
  }
  return {
    totalSessions: sessions.length,
    totalMinutes: Math.round(sessions.reduce((a, s) => a + (s.duration || 0), 0) / 60000),
    byExercise,
  };
};
