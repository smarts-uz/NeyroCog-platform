// Unique game mechanics — distinct interaction models so exercises don't
// all feel like the same multiple-choice engine.
//
// Exposed:
//   EngSort   — binary left/right sorting under time pressure (swipe/tap)
//   EngSimon  — light-and-sound sequence you reproduce by tapping pads
//   EngGrid   — perceptual odd-one-out in a colour/shape grid
//
// Signature: ({ patient, exercise, onAbort, onFinish }) reading exercise.config.

const _ush = (a)=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};
const _uri = (n)=>Math.floor(Math.random()*n);

// =====================================================================
// EngSort — an item appears; sort it LEFT or RIGHT by a rule.
// Fast, game-like; trains selective attention + inhibition + speed.
// config: {
//   rounds, timeout,
//   left:{label}, right:{label},
//   genKey: "parity" | "magnitude" | "category" | "semantic",
//   ... generator-specific data
// }
// =====================================================================
const _SORT_GEN = {
  parity: () => { const n=1+_uri(9); return { text:String(n), side: n%2===0?"left":"right" }; },
  magnitude: (cfg) => { const piv=cfg.pivot||5; let n; do{n=1+_uri(9);}while(n===piv); return { text:String(n), side: n<piv?"left":"right" }; },
  category: (cfg) => {
    const a=cfg.leftItems, b=cfg.rightItems;
    if(Math.random()<0.5){ return { text:a[_uri(a.length)], side:"left" }; }
    return { text:b[_uri(b.length)], side:"right" };
  },
  semantic: (cfg) => {
    // left = "jonli" (living), right = "jonsiz" (non-living) etc — generic word buckets
    const a=cfg.leftItems, b=cfg.rightItems;
    if(Math.random()<0.5){ return { text:a[_uri(a.length)], side:"left" }; }
    return { text:b[_uri(b.length)], side:"right" };
  },
};

const EngSort = ({ patient, exercise, onAbort, onFinish }) => {
  const c = exercise.config;
  const gen = React.useMemo(()=> _SORT_GEN[c.genKey], [exercise.id]);
  const rounds = c.rounds || 20;
  const [phase, setPhase] = React.useState("intro");
  const [idx, setIdx] = React.useState(0);
  const [cur, setCur] = React.useState(null);
  const [fb, setFb] = React.useState(null);
  const [correct, setCorrect] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const startRef = React.useRef(0); const tRef = React.useRef(0);

  const next = () => { setCur(gen(c)); setFb(null); tRef.current = Date.now(); };
  const start = () => { setPhase("running"); setIdx(0); setCorrect(0); setErrors(0); setScore(0); startRef.current=Date.now(); next(); };

  React.useEffect(()=>{
    if(phase!=="running"||!cur||fb||!c.timeout) return;
    const t=setTimeout(()=>{ setErrors(e=>e+1); setFb("timeout"); setTimeout(advance,420); }, c.timeout);
    return ()=>clearTimeout(t);
  },[phase,cur,fb]);

  const choose = (side) => {
    if(fb||!cur) return;
    const ok = side===cur.side;
    if(ok){ setCorrect(x=>x+1); const rt=Date.now()-tRef.current; setScore(s=>s+25+Math.max(0,Math.round(((c.timeout||3000)-rt)/30))); setFb("ok"); }
    else { setErrors(x=>x+1); setScore(s=>Math.max(0,s-15)); setFb("err"); }
    setTimeout(advance, 360);
  };
  const advance = () => {
    const n=idx+1;
    if(n>=rounds){ setPhase("done"); setTimeout(()=>onFinish({exerciseId:exercise.id,score,accuracy:correct/(correct+errors||1),duration:Date.now()-startRef.current,level:exercise._level||1}),700); return; }
    setIdx(n); next();
  };

  return (
    <TrainingShell patient={patient} exercise={exercise} phase={phase} onAbort={onAbort}
      onSave={()=>onFinish({exerciseId:exercise.id,score,accuracy:correct/(correct+errors||1),duration:Date.now()-startRef.current,level:exercise._level||1})}
      metrics={phase==="running"?[
        {label:"Element", value:`${idx+1}/${rounds}`, icon:"list", mono:true},
        {label:"To'g'ri", value:correct, icon:"check", tone:"ok", mono:true},
        {label:"Ball", value:score, icon:"star", mono:true},
      ]:null}
      intro={<TrainingIntro exercise={exercise} description={exercise.description}
        instructions={[`Markazda element paydo bo'ladi.`,
          `Agar "${c.left.label}" bo'lsa — CHAP tugma yoki ← .`,
          `Agar "${c.right.label}" bo'lsa — O'NG tugma yoki → .`,
          `Tez va aniq saralang. Jami ${rounds} ta.`]}
        duration={exercise.duration} onStart={start} />}
      body={cur && (
        <div className="ktt-no-select" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:28,width:"min(640px,94vw)"}}>
          {/* bins */}
          <div style={{display:"flex",justifyContent:"space-between",width:"100%",gap:16}}>
            <div className="pill" style={{fontSize:14,padding:"8px 16px",background:"var(--info-bg)",color:"var(--info)",borderColor:"transparent"}}>← {c.left.label}</div>
            <div className="pill" style={{fontSize:14,padding:"8px 16px",background:"var(--warn-bg)",color:"var(--warn)",borderColor:"transparent"}}>{c.right.label} →</div>
          </div>
          {/* item */}
          <div style={{minWidth:"min(360px,84vw)",minHeight:160,padding:"24px 28px",background:"var(--surface)",
            borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",
            border: fb==="ok"?"3px solid var(--ok)":fb==="err"?"3px solid var(--err)":fb==="timeout"?"3px solid var(--warn)":"1px solid var(--border)",
            boxShadow:"var(--shadow-md)",transition:"border-color 120ms var(--ease)",textAlign:"center",
            fontFamily:"var(--font-sans)",fontWeight:800,fontSize:"clamp(36px,9vw,64px)",letterSpacing:"-0.02em",color:"var(--ink)"}}>
            {cur.text}
          </div>
          {/* big sort buttons */}
          <div className="ktt-answers" style={{display:"flex",gap:14,width:"100%"}}>
            <button onPointerDown={()=>choose("left")} disabled={!!fb}
              style={{flex:1,height:84,borderRadius:16,border:"1px solid var(--border-strong)",background:"var(--info-bg)",color:"var(--info)",
                fontFamily:"var(--font-sans)",fontWeight:700,fontSize:18,cursor:fb?"default":"pointer",opacity:fb?0.6:1,
                display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <Icon name="arrow-left" size={22}/> {c.left.label}
            </button>
            <button onPointerDown={()=>choose("right")} disabled={!!fb}
              style={{flex:1,height:84,borderRadius:16,border:"1px solid var(--border-strong)",background:"var(--warn-bg)",color:"var(--warn)",
                fontFamily:"var(--font-sans)",fontWeight:700,fontSize:18,cursor:fb?"default":"pointer",opacity:fb?0.6:1,
                display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {c.right.label} <Icon name="arrow-right" size={22}/>
            </button>
          </div>
        </div>
      )}
      doneSummary={<TrainingDone exercise={exercise} score={score} accuracy={correct/(correct+errors||1)}
        duration={Date.now()-startRef.current} onAgain={start} onBack={onAbort} />}
      hint={<span>Chap yoki o'ng tomonga saralang</span>}
    />
  );
};

// keyboard ←/→ support
const _useArrowKeys = (onLeft, onRight, active) => {
  React.useEffect(()=>{
    if(!active) return;
    const h=(e)=>{ if(e.key==="ArrowLeft"){e.preventDefault();onLeft();} else if(e.key==="ArrowRight"){e.preventDefault();onRight();} };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[active,onLeft,onRight]);
};

// =====================================================================
// EngSimon — pads light up (with tone) in a growing sequence; reproduce it.
// Distinct from digit-recall: spatial + audio + motor, no typing.
// config: { maxLen, showMs, pads:4|6 }
// =====================================================================
const _SIMON_COLORS = [
  {bg:"#16A34A",lit:"#4ADE80",freq:392},
  {bg:"#DC2626",lit:"#F87171",freq:330},
  {bg:"#2563EB",lit:"#60A5FA",freq:523},
  {bg:"#CA8A04",lit:"#FBBF24",freq:294},
  {bg:"#9333EA",lit:"#C084FC",freq:440},
  {bg:"#0891B2",lit:"#22D3EE",freq:587},
];
const _simonTone = (f)=>{ try{ const ctx=window.__audioCtx||(window.__audioCtx=new(window.AudioContext||window.webkitAudioContext)()); if(ctx.state==="suspended")ctx.resume(); const o=ctx.createOscillator(),g=ctx.createGain(); o.type="sine"; o.frequency.value=f; g.gain.setValueAtTime(0.0001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.16,ctx.currentTime+0.03); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.4); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.42);}catch(e){} };

const EngSimon = ({ patient, exercise, onAbort, onFinish }) => {
  const c = exercise.config;
  const nPads = c.pads || 4;
  const maxLen = c.maxLen || 8;
  const showMs = c.showMs || 600;
  const [phase, setPhase] = React.useState("intro");
  const [seq, setSeq] = React.useState([]);
  const [lit, setLit] = React.useState(-1);
  const [stage, setStage] = React.useState("idle"); // idle|show|input
  const [inLen, setInLen] = React.useState(0);
  const [best, setBest] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [fb, setFb] = React.useState(null);
  const startRef = React.useRef(0); const inputRef = React.useRef(0);

  const playSeq = (s) => {
    setStage("show"); setFb(null); let i=0;
    const step=()=>{
      if(i>=s.length){ setTimeout(()=>{ setLit(-1); setStage("input"); inputRef.current=0; setInLen(0); }, 250); return; }
      setLit(s[i]); _simonTone(_SIMON_COLORS[s[i]].freq);
      setTimeout(()=>{ setLit(-1); setTimeout(step, 180); }, showMs);
      i++;
    };
    step();
  };
  const start = () => {
    setPhase("running"); setBest(0); setScore(0);
    startRef.current=Date.now();
    const s=[_uri(nPads)]; setSeq(s);
    setTimeout(()=>playSeq(s), 500);
  };

  const tap = (pad) => {
    if(stage!=="input"||fb) return;
    setLit(pad); _simonTone(_SIMON_COLORS[pad].freq); setTimeout(()=>setLit(-1),180);
    const pos=inputRef.current;
    if(seq[pos]===pad){
      inputRef.current=pos+1; setInLen(pos+1);
      if(pos+1===seq.length){
        const len=seq.length; setBest(b=>Math.max(b,len)); setScore(s=>s+len*12); setFb("ok");
        if(len>=maxLen){ finish(len); return; }
        setTimeout(()=>{ const s=[...seq,_uri(nPads)]; setSeq(s); playSeq(s); }, 700);
      }
    } else {
      setFb("err"); setTimeout(()=>finish(seq.length-1), 900);
    }
  };
  const finish = (reached) => {
    setPhase("done");
    setTimeout(()=>onFinish({exerciseId:exercise.id,score,accuracy: Math.min(1, (reached||0)/maxLen),
      duration:Date.now()-startRef.current, level: reached||0}),700);
  };

  const cols = nPads<=4?2:3;
  return (
    <TrainingShell patient={patient} exercise={exercise} phase={phase} onAbort={onAbort}
      onSave={()=>onFinish({exerciseId:exercise.id,score,accuracy:Math.min(1,(seq.length||0)/maxLen),duration:Date.now()-startRef.current,level:seq.length||0})}
      metrics={phase==="running"?[
        {label:"Uzunlik", value:seq.length, icon:"ruler", tone:"primary", mono:true},
        {label:"Eng yaxshi", value:best, icon:"award", tone:"ok", mono:true},
        {label:"Ball", value:score, icon:"star", mono:true},
      ]:null}
      intro={<TrainingIntro exercise={exercise} description={exercise.description}
        instructions={["Tugmalar navbat bilan yonadi va tovush chiqaradi.","Diqqat bilan kuzating va eslab qoling.","So'ng xuddi shu tartibda tugmalarni bosing.","Har to'g'ri qator — bittaga uzayadi."]}
        duration={exercise.duration} onStart={start} />}
      body={
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:22}}>
          <div className="pill" style={{fontSize:14,padding:"8px 16px"}}>
            {stage==="show"?"Kuzating…":stage==="input"?`Takrorlang (${inLen}/${seq.length})`:""}
          </div>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:14,width:"min(380px,86vw)"}}>
            {Array.from({length:nPads}).map((_,i)=>{
              const C=_SIMON_COLORS[i]; const on=lit===i;
              return (
                <button key={i} onPointerDown={()=>tap(i)} disabled={stage!=="input"}
                  className="ktt-no-select"
                  style={{aspectRatio:"1",borderRadius:18,border:"none",cursor:stage==="input"?"pointer":"default",
                    background:on?C.lit:C.bg, opacity:on?1:0.62,
                    boxShadow:on?`0 0 0 6px ${C.lit}55, var(--shadow-md)`:"var(--shadow-sm)",
                    transition:"opacity 120ms var(--ease), box-shadow 120ms var(--ease), background 120ms var(--ease)"}} />
              );
            })}
          </div>
          {fb==="err" && <div style={{fontFamily:"var(--font-sans)",color:"var(--err)",fontWeight:600}}>Xato — lekin {seq.length-1} tagacha yetding!</div>}
        </div>
      }
      doneSummary={<TrainingDone exercise={exercise} score={score} accuracy={Math.min(1,best/maxLen)}
        duration={Date.now()-startRef.current} level={best} onAgain={start} onBack={onAbort} />}
      hint={stage==="show"?<span>Ketma-ketlikni kuzating…</span>:<span>Xuddi shu tartibda bosing</span>}
    />
  );
};

// =====================================================================
// EngGrid — perceptual odd-one-out: a grid of identical tiles, one differs
// slightly in shade. Tap it. Trains selective visual attention + acuity.
// config: { rounds, timeout, startGrid:[r,c], maxGrid:[r,c] }
// =====================================================================
const EngGrid = ({ patient, exercise, onAbort, onFinish }) => {
  const c = exercise.config;
  const rounds = c.rounds || 15;
  const [phase, setPhase] = React.useState("intro");
  const [idx, setIdx] = React.useState(0);
  const [cells, setCells] = React.useState([]);
  const [odd, setOdd] = React.useState(-1);
  const [grid, setGrid] = React.useState(c.startGrid || [3,3]);
  const [fb, setFb] = React.useState(null);
  const [correct, setCorrect] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const startRef = React.useRef(0); const tRef = React.useRef(0);

  const build = (level) => {
    // grid grows + shade delta shrinks as rounds progress → harder
    const maxG = c.maxGrid || [6,6];
    const gr = [
      Math.min(maxG[0], (c.startGrid||[3,3])[0] + Math.floor(level/4)),
      Math.min(maxG[1], (c.startGrid||[3,3])[1] + Math.floor(level/4)),
    ];
    setGrid(gr);
    const n = gr[0]*gr[1];
    const hue = _uri(360);
    const baseL = 55, delta = Math.max(6, 22 - level*1.1);
    const base = `hsl(${hue}, 55%, ${baseL}%)`;
    const oddCol = `hsl(${hue}, 55%, ${baseL-delta}%)`;
    const oddIdx = _uri(n);
    setOdd(oddIdx);
    setCells(Array.from({length:n},(_, i)=> i===oddIdx?oddCol:base));
    tRef.current=Date.now(); setFb(null);
  };
  const start = () => { setPhase("running"); setIdx(0); setCorrect(0); setErrors(0); setScore(0); startRef.current=Date.now(); build(0); };

  React.useEffect(()=>{
    if(phase!=="running"||fb||!c.timeout) return;
    const t=setTimeout(()=>{ setErrors(e=>e+1); setFb("to"); setTimeout(advance,420); }, c.timeout);
    return ()=>clearTimeout(t);
  },[phase,idx,fb]);

  const tap = (i) => {
    if(fb) return;
    if(i===odd){ setCorrect(x=>x+1); const rt=Date.now()-tRef.current; setScore(s=>s+30+Math.max(0,Math.round(((c.timeout||6000)-rt)/50))); setFb("ok"); }
    else { setErrors(x=>x+1); setScore(s=>Math.max(0,s-12)); setFb("err"); }
    setTimeout(advance, 380);
  };
  const advance = () => {
    const n=idx+1;
    if(n>=rounds){ setPhase("done"); setTimeout(()=>onFinish({exerciseId:exercise.id,score,accuracy:correct/(correct+errors||1),duration:Date.now()-startRef.current,level:exercise._level||1}),700); return; }
    setIdx(n); build(n);
  };

  return (
    <TrainingShell patient={patient} exercise={exercise} phase={phase} onAbort={onAbort}
      onSave={()=>onFinish({exerciseId:exercise.id,score,accuracy:correct/(correct+errors||1),duration:Date.now()-startRef.current,level:exercise._level||1})}
      metrics={phase==="running"?[
        {label:"Bosqich", value:`${idx+1}/${rounds}`, icon:"list", mono:true},
        {label:"To'g'ri", value:correct, icon:"check", tone:"ok", mono:true},
        {label:"Ball", value:score, icon:"star", mono:true},
      ]:null}
      intro={<TrainingIntro exercise={exercise} description={exercise.description}
        instructions={["Bir xil rangli kataklar panjarasi ko'rinadi.","Ulardan BITTASI biroz boshqacha rangda.","Uni iloji boricha tez topib bosing.","Daraja oshgani sari farq kichrayadi va panjara kattalashadi."]}
        duration={exercise.duration} onStart={start} />}
      body={
        <div className="ktt-no-select" style={{display:"grid",gridTemplateColumns:`repeat(${grid[1]},1fr)`,gap:8,width:"min(440px,90vw)",
          outline: fb==="err"?"3px solid var(--err)":fb==="ok"?"3px solid var(--ok)":"none",outlineOffset:8,borderRadius:8}}>
          {cells.map((col,i)=>(
            <button key={i} onPointerDown={()=>tap(i)} disabled={!!fb}
              style={{aspectRatio:"1",borderRadius:10,border:"none",background:col,cursor:fb?"default":"pointer",
                boxShadow: fb==="ok"&&i===odd?"0 0 0 4px var(--ok)":"none",transition:"box-shadow 120ms"}} />
          ))}
        </div>
      }
      doneSummary={<TrainingDone exercise={exercise} score={score} accuracy={correct/(correct+errors||1)}
        duration={Date.now()-startRef.current} onAgain={start} onBack={onAbort} />}
      hint={<span>Boshqacha rangdagi katakni toping</span>}
    />
  );
};

window.EngSort = EngSort;
window.EngSimon = EngSimon;
window.EngGrid = EngGrid;
