/** Dvigatellar uchun umumiy yordamchilar. */

export function shuffle<T>(arr: readonly T[]): T[] {
  const x = [...arr];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = x[i];
    const b = x[j];
    if (a !== undefined && b !== undefined) {
      x[i] = b;
      x[j] = a;
    }
  }
  return x;
}

export function rndInt(n: number): number {
  return Math.floor(Math.random() * n);
}

export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** WebAudio orqali sof ohang chaladi (eshitish dvigatellari uchun). */
export function playTone(freq: number, dur = 600): void {
  try {
    const w = window as unknown as {
      __kttAudioCtx?: AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctx = window.AudioContext ?? w.webkitAudioContext;
    if (!Ctx) return;
    if (!w.__kttAudioCtx) w.__kttAudioCtx = new Ctx();
    const ctx = w.__kttAudioCtx;
    if (ctx.state === "suspended") void ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur / 1000);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur / 1000 + 0.05);
  } catch {
    // audio mavjud emas — jim o'tkazib yuboramiz
  }
}
