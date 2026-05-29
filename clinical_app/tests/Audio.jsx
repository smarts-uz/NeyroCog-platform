// Audio diqqat testi — "Sounds Around" uslubidagi atrof-muhit tovushlarini ajratish o'yini.
// Bola sahna tanlaydi (Ferma / Shahar / Plyaj), tovush yangraydi, va tovushni
// chiqaradigan obyektni bosadi. To'g'ri bo'lsa — yulduzlar paydo bo'ladi.
//
// Tovushlar Web Audio API orqali sintez qilinadi (tashqi audio fayl yo'q).

// ---- Sound synthesis ----
function ctxOf() {
  return window.__audioCtx || (window.__audioCtx = new (window.AudioContext || window.webkitAudioContext)());
}
function noiseBuffer(ctx, dur) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
function tone(ctx, t0, f0, f1, dur, type = "sine", peak = 0.2) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.03);
}
function noiseSwell(ctx, t0, dur, freq, q, peak = 0.3) {
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, dur);
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(g).connect(ctx.destination); src.start(t0); src.stop(t0 + dur);
}

// Per-object synthesized "voice"
const SOUNDS = {
  // ---- Farm / animals ----
  dog:   (c, t) => { for (let i = 0; i < 2; i++) tone(c, t + i * 0.28, 380, 180, 0.16, "square", 0.22); },        // vov
  cat:   (c, t) => tone(c, t, 700, 340, 0.55, "sawtooth", 0.18),                                                 // myau
  bird:  (c, t) => { for (let i = 0; i < 3; i++) tone(c, t + i * 0.13, 2200 + i * 200, 2600, 0.08, "sine", 0.16); },
  rat:   (c, t) => { for (let i = 0; i < 4; i++) tone(c, t + i * 0.07, 3000, 3400, 0.04, "sine", 0.1); },
  cow:   (c, t) => { tone(c, t, 210, 150, 0.9, "sawtooth", 0.22); tone(c, t, 105, 78, 0.9, "sawtooth", 0.12); },  // moo
  sheep: (c, t) => { for (let i = 0; i < 8; i++) tone(c, t + i * 0.05, 360 + (i % 2 ? 40 : -40), 360, 0.05, "sawtooth", 0.16); }, // baa (vibrato)
  goat:  (c, t) => { for (let i = 0; i < 7; i++) tone(c, t + i * 0.05, 300 + (i % 2 ? 50 : -50), 300, 0.05, "sawtooth", 0.16); },
  horse: (c, t) => { for (let i = 0; i < 5; i++) tone(c, t + i * 0.07, 820 - i * 110, 760 - i * 110, 0.06, "sawtooth", 0.18); noiseSwell(c, t, 0.4, 500, 1, 0.1); }, // neigh
  pig:   (c, t) => { for (let i = 0; i < 4; i++) tone(c, t + i * 0.12, 260, 200, 0.08, "square", 0.2); },          // oink
  rooster: (c, t) => { tone(c, t, 520, 760, 0.18, "sawtooth", 0.2); tone(c, t + 0.2, 760, 760, 0.22, "sawtooth", 0.2); tone(c, t + 0.44, 700, 480, 0.3, "sawtooth", 0.18); }, // cock-a-doodle
  hen:   (c, t) => { for (let i = 0; i < 4; i++) tone(c, t + i * 0.11, 440, 360, 0.06, "square", 0.16); },         // cluck
  duck:  (c, t) => { for (let i = 0; i < 4; i++) tone(c, t + i * 0.13, 620, 520, 0.08, "sawtooth", 0.18); },       // quack
  bee:   (c, t) => { const o = c.createOscillator(), g = c.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(170, t); o.frequency.linearRampToValueAtTime(200, t + 0.6); o.frequency.linearRampToValueAtTime(160, t + 1.2); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 1.25); }, // buzz
  tractor: (c, t) => { for (let i = 0; i < 9; i++) noiseSwell(c, t + i * 0.13, 0.12, 140, 1, 0.18); },             // chug
  donkey: (c, t) => { tone(c, t, 760, 760, 0.35, "sawtooth", 0.2); tone(c, t + 0.4, 220, 180, 0.5, "sawtooth", 0.2); }, // hee-haw

  // ---- City / street ----
  car:   (c, t) => { tone(c, t, 420, 420, 0.5, "square", 0.18); tone(c, t, 280, 280, 0.5, "square", 0.14); },     // signal
  bus:   (c, t) => tone(c, t, 120, 90, 0.7, "sawtooth", 0.22),                                                   // engine
  truck: (c, t) => { tone(c, t, 90, 70, 1.0, "sawtooth", 0.24); tone(c, t, 45, 35, 1.0, "sawtooth", 0.12); },     // big engine
  motorbike: (c, t) => { const o = c.createOscillator(), g = c.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(180, t); o.frequency.linearRampToValueAtTime(320, t + 0.5); o.frequency.linearRampToValueAtTime(220, t + 1.0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 1.05); },
  train: (c, t) => { tone(c, t, 300, 300, 0.7, "sawtooth", 0.18); tone(c, t, 240, 240, 0.7, "sawtooth", 0.16); for (let i = 0; i < 5; i++) noiseSwell(c, t + 0.7 + i * 0.18, 0.1, 200, 1, 0.14); }, // horn + chug
  bell:  (c, t) => { tone(c, t, 1400, 1400, 0.8, "sine", 0.2); tone(c, t, 2100, 2100, 0.8, "sine", 0.1); },
  siren: (c, t) => { tone(c, t, 600, 1100, 0.5, "sine", 0.18); tone(c, t + 0.5, 1100, 600, 0.5, "sine", 0.18); },
  ambulance: (c, t) => { for (let i = 0; i < 3; i++){ tone(c, t + i * 0.35, 760, 760, 0.16, "sine", 0.18); tone(c, t + i * 0.35 + 0.17, 980, 980, 0.16, "sine", 0.18);} }, // fast two-tone
  whistle: (c, t) => { tone(c, t, 2100, 2300, 0.18, "sine", 0.2); tone(c, t + 0.24, 2300, 2100, 0.2, "sine", 0.2); }, // police whistle
  jackhammer: (c, t) => { for (let i = 0; i < 10; i++) noiseSwell(c, t + i * 0.08, 0.05, 320, 1.5, 0.2); },        // construction
  radio: (c, t) => { const notes = [523, 659, 784, 659]; notes.forEach((f, i) => tone(c, t + i * 0.18, f, f, 0.16, "triangle", 0.16)); }, // melody
  klaxon: (c, t) => { tone(c, t, 360, 360, 0.5, "square", 0.22); },                                              // honk

  // ---- Beach / sea ----
  waves: (c, t) => { noiseSwell(c, t, 1.1, 500, 0.6, 0.32); noiseSwell(c, t + 0.6, 1.0, 400, 0.6, 0.26); },
  wind:  (c, t) => noiseSwell(c, t, 1.4, 700, 0.5, 0.26),
  sailboat: (c, t) => { tone(c, t, 220, 200, 1.0, "triangle", 0.14); noiseSwell(c, t, 1.0, 300, 0.5, 0.12); },
  seagull: (c, t) => { for (let i = 0; i < 4; i++) tone(c, t + i * 0.22, 1600 - i * 80, 1900 - i * 80, 0.14, "sawtooth", 0.16); }, // cry
  boathorn: (c, t) => { tone(c, t, 150, 140, 1.1, "sawtooth", 0.24); tone(c, t, 75, 70, 1.1, "sawtooth", 0.14); }, // foghorn
  dolphin: (c, t) => { for (let i = 0; i < 5; i++) tone(c, t + i * 0.08, 2400 + i * 300, 3200 + i * 300, 0.06, "sine", 0.14); }, // chirp
  bubbles: (c, t) => { for (let i = 0; i < 6; i++) tone(c, t + i * 0.1, 380 + i * 60, 620 + i * 60, 0.06, "sine", 0.14); },     // bloop
  splash: (c, t) => { noiseSwell(c, t, 0.4, 1200, 0.7, 0.3); noiseSwell(c, t + 0.1, 0.3, 800, 0.7, 0.18); },      // splash
  jetski: (c, t) => { const o = c.createOscillator(), g = c.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(260, t); o.frequency.linearRampToValueAtTime(420, t + 0.6); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.0); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 1.05); },
  icecream: (c, t) => { const notes = [784, 880, 988, 880, 784]; notes.forEach((f, i) => tone(c, t + i * 0.16, f, f, 0.14, "triangle", 0.16)); }, // jingle

  // ---- Home ----
  clock:    (c, t) => { for (let i = 0; i < 3; i++) tone(c, t + i * 0.5, 1800, 1800, 0.06, "square", 0.16); },     // tik
  phone:    (c, t) => { for (let i = 0; i < 2; i++){ tone(c, t + i * 0.4, 1200, 1200, 0.18, "sine", 0.18); tone(c, t + i * 0.4, 1500, 1500, 0.18, "sine", 0.12);} }, // ring
  kettle:   (c, t) => noiseSwell(c, t, 1.4, 2600, 4, 0.2),                                                        // whistle hiss
  doorbell: (c, t) => { tone(c, t, 880, 880, 0.4, "sine", 0.2); tone(c, t + 0.35, 660, 660, 0.5, "sine", 0.2); }, // ding-dong
  alarm:    (c, t) => { for (let i = 0; i < 6; i++) tone(c, t + i * 0.16, 880, 880, 0.1, "square", 0.18); },       // beep beep
  microwave:(c, t) => { for (let i = 0; i < 3; i++) tone(c, t + i * 0.25, 1000, 1000, 0.12, "sine", 0.18); },      // beep
  vacuum:   (c, t) => noiseSwell(c, t, 1.4, 320, 0.6, 0.24),                                                      // hum
  washer:   (c, t) => { for (let i = 0; i < 5; i++) noiseSwell(c, t + i * 0.28, 0.22, 260, 0.8, 0.18); },          // rhythm
  fan:      (c, t) => noiseSwell(c, t, 1.4, 500, 0.4, 0.18),                                                      // airy
  faucet:   (c, t) => { noiseSwell(c, t, 1.3, 2200, 0.9, 0.18); noiseSwell(c, t + 0.2, 1.0, 2800, 0.9, 0.12); },   // water
  guitar:   (c, t) => { const notes = [330, 392, 494]; notes.forEach((f, i) => tone(c, t + i * 0.22, f, f, 0.4, "triangle", 0.16)); }, // pluck
  baby:     (c, t) => { for (let i = 0; i < 3; i++) tone(c, t + i * 0.4, 560, 760, 0.3, "sawtooth", 0.18); },      // cry
  knock:    (c, t) => { for (let i = 0; i < 3; i++) noiseSwell(c, t + i * 0.2, 0.08, 200, 1, 0.24); },             // knock
  tv:       (c, t) => { noiseSwell(c, t, 0.6, 1200, 0.5, 0.14); tone(c, t, 440, 440, 0.5, "triangle", 0.12); },    // static + tone

  // ---- Forest ----
  owl:      (c, t) => { tone(c, t, 500, 380, 0.35, "sine", 0.18); tone(c, t + 0.45, 500, 380, 0.35, "sine", 0.18); }, // hoo-hoo
  frog:     (c, t) => { for (let i = 0; i < 3; i++) tone(c, t + i * 0.18, 300, 220, 0.1, "sawtooth", 0.18); },    // croak
  cricket:  (c, t) => { for (let i = 0; i < 6; i++) tone(c, t + i * 0.09, 4200, 4200, 0.04, "sine", 0.1); },      // chirp
  stream:   (c, t) => { noiseSwell(c, t, 1.5, 1800, 0.8, 0.18); noiseSwell(c, t + 0.3, 1.2, 2400, 0.8, 0.12); },  // water
  wolf:     (c, t) => { const o = c.createOscillator(), g = c.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(300, t); o.frequency.linearRampToValueAtTime(520, t + 0.6); o.frequency.linearRampToValueAtTime(360, t + 1.3); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 1.35); }, // howl
  woodpecker:(c, t) => { for (let i = 0; i < 7; i++) noiseSwell(c, t + i * 0.06, 0.03, 1600, 2, 0.18); },          // knock-knock
  cuckoo:   (c, t) => { tone(c, t, 820, 820, 0.2, "sine", 0.18); tone(c, t + 0.24, 650, 650, 0.26, "sine", 0.18); }, // cuckoo
  thunder:  (c, t) => { noiseSwell(c, t, 1.6, 90, 0.4, 0.34); noiseSwell(c, t + 0.3, 1.3, 60, 0.4, 0.22); },       // rumble
  rain:     (c, t) => { noiseSwell(c, t, 1.6, 3000, 0.5, 0.16); noiseSwell(c, t + 0.2, 1.4, 3600, 0.5, 0.12); },   // patter
  bear:     (c, t) => { tone(c, t, 130, 90, 1.0, "sawtooth", 0.24); noiseSwell(c, t, 0.8, 220, 0.6, 0.12); },      // growl
  snake:    (c, t) => noiseSwell(c, t, 1.2, 3200, 6, 0.2),                                                        // hiss
  fox:      (c, t) => { for (let i = 0; i < 3; i++) tone(c, t + i * 0.2, 900, 700, 0.12, "sawtooth", 0.18); },     // yip
};

const SCENES = [
  { id: "farm",  name: "Ferma",  icon: "tractor", soft: "#DCFCE7", color: "#16A34A",
    objects: [
      { id: "dog",      name: "It",        icon: "dog" },
      { id: "cat",      name: "Mushuk",    icon: "cat" },
      { id: "cow",      name: "Sigir",     icon: "milk" },
      { id: "horse",    name: "Ot",        icon: "footprints" },
      { id: "sheep",    name: "Qo'y",      icon: "cloud" },
      { id: "goat",     name: "Echki",     icon: "leaf" },
      { id: "pig",      name: "Cho'chqa",  icon: "piggy-bank" },
      { id: "rooster",  name: "Xo'roz",    icon: "sunrise" },
      { id: "hen",      name: "Tovuq",     icon: "egg" },
      { id: "duck",     name: "O'rdak",    icon: "droplet" },
      { id: "donkey",   name: "Eshak",     icon: "carrot" },
      { id: "rabbit",   name: "Quyon",     icon: "rabbit" },
      { id: "rat",      name: "Sichqon",   icon: "rat" },
      { id: "bird",     name: "Qush",      icon: "bird" },
      { id: "bee",      name: "Asalari",   icon: "bug" },
      { id: "frog",     name: "Qurbaqa",   icon: "droplets" },
      { id: "tractor",  name: "Traktor",   icon: "tractor" },
      { id: "cricket",  name: "Chigirtka", icon: "leaf" },
      { id: "owl",      name: "Boyqush",   icon: "moon" },
      { id: "wind",     name: "Shamol",    icon: "wind" },
    ] },
  { id: "city",  name: "Shahar", icon: "building-2", soft: "#DBEAFE", color: "#2563EB",
    objects: [
      { id: "car",       name: "Mashina",    icon: "car" },
      { id: "bus",       name: "Avtobus",    icon: "bus" },
      { id: "truck",     name: "Yuk mashina",icon: "truck" },
      { id: "motorbike", name: "Mototsikl",  icon: "bike" },
      { id: "train",     name: "Poyezd",     icon: "train-front" },
      { id: "ambulance", name: "Tez yordam", icon: "ambulance" },
      { id: "siren",     name: "Sirena",     icon: "siren" },
      { id: "whistle",   name: "Hushtak",    icon: "volume-2" },
      { id: "bell",      name: "Qo'ng'iroq", icon: "bell" },
      { id: "klaxon",    name: "Signal",     icon: "megaphone" },
      { id: "jackhammer",name: "Bolg'a",     icon: "hammer" },
      { id: "radio",     name: "Radio",      icon: "radio" },
      { id: "phone",     name: "Telefon",    icon: "smartphone" },
      { id: "doorbell",  name: "Eshik qo'ng'irog'i", icon: "door-closed" },
      { id: "clock",     name: "Soat",       icon: "clock" },
      { id: "dog",       name: "It",         icon: "dog" },
      { id: "bird",      name: "Kaptar",     icon: "bird" },
      { id: "baby",      name: "Bola",       icon: "baby" },
      { id: "guitar",    name: "Gitara",     icon: "guitar" },
      { id: "wind",      name: "Shamol",     icon: "wind" },
    ] },
  { id: "beach", name: "Plyaj",  icon: "palmtree", soft: "#FEF3C7", color: "#D97706",
    objects: [
      { id: "waves",    name: "To'lqin",   icon: "waves" },
      { id: "wind",     name: "Shamol",    icon: "wind" },
      { id: "seagull",  name: "Chayka",    icon: "bird" },
      { id: "sailboat", name: "Yelkanli",  icon: "sailboat" },
      { id: "boathorn", name: "Kema",      icon: "ship" },
      { id: "dolphin",  name: "Delfin",    icon: "fish" },
      { id: "bubbles",  name: "Pufakcha",  icon: "droplets" },
      { id: "splash",   name: "Suv chaplashi", icon: "droplet" },
      { id: "jetski",   name: "Gidrotsikl",icon: "waves" },
      { id: "icecream", name: "Muzqaymoq", icon: "ice-cream-cone" },
      { id: "radio",    name: "Radio",     icon: "radio" },
      { id: "bird",     name: "Qush",      icon: "bird" },
      { id: "dog",      name: "It",        icon: "dog" },
      { id: "baby",     name: "Bola",      icon: "baby" },
      { id: "guitar",   name: "Gitara",    icon: "guitar" },
      { id: "bell",     name: "Qo'ng'iroq",icon: "bell" },
      { id: "car",      name: "Mashina",   icon: "car" },
      { id: "phone",    name: "Telefon",   icon: "smartphone" },
      { id: "thunder",  name: "Momaqaldiroq", icon: "cloud-lightning" },
      { id: "rain",     name: "Yomg'ir",   icon: "cloud-rain" },
    ] },
  { id: "home",  name: "Uy",     icon: "home", soft: "#F3E8FF", color: "#7C3AED",
    objects: [
      { id: "clock",     name: "Soat",       icon: "clock" },
      { id: "phone",     name: "Telefon",    icon: "phone" },
      { id: "kettle",    name: "Choynak",    icon: "coffee" },
      { id: "doorbell",  name: "Eshik qo'ng'irog'i", icon: "bell" },
      { id: "alarm",     name: "Budilnik",   icon: "alarm-clock" },
      { id: "microwave", name: "Mikroto'lqin", icon: "microwave" },
      { id: "vacuum",    name: "Changyutgich", icon: "wind" },
      { id: "washer",    name: "Kir mashina",icon: "washing-machine" },
      { id: "fan",       name: "Ventilyator",icon: "fan" },
      { id: "faucet",    name: "Jo'mrak",    icon: "droplet" },
      { id: "guitar",    name: "Gitara",     icon: "guitar" },
      { id: "baby",      name: "Chaqaloq",   icon: "baby" },
      { id: "knock",     name: "Taqillatish",icon: "door-closed" },
      { id: "tv",        name: "Televizor",  icon: "tv" },
      { id: "radio",     name: "Radio",      icon: "radio" },
      { id: "cat",       name: "Mushuk",     icon: "cat" },
      { id: "dog",       name: "It",         icon: "dog" },
      { id: "bird",      name: "Qush",       icon: "bird" },
      { id: "bell",      name: "Qo'ng'iroq", icon: "bell" },
      { id: "cuckoo",    name: "Kuku soati", icon: "clock" },
    ] },
  { id: "forest", name: "O'rmon", icon: "trees", soft: "#DCFCE7", color: "#15803D",
    objects: [
      { id: "owl",       name: "Boyqush",    icon: "feather" },
      { id: "frog",      name: "Qurbaqa",    icon: "droplets" },
      { id: "cricket",   name: "Chigirtka",  icon: "bug" },
      { id: "stream",    name: "Soy",        icon: "waves" },
      { id: "wolf",      name: "Bo'ri",      icon: "paw-print" },
      { id: "woodpecker",name: "Qizilishton",icon: "tree-pine" },
      { id: "cuckoo",    name: "Kakku",      icon: "bird" },
      { id: "thunder",   name: "Momaqaldiroq",icon: "cloud-lightning" },
      { id: "rain",      name: "Yomg'ir",    icon: "cloud-rain" },
      { id: "bear",      name: "Ayiq",       icon: "paw-print" },
      { id: "fox",       name: "Tulki",      icon: "paw-print" },
      { id: "bee",       name: "Asalari",    icon: "bug" },
      { id: "bird",      name: "Qush",       icon: "bird" },
      { id: "wind",      name: "Shamol",     icon: "wind" },
      { id: "dog",       name: "Ovchi iti",  icon: "dog" },
      { id: "duck",      name: "Yovvoyi o'rdak", icon: "droplet" },
      { id: "splash",    name: "Suv sachrashi", icon: "droplet" },
      { id: "horse",     name: "Ot",         icon: "footprints" },
      { id: "rat",       name: "Sichqon",    icon: "rat" },
      { id: "cat",       name: "Yovvoyi mushuk", icon: "cat" },
    ] },
];

const AUDIO_ROUNDS = 20;

const AudioTest = ({ patient, onAbort, onFinish }) => {
  const test = window.KNBT.TEST_META.Audio;
  const [phase, setPhase] = React.useState("intro");      // intro | scene | running | done
  const [scene, setScene] = React.useState(null);
  const [round, setRound] = React.useState(0);
  const [target, setTarget] = React.useState(null);
  const [correct, setCorrect] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [feedbackId, setFeedbackId] = React.useState(null);   // object id flashed
  const [feedbackOk, setFeedbackOk] = React.useState(null);
  const [starsOn, setStarsOn] = React.useState(null);          // object id with stars
  const [startTime, setStartTime] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (phase !== "running" || !startTime) return;
    const id = setInterval(() => setElapsed(Date.now() - startTime), 200);
    return () => clearInterval(id);
  }, [phase, startTime]);

  const playSound = (objId) => {
    try {
      const c = ctxOf(); if (c.state === "suspended") c.resume();
      (SOUNDS[objId] || SOUNDS.bell)(c, c.currentTime + 0.05);
    } catch (e) {}
  };

  const nextRound = (sc, r) => {
    const obj = sc.objects[Math.floor(Math.random() * sc.objects.length)];
    setTarget(obj); setFeedbackId(null); setFeedbackOk(null); setStarsOn(null);
    setTimeout(() => playSound(obj.id), 450);
  };

  const startScene = (sc) => {
    setScene(sc); setRound(0); setCorrect(0); setErrors(0);
    setStartTime(Date.now()); setElapsed(0);
    setPhase("running");
    nextRound(sc, 0);
  };

  const onPick = (obj) => {
    if (feedbackId || !target) return;
    const ok = obj.id === target.id;
    setFeedbackId(obj.id); setFeedbackOk(ok);
    if (ok) {
      setCorrect(c => c + 1); setStarsOn(obj.id);
      setTimeout(() => {
        const nr = round + 1;
        if (nr >= AUDIO_ROUNDS) finish(correct + 1, errors);
        else { setRound(nr); nextRound(scene, nr); }
      }, 1100);
    } else {
      setErrors(e => e + 1);
      setTimeout(() => { setFeedbackId(null); setFeedbackOk(null); playSound(target.id); }, 900);
    }
  };

  // "Keyingisi" — joriy raundni o'tkazib yuborish. Stroop testidagi kabi,
  // o'tkazib yuborilgan raund XATO javob deb hisoblanadi.
  const skipRound = () => {
    if (feedbackId) return;
    const nr = round + 1;
    setErrors(e => e + 1);
    if (nr >= AUDIO_ROUNDS) finish(correct, errors + 1);
    else { setRound(nr); nextRound(scene, nr); }
  };

  const finish = (corr, err) => {
    const dur = Date.now() - startTime;
    setPhase("done");
    setTimeout(() => onFinish({
      test: "Audio",
      raw: { correct: corr, errors: err, totalTrials: AUDIO_ROUNDS, totalTimeSec: dur / 1000 },
      duration: dur,
      completedAt: new Date().toISOString(),
    }), 900);
  };

  return (
    <TestShell
      patient={patient} test={test} phase={phase === "scene" ? "running" : phase} onAbort={onAbort}
      onSave={() => onFinish({
        test: "Audio",
        raw: { correct, errors, totalTrials: AUDIO_ROUNDS, totalTimeSec: (Date.now() - startTime) / 1000 },
        duration: Date.now() - startTime,
        completedAt: new Date().toISOString(),
      })}
      metrics={phase === "running" ? [
        { label: "Sahna", value: scene?.name || "—", icon: scene?.icon || "map" },
        { label: "To'g'ri", value: correct, icon: "check", tone: "ok", mono: true },
        { label: "Xato", value: errors, icon: "x", tone: errors ? "err" : "neutral", mono: true },
        { label: "Raund", value: `${Math.min(round + 1, AUDIO_ROUNDS)} / ${AUDIO_ROUNDS}`, icon: "list", mono: true },
      ] : null}
      intro={
        <TestIntro test={test}
          title="Audio diqqat testi — Atrofdagi tovushlar"
          description="Bolaning eshitish diqqati va atrof-muhit tovushlarini tanish qobiliyatini rivojlantiradi. Sahna tanlanadi, tovush yangraydi — bola tovush chiqargan narsani topib bosadi."
          steps={[
            "Quloqchin yoki dinamikni ulang va ovozni sozlang.",
            "Sahnani tanlang: Ferma, Shahar, Plyaj, Uy yoki O'rmon.",
            "Tovush avtomatik yangraydi — markazdagi tugmadan qayta tinglash mumkin.",
            "Tovush chiqargan narsani bosing. To'g'ri bo'lsa — yulduzlar chiqadi.",
          ]}
          note="Brauzerda audio ishlashi uchun avval sahifani bosgan bo'lishingiz kerak."
          onStart={() => setPhase("scene")}
          ctaLabel="Sahna tanlash"
        />
      }
      body={
        phase === "scene" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 22, color: "var(--ink)", letterSpacing: "-0.01em" }}>Sahnani tanlang</div>
            <div className="ktt-answers" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              {SCENES.map(sc => (
                <button key={sc.id} className="ktt-lift ktt-tap" onPointerDown={() => startScene(sc)} style={{
                  width: 200, padding: "28px 20px", borderRadius: "var(--r-xl)",
                  border: `1px solid ${sc.color}33`, background: "var(--surface)", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 14, fontFamily: "inherit",
                }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: sc.soft, color: sc.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={sc.icon} size={38} />
                  </div>
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 18, color: "var(--ink)" }}>{sc.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
            {/* Replay button */}
            <button onPointerDown={() => target && playSound(target.id)} className="ktt-tap" style={{
              width: 150, height: 150, borderRadius: 999,
              background: "var(--primary-soft)", border: "2px solid var(--primary)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
              cursor: "pointer", boxShadow: "var(--shadow-md)",
            }}>
              <Icon name="volume-2" size={52} style={{ color: "var(--primary-press)" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--primary-press)" }}>Qayta tinglash</span>
            </button>

            {/* Scene objects */}
            <div className="ktt-answers" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(112px, 1fr))", gap: 12, width: "min(640px, 94vw)" }}>
              {scene?.objects.map(obj => {
                const isFb = feedbackId === obj.id;
                const stars = starsOn === obj.id;
                const bg = isFb ? (feedbackOk ? "var(--ok-bg)" : "var(--err-bg)") : "var(--surface)";
                const bd = isFb ? (feedbackOk ? "var(--ok)" : "var(--err)") : "var(--border-strong)";
                return (
                  <button key={obj.id} onPointerDown={() => onPick(obj)} disabled={!!feedbackId}
                    style={{
                      position: "relative", height: 100, borderRadius: "var(--r-lg)",
                      border: `2px solid ${bd}`, background: bg, cursor: feedbackId ? "default" : "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7,
                      fontFamily: "inherit", transition: "background 160ms var(--ease), border-color 160ms var(--ease)",
                    }}>
                    {stars && <Stars />}
                    <Icon name={obj.icon} size={34} style={{ color: scene.color }} />
                    <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{obj.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Keyingisi — skip current round (counts as error) */}
            <button onClick={skipRound} disabled={!!feedbackId} className="btn btn-secondary btn-sm"
              title="Bu raundni o'tkazib yuborish (xato deb hisoblanadi)">
              Keyingisi <Icon name="chevron-right" size={15} />
            </button>
          </div>
        )
      }
      doneMessage={
        <div style={{ textAlign: "center" }}>
          <Icon name="check-circle" size={64} style={{ color: "var(--ok)" }} />
          <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 28, color: "var(--ink)", marginTop: 12 }}>Test yakunlandi</div>
        </div>
      }
      hint={phase === "running" && scene ? <span>Tovush chiqargan narsani bosing</span> : null}
    />
  );
};

// Animated stars burst around a correct answer
const Stars = () => (
  <>
    {[[-8, -6], [50, -14], [108, -4], [-6, 70], [110, 72]].map((p, i) => (
      <span key={i} style={{
        position: "absolute", left: `${p[0]}%`, top: `${p[1]}%`,
        color: "#F59E0B", animation: `kttPop 420ms var(--ease-spring) ${i * 70}ms both`,
        pointerEvents: "none",
      }}>
        <Icon name="star" size={i % 2 ? 16 : 22} style={{ fill: "#FBBF24", color: "#F59E0B" }} />
      </span>
    ))}
  </>
);

window.AudioTest = AudioTest;
