// Cognitive rehabilitation training metadata — 10 domains × 5 exercises = 50.
// Each exercise either uses a flagship `component` (custom-built) OR an
// `engine` (config-driven generic engine from engines_core/engines_extra).

// ---------- shared content pools (uz) ----------
const W_ANIMALS = ["mushuk","it","ot","sigir","qo'y","echki","tovuq","o'rdak","baliq","quyon","ayiq","bo'ri","tulki","sher","fil"];
const W_FRUITS  = ["olma","nok","uzum","anor","shaftoli","o'rik","gilos","banan","apelsin","limon","tarvuz","qovun","behi","xurmo"];
const W_OBJECTS = ["stol","stul","kitob","qalam","soat","kalit","oyna","chiroq","sumka","koptok","qoshiq","pichoq","likopcha","gilam"];
const W_BODY    = ["bosh","qo'l","oyoq","ko'z","quloq","burun","og'iz","barmoq","tirsak","tizza","yelka","soch","til","tish"];
const W_NATURE  = ["daraxt","gul","tog'","daryo","dengiz","quyosh","oy","yulduz","bulut","yomg'ir","qor","shamol","o't","tosh"];

const TRAINING_META = {

  // ============ 1. Diqqat va selektiv diqqat (teal) ============
  visualSearch: { id:"visualSearch", name:"Vizual qidiruv", short:"VS", domain:"Diqqat va selektiv diqqat",
    description:"Distraktorlar orasidan target shaklni topish. Selektiv e'tiborni mashq qildirish.",
    icon:"search", color:"#0F766E", soft:"#CCFBF1", duration:"3–4 daq", component:"VisualSearchTraining" },
  att_odd: { id:"att_odd", name:"Ortiqchani top", short:"OD", domain:"Diqqat va selektiv diqqat",
    description:"To'rt so'zdan bittasi guruhga to'g'ri kelmaydi — uni toping.",
    icon:"filter", color:"#0F766E", soft:"#CCFBF1", duration:"3 daq",
    engine:"EngChoice", config:{ genKey:"oddball", rounds:16, timeout:7000,
      groups:[W_ANIMALS,W_FRUITS,W_OBJECTS,W_BODY,W_NATURE] } },
  att_stroop: { id:"att_stroop", name:"Rang-so'z inhibitsiya", short:"ST", domain:"Diqqat va selektiv diqqat",
    description:"So'zning ma'nosini emas, yozilgan rangini tanlang. Diqqatni boshqarish.",
    icon:"palette", color:"#0F766E", soft:"#CCFBF1", duration:"3 daq",
    engine:"EngChoice", config:{ genKey:"stroop", rounds:20, timeout:5000 } },
  att_count: { id:"att_count", name:"Signallarni sanash", short:"SC", domain:"Diqqat va selektiv diqqat",
    description:"Nechta tovush signali yangraganini diqqat bilan sanang.",
    icon:"ear", color:"#0F766E", soft:"#CCFBF1", duration:"3–4 daq",
    engine:"EngAudio", config:{ mode:"count", rounds:16 } },
  att_concentr: { id:"att_concentr", name:"Konsentratsiya juftlari", short:"CN", domain:"Diqqat va selektiv diqqat",
    description:"Yashirin kartochkalar joyini eslab, juftlarni toping. Diqqat barqarorligi.",
    icon:"copy", color:"#0F766E", soft:"#CCFBF1", duration:"3–5 daq",
    engine:"EngMatch", config:{ pairs:6, items:W_OBJECTS } },

  // ============ 2. Ishchi xotira (blue) ============
  nback: { id:"nback", name:"N-Back xotira", short:"NB", domain:"Ishchi xotira",
    description:"Joriy harf N qadam oldingisi bilan bir xil bo'lsa — match.",
    icon:"layers", color:"#2563EB", soft:"#DBEAFE", duration:"3–4 daq", component:"NBackTraining" },
  wm_digit_f: { id:"wm_digit_f", name:"Raqam ketma-ketligi", short:"DF", domain:"Ishchi xotira",
    description:"Ko'rsatilgan raqamlarni xuddi shu tartibda takrorlang. Span oshib boradi.",
    icon:"list-ordered", color:"#2563EB", soft:"#DBEAFE", duration:"3–4 daq",
    engine:"EngSequence", config:{ itemType:"digit", mode:"forward", startLen:3, maxLen:9, showMs:850, gapMs:300 } },
  wm_digit_b: { id:"wm_digit_b", name:"Teskari raqamlar", short:"DB", domain:"Ishchi xotira",
    description:"Raqamlarni TESKARI tartibda kiriting — ishchi xotira manipulyatsiyasi.",
    icon:"flip-horizontal", color:"#2563EB", soft:"#DBEAFE", duration:"3–4 daq",
    engine:"EngSequence", config:{ itemType:"digit", mode:"reverse", startLen:2, maxLen:8, showMs:900, gapMs:320 } },
  wm_spatial: { id:"wm_spatial", name:"Fazoviy span (Corsi)", short:"SP", domain:"Ishchi xotira",
    description:"Yorishgan kataklar ketma-ketligini xuddi shu tartibda bosing.",
    icon:"grid-3x3", color:"#2563EB", soft:"#DBEAFE", duration:"3–4 daq",
    engine:"EngSequence", config:{ itemType:"cell", mode:"forward", startLen:3, maxLen:8, showMs:700, gapMs:280, grid:[3,3] } },
  wm_arith: { id:"wm_arith", name:"Aqliy hisob", short:"AR", domain:"Ishchi xotira",
    description:"Sonlar ustida amallarni xayolan bajarib, javobni tanlang.",
    icon:"calculator", color:"#2563EB", soft:"#DBEAFE", duration:"3 daq",
    engine:"EngChoice", config:{ genKey:"arith", rounds:16, timeout:8000, ops:["+","-"], max:12 } },

  // ============ 3. Ijro funksiyalari (amber) ============
  taskSwitch: { id:"taskSwitch", name:"Qoidalar almashinuvi", short:"TS", domain:"Ijro funksiyalari",
    description:"Fon rangiga qarab qoida o'zgaradi. Kognitiv moslashuvchanlik.",
    icon:"repeat", color:"#D97706", soft:"#FEF3C7", duration:"3 daq", component:"TaskSwitchTraining" },
  ef_categorize: { id:"ef_categorize", name:"Toifalash", short:"CT", domain:"Ijro funksiyalari",
    description:"So'z qaysi guruhga tegishli ekanini tez aniqlang.",
    icon:"layout-grid", color:"#D97706", soft:"#FEF3C7", duration:"3 daq",
    engine:"EngChoice", config:{ genKey:"category", rounds:18, timeout:5000,
      categories:[{name:"Hayvon",items:W_ANIMALS},{name:"Meva",items:W_FRUITS},{name:"Buyum",items:W_OBJECTS},{name:"Tabiat",items:W_NATURE}] } },
  ef_mixed_arith: { id:"ef_mixed_arith", name:"Aralash amallar", short:"MA", domain:"Ijro funksiyalari",
    description:"Qo'shish va ayirish aralash keladi — moslashuvchanlikni mashq qiling.",
    icon:"plus-minus", color:"#D97706", soft:"#FEF3C7", duration:"3 daq",
    engine:"EngChoice", config:{ genKey:"arith", rounds:18, timeout:6000, ops:["+","-","×"], max:9 } },
  ef_stroop2: { id:"ef_stroop2", name:"Interferensiya nazorati", short:"IC", domain:"Ijro funksiyalari",
    description:"Rang-so'z ziddiyatini yengib, to'g'ri rangni tez tanlang.",
    icon:"shuffle", color:"#D97706", soft:"#FEF3C7", duration:"3 daq",
    engine:"EngChoice", config:{ genKey:"stroop", rounds:24, timeout:4000 } },
  ef_plan_match: { id:"ef_plan_match", name:"Rejalashtirilgan xotira", short:"PM", domain:"Ijro funksiyalari",
    description:"Ko'proq juftli xotira o'yini — strategiya va rejalashtirish.",
    icon:"brain-circuit", color:"#D97706", soft:"#FEF3C7", duration:"4–5 daq",
    engine:"EngMatch", config:{ pairs:8, items:W_ANIMALS } },

  // ============ 4. Psixomotor tezlik (purple) ============
  reactionTime: { id:"reactionTime", name:"Reaksiya tezligi", short:"RT", domain:"Psixomotor tezlik",
    description:"GO/NO-GO: yashil — bos, qizil — bosma. Reaksiya va inhibitsiya.",
    icon:"zap", color:"#9333EA", soft:"#F3E8FF", duration:"2–3 daq", component:"RTimeTraining" },
  ps_fast_cat: { id:"ps_fast_cat", name:"Tezkor toifalash", short:"FC", domain:"Psixomotor tezlik",
    description:"Qisqa vaqt ichida so'zni to'g'ri guruhga joylashtiring.",
    icon:"gauge", color:"#9333EA", soft:"#F3E8FF", duration:"2–3 daq",
    engine:"EngChoice", config:{ genKey:"category", rounds:20, timeout:2800,
      categories:[{name:"Hayvon",items:W_ANIMALS},{name:"Meva",items:W_FRUITS}] } },
  ps_fast_arith: { id:"ps_fast_arith", name:"Tez hisob", short:"FA", domain:"Psixomotor tezlik",
    description:"Oddiy amallarni imkon qadar tez yeching.",
    icon:"timer", color:"#9333EA", soft:"#F3E8FF", duration:"2–3 daq",
    engine:"EngChoice", config:{ genKey:"arith", rounds:20, timeout:3500, ops:["+","-"], max:10 } },
  ps_pitch: { id:"ps_pitch", name:"Tezkor tovush", short:"PT", domain:"Psixomotor tezlik",
    description:"Tovush balandligini tez eshitib, darhol javob bering.",
    icon:"activity", color:"#9333EA", soft:"#F3E8FF", duration:"3 daq",
    engine:"EngAudio", config:{ mode:"pitch", rounds:20 } },
  ps_track: { id:"ps_track", name:"Nishon kuzatish (tezkor)", short:"FT", domain:"Psixomotor tezlik",
    description:"Tez harakatlanuvchi nishonni kursor bilan kuzatib boring.",
    icon:"crosshair", color:"#9333EA", soft:"#F3E8FF", duration:"45 son", component:"TrackingTraining" },

  // ============ 5. Vizual-motor koordinatsiya (pink) ============
  tracking: { id:"tracking", name:"Nishon kuzatish", short:"TR", domain:"Vizual-motor koordinatsiya",
    description:"Harakatlanayotgan nishonni kursor bilan kuzatish.",
    icon:"crosshair", color:"#DB2777", soft:"#FCE7F3", duration:"45 son", component:"TrackingTraining" },
  vm_search: { id:"vm_search", name:"Ko'z-qo'l qidiruvi", short:"EH", domain:"Vizual-motor koordinatsiya",
    description:"Targetni topib bosish — ko'rish va qo'l harakati uyg'unligi.",
    icon:"mouse-pointer-click", color:"#DB2777", soft:"#FCE7F3", duration:"3–4 daq", component:"VisualSearchTraining" },
  vm_spatial: { id:"vm_spatial", name:"Katak ketma-ketligi", short:"CS", domain:"Vizual-motor koordinatsiya",
    description:"Yorishgan kataklarni aniq bosib takrorlang — nozik motorika.",
    icon:"grid-3x3", color:"#DB2777", soft:"#FCE7F3", duration:"3–4 daq",
    engine:"EngSequence", config:{ itemType:"cell", mode:"forward", startLen:3, maxLen:7, showMs:650, gapMs:260, grid:[4,4] } },
  vm_match: { id:"vm_match", name:"Nishonli juftlar", short:"TM", domain:"Vizual-motor koordinatsiya",
    description:"Kartochkalarni aniq bosib, juftlarni toping.",
    icon:"copy", color:"#DB2777", soft:"#FCE7F3", duration:"3–4 daq",
    engine:"EngMatch", config:{ pairs:6, items:W_NATURE } },
  vm_seq_tap: { id:"vm_seq_tap", name:"Katta panjara (Corsi+)", short:"BG", domain:"Vizual-motor koordinatsiya",
    description:"Kattaroq panjarada ketma-ketlikni bosish — koordinatsiya sinovi.",
    icon:"layout-dashboard", color:"#DB2777", soft:"#FCE7F3", duration:"3–4 daq",
    engine:"EngSequence", config:{ itemType:"cell", mode:"forward", startLen:3, maxLen:8, showMs:600, gapMs:240, grid:[5,4] } },

  // ============ 6. Verbal xotira (cyan) ============
  vb_word_f: { id:"vb_word_f", name:"So'z ketma-ketligi", short:"WF", domain:"Verbal xotira",
    description:"Ko'rsatilgan so'zlarni xuddi shu tartibda eslab, takrorlang.",
    icon:"text", color:"#0891B2", soft:"#CFFAFE", duration:"4 daq",
    engine:"EngSequence", config:{ itemType:"word", mode:"forward", startLen:2, maxLen:7, showMs:1100, gapMs:380, words:W_OBJECTS } },
  vb_word_anim: { id:"vb_word_anim", name:"Hayvonlarni yodlash", short:"WA", domain:"Verbal xotira",
    description:"Hayvon nomlari ketma-ketligini eslab qoling va takrorlang.",
    icon:"rabbit", color:"#0891B2", soft:"#CFFAFE", duration:"4 daq",
    engine:"EngSequence", config:{ itemType:"word", mode:"forward", startLen:2, maxLen:7, showMs:1100, gapMs:380, words:W_ANIMALS } },
  vb_pair_syn: { id:"vb_pair_syn", name:"Ma'nodosh so'zlar", short:"SY", domain:"Verbal xotira",
    description:"Berilgan so'zga ma'no jihatdan mos so'zni tanlang.",
    icon:"link", color:"#0891B2", soft:"#CFFAFE", duration:"3–4 daq",
    engine:"EngChoice", config:{ genKey:"wordpair", rounds:14, timeout:7000, ruleText:"Ma'nodosh so'zni tanlang",
      pairs:[
        {word:"katta",match:"ulkan",distractors:["kichik","tez","yangi"]},
        {word:"baxtli",match:"xursand",distractors:["g'amgin","sovuq","baland"]},
        {word:"tez",match:"shoshqaloq",distractors:["sekin","og'ir","uzoq"]},
        {word:"chiroyli",match:"go'zal",distractors:["xunuk","qattiq","achchiq"]},
        {word:"aqlli",match:"zukko",distractors:["dangasa","baland","issiq"]},
        {word:"dadil",match:"jasur",distractors:["qo'rqoq","yumshoq","yangi"]},
      ] } },
  vb_word_match: { id:"vb_word_match", name:"So'z juftlari xotirasi", short:"WM", domain:"Verbal xotira",
    description:"So'zli kartochkalarni eslab, juftlarini toping.",
    icon:"copy", color:"#0891B2", soft:"#CFFAFE", duration:"4 daq",
    engine:"EngMatch", config:{ pairs:7, items:W_FRUITS } },
  vb_story_cat: { id:"vb_story_cat", name:"So'zni guruhlash", short:"WG", domain:"Verbal xotira",
    description:"So'zlarni semantik guruhlarga ajratib, verbal tizimni mustahkamlang.",
    icon:"folder-tree", color:"#0891B2", soft:"#CFFAFE", duration:"3–4 daq",
    engine:"EngChoice", config:{ genKey:"category", rounds:16, timeout:6000,
      categories:[{name:"Tana a'zosi",items:W_BODY},{name:"Tabiat",items:W_NATURE},{name:"Buyum",items:W_OBJECTS}] } },

  // ============ 7. Eshitish gnozisi (green) ============
  ag_pitch: { id:"ag_pitch", name:"Tovush balandligi", short:"AP", domain:"Eshitish gnozisi",
    description:"Yangragan tovushning balandligini aniqlang.",
    icon:"music", color:"#16A34A", soft:"#DCFCE7", duration:"3–4 daq",
    engine:"EngAudio", config:{ mode:"pitch", rounds:20 } },
  ag_count: { id:"ag_count", name:"Signallar soni", short:"AC", domain:"Eshitish gnozisi",
    description:"Nechta tovush signali yangraganini sanang.",
    icon:"hash", color:"#16A34A", soft:"#DCFCE7", duration:"3–4 daq",
    engine:"EngAudio", config:{ mode:"count", rounds:16 } },
  ag_seq: { id:"ag_seq", name:"Tovush ketma-ketligi", short:"AS", domain:"Eshitish gnozisi",
    description:"Eshitilgan tovushlar ketma-ketligini xuddi shunday takrorlang.",
    icon:"audio-lines", color:"#16A34A", soft:"#DCFCE7", duration:"4 daq",
    engine:"EngAudio", config:{ mode:"sequence", rounds:14 } },
  ag_2tone: { id:"ag_2tone", name:"Ikki tovush farqi", short:"2T", domain:"Eshitish gnozisi",
    description:"Faqat ikki balandlik orasidan farqlash — nozik eshitish gnozisi.",
    icon:"git-compare", color:"#16A34A", soft:"#DCFCE7", duration:"3 daq",
    engine:"EngAudio", config:{ mode:"pitch", rounds:18, tones:[{name:"Past",freq:330},{name:"Baland",freq:660}] } },
  ag_long_seq: { id:"ag_long_seq", name:"Uzun tovush qatori", short:"LS", domain:"Eshitish gnozisi",
    description:"Uzunroq tovush ketma-ketligini eslab takrorlang — eshitish xotirasi.",
    icon:"waveform", color:"#16A34A", soft:"#DCFCE7", duration:"4–5 daq",
    engine:"EngAudio", config:{ mode:"sequence", rounds:12, tones:[{name:"Past",freq:262},{name:"O'rta",freq:392},{name:"Baland",freq:523}] } },

  // ============ 8. Orientatsiya va fazoviy fikrlash (gold) ============
  sp_tmt: { id:"sp_tmt", name:"Iz chizish (TMT)", short:"TM", domain:"Orientatsiya va fazoviy fikrlash",
    description:"Raqamlarni tartib bilan ulang — fazoviy-ketma-ketlik orientatsiyasi.",
    icon:"git-branch", color:"#CA8A04", soft:"#FEF9C3", duration:"3–5 daq", component:"TMTTest" },
  sp_corsi: { id:"sp_corsi", name:"Fazoviy joylashuv", short:"FJ", domain:"Orientatsiya va fazoviy fikrlash",
    description:"Kataklar yoritilgan tartibni eslab, fazoviy xotira bilan takrorlang.",
    icon:"grid-3x3", color:"#CA8A04", soft:"#FEF9C3", duration:"3–4 daq",
    engine:"EngSequence", config:{ itemType:"cell", mode:"forward", startLen:3, maxLen:8, showMs:700, gapMs:280, grid:[4,4] } },
  sp_corsi_rev: { id:"sp_corsi_rev", name:"Teskari fazoviy", short:"FR", domain:"Orientatsiya va fazoviy fikrlash",
    description:"Yoritilgan kataklarni TESKARI tartibda bosing — fazoviy manipulyatsiya.",
    icon:"flip-horizontal-2", color:"#CA8A04", soft:"#FEF9C3", duration:"3–4 daq",
    engine:"EngSequence", config:{ itemType:"cell", mode:"reverse", startLen:2, maxLen:7, showMs:750, gapMs:300, grid:[4,4] } },
  sp_search: { id:"sp_search", name:"Fazoviy qidiruv", short:"FQ", domain:"Orientatsiya va fazoviy fikrlash",
    description:"Maydonda targetni topish — fazoviy skanerlash va orientatsiya.",
    icon:"scan-search", color:"#CA8A04", soft:"#FEF9C3", duration:"3–4 daq", component:"VisualSearchTraining" },
  sp_pos_match: { id:"sp_pos_match", name:"Joylashuv juftlari", short:"PJ", domain:"Orientatsiya va fazoviy fikrlash",
    description:"Kartochkalar joyini eslab, fazoviy xotira bilan juftlarni toping.",
    icon:"map-pin", color:"#CA8A04", soft:"#FEF9C3", duration:"4 daq",
    engine:"EngMatch", config:{ pairs:8, items:W_OBJECTS } },

  // ============ 9. Emotsional regulyatsiya (violet) ============
  em_breathe: { id:"em_breathe", name:"Nafas mashqi", short:"NF", domain:"Emotsional regulyatsiya",
    description:"Ritmik nafas — 4 son nafas, 4 son ushlab, 6 son chiqarish. Tinchlanish.",
    icon:"wind", color:"#7C3AED", soft:"#EDE9FE", duration:"2–3 daq",
    engine:"EngBreathe", config:{ cycles:6, inhale:4, hold:4, exhale:6 } },
  em_breathe_long: { id:"em_breathe_long", name:"Chuqur bo'shashish", short:"CB", domain:"Emotsional regulyatsiya",
    description:"Uzunroq nafas sikllari bilan chuqur relaksatsiya.",
    icon:"flower", color:"#7C3AED", soft:"#EDE9FE", duration:"4 daq",
    engine:"EngBreathe", config:{ cycles:8, inhale:5, hold:4, exhale:7 } },
  em_recognize: { id:"em_recognize", name:"His-tuyg'uni tanish", short:"HT", domain:"Emotsional regulyatsiya",
    description:"Vaziyatga mos his-tuyg'uni aniqlang — emotsional savodxonlik.",
    icon:"smile", color:"#7C3AED", soft:"#EDE9FE", duration:"3 daq",
    engine:"EngChoice", config:{ genKey:"emotion", rounds:14, timeout:9000,
      scenarios:[
        {text:"Tug'ilgan kuningga do'sting sovg'a olib keldi.",answer:"Quvonch",options:["Quvonch","Qo'rquv","G'azab","Hafagarchilik"]},
        {text:"Sevimli o'yinchog'ing singib qoldi.",answer:"Hafagarchilik",options:["Quvonch","Hafagarchilik","Hayrat","Xotirjamlik"]},
        {text:"Qorong'i xonada g'alati ovoz eshitilди.",answer:"Qo'rquv",options:["Qo'rquv","Quvonch","Zerikish","Faxr"]},
        {text:"Birov navbatdan oldinga o'tib ketdi.",answer:"G'azab",options:["G'azab","Quvonch","Xotirjamlik","Hayrat"]},
        {text:"Imtihondan a'lo baho olding.",answer:"Faxr",options:["Faxr","Qo'rquv","Hafagarchilik","Zerikish"]},
        {text:"Uzoq kutilgan do'sting keldi.",answer:"Quvonch",options:["Quvonch","G'azab","Qo'rquv","Zerikish"]},
      ] } },
  em_calm_match: { id:"em_calm_match", name:"Xotirjam juftlar", short:"XJ", domain:"Emotsional regulyatsiya",
    description:"Shoshmasdan, xotirjam holda juftlarni toping — sabr va e'tibor.",
    icon:"heart", color:"#7C3AED", soft:"#EDE9FE", duration:"3–4 daq",
    engine:"EngMatch", config:{ pairs:6, items:W_NATURE } },
  em_breathe_short: { id:"em_breathe_short", name:"Tezkor tinchlanish", short:"TT", domain:"Emotsional regulyatsiya",
    description:"Qisqa nafas mashqi — tez tinchlanish uchun (3 sikl).",
    icon:"pause", color:"#7C3AED", soft:"#EDE9FE", duration:"1–2 daq",
    engine:"EngBreathe", config:{ cycles:3, inhale:4, hold:2, exhale:6 } },

  // ============ 10. Nutq va lingvistik (rose) ============
  lg_category: { id:"lg_category", name:"So'z toifalash", short:"WC", domain:"Nutq va lingvistik",
    description:"So'z qaysi semantik guruhga tegishli ekanini tanlang.",
    icon:"shapes", color:"#E11D48", soft:"#FFE4E6", duration:"3 daq",
    engine:"EngChoice", config:{ genKey:"category", rounds:18, timeout:6000,
      categories:[{name:"Hayvon",items:W_ANIMALS},{name:"Meva",items:W_FRUITS},{name:"Tana",items:W_BODY},{name:"Tabiat",items:W_NATURE}] } },
  lg_synonym: { id:"lg_synonym", name:"Ma'nodoshlar", short:"SN", domain:"Nutq va lingvistik",
    description:"Berilgan so'zga ma'nodosh so'zni toping — lug'at boyligi.",
    icon:"link-2", color:"#E11D48", soft:"#FFE4E6", duration:"3–4 daq",
    engine:"EngChoice", config:{ genKey:"wordpair", rounds:14, timeout:8000, ruleText:"Ma'nodosh so'zni tanlang",
      pairs:[
        {word:"shod",match:"xursand",distractors:["g'amgin","charchagan","och"]},
        {word:"kuchli",match:"baquvvat",distractors:["zaif","kichik","sekin"]},
        {word:"yorug'",match:"nurli",distractors:["qorong'i","sovuq","baland"]},
        {word:"keng",match:"vase'",distractors:["tor","past","yangi"]},
        {word:"botir",match:"qahramon",distractors:["qo'rqoq","dangasa","kichkina"]},
        {word:"oson",match:"yengil",distractors:["qiyin","og'ir","uzoq"]},
      ] } },
  lg_antonym: { id:"lg_antonym", name:"Qarama-qarshi so'zlar", short:"AN", domain:"Nutq va lingvistik",
    description:"Berilgan so'zga ZID ma'noli so'zni toping.",
    icon:"arrow-left-right", color:"#E11D48", soft:"#FFE4E6", duration:"3–4 daq",
    engine:"EngChoice", config:{ genKey:"wordpair", rounds:14, timeout:8000, ruleText:"Qarama-qarshi so'zni tanlang",
      pairs:[
        {word:"katta",match:"kichik",distractors:["ulkan","baland","keng"]},
        {word:"issiq",match:"sovuq",distractors:["iliq","quruq","yorug'"]},
        {word:"baland",match:"past",distractors:["uzun","tez","og'ir"]},
        {word:"tez",match:"sekin",distractors:["shoshqaloq","yengil","yangi"]},
        {word:"yorug'",match:"qorong'i",distractors:["nurli","oq","keng"]},
        {word:"baxtli",match:"g'amgin",distractors:["xursand","shod","tinch"]},
      ] } },
  lg_word_find: { id:"lg_word_find", name:"So'z topish", short:"WD", domain:"Nutq va lingvistik",
    description:"So'zli kartochkalarni eslab juftlab, so'z topish qobiliyatini mashq qiling.",
    icon:"spell-check", color:"#E11D48", soft:"#FFE4E6", duration:"4 daq",
    engine:"EngMatch", config:{ pairs:7, items:W_BODY } },
  lg_word_seq: { id:"lg_word_seq", name:"Jumla qurilishi", short:"JQ", domain:"Nutq va lingvistik",
    description:"So'zlar ketma-ketligini eslab takrorlang — nutq xotirasi va tartibi.",
    icon:"pilcrow", color:"#E11D48", soft:"#FFE4E6", duration:"4 daq",
    engine:"EngSequence", config:{ itemType:"word", mode:"forward", startLen:2, maxLen:6, showMs:1150, gapMs:400, words:W_NATURE } },
};

// Domain order + meta for grouped display
const TRAINING_DOMAINS = [
  { name:"Diqqat va selektiv diqqat",        color:"#0F766E", soft:"#CCFBF1", icon:"eye" },
  { name:"Ishchi xotira",                    color:"#2563EB", soft:"#DBEAFE", icon:"layers" },
  { name:"Ijro funksiyalari",                color:"#D97706", soft:"#FEF3C7", icon:"git-merge" },
  { name:"Psixomotor tezlik",                color:"#9333EA", soft:"#F3E8FF", icon:"zap" },
  { name:"Vizual-motor koordinatsiya",       color:"#DB2777", soft:"#FCE7F3", icon:"crosshair" },
  { name:"Verbal xotira",                    color:"#0891B2", soft:"#CFFAFE", icon:"text" },
  { name:"Eshitish gnozisi",                 color:"#16A34A", soft:"#DCFCE7", icon:"ear" },
  { name:"Orientatsiya va fazoviy fikrlash", color:"#CA8A04", soft:"#FEF9C3", icon:"compass" },
  { name:"Emotsional regulyatsiya",          color:"#7C3AED", soft:"#EDE9FE", icon:"heart" },
  { name:"Nutq va lingvistik",               color:"#E11D48", soft:"#FFE4E6", icon:"message-circle" },
];

window.TRAINING_META = TRAINING_META;
window.TRAINING_DOMAINS = TRAINING_DOMAINS;

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
