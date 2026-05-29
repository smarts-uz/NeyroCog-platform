// Config-driven cognitive training engines (core set).
// Each engine wraps <TrainingShell> and is parameterized by `config` from
// TRAINING_META, so one engine powers many exercises.
//
// Exposed: EngSequence, EngChoice, EngMatch
// Every engine signature: ({ patient, exercise, onAbort, onFinish })
// reads exercise.config.

// ---------- shared helpers ----------
const _shuffle = (a) => { const x=[...a]; for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];} return x; };
const _rndInt = (n) => Math.floor(Math.random()*n);
const _sample = (arr, n) => _shuffle(arr).slice(0, n);

// =====================================================================
// EngSequence — show a sequence, recall it.
// config: {
//   itemType: "digit" | "word" | "cell",
//   mode: "forward" | "reverse",
//   startLen, maxLen, showMs, gapMs,
//   words?: [...],          // for word type
//   grid?: [rows, cols],    // for cell type
// }
// =====================================================================
const EngSequence = ({ patient, exercise, onAbort, onFinish }) => {
  const c = exercise.config;
  const grid = c.grid || [3, 3];
  const [phase, setPhase] = React.useState("intro");
  const [len, setLen] = React.useState(c.startLen || 3);
  const [seq, setSeq] = React.useState([]);
  const [showIdx, setShowIdx] = React.useState(-1);
  const [stage, setStage] = React.useState("idle"); // idle|show|input
  const [input, setInput] = React.useState([]);
  const [fb, setFb] = React.useState(null);
  const [best, setBest] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const [fails, setFails] = React.useState(0);
  const [round, setRound] = React.useState(0);
  const startRef = React.useRef(0);

  const pool = c.itemType === "word" ? (c.words || []) : null;

  const genSeq = (n) => {
    if (c.itemType === "digit") {
      const out=[]; let last=-1;
      while(out.length<n){const d=_rndInt(10); if(d!==last){out.push(d);last=d;}} return out;
    }
    if (c.itemType === "word") return _sample(pool, n);
    // cell
    const total = grid[0]*grid[1]; const out=[]; let last=-1;
    while(out.length<n){const d=_rndInt(total); if(d!==last){out.push(d);last=d;}} return out;
  };

  const showSequence = (s) => {
    setStage("show"); setInput([]); setFb(null);
    let i=0;
    const step=()=>{
      if(i>=s.length){ setTimeout(()=>{ setShowIdx(-1); setStage("input"); }, 250); return; }
      setShowIdx(s[i]); i++;
      setTimeout(()=>{ setShowIdx(-1); setTimeout(step, c.gapMs||300); }, c.showMs||900);
    };
    step();
  };

  const start = () => {
    setPhase("running"); setLen(c.startLen||3); setBest(0); setScore(0); setFails(0); setRound(0);
    startRef.current = Date.now();
    const s=genSeq(c.startLen||3); setSeq(s);
    setTimeout(()=>showSequence(s), 500);
  };

  const expected = c.mode === "reverse" ? [...seq].slice().reverse() : seq;

  const submit = (arr) => {
    const ok = arr.length===expected.length && arr.every((v,i)=>v===expected[i]);
    setFb(ok?"ok":"err");
    setTimeout(()=>{
      setFb(null);
      if(ok){
        setBest(b=>Math.max(b,len)); setScore(s=>s+len*10);
        const nl=len+1;
        if(nl>(c.maxLen||9)){ finish(); return; }
        setLen(nl); setFails(0); const s=genSeq(nl); setSeq(s);
        setTimeout(()=>showSequence(s),500);
      } else {
        const f=fails+1; setFails(f);
        if(f>=2){ finish(); return; }
        const s=genSeq(len); setSeq(s); setTimeout(()=>showSequence(s),500);
      }
      setRound(r=>r+1);
    }, 650);
  };

  const finish = () => {
    setPhase("done");
    setTimeout(()=>onFinish({
      exerciseId: exercise.id, score, accuracy: best/(c.maxLen||9),
      duration: Date.now()-startRef.current, level: best,
    }), 700);
  };

  // input handlers
  const pushDigit = (d) => { const n=[...input,d]; setInput(n); };
  const clearInput = () => setInput([]);

  const isWord = c.itemType==="word", isCell=c.itemType==="cell", isDigit=c.itemType==="digit";

  return (
    <TrainingShell patient={patient} exercise={exercise} phase={phase} onAbort={onAbort}
      onSave={() => onFinish({ exerciseId: exercise.id, score, accuracy: best/(c.maxLen||9), duration: Date.now()-startRef.current, level: best })}
      metrics={phase==="running"?[
        {label:"Uzunlik", value:len, icon:"ruler", tone:"primary", mono:true},
        {label:"Eng yaxshi", value:best, icon:"award", tone:"ok", mono:true},
        {label:"Ball", value:score, icon:"star", mono:true},
      ]:null}
      intro={<TrainingIntro exercise={exercise}
        description={exercise.description}
        instructions={c.mode==="reverse"
          ? ["Ketma-ketlik ko'rsatiladi — diqqat bilan kuzating.","Endi uni TESKARI tartibda kiriting.","To'g'ri bo'lsa — uzunlik oshadi.","Bir uzunlikda 2 marta xato — yakun."]
          : ["Ketma-ketlik ko'rsatiladi — diqqat bilan kuzating.","Endi uni xuddi shu tartibda kiriting.","To'g'ri bo'lsa — uzunlik oshadi.","Bir uzunlikda 2 marta xato — yakun."]}
        duration={exercise.duration} onStart={start} />}
      body={
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:28,width:"min(560px,92vw)"}}>
          {stage==="show" && (isDigit||isWord) && (
            <div style={{width:240,height:200,borderRadius:24,background:"var(--ink)",color:"var(--bg)",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:"var(--font-sans)",fontWeight:800,
              fontSize:isWord?44:120,letterSpacing:"-0.02em",boxShadow:"var(--shadow-lg)",textAlign:"center",padding:12}}>
              {showIdx>=0 ? (isWord?pool[showIdx]:showIdx) : ""}
            </div>
          )}
          {(isCell) && (
            <CellGrid grid={grid} active={stage==="show"?showIdx:-1}
              onTap={stage==="input"?(idx)=>{const n=[...input,idx]; setInput(n); if(n.length===expected.length) submit(n);}:null}
              picked={input} fb={fb} />
          )}

          {stage==="input" && (isDigit||isWord) && (
            <>
              <div style={{fontFamily:"var(--font-sans)",fontSize:15,color:"var(--ink-2)",textAlign:"center"}}>
                {c.mode==="reverse"?<>Endi <b style={{color:"var(--accent)"}}>teskari</b> tartibda kiriting</>:<>Ko'rsatilgan tartibda kiriting</>}
                {" "}({expected.length} ta)
              </div>
              <div className="num" style={{minHeight:40,display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",
                fontFamily:"var(--font-sans)",fontWeight:700,fontSize:24,
                color: fb==="ok"?"var(--ok)":fb==="err"?"var(--err)":"var(--ink)"}}>
                {input.length? input.map((v,i)=><span key={i} style={{padding:"2px 10px",background:"var(--surface-2)",borderRadius:8}}>{isWord?pool[v]:v}</span>) : <span style={{color:"var(--ink-4)"}}>…</span>}
              </div>
              {isDigit && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,width:"100%"}}>
                  {[0,1,2,3,4,5,6,7,8,9].map(d=>(
                    <button key={d} className="num" onPointerDown={()=>pushDigit(d)} disabled={!!fb}
                      style={{height:54,borderRadius:12,border:"1px solid var(--border-strong)",background:"var(--surface)",
                        color:"var(--ink)",fontFamily:"var(--font-sans)",fontWeight:700,fontSize:22,cursor:"pointer"}}>{d}</button>
                  ))}
                </div>
              )}
              {isWord && (
                <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
                  {_sample(pool, Math.min(8, pool.length)).concat(expected.map(i=>pool[i])).filter((v,i,a)=>a.indexOf(v)===i).slice(0,9).map((w,i)=>(
                    <button key={i} onPointerDown={()=>{const idx=pool.indexOf(w); const n=[...input,idx]; setInput(n);}} disabled={!!fb}
                      style={{padding:"10px 14px",borderRadius:12,border:"1px solid var(--border-strong)",background:"var(--surface)",
                        color:"var(--ink)",fontFamily:"var(--font-sans)",fontWeight:600,fontSize:15,cursor:"pointer"}}>{w}</button>
                  ))}
                </div>
              )}
              {(isDigit||isWord) && (
                <div style={{display:"flex",gap:10}}>
                  <button className="btn btn-secondary" onPointerDown={clearInput} disabled={!!fb}>Tozalash</button>
                  <button className="btn btn-primary" onPointerDown={()=>submit(input)} disabled={!input.length||!!fb}>
                    Tasdiqlash <Icon name="check" size={16}/>
                  </button>
                </div>
              )}
            </>
          )}
          {stage==="show" && (
            <div style={{fontFamily:"var(--font-sans)",fontSize:14,color:"var(--ink-3)"}}>Eslab qoling…</div>
          )}
        </div>
      }
      doneSummary={<TrainingDone exercise={exercise} score={score} accuracy={best/(c.maxLen||9)}
        duration={Date.now()-startRef.current} level={best} onAgain={start} onBack={onAbort} />}
      hint={stage==="show"?<span>Eslab qoling…</span>:<span>Ketma-ketlikni kiriting</span>}
    />
  );
};

const CellGrid = ({ grid, active, onTap, picked, fb }) => {
  const [rows, cols] = grid;
  const cells = rows*cols;
  return (
    <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:10,width:"min(360px,80vw)"}}>
      {Array.from({length:cells}).map((_,i)=>{
        const on = active===i;
        const isPicked = picked && picked.includes(i);
        return (
          <button key={i} onPointerDown={onTap?()=>onTap(i):undefined} disabled={!onTap}
            style={{aspectRatio:"1",borderRadius:14,border:"1px solid var(--border-strong)",cursor:onTap?"pointer":"default",
              background: on?"var(--primary)":isPicked?(fb==="err"?"var(--err-bg)":"var(--primary-soft)"):"var(--surface-2)",
              boxShadow: on?"0 0 0 6px var(--primary-ring)":"none",
              transition:"background 120ms var(--ease), box-shadow 120ms var(--ease)"}} />
        );
      })}
    </div>
  );
};

// =====================================================================
// EngChoice — stimulus → pick correct option. Powers categorize, oddball,
// switch, go/nogo, word-finding, Stroop-like inhibition.
// config: {
//   rounds, timeout,
//   gen: () => ({ promptText?, promptColor?, options:[{label,correct,color?}], ruleText? })
//   genKey: string  (selects a builtin generator)
// }
// =====================================================================
const _CHOICE_GENERATORS = {
  // categorize a word into one of N categories
  category: (cfg) => () => {
    const cats = cfg.categories; // [{name, items:[...]}]
    const cat = cats[_rndInt(cats.length)];
    const item = cat.items[_rndInt(cat.items.length)];
    return {
      promptText: item,
      ruleText: "Qaysi guruhga kiradi?",
      options: cats.map(c=>({label:c.name, correct:c.name===cat.name})),
    };
  },
  // odd-one-out
  oddball: (cfg) => () => {
    const groups = cfg.groups; // [[...],[...]]
    const g = groups[_rndInt(groups.length)];
    const others = groups.filter(x=>x!==g);
    const odd = others[_rndInt(others.length)][_rndInt(3)];
    const picks = _sample(g, 3).concat(odd);
    const sh = _shuffle(picks);
    return {
      ruleText: "Ortiqcha so'zni toping",
      options: sh.map(w=>({label:w, correct:w===odd})),
    };
  },
  // synonym / antonym matching
  wordpair: (cfg) => () => {
    const p = cfg.pairs[_rndInt(cfg.pairs.length)]; // {word, match, distractors:[...]}
    const opts = _shuffle([{label:p.match,correct:true}, ...p.distractors.map(d=>({label:d,correct:false}))]);
    return { promptText: p.word, ruleText: cfg.ruleText||"Mos so'zni tanlang", options: opts };
  },
  // emotion recognition (emoji-free: text descriptions)
  emotion: (cfg) => () => {
    const e = cfg.scenarios[_rndInt(cfg.scenarios.length)]; // {text, answer, options}
    return { promptText: e.text, ruleText: "Bu qanday his-tuyg'u?",
      options: _shuffle(e.options.map(o=>({label:o, correct:o===e.answer}))) };
  },
  // Stroop-like inhibition: name the INK color, not the word
  stroop: (cfg) => () => {
    const colors = [
      {name:"Qizil",hex:"#DC2626"},{name:"Ko'k",hex:"#2563EB"},
      {name:"Yashil",hex:"#16A34A"},{name:"Sariq",hex:"#CA8A04"},
    ];
    const wi=_rndInt(colors.length); let ii; do{ii=_rndInt(colors.length);}while(ii===wi&&Math.random()<0.75);
    return { promptText: colors[wi].name.toUpperCase(), promptColor: colors[ii].hex,
      ruleText: "So'zning RANGINI tanlang", options: _shuffle(colors.map(c=>({label:c.name, correct:c.name===colors[ii].name}))) };
  },
  // mental arithmetic
  arith: (cfg) => () => {
    const ops = cfg.ops || ["+","-"];
    const op = ops[_rndInt(ops.length)];
    let a=_rndInt(cfg.max||12)+1, b=_rndInt(cfg.max||12)+1;
    if(op==="-"&&b>a){[a,b]=[b,a];}
    const ans = op==="+"?a+b: op==="-"?a-b: a*b;
    const distract = _shuffle([ans+1, ans-1, ans+2, ans-2].filter(x=>x>=0)).slice(0,3);
    return { promptText: `${a} ${op} ${b}`, ruleText: "Javobni tanlang",
      options: _shuffle([{label:String(ans),correct:true}, ...distract.map(d=>({label:String(d),correct:false}))]) };
  },
};

const EngChoice = ({ patient, exercise, onAbort, onFinish }) => {
  const c = exercise.config;
  const genFn = React.useMemo(()=> _CHOICE_GENERATORS[c.genKey](c), [exercise.id]);
  const [phase, setPhase] = React.useState("intro");
  const [idx, setIdx] = React.useState(0);
  const [trial, setTrial] = React.useState(null);
  const [fb, setFb] = React.useState(null);
  const [picked, setPicked] = React.useState(null);
  const [correct, setCorrect] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const startRef = React.useRef(0); const tRef = React.useRef(0);
  const rounds = c.rounds || 16;

  const next = () => { setTrial(genFn()); setFb(null); setPicked(null); tRef.current=Date.now(); };
  const start = () => { setPhase("running"); setIdx(0); setCorrect(0); setErrors(0); setScore(0); startRef.current=Date.now(); next(); };

  React.useEffect(()=>{
    if(phase!=="running"||!trial||fb||!c.timeout) return;
    const t=setTimeout(()=>{ setErrors(e=>e+1); setFb("timeout"); setTimeout(advance,500); }, c.timeout);
    return ()=>clearTimeout(t);
  },[phase,trial,fb]);

  const answer = (opt) => {
    if(fb) return;
    setPicked(opt.label);
    if(opt.correct){ setCorrect(x=>x+1); const rt=Date.now()-tRef.current; setScore(s=>s+30+Math.max(0,Math.round((( c.timeout||4000)-rt)/40))); setFb("ok"); }
    else { setErrors(x=>x+1); setScore(s=>Math.max(0,s-15)); setFb("err"); }
    setTimeout(advance, 480);
  };
  const advance = () => {
    const n=idx+1;
    if(n>=rounds){ setPhase("done"); setTimeout(()=>onFinish({exerciseId:exercise.id,score,accuracy:correct/(correct+errors||1),duration:Date.now()-startRef.current,level:1}),700); return; }
    setIdx(n); next();
  };

  return (
    <TrainingShell patient={patient} exercise={exercise} phase={phase} onAbort={onAbort}
      onSave={() => onFinish({ exerciseId: exercise.id, score, accuracy: correct/(correct+errors||1), duration: Date.now()-startRef.current, level: 1 })}
      metrics={phase==="running"?[
        {label:"Savol", value:`${idx+1}/${rounds}`, icon:"list", mono:true},
        {label:"To'g'ri", value:correct, icon:"check", tone:"ok", mono:true},
        {label:"Ball", value:score, icon:"star", mono:true},
      ]:null}
      intro={<TrainingIntro exercise={exercise} description={exercise.description}
        instructions={c.instructions||["Ekrandagi vazifani diqqat bilan o'qing.","To'g'ri javobni tanlang.","Tez va aniq javob bering.",`Jami ${rounds} ta savol.`]}
        duration={exercise.duration} onStart={start} />}
      body={trial && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:24,width:"min(620px,94vw)"}}>
          {trial.ruleText && <div className="pill primary">{trial.ruleText}</div>}
          {trial.promptText && (
            <div className="ktt-no-select" style={{minWidth:"min(440px,90vw)",minHeight:150,padding:"24px 28px",
              background:"var(--surface)",borderRadius:22,display:"flex",alignItems:"center",justifyContent:"center",
              border: fb==="ok"?"3px solid var(--ok)":fb==="err"?"3px solid var(--err)":fb==="timeout"?"3px solid var(--warn)":"1px solid var(--border)",
              boxShadow:"var(--shadow-md)",transition:"border-color 120ms var(--ease)",textAlign:"center",
              fontFamily:"var(--font-sans)",fontWeight:800,fontSize:"clamp(28px,6vw,52px)",letterSpacing:"-0.02em",
              color: trial.promptColor||"var(--ink)"}}>
              {trial.promptText}
            </div>
          )}
          <div className="ktt-answers" style={{display:"flex",flexWrap:"wrap",gap:12,justifyContent:"center",width:"100%"}}>
            {trial.options.map((o,i)=>{
              const isPicked = picked === o.label;
              const showWrong = fb && isPicked && !o.correct;
              return (
              <button key={i} onPointerDown={()=>answer(o)} disabled={!!fb}
                style={{flex:"1 1 40%",minWidth:120,minHeight:60,padding:"0 18px",borderRadius:14,
                  border: showWrong?"2px solid var(--err)":(fb&&o.correct)?"2px solid var(--ok)":"1px solid var(--border-strong)",
                  background: showWrong?"var(--err-bg)":(fb && o.correct)?"var(--ok-bg)":"var(--surface)",
                  color:o.color||"var(--ink)",fontFamily:"var(--font-sans)",fontWeight:700,fontSize:17,cursor:fb?"default":"pointer",
                  boxShadow:"var(--shadow-xs)",transition:"background 120ms var(--ease), border-color 120ms var(--ease)"}}>{o.label}</button>
              );
            })}
          </div>
        </div>
      )}
      doneSummary={<TrainingDone exercise={exercise} score={score} accuracy={correct/(correct+errors||1)}
        duration={Date.now()-startRef.current} onAgain={start} onBack={onAbort} />}
      hint={<span>To'g'ri javobni tanlang</span>}
    />
  );
};

window.EngSequence = EngSequence;
window.EngChoice = EngChoice;
