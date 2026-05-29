/**
 * Reabilitatsiya — kognitiv trening metadata (2-Dastur).
 * 10 domen × 5 mashq = 50 ta mashq.
 *
 * Har mashq yo flagship `component` (maxsus qurilgan), yoki `engine`
 * (TRAINING_META config bilan boshqariladigan umumiy dvigatel) ishlatadi.
 */

// ---------- umumiy so'z bazalari (uz) ----------
const W_ANIMALS = [
  "mushuk",
  "it",
  "ot",
  "sigir",
  "qo'y",
  "echki",
  "tovuq",
  "o'rdak",
  "baliq",
  "quyon",
  "ayiq",
  "bo'ri",
  "tulki",
  "sher",
  "fil",
];
const W_FRUITS = [
  "olma",
  "nok",
  "uzum",
  "anor",
  "shaftoli",
  "o'rik",
  "gilos",
  "banan",
  "apelsin",
  "limon",
  "tarvuz",
  "qovun",
  "behi",
  "xurmo",
];
const W_OBJECTS = [
  "stol",
  "stul",
  "kitob",
  "qalam",
  "soat",
  "kalit",
  "oyna",
  "chiroq",
  "sumka",
  "koptok",
  "qoshiq",
  "pichoq",
  "likopcha",
  "gilam",
];
const W_BODY = [
  "bosh",
  "qo'l",
  "oyoq",
  "ko'z",
  "quloq",
  "burun",
  "og'iz",
  "barmoq",
  "tirsak",
  "tizza",
  "yelka",
  "soch",
  "til",
  "tish",
];
const W_NATURE = [
  "daraxt",
  "gul",
  "tog'",
  "daryo",
  "dengiz",
  "quyosh",
  "oy",
  "yulduz",
  "bulut",
  "yomg'ir",
  "qor",
  "shamol",
  "o't",
  "tosh",
];

export type EngineId = "EngSequence" | "EngChoice" | "EngMatch" | "EngAudio" | "EngBreathe";

export type FlagshipComponentId =
  | "VisualSearchTraining"
  | "NBackTraining"
  | "TaskSwitchTraining"
  | "RTimeTraining"
  | "TrackingTraining"
  | "TMTTest";

export interface WordPair {
  word: string;
  match: string;
  distractors: string[];
}

export interface EmotionScenario {
  text: string;
  answer: string;
  options: string[];
}

export interface CategorySpec {
  name: string;
  items: string[];
}

/** Engine config — barcha dvigatellar uchun (qaysi maydon kerakligi engine'ga bog'liq). */
export interface ExerciseConfig {
  // umumiy
  rounds?: number;
  timeout?: number;
  instructions?: string[];
  // EngSequence
  itemType?: "digit" | "word" | "cell";
  mode?: "forward" | "reverse";
  startLen?: number;
  maxLen?: number;
  showMs?: number;
  gapMs?: number;
  words?: string[];
  grid?: [number, number];
  // EngChoice
  genKey?: "category" | "oddball" | "wordpair" | "emotion" | "stroop" | "arith";
  categories?: CategorySpec[];
  groups?: string[][];
  ruleText?: string;
  scenarios?: EmotionScenario[];
  ops?: string[];
  max?: number;
  // EngMatch (pairs: number) yoki EngChoice wordpair (pairs: WordPair[])
  pairs?: number | WordPair[];
  items?: string[];
  // EngAudio
  audioMode?: "pitch" | "count" | "sequence";
  tones?: { name: string; freq: number }[];
  // EngBreathe
  cycles?: number;
  inhale?: number;
  hold?: number;
  exhale?: number;
}

export interface ExerciseMeta {
  id: string;
  name: string;
  short: string;
  domain: string;
  description: string;
  icon: string;
  color: string;
  soft: string;
  duration: string;
  component?: FlagshipComponentId;
  engine?: EngineId;
  config?: ExerciseConfig;
  /** adaptExercise tomonidan runtime'da qo'shiladi */
  _level?: number;
}

const C_ATT = { color: "#0F766E", soft: "#CCFBF1" };
const C_WM = { color: "#2563EB", soft: "#DBEAFE" };
const C_EF = { color: "#D97706", soft: "#FEF3C7" };
const C_PS = { color: "#9333EA", soft: "#F3E8FF" };
const C_VM = { color: "#DB2777", soft: "#FCE7F3" };
const C_VB = { color: "#0891B2", soft: "#CFFAFE" };
const C_AG = { color: "#16A34A", soft: "#DCFCE7" };
const C_SP = { color: "#CA8A04", soft: "#FEF9C3" };
const C_EM = { color: "#7C3AED", soft: "#EDE9FE" };
const C_LG = { color: "#E11D48", soft: "#FFE4E6" };

const TRAINING_META = {
  // ============ 1. Diqqat va selektiv diqqat ============
  visualSearch: {
    id: "visualSearch",
    name: "Vizual qidiruv",
    short: "VS",
    domain: "Diqqat va selektiv diqqat",
    icon: "search",
    ...C_ATT,
    duration: "3–4 daq",
    description:
      "Distraktorlar orasidan target shaklni topish. Selektiv e'tiborni mashq qildirish.",
    component: "VisualSearchTraining",
  },
  att_odd: {
    id: "att_odd",
    name: "Ortiqchani top",
    short: "OD",
    domain: "Diqqat va selektiv diqqat",
    icon: "filter",
    ...C_ATT,
    duration: "3 daq",
    description: "To'rt so'zdan bittasi guruhga to'g'ri kelmaydi — uni toping.",
    engine: "EngChoice",
    config: {
      genKey: "oddball",
      rounds: 16,
      timeout: 7000,
      groups: [W_ANIMALS, W_FRUITS, W_OBJECTS, W_BODY, W_NATURE],
    },
  },
  att_stroop: {
    id: "att_stroop",
    name: "Rang-so'z inhibitsiya",
    short: "ST",
    domain: "Diqqat va selektiv diqqat",
    icon: "palette",
    ...C_ATT,
    duration: "3 daq",
    description: "So'zning ma'nosini emas, yozilgan rangini tanlang. Diqqatni boshqarish.",
    engine: "EngChoice",
    config: { genKey: "stroop", rounds: 20, timeout: 5000 },
  },
  att_count: {
    id: "att_count",
    name: "Signallarni sanash",
    short: "SC",
    domain: "Diqqat va selektiv diqqat",
    icon: "ear",
    ...C_ATT,
    duration: "3–4 daq",
    description: "Nechta tovush signali yangraganini diqqat bilan sanang.",
    engine: "EngAudio",
    config: { audioMode: "count", rounds: 16 },
  },
  att_concentr: {
    id: "att_concentr",
    name: "Konsentratsiya juftlari",
    short: "CN",
    domain: "Diqqat va selektiv diqqat",
    icon: "copy",
    ...C_ATT,
    duration: "3–5 daq",
    description: "Yashirin kartochkalar joyini eslab, juftlarni toping. Diqqat barqarorligi.",
    engine: "EngMatch",
    config: { pairs: 6, items: W_OBJECTS },
  },

  // ============ 2. Ishchi xotira ============
  nback: {
    id: "nback",
    name: "N-Back xotira",
    short: "NB",
    domain: "Ishchi xotira",
    icon: "layers",
    ...C_WM,
    duration: "3–4 daq",
    description: "Joriy harf N qadam oldingisi bilan bir xil bo'lsa — match.",
    component: "NBackTraining",
  },
  wm_digit_f: {
    id: "wm_digit_f",
    name: "Raqam ketma-ketligi",
    short: "DF",
    domain: "Ishchi xotira",
    icon: "list-ordered",
    ...C_WM,
    duration: "3–4 daq",
    description: "Ko'rsatilgan raqamlarni xuddi shu tartibda takrorlang. Span oshib boradi.",
    engine: "EngSequence",
    config: { itemType: "digit", mode: "forward", startLen: 3, maxLen: 9, showMs: 850, gapMs: 300 },
  },
  wm_digit_b: {
    id: "wm_digit_b",
    name: "Teskari raqamlar",
    short: "DB",
    domain: "Ishchi xotira",
    icon: "flip-horizontal",
    ...C_WM,
    duration: "3–4 daq",
    description: "Raqamlarni TESKARI tartibda kiriting — ishchi xotira manipulyatsiyasi.",
    engine: "EngSequence",
    config: { itemType: "digit", mode: "reverse", startLen: 2, maxLen: 8, showMs: 900, gapMs: 320 },
  },
  wm_spatial: {
    id: "wm_spatial",
    name: "Fazoviy span (Corsi)",
    short: "SP",
    domain: "Ishchi xotira",
    icon: "grid-3x3",
    ...C_WM,
    duration: "3–4 daq",
    description: "Yorishgan kataklar ketma-ketligini xuddi shu tartibda bosing.",
    engine: "EngSequence",
    config: {
      itemType: "cell",
      mode: "forward",
      startLen: 3,
      maxLen: 8,
      showMs: 700,
      gapMs: 280,
      grid: [3, 3],
    },
  },
  wm_arith: {
    id: "wm_arith",
    name: "Aqliy hisob",
    short: "AR",
    domain: "Ishchi xotira",
    icon: "calculator",
    ...C_WM,
    duration: "3 daq",
    description: "Sonlar ustida amallarni xayolan bajarib, javobni tanlang.",
    engine: "EngChoice",
    config: { genKey: "arith", rounds: 16, timeout: 8000, ops: ["+", "-"], max: 12 },
  },

  // ============ 3. Ijro funksiyalari ============
  taskSwitch: {
    id: "taskSwitch",
    name: "Qoidalar almashinuvi",
    short: "TS",
    domain: "Ijro funksiyalari",
    icon: "repeat",
    ...C_EF,
    duration: "3 daq",
    description: "Fon rangiga qarab qoida o'zgaradi. Kognitiv moslashuvchanlik.",
    component: "TaskSwitchTraining",
  },
  ef_categorize: {
    id: "ef_categorize",
    name: "Toifalash",
    short: "CT",
    domain: "Ijro funksiyalari",
    icon: "layout-grid",
    ...C_EF,
    duration: "3 daq",
    description: "So'z qaysi guruhga tegishli ekanini tez aniqlang.",
    engine: "EngChoice",
    config: {
      genKey: "category",
      rounds: 18,
      timeout: 5000,
      categories: [
        { name: "Hayvon", items: W_ANIMALS },
        { name: "Meva", items: W_FRUITS },
        { name: "Buyum", items: W_OBJECTS },
        { name: "Tabiat", items: W_NATURE },
      ],
    },
  },
  ef_mixed_arith: {
    id: "ef_mixed_arith",
    name: "Aralash amallar",
    short: "MA",
    domain: "Ijro funksiyalari",
    icon: "plus-minus",
    ...C_EF,
    duration: "3 daq",
    description: "Qo'shish va ayirish aralash keladi — moslashuvchanlikni mashq qiling.",
    engine: "EngChoice",
    config: { genKey: "arith", rounds: 18, timeout: 6000, ops: ["+", "-", "×"], max: 9 },
  },
  ef_stroop2: {
    id: "ef_stroop2",
    name: "Interferensiya nazorati",
    short: "IC",
    domain: "Ijro funksiyalari",
    icon: "shuffle",
    ...C_EF,
    duration: "3 daq",
    description: "Rang-so'z ziddiyatini yengib, to'g'ri rangni tez tanlang.",
    engine: "EngChoice",
    config: { genKey: "stroop", rounds: 24, timeout: 4000 },
  },
  ef_plan_match: {
    id: "ef_plan_match",
    name: "Rejalashtirilgan xotira",
    short: "PM",
    domain: "Ijro funksiyalari",
    icon: "brain-circuit",
    ...C_EF,
    duration: "4–5 daq",
    description: "Ko'proq juftli xotira o'yini — strategiya va rejalashtirish.",
    engine: "EngMatch",
    config: { pairs: 8, items: W_ANIMALS },
  },

  // ============ 4. Psixomotor tezlik ============
  reactionTime: {
    id: "reactionTime",
    name: "Reaksiya tezligi",
    short: "RT",
    domain: "Psixomotor tezlik",
    icon: "zap",
    ...C_PS,
    duration: "2–3 daq",
    description: "GO/NO-GO: yashil — bos, qizil — bosma. Reaksiya va inhibitsiya.",
    component: "RTimeTraining",
  },
  ps_fast_cat: {
    id: "ps_fast_cat",
    name: "Tezkor toifalash",
    short: "FC",
    domain: "Psixomotor tezlik",
    icon: "gauge",
    ...C_PS,
    duration: "2–3 daq",
    description: "Qisqa vaqt ichida so'zni to'g'ri guruhga joylashtiring.",
    engine: "EngChoice",
    config: {
      genKey: "category",
      rounds: 20,
      timeout: 2800,
      categories: [
        { name: "Hayvon", items: W_ANIMALS },
        { name: "Meva", items: W_FRUITS },
      ],
    },
  },
  ps_fast_arith: {
    id: "ps_fast_arith",
    name: "Tez hisob",
    short: "FA",
    domain: "Psixomotor tezlik",
    icon: "timer",
    ...C_PS,
    duration: "2–3 daq",
    description: "Oddiy amallarni imkon qadar tez yeching.",
    engine: "EngChoice",
    config: { genKey: "arith", rounds: 20, timeout: 3500, ops: ["+", "-"], max: 10 },
  },
  ps_pitch: {
    id: "ps_pitch",
    name: "Tezkor tovush",
    short: "PT",
    domain: "Psixomotor tezlik",
    icon: "activity",
    ...C_PS,
    duration: "3 daq",
    description: "Tovush balandligini tez eshitib, darhol javob bering.",
    engine: "EngAudio",
    config: { audioMode: "pitch", rounds: 20 },
  },
  ps_track: {
    id: "ps_track",
    name: "Nishon kuzatish (tezkor)",
    short: "FT",
    domain: "Psixomotor tezlik",
    icon: "crosshair",
    ...C_PS,
    duration: "45 son",
    description: "Tez harakatlanuvchi nishonni kursor bilan kuzatib boring.",
    component: "TrackingTraining",
  },

  // ============ 5. Vizual-motor koordinatsiya ============
  tracking: {
    id: "tracking",
    name: "Nishon kuzatish",
    short: "TR",
    domain: "Vizual-motor koordinatsiya",
    icon: "crosshair",
    ...C_VM,
    duration: "45 son",
    description: "Harakatlanayotgan nishonni kursor bilan kuzatish.",
    component: "TrackingTraining",
  },
  vm_search: {
    id: "vm_search",
    name: "Ko'z-qo'l qidiruvi",
    short: "EH",
    domain: "Vizual-motor koordinatsiya",
    icon: "mouse-pointer-click",
    ...C_VM,
    duration: "3–4 daq",
    description: "Targetni topib bosish — ko'rish va qo'l harakati uyg'unligi.",
    component: "VisualSearchTraining",
  },
  vm_spatial: {
    id: "vm_spatial",
    name: "Katak ketma-ketligi",
    short: "CS",
    domain: "Vizual-motor koordinatsiya",
    icon: "grid-3x3",
    ...C_VM,
    duration: "3–4 daq",
    description: "Yorishgan kataklarni aniq bosib takrorlang — nozik motorika.",
    engine: "EngSequence",
    config: {
      itemType: "cell",
      mode: "forward",
      startLen: 3,
      maxLen: 7,
      showMs: 650,
      gapMs: 260,
      grid: [4, 4],
    },
  },
  vm_match: {
    id: "vm_match",
    name: "Nishonli juftlar",
    short: "TM",
    domain: "Vizual-motor koordinatsiya",
    icon: "copy",
    ...C_VM,
    duration: "3–4 daq",
    description: "Kartochkalarni aniq bosib, juftlarni toping.",
    engine: "EngMatch",
    config: { pairs: 6, items: W_NATURE },
  },
  vm_seq_tap: {
    id: "vm_seq_tap",
    name: "Katta panjara (Corsi+)",
    short: "BG",
    domain: "Vizual-motor koordinatsiya",
    icon: "layout-dashboard",
    ...C_VM,
    duration: "3–4 daq",
    description: "Kattaroq panjarada ketma-ketlikni bosish — koordinatsiya sinovi.",
    engine: "EngSequence",
    config: {
      itemType: "cell",
      mode: "forward",
      startLen: 3,
      maxLen: 8,
      showMs: 600,
      gapMs: 240,
      grid: [5, 4],
    },
  },

  // ============ 6. Verbal xotira ============
  vb_word_f: {
    id: "vb_word_f",
    name: "So'z ketma-ketligi",
    short: "WF",
    domain: "Verbal xotira",
    icon: "text",
    ...C_VB,
    duration: "4 daq",
    description: "Ko'rsatilgan so'zlarni xuddi shu tartibda eslab, takrorlang.",
    engine: "EngSequence",
    config: {
      itemType: "word",
      mode: "forward",
      startLen: 2,
      maxLen: 7,
      showMs: 1100,
      gapMs: 380,
      words: W_OBJECTS,
    },
  },
  vb_word_anim: {
    id: "vb_word_anim",
    name: "Hayvonlarni yodlash",
    short: "WA",
    domain: "Verbal xotira",
    icon: "rabbit",
    ...C_VB,
    duration: "4 daq",
    description: "Hayvon nomlari ketma-ketligini eslab qoling va takrorlang.",
    engine: "EngSequence",
    config: {
      itemType: "word",
      mode: "forward",
      startLen: 2,
      maxLen: 7,
      showMs: 1100,
      gapMs: 380,
      words: W_ANIMALS,
    },
  },
  vb_pair_syn: {
    id: "vb_pair_syn",
    name: "Ma'nodosh so'zlar",
    short: "SY",
    domain: "Verbal xotira",
    icon: "link",
    ...C_VB,
    duration: "3–4 daq",
    description: "Berilgan so'zga ma'no jihatdan mos so'zni tanlang.",
    engine: "EngChoice",
    config: {
      genKey: "wordpair",
      rounds: 14,
      timeout: 7000,
      ruleText: "Ma'nodosh so'zni tanlang",
      pairs: [
        { word: "katta", match: "ulkan", distractors: ["kichik", "tez", "yangi"] },
        { word: "baxtli", match: "xursand", distractors: ["g'amgin", "sovuq", "baland"] },
        { word: "tez", match: "shoshqaloq", distractors: ["sekin", "og'ir", "uzoq"] },
        { word: "chiroyli", match: "go'zal", distractors: ["xunuk", "qattiq", "achchiq"] },
        { word: "aqlli", match: "zukko", distractors: ["dangasa", "baland", "issiq"] },
        { word: "dadil", match: "jasur", distractors: ["qo'rqoq", "yumshoq", "yangi"] },
      ],
    },
  },
  vb_word_match: {
    id: "vb_word_match",
    name: "So'z juftlari xotirasi",
    short: "WM",
    domain: "Verbal xotira",
    icon: "copy",
    ...C_VB,
    duration: "4 daq",
    description: "So'zli kartochkalarni eslab, juftlarini toping.",
    engine: "EngMatch",
    config: { pairs: 7, items: W_FRUITS },
  },
  vb_story_cat: {
    id: "vb_story_cat",
    name: "So'zni guruhlash",
    short: "WG",
    domain: "Verbal xotira",
    icon: "folder-tree",
    ...C_VB,
    duration: "3–4 daq",
    description: "So'zlarni semantik guruhlarga ajratib, verbal tizimni mustahkamlang.",
    engine: "EngChoice",
    config: {
      genKey: "category",
      rounds: 16,
      timeout: 6000,
      categories: [
        { name: "Tana a'zosi", items: W_BODY },
        { name: "Tabiat", items: W_NATURE },
        { name: "Buyum", items: W_OBJECTS },
      ],
    },
  },

  // ============ 7. Eshitish gnozisi ============
  ag_pitch: {
    id: "ag_pitch",
    name: "Tovush balandligi",
    short: "AP",
    domain: "Eshitish gnozisi",
    icon: "music",
    ...C_AG,
    duration: "3–4 daq",
    description: "Yangragan tovushning balandligini aniqlang.",
    engine: "EngAudio",
    config: { audioMode: "pitch", rounds: 20 },
  },
  ag_count: {
    id: "ag_count",
    name: "Signallar soni",
    short: "AC",
    domain: "Eshitish gnozisi",
    icon: "hash",
    ...C_AG,
    duration: "3–4 daq",
    description: "Nechta tovush signali yangraganini sanang.",
    engine: "EngAudio",
    config: { audioMode: "count", rounds: 16 },
  },
  ag_seq: {
    id: "ag_seq",
    name: "Tovush ketma-ketligi",
    short: "AS",
    domain: "Eshitish gnozisi",
    icon: "audio-lines",
    ...C_AG,
    duration: "4 daq",
    description: "Eshitilgan tovushlar ketma-ketligini xuddi shunday takrorlang.",
    engine: "EngAudio",
    config: { audioMode: "sequence", rounds: 14 },
  },
  ag_2tone: {
    id: "ag_2tone",
    name: "Ikki tovush farqi",
    short: "2T",
    domain: "Eshitish gnozisi",
    icon: "git-compare",
    ...C_AG,
    duration: "3 daq",
    description: "Faqat ikki balandlik orasidan farqlash — nozik eshitish gnozisi.",
    engine: "EngAudio",
    config: {
      audioMode: "pitch",
      rounds: 18,
      tones: [
        { name: "Past", freq: 330 },
        { name: "Baland", freq: 660 },
      ],
    },
  },
  ag_long_seq: {
    id: "ag_long_seq",
    name: "Uzun tovush qatori",
    short: "LS",
    domain: "Eshitish gnozisi",
    icon: "waveform",
    ...C_AG,
    duration: "4–5 daq",
    description: "Uzunroq tovush ketma-ketligini eslab takrorlang — eshitish xotirasi.",
    engine: "EngAudio",
    config: {
      audioMode: "sequence",
      rounds: 12,
      tones: [
        { name: "Past", freq: 262 },
        { name: "O'rta", freq: 392 },
        { name: "Baland", freq: 523 },
      ],
    },
  },

  // ============ 8. Orientatsiya va fazoviy fikrlash ============
  sp_tmt: {
    id: "sp_tmt",
    name: "Iz chizish (TMT)",
    short: "TM",
    domain: "Orientatsiya va fazoviy fikrlash",
    icon: "git-branch",
    ...C_SP,
    duration: "3–5 daq",
    description: "Raqamlarni tartib bilan ulang — fazoviy-ketma-ketlik orientatsiyasi.",
    component: "TMTTest",
  },
  sp_corsi: {
    id: "sp_corsi",
    name: "Fazoviy joylashuv",
    short: "FJ",
    domain: "Orientatsiya va fazoviy fikrlash",
    icon: "grid-3x3",
    ...C_SP,
    duration: "3–4 daq",
    description: "Kataklar yoritilgan tartibni eslab, fazoviy xotira bilan takrorlang.",
    engine: "EngSequence",
    config: {
      itemType: "cell",
      mode: "forward",
      startLen: 3,
      maxLen: 8,
      showMs: 700,
      gapMs: 280,
      grid: [4, 4],
    },
  },
  sp_corsi_rev: {
    id: "sp_corsi_rev",
    name: "Teskari fazoviy",
    short: "FR",
    domain: "Orientatsiya va fazoviy fikrlash",
    icon: "flip-horizontal-2",
    ...C_SP,
    duration: "3–4 daq",
    description: "Yoritilgan kataklarni TESKARI tartibda bosing — fazoviy manipulyatsiya.",
    engine: "EngSequence",
    config: {
      itemType: "cell",
      mode: "reverse",
      startLen: 2,
      maxLen: 7,
      showMs: 750,
      gapMs: 300,
      grid: [4, 4],
    },
  },
  sp_search: {
    id: "sp_search",
    name: "Fazoviy qidiruv",
    short: "FQ",
    domain: "Orientatsiya va fazoviy fikrlash",
    icon: "scan-search",
    ...C_SP,
    duration: "3–4 daq",
    description: "Maydonda targetni topish — fazoviy skanerlash va orientatsiya.",
    component: "VisualSearchTraining",
  },
  sp_pos_match: {
    id: "sp_pos_match",
    name: "Joylashuv juftlari",
    short: "PJ",
    domain: "Orientatsiya va fazoviy fikrlash",
    icon: "map-pin",
    ...C_SP,
    duration: "4 daq",
    description: "Kartochkalar joyini eslab, fazoviy xotira bilan juftlarni toping.",
    engine: "EngMatch",
    config: { pairs: 8, items: W_OBJECTS },
  },

  // ============ 9. Emotsional regulyatsiya ============
  em_breathe: {
    id: "em_breathe",
    name: "Nafas mashqi",
    short: "NF",
    domain: "Emotsional regulyatsiya",
    icon: "wind",
    ...C_EM,
    duration: "2–3 daq",
    description: "Ritmik nafas — 4 son nafas, 4 son ushlab, 6 son chiqarish. Tinchlanish.",
    engine: "EngBreathe",
    config: { cycles: 6, inhale: 4, hold: 4, exhale: 6 },
  },
  em_breathe_long: {
    id: "em_breathe_long",
    name: "Chuqur bo'shashish",
    short: "CB",
    domain: "Emotsional regulyatsiya",
    icon: "flower",
    ...C_EM,
    duration: "4 daq",
    description: "Uzunroq nafas sikllari bilan chuqur relaksatsiya.",
    engine: "EngBreathe",
    config: { cycles: 8, inhale: 5, hold: 4, exhale: 7 },
  },
  em_recognize: {
    id: "em_recognize",
    name: "His-tuyg'uni tanish",
    short: "HT",
    domain: "Emotsional regulyatsiya",
    icon: "smile",
    ...C_EM,
    duration: "3 daq",
    description: "Vaziyatga mos his-tuyg'uni aniqlang — emotsional savodxonlik.",
    engine: "EngChoice",
    config: {
      genKey: "emotion",
      rounds: 14,
      timeout: 9000,
      scenarios: [
        {
          text: "Tug'ilgan kuningga do'sting sovg'a olib keldi.",
          answer: "Quvonch",
          options: ["Quvonch", "Qo'rquv", "G'azab", "Hafagarchilik"],
        },
        {
          text: "Sevimli o'yinchog'ing singib qoldi.",
          answer: "Hafagarchilik",
          options: ["Quvonch", "Hafagarchilik", "Hayrat", "Xotirjamlik"],
        },
        {
          text: "Qorong'i xonada g'alati ovoz eshitildi.",
          answer: "Qo'rquv",
          options: ["Qo'rquv", "Quvonch", "Zerikish", "Faxr"],
        },
        {
          text: "Birov navbatdan oldinga o'tib ketdi.",
          answer: "G'azab",
          options: ["G'azab", "Quvonch", "Xotirjamlik", "Hayrat"],
        },
        {
          text: "Imtihondan a'lo baho olding.",
          answer: "Faxr",
          options: ["Faxr", "Qo'rquv", "Hafagarchilik", "Zerikish"],
        },
        {
          text: "Uzoq kutilgan do'sting keldi.",
          answer: "Quvonch",
          options: ["Quvonch", "G'azab", "Qo'rquv", "Zerikish"],
        },
      ],
    },
  },
  em_calm_match: {
    id: "em_calm_match",
    name: "Xotirjam juftlar",
    short: "XJ",
    domain: "Emotsional regulyatsiya",
    icon: "heart",
    ...C_EM,
    duration: "3–4 daq",
    description: "Shoshmasdan, xotirjam holda juftlarni toping — sabr va e'tibor.",
    engine: "EngMatch",
    config: { pairs: 6, items: W_NATURE },
  },
  em_breathe_short: {
    id: "em_breathe_short",
    name: "Tezkor tinchlanish",
    short: "TT",
    domain: "Emotsional regulyatsiya",
    icon: "pause",
    ...C_EM,
    duration: "1–2 daq",
    description: "Qisqa nafas mashqi — tez tinchlanish uchun (3 sikl).",
    engine: "EngBreathe",
    config: { cycles: 3, inhale: 4, hold: 2, exhale: 6 },
  },

  // ============ 10. Nutq va lingvistik ============
  lg_category: {
    id: "lg_category",
    name: "So'z toifalash",
    short: "WC",
    domain: "Nutq va lingvistik",
    icon: "shapes",
    ...C_LG,
    duration: "3 daq",
    description: "So'z qaysi semantik guruhga tegishli ekanini tanlang.",
    engine: "EngChoice",
    config: {
      genKey: "category",
      rounds: 18,
      timeout: 6000,
      categories: [
        { name: "Hayvon", items: W_ANIMALS },
        { name: "Meva", items: W_FRUITS },
        { name: "Tana", items: W_BODY },
        { name: "Tabiat", items: W_NATURE },
      ],
    },
  },
  lg_synonym: {
    id: "lg_synonym",
    name: "Ma'nodoshlar",
    short: "SN",
    domain: "Nutq va lingvistik",
    icon: "link-2",
    ...C_LG,
    duration: "3–4 daq",
    description: "Berilgan so'zga ma'nodosh so'zni toping — lug'at boyligi.",
    engine: "EngChoice",
    config: {
      genKey: "wordpair",
      rounds: 14,
      timeout: 8000,
      ruleText: "Ma'nodosh so'zni tanlang",
      pairs: [
        { word: "shod", match: "xursand", distractors: ["g'amgin", "charchagan", "och"] },
        { word: "kuchli", match: "baquvvat", distractors: ["zaif", "kichik", "sekin"] },
        { word: "yorug'", match: "nurli", distractors: ["qorong'i", "sovuq", "baland"] },
        { word: "keng", match: "vase'", distractors: ["tor", "past", "yangi"] },
        { word: "botir", match: "qahramon", distractors: ["qo'rqoq", "dangasa", "kichkina"] },
        { word: "oson", match: "yengil", distractors: ["qiyin", "og'ir", "uzoq"] },
      ],
    },
  },
  lg_antonym: {
    id: "lg_antonym",
    name: "Qarama-qarshi so'zlar",
    short: "AN",
    domain: "Nutq va lingvistik",
    icon: "arrow-left-right",
    ...C_LG,
    duration: "3–4 daq",
    description: "Berilgan so'zga ZID ma'noli so'zni toping.",
    engine: "EngChoice",
    config: {
      genKey: "wordpair",
      rounds: 14,
      timeout: 8000,
      ruleText: "Qarama-qarshi so'zni tanlang",
      pairs: [
        { word: "katta", match: "kichik", distractors: ["ulkan", "baland", "keng"] },
        { word: "issiq", match: "sovuq", distractors: ["iliq", "quruq", "yorug'"] },
        { word: "baland", match: "past", distractors: ["uzun", "tez", "og'ir"] },
        { word: "tez", match: "sekin", distractors: ["shoshqaloq", "yengil", "yangi"] },
        { word: "yorug'", match: "qorong'i", distractors: ["nurli", "oq", "keng"] },
        { word: "baxtli", match: "g'amgin", distractors: ["xursand", "shod", "tinch"] },
      ],
    },
  },
  lg_word_find: {
    id: "lg_word_find",
    name: "So'z topish",
    short: "WD",
    domain: "Nutq va lingvistik",
    icon: "spell-check",
    ...C_LG,
    duration: "4 daq",
    description: "So'zli kartochkalarni eslab juftlab, so'z topish qobiliyatini mashq qiling.",
    engine: "EngMatch",
    config: { pairs: 7, items: W_BODY },
  },
  lg_word_seq: {
    id: "lg_word_seq",
    name: "Jumla qurilishi",
    short: "JQ",
    domain: "Nutq va lingvistik",
    icon: "pilcrow",
    ...C_LG,
    duration: "4 daq",
    description: "So'zlar ketma-ketligini eslab takrorlang — nutq xotirasi va tartibi.",
    engine: "EngSequence",
    config: {
      itemType: "word",
      mode: "forward",
      startLen: 2,
      maxLen: 6,
      showMs: 1150,
      gapMs: 400,
      words: W_NATURE,
    },
  },
} satisfies Record<string, ExerciseMeta>;

export { TRAINING_META };
export type ExerciseId = keyof typeof TRAINING_META;

export const TRAINING_LIST: ExerciseMeta[] = Object.values(TRAINING_META);

export interface DomainMeta {
  name: string;
  color: string;
  soft: string;
  icon: string;
}

/** Domen tartibi + guruhlangan ko'rinish uchun meta. */
export const TRAINING_DOMAINS: DomainMeta[] = [
  { name: "Diqqat va selektiv diqqat", color: "#0F766E", soft: "#CCFBF1", icon: "eye" },
  { name: "Ishchi xotira", color: "#2563EB", soft: "#DBEAFE", icon: "layers" },
  { name: "Ijro funksiyalari", color: "#D97706", soft: "#FEF3C7", icon: "git-merge" },
  { name: "Psixomotor tezlik", color: "#9333EA", soft: "#F3E8FF", icon: "zap" },
  { name: "Vizual-motor koordinatsiya", color: "#DB2777", soft: "#FCE7F3", icon: "crosshair" },
  { name: "Verbal xotira", color: "#0891B2", soft: "#CFFAFE", icon: "text" },
  { name: "Eshitish gnozisi", color: "#16A34A", soft: "#DCFCE7", icon: "ear" },
  { name: "Orientatsiya va fazoviy fikrlash", color: "#CA8A04", soft: "#FEF9C3", icon: "compass" },
  { name: "Emotsional regulyatsiya", color: "#7C3AED", soft: "#EDE9FE", icon: "heart" },
  { name: "Nutq va lingvistik", color: "#E11D48", soft: "#FFE4E6", icon: "message-circle" },
];

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
