// Config-driven cognitive training engines (extra set).
// Exposed: EngMatch, EngAudio, EngBreathe, EngGridFind
// Signature: ({ patient, exercise, onAbort, onFinish }) reading exercise.config.

const _sh = (a)=>{const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};
const _ri = (n)=>Math.floor(Math.random()*n);

// =====================================================================
// EngMatch — memory pair-matching (concentration). Flip cards, find pairs.
// config: { pairs: number, items: [...labels], rounds? }
// =====================================================================
const EngMatch = ({ patient, exercise, onAbort, onFinish }) => {
  const c = exercise.config;
  const nPairs = c.pairs || 6;
  const [phase, setPhase] = React.useState("intro");
  const [cards, setCards] = React.useState([]);
  const [flipped, setFlipped] = React.useState([]);
  const [matched, setMatched] = React.useState([]);
  const [moves, setMoves] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const startRef = React.useRef(0);
  const lockRef = React.useRef(false);

  const build = () => {
    const items = _sh(c.items).slice(0, nPairs);
    const deck = _sh(items.flatMap((label, i) => ([
      { id: i*2, pair: i, label }, { id: i*2+1, pair: i, label },
    ])));
    setCards(deck); setFlipped([]); setMatched([]); setMoves(0); setScore(0);
  };
  const start = () => { setPhase("running"); build(); startRef.current=Date.now(); };

  const flip = (idx) => {
    if(lockRef.current) return;
    if(flipped.includes(idx)||matched.includes(cards[idx].pair)) return;
    const nf=[...flipped, idx];
    setFlipped(nf);
    if(nf.length===2){
      setMoves(m=>m+1); lockRef.current=true;
      const [a,b]=nf;
      if(cards[a].pair===cards[b].pair){
        setTimeout(()=>{
          const nm=[...matched, cards[a].pair]; setMatched(nm); setFlipped([]); setScore(s=>s+20); lockRef.current=false;
          if(nm.length===nPairs){
            setPhase("done");
            setTimeout(()=>onFinish({exerciseId:exercise.id,score:score+20,
              accuracy: nPairs/Math.max(nPairs,moves+1), duration:Date.now()-startRef.current, level:nPairs}),700);
          }
        }, 450);
      } else {
        setScore(s=>Math.max(0,s-4));
        setTimeout(()=>{ setFlipped([]); lockRef.current=false; }, 800);
      }
    }
  };

  const cols = nPairs<=6?4:nPairs<=8?4:6;

  return (
    <TrainingShell patient={patient} exercise={exercise} phase={phase} onAbort={onAbort}
      onSave={()=>onFinish({exerciseId:exercise.id,score,accuracy:matched.length/Math.max(1,nPairs),duration:Date.now()-startRef.current,level:matched.length})}
      metrics={phase==="running"?[
        {label:"Juftlar", value:`${matched.length}/${nPairs}`, icon:"copy", tone:"primary", mono:true},
        {label:"Yurishlar", value:moves, icon:"move", mono:true},
        {label:"Ball", value:score, icon:"star", mono:true},
      ]:null}
      intro={<TrainingIntro exercise={exercise} description={exercise.description}
        instructions={["Kartochkalar yashirin. Bittasini bosib oching.","Ikkinchisini bosib, juftini toping.","Mos kelsa — ochiq qoladi.","Barcha juftlarni eng kam yurishda toping."]}
        duration={exercise.duration} onStart={start} />}
      body={
        <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:10,width:"min(520px,92vw)"}}>
          {cards.map((card,idx)=>{
            const open = flipped.includes(idx)||matched.includes(card.pair);
            return (
              <button key={card.id} onPointerDown={()=>flip(idx)}
                style={{aspectRatio:"3/4",borderRadius:14,cursor:"pointer",border:"1px solid var(--border-strong)",
                  background: open?"var(--primary-soft)":"var(--ink)",
                  color: open?"var(--primary-press)":"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:"var(--font-sans)",fontWeight:700,fontSize:"clamp(13px,3.5vw,20px)",textAlign:"center",padding:4,
                  boxShadow: matched.includes(card.pair)?"0 0 0 3px var(--ok)":"var(--shadow-xs)",
                  transition:"background 200ms var(--ease), box-shadow 200ms var(--ease)"}}>
                {open?card.label:""}
              </button>
            );
          })}
        </div>
      }
      doneSummary={<TrainingDone exercise={exercise} score={score} accuracy={nPairs/Math.max(nPairs,moves)}
        duration={Date.now()-startRef.current} level={nPairs} onAgain={start} onBack={onAbort} />}
      hint={<span>Juftlarni toping</span>}
    />
  );
};

// =====================================================================
// EngAudio — auditory gnosis. Play tone/sequence, identify.
// config: { mode:"pitch"|"count"|"sequence", rounds, tones?:[{name,freq}] }
// =====================================================================
const _playTone = (freq, dur=600) => {
  try{
    const ctx = window.__audioCtx || (window.__audioCtx = new (window.AudioContext||window.webkitAudioContext)());
    if(ctx.state==="suspended") ctx.resume();
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type="sine"; o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18,ctx.currentTime+0.04);
    g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+dur/1000);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+dur/1000+0.05);
  }catch(e){}
};

const EngAudio = ({ patient, exercise, onAbort, onFinish }) => {
  const c = exercise.config;
  const TONES = c.tones || [{name:"Past",freq:220},{name:"O'rta",freq:440},{name:"Baland",freq:880},{name:"Tepa",freq:1320}];
  const rounds = c.rounds || 20;
  const [phase, setPhase] = React.useState("intro");
  const [idx, setIdx] = React.useState(0);
  const [played, setPlayed] = React.useState(false);
  const [fb, setFb] = React.useState(null);
  const [correct, setCorrect] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [score, setScore] = React.useState(0);
  const startRef = React.useRef(0);
  const answerRef = React.useRef(null);

  const setup = () => {
    if(c.mode==="count"){
      const n=1+_ri(4);
      answerRef.current = n;
      return { count:n };
    }
    if(c.mode==="sequence"){
      const len=2+_ri(2);
      const seq=Array.from({length:len},()=>_ri(TONES.length));
      answerRef.current = seq;
      return { seq };
    }
    const t=_ri(TONES.length); answerRef.current=t; return { tone:t };
  };
  const [cur, setCur] = React.useState(null);

  const playCurrent = (data=cur) => {
    if(!data) return;
    if(c.mode==="count"){ let i=0; const beep=()=>{ if(i>=data.count) return; _playTone(660,200); i++; setTimeout(beep,360);}; beep(); }
    else if(c.mode==="sequence"){ let i=0; const beep=()=>{ if(i>=data.seq.length) return; _playTone(TONES[data.seq[i]].freq,420); i++; setTimeout(beep,520);}; beep(); }
    else { _playTone(TONES[data.tone].freq, 700); }
    setPlayed(true);
  };

  React.useEffect(()=>{
    if(phase!=="running") return;
    setPlayed(false); setFb(null);
    const t=setTimeout(()=>playCurrent(), 400);
    return ()=>clearTimeout(t);
  },[phase, idx]);

  const start = () => { setPhase("running"); setIdx(0); setCorrect(0); setErrors(0); setScore(0); startRef.current=Date.now(); const d=setup(); setCur(d); };

  const judge = (ok) => {
    if(ok){ setCorrect(x=>x+1); setScore(s=>s+25); setFb("ok"); }
    else { setErrors(x=>x+1); setFb("err"); }
    setTimeout(()=>{
      const n=idx+1;
      if(n>=rounds){ setPhase("done"); setTimeout(()=>onFinish({exerciseId:exercise.id,score,accuracy:correct/(correct+errors||1),duration:Date.now()-startRef.current,level:1}),700); return; }
      setIdx(n); const d=setup(); setCur(d);
    }, 480);
  };

  const answerPitch = (i)=> judge(i===answerRef.current);
  const answerCount = (n)=> judge(n===answerRef.current);
  const answerSeq = (arr)=> judge(arr.length===answerRef.current.length && arr.every((v,i)=>v===answerRef.current[i]));
  const [seqInput, setSeqInput] = React.useState([]);
  React.useEffect(()=>{ setSeqInput([]); },[idx]);

  return (
    <TrainingShell patient={patient} exercise={exercise} phase={phase} onAbort={onAbort}
      onSave={()=>onFinish({exerciseId:exercise.id,score,accuracy:correct/(correct+errors||1),duration:Date.now()-startRef.current,level:1})}
      metrics={phase==="running"?[
        {label:"Savol", value:`${idx+1}/${rounds}`, icon:"list", mono:true},
        {label:"To'g'ri", value:correct, icon:"check", tone:"ok", mono:true},
        {label:"Ball", value:score, icon:"star", mono:true},
      ]:null}
      intro={<TrainingIntro exercise={exercise} description={exercise.description}
        instructions={["Quloqchin yoki dinamikni ulang.","Tovush yangraydi — diqqat bilan tinglang.","Kerak bo'lsa qayta tinglang.",
          c.mode==="count"?"Nechta signal eshitganingizni tanlang.":c.mode==="sequence"?"Tovushlar ketma-ketligini takrorlang.":"Qaysi balandlikdagi tovush ekanini tanlang."]}
        duration={exercise.duration} onStart={start} />}
      body={
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:32}}>
          <button onPointerDown={()=>playCurrent()} className="ktt-no-select"
            style={{width:200,height:200,borderRadius:999,
              background: fb==="ok"?"var(--ok-bg)":fb==="err"?"var(--err-bg)":played?"var(--primary-soft)":"var(--surface)",
              border:"2px solid "+(played?"var(--primary)":"var(--border-strong)"),
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",boxShadow:"var(--shadow-md)"}}>
            <Icon name={played?"volume-2":"headphones"} size={64} style={{color:played?"var(--primary-press)":"var(--ink-3)"}}/>
            <span style={{fontFamily:"var(--font-sans)",fontWeight:600,fontSize:13,color:"var(--ink-3)"}}>{played?"Qayta tinglash":"Tinglash"}</span>
          </button>

          {c.mode==="pitch" && (
            <div className="ktt-answers" style={{display:"flex",gap:12,width:"min(560px,92vw)",justifyContent:"center"}}>
              {TONES.map((t,i)=>(
                <button key={i} onPointerDown={()=>answerPitch(i)} disabled={!played||!!fb}
                  style={{flex:1,minWidth:0,height:84,borderRadius:16,border:"1px solid var(--border-strong)",background:"var(--surface)",
                    color:"var(--ink)",fontFamily:"var(--font-sans)",fontWeight:600,fontSize:16,opacity:!played||fb?0.5:1,
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer"}}>
                  <span>{t.name}</span><span className="num" style={{fontSize:11.5,color:"var(--ink-3)"}}>{t.freq} Hz</span>
                </button>
              ))}
            </div>
          )}
          {c.mode==="count" && (
            <div className="ktt-answers" style={{display:"flex",gap:12}}>
              {[1,2,3,4].map(n=>(
                <button key={n} className="num" onPointerDown={()=>answerCount(n)} disabled={!played||!!fb}
                  style={{width:72,height:72,borderRadius:16,border:"1px solid var(--border-strong)",background:"var(--surface)",
                    color:"var(--ink)",fontWeight:800,fontSize:28,opacity:!played||fb?0.5:1,cursor:"pointer"}}>{n}</button>
              ))}
            </div>
          )}
          {c.mode==="sequence" && (
            <div style={{display:"flex",flexDirection:"column",gap:14,alignItems:"center"}}>
              <div className="num" style={{minHeight:30,display:"flex",gap:6,fontFamily:"var(--font-sans)",fontWeight:700,color:"var(--ink)"}}>
                {seqInput.length?seqInput.map((v,i)=><span key={i} style={{padding:"2px 8px",background:"var(--surface-2)",borderRadius:6}}>{TONES[v].name}</span>):<span style={{color:"var(--ink-4)"}}>…</span>}
              </div>
              <div className="ktt-answers" style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
                {TONES.map((t,i)=>(
                  <button key={i} onPointerDown={()=>{const n=[...seqInput,i];setSeqInput(n); if(n.length===answerRef.current.length) answerSeq(n);}} disabled={!played||!!fb}
                    style={{padding:"12px 16px",borderRadius:14,border:"1px solid var(--border-strong)",background:"var(--surface)",
                      color:"var(--ink)",fontFamily:"var(--font-sans)",fontWeight:600,fontSize:15,opacity:!played||fb?0.5:1,cursor:"pointer"}}>{t.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      }
      doneSummary={<TrainingDone exercise={exercise} score={score} accuracy={correct/(correct+errors||1)}
        duration={Date.now()-startRef.current} onAgain={start} onBack={onAbort} />}
      hint={<span>Tovushni tinglab, javob bering</span>}
    />
  );
};

// =====================================================================
// EngBreathe — emotional regulation: paced breathing + relaxation rounds.
// config: { cycles, inhale, hold, exhale }  (seconds)
// =====================================================================
const EngBreathe = ({ patient, exercise, onAbort, onFinish }) => {
  const c = exercise.config;
  const cycles = c.cycles || 6;
  const IN=c.inhale||4, HOLD=c.hold||4, OUT=c.exhale||6;
  const [phase, setPhase] = React.useState("intro");
  const [cycle, setCycle] = React.useState(0);
  const [stage, setStage] = React.useState("in"); // in|hold|out
  const [t, setT] = React.useState(0);
  const startRef = React.useRef(0);
  const rafRef = React.useRef(0);

  const start = () => { setPhase("running"); setCycle(0); setStage("in"); setT(0); startRef.current=Date.now(); };

  React.useEffect(()=>{
    if(phase!=="running") return;
    let last=Date.now(); let st="in"; let acc=0; let cy=0;
    const dur={in:IN,hold:HOLD,out:OUT};
    const loop=()=>{
      const now=Date.now(); acc+=(now-last)/1000; last=now;
      if(acc>=dur[st]){
        acc=0;
        st = st==="in"?"hold":st==="hold"?"out":"in";
        if(st==="in"){ cy++; setCycle(cy); if(cy>=cycles){ finish(); return; } }
        setStage(st);
      }
      setT(acc);
      rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[phase]);

  const finish = () => {
    cancelAnimationFrame(rafRef.current);
    setPhase("done");
    setTimeout(()=>onFinish({exerciseId:exercise.id,score:cycles*15,accuracy:1,duration:Date.now()-startRef.current,level:cycles}),700);
  };

  const dur = stage==="in"?IN:stage==="hold"?HOLD:OUT;
  const frac = Math.min(1, t/dur);
  const scale = stage==="in"? 0.5+frac*0.5 : stage==="out"? 1-frac*0.5 : 1;
  const label = stage==="in"?"Nafas oling":stage==="hold"?"Ushlab turing":"Nafas chiqaring";
  const col = stage==="in"?"var(--primary)":stage==="hold"?"var(--accent)":"var(--info)";

  return (
    <TrainingShell patient={patient} exercise={exercise} phase={phase} onAbort={onAbort}
      onSave={()=>onFinish({exerciseId:exercise.id,score:cycle*15,accuracy:1,duration:Date.now()-startRef.current,level:cycle})}
      metrics={phase==="running"?[
        {label:"Sikl", value:`${cycle+1}/${cycles}`, icon:"repeat", tone:"primary", mono:true},
        {label:"Bosqich", value:label, icon:"wind"},
      ]:null}
      intro={<TrainingIntro exercise={exercise} description={exercise.description}
        instructions={["Qulay o'tiring, yelkangizni bo'shashtiring.","Doira kengayganda — burun orqali nafas oling.","To'xtaganda — nafasni ushlab turing.","Kichrayganda — sekin nafas chiqaring."]}
        duration={exercise.duration} onStart={start} />}
      body={
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:36}}>
          <div style={{position:"relative",width:280,height:280,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{position:"absolute",width:280,height:280,borderRadius:999,border:"2px dashed var(--border-strong)"}} />
            <div style={{width:280,height:280,borderRadius:999,background:col,opacity:0.18,
              transform:`scale(${scale})`,transition:"transform 80ms linear, background 400ms var(--ease)"}} />
            <div style={{position:"absolute",width:140,height:140,borderRadius:999,background:col,opacity:0.85,
              transform:`scale(${scale})`,transition:"transform 80ms linear, background 400ms var(--ease)",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span className="num" style={{color:"#fff",fontFamily:"var(--font-sans)",fontWeight:800,fontSize:34}}>{Math.ceil(dur-t)}</span>
            </div>
          </div>
          <div style={{fontFamily:"var(--font-sans)",fontWeight:700,fontSize:24,color:col,letterSpacing:"-0.01em"}}>{label}</div>
        </div>
      }
      doneSummary={<TrainingDone exercise={exercise} score={cycles*15} accuracy={1}
        duration={Date.now()-startRef.current} level={cycles} onAgain={start} onBack={onAbort} />}
      hint={<span>Doira bilan birga nafas oling</span>}
    />
  );
};

window.EngMatch = EngMatch;
window.EngAudio = EngAudio;
window.EngBreathe = EngBreathe;
