"use client";


import {
  useState, useEffect, useRef, useCallback,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
} from "react";
import CheckbulbIcon from "./icons/CheckbulbIcon";
import CircuitIcon   from "./icons/CircuitIcon";
import PCBIcon       from "./icons/PCBIcon";
import CodeIcon      from "./icons/CodeIcon";
import DesignIcon    from "./icons/DesignIcon";
import ClipboardIcon from "./icons/ClipboardIcon";
import QualityIcon   from "./icons/QualityIcon";

/* CONFIG */
const CFG = {
  autoAdvance  : true,
  intervalMs   : 5000,
  entranceMs   : 600,
  ease         : "700ms cubic-bezier(0.2,0,0,1)",

  red          : "#FF0000",
  redDark      : "#910000",
  redGradEnd   : "rgb(207,207,207)",
  black        : "#000000",
  ink          : "#191919",
  inkFaint     : "rgba(25,25,25,0.42)",
  white        : "#ffffff",

  /* typography — clamp(floor, vw@1280, cap) */

  fontTitle      : ["22px", "2.188vw", "36px"]  as const,
  fontHeading    : ["22px", "1.875vw", "36px"]  as const,
  fontBody       : ["20px", "1.719vw", "28px"]  as const,
  fontPillActive : ["12px", "1.328vw", "18px"]  as const,
  fontPillIdle   : ["10px",  "1.016vw", "18px"]  as const,
  fontPhase      : ["10px",  "1.094vw", "18px"]  as const,
  iconSize       : ["64px", "3.75vw",  "1px"]  as const,

  /* card */
  cardBorderRadius : 10.8,
  cardBorder       : "2.7px solid rgba(255,255,255,0.2)",
  cardShadowActive : "0 8px 32px 0 rgba(0,0,0,0.28), inset 0 1px 0 0 rgba(255,255,255,0.08)",
  cardShadowIdle   : "0 4px 16px 0 rgba(0,0,0,0.18)",
  cardPlaceholder  : "#DCDCDC",
  inactiveOpacity  : 0.42,
  farOpacity       : 0.14,
  inactiveScale    : 0.965,

  /* rake light */
  rakeOpacity  : 0.12,
  rakeRadius   : 180,

  /* carousel */
  cardRatioDesktop : 0.58,
  cardRatioTablet  : 0.72,
  cardRatioPhone   : 0.88,
  gapRatioDesktop  : 0.022,
  gapRatioTablet   : 0.024,
  gapRatioPhone    : 0.04,

  /* pills */
  pillHeightIdle   : ["38px", "4vw",   "54px"] as const,
  pillHeightActive : ["48px", "5vw",   "66px"] as const,
  pillPadH         : ["6px",  "0.8vw", "10px"] as const,
  pillPadB         : ["6px",  "0.8vw", "10px"] as const,
  pillGap          : ["1px",  "0.2vw", "3px"]  as const,
  pillRadius       : ["1px",  "0.2vw", "2px"]  as const,

  /* horizontal inset — CSS var --ctm-hpad */
  hPadMin : 10,
  hPadVw  : 2.5,
  hPadMax : 40,

  /* stepperWidth — fraction of section width */
  stepperWidth : 1.0,

  /*  TRAIL  */
  trailVBW        : 1259,    /* SVG viewBox width  */
  trailVBH        : 22,      /* SVG viewBox height — FIXED rendered px height */
  trailLineY      : 16,      /* y where flat line starts in viewBox */
  trailArrowBase  : 1213.85, /* x where arrow base starts */
  trailArrowTip   : 1216.77, /* x of arrow spike top */
  

  trailFeatherPct : 0.6,     /* fraction of one dot-gap for the feather gradient */

  /* dots */
  dotD      : ["10px", "1vw", "24px"] as const,
  dotBorder : ["1px", "0.15vw", "4px"] as const,

  /* phase strip */
  phaseStripBg : "#EBEBEB",
  phaseH       : 34,

  /* background texture */
  bgDotOpacity : 0.032,
  bgDotSpacing : 28,
  bgDotSize    : 1,
} as const;

const cl = (t: readonly [string,string,string]) => `clamp(${t[0]},${t[1]},${t[2]})`;

/* Arrow fraction — the % of total SVG width occupied by the arrowhead */
const ARROW_FRAC = (CFG.trailVBW - CFG.trailArrowBase) / CFG.trailVBW; /* 0.035862 */
const ARROW_PCT  = `${(ARROW_FRAC * 100).toFixed(4)}%`;  /* "3.5862%" */

/* Full trail path — used for both grey base and red fill (clipped) */
const TRAIL_PATH = `M${CFG.trailArrowTip} 0 L${CFG.trailVBW} ${CFG.trailVBH} H0 V${CFG.trailLineY} H${CFG.trailArrowBase} L${CFG.trailArrowTip} 0 Z`;

/* BREAKPOINTS */
type BP = "desktop"|"tablet"|"phone";
const getBP = (w:number):BP => w>=1280?"desktop":w>=810?"tablet":"phone";

/*  KEYFRAMES  ═*/
const KF = `
@keyframes ctm-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes ctm-in{from{opacity:0}to{opacity:1}}
@media(prefers-reduced-motion:reduce){.ctm-t,.ctm-c,.ctm-s{animation:none!important;opacity:1!important}}
`;
function useKF(){
  useEffect(()=>{
    if(document.getElementById("ctm-kf"))return;
    const el=document.createElement("style");
    el.id="ctm-kf";el.textContent=KF;
    document.head.appendChild(el);
  },[]);
}

/*  DATA */
type Phase="CVD"|"EVT"|"DVT"|"PVT";
type Stage={id:string;pill:string;heading:string;body:string;Icon:ComponentType<{className?:string}>;media?:string;phase:Phase};

const STAGES:Stage[]=[
  {id:"cv", pill:"Concept Validation",heading:"Concept Validation",
   body:"From idea to defendable spec: feasibility studies, system architecture, product specification.",
   Icon:CheckbulbIcon,media:"https://framerusercontent.com/assets/T37zx5wYoF864LLeah9hwj2lUNk.mp4",phase:"CVD"},
  {id:"hd", pill:"Hardware Development",heading:"Hardware Development",
   body:"High-level and low-level design, component engineering, board bring-up & testing.",
   Icon:CircuitIcon,media:"https://framerusercontent.com/assets/zQiDSY49IC5ohPtYlQt207jEpA0.mp4",phase:"EVT"},
  {id:"pcb",pill:"PCB Design",heading:"PCB Design",
   body:"Multi-layer layouts, signal & power integrity, design-for-manufacturability.",
   Icon:PCBIcon,media:"https://framerusercontent.com/assets/zQiDSY49IC5ohPtYlQt207jEpA0.mp4",phase:"EVT"},
  {id:"sw", pill:"Firmware & SW Development",heading:"Firmware & SW Development",
   body:"Firmware, drivers / BSP and cross-platform application development.",
   Icon:CodeIcon,media:"https://framerusercontent.com/assets/zQiDSY49IC5ohPtYlQt207jEpA0.mp4",phase:"EVT"},
  {id:"mid",pill:"Mechanical and ID",heading:"Mech and Industrial Design",
   body:"Enclosure design, UI/UX and CMF, the experience the user actually holds.",
   Icon:DesignIcon,media:"https://framerusercontent.com/assets/zQiDSY49IC5ohPtYlQt207jEpA0.mp4",phase:"EVT"},
  {id:"cmp",pill:"Validation & Compliance",heading:"Validation & Compliance",
   body:"Compliance certification (FCC / UL / CE), vendor audits and test-jig development.",
   Icon:ClipboardIcon,media:"https://framerusercontent.com/assets/d5TbJNs9wSu60hFl9QDQv7eXgr0.mp4",phase:"DVT"},
  {id:"val",pill:"Production Validation",heading:"Production Validation",
   body:"Manufacturing coordination and production testing, built at scale, shipped with confidence.",
   Icon:QualityIcon,media:"https://framerusercontent.com/assets/LQwD6gGvPIlcHemMODDhWlQuBPI.mp4",phase:"PVT"},
];

const PHASES:{key:Phase;span:number}[]=[
  {key:"CVD",span:1},{key:"EVT",span:4},{key:"DVT",span:1},{key:"PVT",span:1}
];

const N=STAGES.length;
const VBW=CFG.trailVBW;
const VBH=CFG.trailVBH;

const DOT_BG=`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${CFG.bgDotSpacing}' height='${CFG.bgDotSpacing}'%3E%3Ccircle cx='${CFG.bgDotSize}' cy='${CFG.bgDotSize}' r='${CFG.bgDotSize}' fill='rgba(0,0,0,${CFG.bgDotOpacity})'/%3E%3C/svg%3E")`;

/* HOOKS */
function useRakeLight(enabled:boolean){
  const [lt,setLt]=useState({x:0,y:0,on:false});
  const ref=useRef<HTMLDivElement>(null);
  const mv=useCallback((e:ReactMouseEvent<HTMLDivElement>)=>{
    if(!enabled||!ref.current)return;
    const r=ref.current.getBoundingClientRect();
    setLt({x:e.clientX-r.left,y:e.clientY-r.top,on:true});
  },[enabled]);
  const ml=useCallback(()=>setLt(s=>({...s,on:false})),[]);
  return{ref,lt,mv,ml};
}

/*  COMPONENT */
export default function ConceptToManufacturing(){
  const [active,setActive]=useState(0);
  const [paused,setPaused]=useState(false);
  const [secW,setSecW]=useState(0);
  const sectionRef=useRef<HTMLElement>(null);
  useKF();

  useEffect(()=>{
    const el=sectionRef.current;if(!el)return;
    const ro=new ResizeObserver(()=>setSecW(el.offsetWidth));
    ro.observe(el);setSecW(el.offsetWidth);
    return()=>ro.disconnect();
  },[]);

  useEffect(()=>{
    if(!CFG.autoAdvance||paused)return;
    const t=setTimeout(()=>setActive(p=>(p+1)%N),CFG.intervalMs);
    return()=>clearTimeout(t);
  },[paused,active]);

  const goTo=useCallback((i:number)=>setActive(i),[]);
  const bp=getBP(secW);

  /* carousel */
  const cR=bp==="phone"?CFG.cardRatioPhone:bp==="tablet"?CFG.cardRatioTablet:CFG.cardRatioDesktop;
  const gR=bp==="phone"?CFG.gapRatioPhone:bp==="tablet"?CFG.gapRatioTablet:CFG.gapRatioDesktop;
  const cardW=secW*cR;
  const gap=secW*gR;
  const tx=(secW-cardW)/2-active*(cardW+gap);

  /* trail */
  const activePhase=STAGES[active].phase;
  const atLast=active===N-1;

  const solidX   = (active+0.5)/N * CFG.trailArrowBase;
  const featherW = (CFG.trailArrowBase/N) * CFG.trailFeatherPct;


  const pillPhaseRight = ARROW_PCT;

  const PH_IN = cl(CFG.pillHeightIdle);
  const PH_AC = cl(CFG.pillHeightActive);

  const D=CFG.entranceMs;
  const aT={animation:`ctm-up ${D*.5}ms ease both`};
  const aC={animation:`ctm-in ${D*.6}ms ${D*.2}ms ease both`};
  const aS={animation:`ctm-up ${D*.5}ms ${D*.4}ms ease both`};

  return(
    <section
      ref={sectionRef}
      onMouseEnter={()=>setPaused(true)}
      onMouseLeave={()=>setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Concept to Manufacturing stages"
      style={{
        position:"relative",display:"flex",flexDirection:"column",
        width:"100%",height:"95vh",minHeight:560,overflow:"hidden",
        background:`${CFG.white} ${DOT_BG}`,
        backgroundSize:`${CFG.bgDotSpacing}px ${CFG.bgDotSpacing}px`,
        fontFamily:"var(--font-oxanium,'Oxanium',sans-serif)",
        color:CFG.ink,userSelect:"none",WebkitUserSelect:"none",
        "--ctm-hpad":`clamp(${CFG.hPadMin}px,${CFG.hPadVw}vw,${CFG.hPadMax}px)`,
      } as React.CSSProperties}
    >

      {/* TITLE */}
      <h2 className="ctm-t" style={{
        ...aT,flexShrink:0,margin:0,
        paddingTop:"clamp(16px,2.5vh,32px)",
        paddingBottom:"clamp(16px,2.5vh,32px)",
        textAlign:"center",fontSize:cl(CFG.fontTitle),
        fontWeight:600,textTransform:"uppercase",
        letterSpacing:"0.01em",color:CFG.black,
      }}>
        Concept to Manufacturing
      </h2>

      {/* CAROUSEL */}
      <div className="ctm-c" style={{
        ...aC,position:"relative",flex:"1 1 0",minHeight:0,
        overflowX:"hidden",overflowY:"visible",
      }}>
        <div aria-hidden style={{
          position:"absolute",inset:0,pointerEvents:"none",zIndex:0,
          background:"linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(237,237,237,0.70) 47.73%,rgba(255,255,255,0) 100%)",
        }}/>
        <div style={{
          position:"absolute",top:0,bottom:0,left:0,
          display:"flex",alignItems:"center",gap,
          transform:secW?`translateX(${tx}px)`:undefined,
          transition:secW?`transform ${CFG.ease}`:"none",
          willChange:"transform",zIndex:1,
        }}>
          {STAGES.map((s,i)=>{
            const isActive=i===active;
            const dist=Math.abs(i-active);
            const opacity=isActive?1:dist===1?CFG.inactiveOpacity:CFG.farOpacity;
            const scale=isActive?1:CFG.inactiveScale;
            return(
              <CardSlide key={s.id} stage={s} isActive={isActive}
                opacity={opacity} scale={scale} cardW={cardW} bp={bp}
                onClick={()=>!isActive&&goTo(i)}/>
            );
          })}
        </div>
      </div>

      {/* STEPPER */}
      <div className="ctm-s" style={{...aS,flexShrink:0}}>
        {bp!=="phone"?(

          <div style={{
            width:`${CFG.stepperWidth*100}%`,margin:"0 auto",
            paddingLeft:"var(--ctm-hpad)",paddingRight:"var(--ctm-hpad)",
          }}>

            {/* ── PILLS ────────────────────────────────────────────────
                paddingRight = ARROW_PCT so pill columns stop at line end.
                Same 1fr as dots below = perfect centre alignment.       */}
            <div style={{
              display:"grid",gridTemplateColumns:`repeat(${N},1fr)`,
              gap: `0 ${cl(CFG.pillGap)}`,alignItems:"end",height:PH_AC,
              paddingRight:pillPhaseRight,
            }}>
              {STAGES.map((s,i)=>{
                const isActive=i===active;
                return(
                  <button key={`pill-${s.id}`}
                    onClick={()=>goTo(i)} onMouseEnter={()=>goTo(i)}
                    aria-current={isActive?"step":undefined}
                    style={{
                      height:isActive?PH_AC:PH_IN,alignSelf:"end",
                      padding: `0 ${cl(CFG.pillPadH)} ${cl(CFG.pillPadB)}`,
                      display:"flex",alignItems:"flex-end",
                      background:isActive
                        ?"linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0) 55%) #000"
                        :"linear-gradient(111deg,rgba(217,217,217,0.22) 0%,rgba(217,217,217,0.55) 48.8%,rgba(217,217,217,0.22) 100%)",
                      boxShadow:isActive?"inset 0 1px 0 0 rgba(255,255,255,0.14)":"none",
                      color:isActive?CFG.white:CFG.ink,
                      fontSize:cl(isActive?CFG.fontPillActive:CFG.fontPillIdle),
                      fontWeight:600,fontFamily:"inherit",
                      textTransform:"uppercase",lineHeight:1.25,textAlign:"left",
                      borderRadius: cl(CFG.pillRadius),border:"none",cursor:"pointer",
                      transition:"background 280ms ease,color 280ms ease,height 280ms ease,box-shadow 280ms ease",
                      minWidth:0,overflow:"hidden",boxSizing:"border-box",
                    }}
                  >{s.pill}</button>
                );
              })}
            </div>

       
            <div style={{position:"relative",marginTop:3}}>

    
              <svg
                aria-hidden
                viewBox={`0 0 ${VBW} ${VBH}`}
                preserveAspectRatio="none"
                style={{display:"block",width:"100%",height:VBH}}
              >
                <defs>
                  {/* Clip everything to the exact trail shape */}
                  <clipPath id="ctm-clip">
                    <path d={TRAIL_PATH}/>
                  </clipPath>
                  {/* Feather gradient: red → grey (applied to feather rect) */}
                  <linearGradient id="ctm-feather-g" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor={CFG.red}/>
                    <stop offset="100%" stopColor={CFG.redGradEnd}/>
                  </linearGradient>
                </defs>

                {/* 1. Grey base — full shape */}
                <path d={TRAIL_PATH} fill={CFG.redGradEnd}/>

                {/* 2. Solid red fill — width in viewBox coords, CSS-transitions */}
                <rect
                  x={0} y={0} width={solidX} height={VBH}
                  fill={CFG.red}
                  clipPath="url(#ctm-clip)"
                  style={{transition:`width ${CFG.ease}`}}
                />

                {/* 3. Feather — x in viewBox coords, CSS transition on x property */}
                <rect
                  x={solidX} y={0} width={featherW} height={VBH}
                  fill="url(#ctm-feather-g)"
                  clipPath="url(#ctm-clip)"
                  style={{transition:`x ${CFG.ease}`}}
                />
              </svg>

              {/* DOTS — HTML grid, right=ARROW_PCT stops them at line end */}
              <div style={{
                position:"absolute",top:0,left:0,
                right:ARROW_PCT,
                height:VBH,
                display:"grid",gridTemplateColumns:`repeat(${N},1fr)`,
                gap: `0 ${cl(CFG.pillGap)}`,
              }}>
                {STAGES.map((s,i)=>{
                  const done=i<=active,current=i===active;
                  return(
                    <button key={`dot-${s.id}`}
                      onClick={()=>goTo(i)} onMouseEnter={()=>goTo(i)}
                      aria-label={`Go to ${s.pill}`}
                      style={{
                        display:"flex",alignItems:"flex-start",justifyContent:"center",
                        background:"none",border:"none",cursor:"pointer",
                        padding:0,paddingTop:13.5,height:VBH,boxSizing:"border-box",
                      }}
                    >
                     <span style={{
  display:"block",
  width: cl(CFG.dotD), height: cl(CFG.dotD), borderRadius:"50%",
  background: done ? CFG.red : "#D0D0D0",
  border: `${cl(CFG.dotBorder)} solid ${done ? CFG.redDark : "#B8B8B8"}`,
  flexShrink:0,
  transition:"background 450ms ease,border-color 450ms ease,box-shadow 450ms ease",
  boxShadow: current ? "0 0 0 3px rgba(255,0,0,0.18)" : "none",
}}/>
                    </button>
                  );
                })}
              </div>
            </div>

       
            <div style={{
              display:"grid",gridTemplateColumns:`repeat(${N},1fr)`,
              gap: `0 ${cl(CFG.pillGap)}`,
              background:CFG.phaseStripBg,
              paddingRight:pillPhaseRight,
            }}>
              {PHASES.map(p=>{
                const isAct=p.key===activePhase;
                return(
                  <div key={`ph-${p.key}`} style={{
                    gridColumn:`span ${p.span}`,height:CFG.phaseH,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:cl(CFG.fontPhase),
                    fontWeight:isAct?600:400,fontFamily:"inherit",
                    color:isAct?CFG.black:CFG.inkFaint,
                    transition:"color 280ms ease",
                  }}>{p.key}</div>
                );
              })}
            </div>

          </div>

        ):(

          /* ── PHONE ─────────────────────────────────────────────── */
          <div style={{padding:"0 var(--ctm-hpad)",position:"relative"}}>
            {/* floating pill */}
            <div style={{position:"relative",height:PH_IN,marginBottom:2}}>
              <button style={{
                position:"absolute",bottom:0,
                left:`clamp(0px,calc(${(active+0.5)/N}*(100% - ${ARROW_PCT}) - 60px),calc(100% - 165px))`,
                transition:`left ${CFG.ease}`,
                padding:"8px 12px",
                background:"linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0) 55%) #000",
                boxShadow:"inset 0 1px 0 0 rgba(255,255,255,0.14)",
                color:CFG.white,fontSize:cl(CFG.fontPillActive),    
                fontWeight:600,fontFamily:"inherit",
                textTransform:"uppercase",lineHeight:1.25,
                borderRadius: cl(CFG.pillRadius),border:"none",cursor:"default",
                whiteSpace:"nowrap",minWidth:80,maxWidth:160,
                textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",
              }}>
                {STAGES[active].pill}
              </button>
            </div>
            {/* trail + dots */}
            <div style={{position:"relative",marginTop:3}}>
              <svg aria-hidden
                viewBox={`0 0 ${VBW} ${VBH}`}
                preserveAspectRatio="none"
                style={{display:"block",width:"100%",height:VBH}}
              >
                <defs>
                  <clipPath id="ctm-clip-ph"><path d={TRAIL_PATH}/></clipPath>
                  <linearGradient id="ctm-feather-ph" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor={CFG.red}/>
                    <stop offset="100%" stopColor={CFG.redGradEnd}/>
                  </linearGradient>
                </defs>
                <path d={TRAIL_PATH} fill={CFG.redGradEnd}/>
                <rect x={0} y={0} width={solidX} height={VBH}
                  fill={CFG.red} clipPath="url(#ctm-clip-ph)"
                  style={{transition:`width ${CFG.ease}`}}/>
                <rect x={solidX} y={0} width={featherW} height={VBH}
                  fill="url(#ctm-feather-ph)" clipPath="url(#ctm-clip-ph)"
                  style={{transition:`x ${CFG.ease}`}}/>
              </svg>
              <div style={{
                position:"absolute",top:0,left:0,right:ARROW_PCT,height:VBH,
                display:"grid",gridTemplateColumns:`repeat(${N},1fr)`,
              }}>
                {STAGES.map((s,i)=>{
                  const done=i<=active,cur=i===active;
                  return(
                    <button key={s.id}
                      onClick={()=>goTo(i)} onMouseEnter={()=>goTo(i)}
                      aria-label={`Go to ${s.pill}`}
                      style={{display:"flex",alignItems:"flex-start",justifyContent:"center",
                        background:"none",border:"none",cursor:"pointer",
                        padding:0,paddingTop:13.5,height:VBH,boxSizing:"border-box"}}>
                      <span style={{
  display:"block", 
  width: cl(CFG.dotD), height: cl(CFG.dotD), borderRadius:"50%",
  background: done ? CFG.red : "#D0D0D0",
  border: `${cl(CFG.dotBorder)} solid ${done ? CFG.redDark : "#B8B8B8"}`,
  flexShrink:0,
  transition:"background 450ms ease,border-color 450ms ease",
  boxShadow: cur ? "0 0 0 3px rgba(255,0,0,0.18)" : "none",
}}/>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* phase */}
            <div style={{
              display:"grid",gridTemplateColumns:`repeat(${N},1fr)`,
              paddingRight:ARROW_PCT,background:CFG.phaseStripBg,
            }}>
              {PHASES.map(p=>{
                const isAct=p.key===activePhase;
                return(
                  <div key={p.key} style={{
                    gridColumn:`span ${p.span}`,height:CFG.phaseH,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:cl(CFG.fontPhase),
                    fontWeight:isAct?600:400,fontFamily:"inherit",
                    color:isAct?CFG.black:CFG.inkFaint,
                    transition:"color 280ms ease",
                  }}>{p.key}</div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{height:"clamp(6px,1.2vh,16px)"}}/>
      </div>
    </section>
  );
}

/*  CARD SLIDE*/
type CardSlideProps={stage:Stage;isActive:boolean;opacity:number;scale:number;cardW:number;bp:BP;onClick:()=>void};

function CardSlide({stage:s,isActive,opacity,scale,cardW,bp,onClick}:CardSlideProps){
  const{ref,lt,mv,ml}=useRakeLight(isActive);
  const videoRef=useRef<HTMLVideoElement>(null);

  useEffect(()=>{
    const v=videoRef.current;if(!v)return;
    if(isActive){v.currentTime=0;v.play().catch(()=>{});}
    else{v.pause();v.currentTime=0;}
  },[isActive]);

  const isPhone=bp==="phone";

  return(
    <div aria-hidden={!isActive} onClick={onClick} style={{
      width:cardW||"58vw",flexShrink:0,
      opacity,transform:`scale(${scale})`,
      transition:"opacity 550ms ease,transform 550ms ease",
      cursor:isActive?"default":"pointer",
    }}>
      <div style={{
        display:"flex",
        flexDirection:isPhone?"column":"row",
        alignItems:isPhone?"stretch":"center",
        gap:isPhone?"clamp(12px,2vh,20px)":"clamp(16px,3.5%,48px)",
        height:"100%",
        padding:isPhone?"0 0 8px":undefined,
      }}>

        {/* VIDEO */}
        <div style={{flexShrink:0,width:isPhone?"100%":"52%"}}>
          <div ref={ref} onMouseMove={mv} onMouseLeave={ml} style={{
            position:"relative",aspectRatio:"4/3",
            borderRadius:CFG.cardBorderRadius,
            border:CFG.cardBorder,
            boxShadow:isActive?CFG.cardShadowActive:CFG.cardShadowIdle,
            overflow:"hidden",background:CFG.cardPlaceholder,
            transition:"box-shadow 400ms ease",
          }}>
            {s.media&&(
              <video ref={videoRef} src={s.media} muted loop playsInline
                preload={isActive?"auto":"metadata"}
                style={{position:"absolute",inset:0,width:"100%",height:"100%",
                  objectFit:"cover",borderRadius:CFG.cardBorderRadius-1}}/>
            )}
            <div aria-hidden style={{
              position:"absolute",inset:0,pointerEvents:"none",
              borderRadius:CFG.cardBorderRadius-1,zIndex:1,
              background:"radial-gradient(ellipse at 50% 50%,transparent 45%,rgba(0,0,0,0.18) 100%)",
            }}/>
            <div aria-hidden style={{
              position:"absolute",inset:0,pointerEvents:"none",
              borderRadius:CFG.cardBorderRadius-1,zIndex:2,
              opacity:lt.on?1:0,transition:"opacity 300ms ease",
              background:lt.on
                ?`radial-gradient(circle ${CFG.rakeRadius}px at ${lt.x}px ${lt.y}px,rgba(255,255,255,${CFG.rakeOpacity}) 0%,rgba(255,255,255,0) 70%)`
                :"none",
            }}/>
          </div>
        </div>

        {/* TEXT */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"END",gap:14}}>
            <div style={{flexShrink:0,width:cl(CFG.iconSize),height:cl(CFG.iconSize)}}>
              <s.Icon className="w-full h-full text-[#FF0000]"/>
            </div>
            <div style={{flex:1,height:3,
              background:"linear-gradient(90deg,rgb(214,214,214) 0%,rgba(171,171,171,0) 100%)"}}/>
          </div>
          <h3 style={{
            marginTop:"clamp(10px,1.3vw,20px)",
            fontSize:cl(CFG.fontHeading),
            fontWeight:600,textTransform:"uppercase",lineHeight:1.4,color:CFG.ink,
          }}>{s.heading}</h3>
          <p style={{
            marginTop:"clamp(6px,0.9vw,14px)",
            fontSize:cl(CFG.fontBody),lineHeight:1.3,color:CFG.ink,
          }}>{s.body}</p>
        </div>
      </div>
    </div>
  );
}