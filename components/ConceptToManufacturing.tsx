"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  ConceptToManufacturing v6  —  QMAX                                 ║
 * ║  Desktop (≥1280px) · Tablet (810–1279px) · Phone (<810px)          ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  FONT — app/layout.tsx:                                             ║
 * ║    import { Oxanium } from "next/font/google";                      ║
 * ║    const ox = Oxanium({ subsets:["latin"],                          ║
 * ║      weight:["400","600"], variable:"--font-oxanium" });            ║
 * ║    <body className={ox.variable}>                                   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

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

/* ═══════════════════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════════════════ */
const CFG = {
  autoAdvance       : true,
  intervalMs        : 4000,
  entranceMs        : 600,

  /* colours */
  red         : "#FF0000",
  redDark     : "#910000",
  redGradEnd  : "rgb(207,207,207)",
  black       : "#000000",
  ink         : "#191919",
  inkFaint    : "rgba(25,25,25,0.42)",
  white       : "#ffffff",

  /* card */
  cardBorderRadius : 10.8,
  cardBorder       : "2.7px solid rgba(255,255,255,0.2)",
  cardShadowActive : "3.6px 3.6px 24px 0 rgba(0,0,0,0.32), inset 0 1px 0 0 rgba(255,255,255,0.08)",
  cardShadowIdle   : "3.6px 3.6px 18px 0 rgba(0,0,0,0.25)",
  cardPlaceholder  : "#DCDCDC",
  inactiveOpacity  : 0.42,
  farOpacity       : 0.14,
  inactiveScale    : 0.965,

  /* rake light on card */
  rakeOpacity : 0.12,
  rakeRadius  : 180,

  /* desktop carousel */
  cardRatio   : 0.58,   // card width as fraction of section width
  gapRatio    : 0.022,  // gap as fraction of section width

  /* pills */
  pillFontSize    : "clamp(9px,0.9vw,13px)",
  pillHeightIdle  : 52,
  pillHeightActive: 66,
  pillPadH        : 10,
  pillPadB        : 10,
  pillGap         : 3,
  pillRadius      : 2,

  /* trail SVG — exact from Framer body tag viewBox="0 0 1259 22"
     M 1216.765 0 L 1259 22 L 0 22 L 0 16 L 1213.85 16 Z            */
  trailW  : 1259,
  trailH  : 22,
  trailLT : 16,       // y where flat line starts
  trailABB: 1213.85,  // arrow base x (bottom edge)
  trailABT: 1216.765, // arrow base x (top edge)

  /* phase strip */
  phaseStripBg: "#EBEBEB",
  phaseH      : 34,

  /* background dot-grid texture */
  bgDotOpacity: 0.032,  // set to 0 to disable
  bgDotSpacing: 28,     // px between dots
  bgDotSize   : 1,      // px dot radius
} as const;

/* ═══════════════════════════════════════════════════════════════════
   BREAKPOINTS
═══════════════════════════════════════════════════════════════════ */
// Desktop  ≥ 1280
// Tablet   810 – 1279
// Phone    < 810
type BP = "desktop" | "tablet" | "phone";
function getBP(w: number): BP {
  if (w >= 1280) return "desktop";
  if (w >= 810)  return "tablet";
  return "phone";
}

/* ═══════════════════════════════════════════════════════════════════
   KEYFRAMES (injected once)
═══════════════════════════════════════════════════════════════════ */
const KF = `
@keyframes ctm-up   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes ctm-in   { from{opacity:0}                            to{opacity:1} }
@media (prefers-reduced-motion:reduce){
  .ctm-t,.ctm-c,.ctm-s{animation:none!important;opacity:1!important}
}
`;
function useKF() {
  useEffect(() => {
    if (document.getElementById("ctm-kf")) return;
    const el = document.createElement("style");
    el.id = "ctm-kf"; el.textContent = KF;
    document.head.appendChild(el);
  }, []);
}

/* ═══════════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════════ */
type Phase = "CVD"|"EVT"|"DVT"|"PVT";
type Stage = {
  id:string; pill:string; heading:string; body:string;
  Icon:ComponentType<{className?:string}>; media?:string; phase:Phase;
};

const STAGES:Stage[] = [
  { id:"cv",  pill:"Concept Validation",          heading:"Concept Validation",
    body:"From idea to defendable spec: feasibility studies, system architecture, product specification.",
    Icon:CheckbulbIcon, media:"https://framerusercontent.com/assets/T37zx5wYoF864LLeah9hwj2lUNk.mp4", phase:"CVD" },
  { id:"hd",  pill:"Hardware Development",        heading:"Hardware Development",
    body:"High-level and low-level design, component engineering, board bring-up & testing.",
    Icon:CircuitIcon,   media:"https://framerusercontent.com/assets/zQiDSY49IC5ohPtYlQt207jEpA0.mp4", phase:"EVT" },
  { id:"pcb", pill:"PCB Design",                  heading:"PCB Design",
    body:"Multi-layer layouts, signal & power integrity, design-for-manufacturability.",
    Icon:PCBIcon,       phase:"EVT" },
  { id:"sw",  pill:"Firmware & SW Development",   heading:"Firmware & SW Development",
    body:"Firmware, drivers / BSP and cross-platform application development.",
    Icon:CodeIcon,      phase:"EVT" },
  { id:"mid", pill:"Mechanical and Industrial Design", heading:"Mech and Industrial Design",
    body:"Enclosure design, UI/UX and CMF, the experience the user actually holds.",
    Icon:DesignIcon,    phase:"EVT" },
  { id:"cmp", pill:"Validation & Compliance",     heading:"Validation & Compliance",
    body:"Compliance certification (FCC / UL / CE), vendor audits and test-jig development.",
    Icon:ClipboardIcon, media:"https://framerusercontent.com/assets/d5TbJNs9wSu60hFl9QDQv7eXgr0.mp4", phase:"DVT" },
  { id:"val", pill:"Production Validation",       heading:"Production Validation",
    body:"Manufacturing coordination and production testing, built at scale, shipped with confidence.",
    Icon:QualityIcon,   media:"https://framerusercontent.com/assets/LQwD6gGvPIlcHemMODDhWlQuBPI.mp4", phase:"PVT" },
];

const PHASES:{key:Phase;span:number}[] = [
  {key:"CVD",span:1},{key:"EVT",span:4},{key:"DVT",span:1},{key:"PVT",span:1}
];

const N   = STAGES.length;
const VBW = CFG.trailW;
const VBH = CFG.trailH;
const LT  = CFG.trailLT;
const ABB = CFG.trailABB;
const ABT = CFG.trailABT;
const TRAIL = `M ${ABT} 0 L ${VBW} ${VBH} L 0 ${VBH} L 0 ${LT} L ${ABB} ${LT} Z`;

/* dot-grid SVG data URI */
const DOT_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${CFG.bgDotSpacing}' height='${CFG.bgDotSpacing}'%3E%3Ccircle cx='${CFG.bgDotSize}' cy='${CFG.bgDotSize}' r='${CFG.bgDotSize}' fill='rgba(0,0,0,${CFG.bgDotOpacity})'/%3E%3C/svg%3E")`;

/* ═══════════════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════════════ */
function useRakeLight(enabled:boolean) {
  const [lt, setLt] = useState({x:0,y:0,on:false});
  const ref = useRef<HTMLDivElement>(null);
  const mv  = useCallback((e:ReactMouseEvent<HTMLDivElement>) => {
    if (!enabled||!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setLt({x:e.clientX-r.left, y:e.clientY-r.top, on:true});
  },[enabled]);
  const ml = useCallback(()=>setLt(s=>({...s,on:false})),[]);
  return {ref,lt,mv,ml};
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function ConceptToManufacturing() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [secW,   setSecW]   = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  useKF();

  /* measure */
  useEffect(() => {
    const el = sectionRef.current; if (!el) return;
    const ro = new ResizeObserver(()=>setSecW(el.offsetWidth));
    ro.observe(el); setSecW(el.offsetWidth);
    return ()=>ro.disconnect();
  },[]);

  /* auto-advance */
  useEffect(()=>{
    if (!CFG.autoAdvance||paused) return;
    const t = setTimeout(()=>setActive(p=>(p+1)%N), CFG.intervalMs);
    return ()=>clearTimeout(t);
  },[paused,active]);

  const goTo = useCallback((i:number)=>setActive(i),[]);

  const bp = getBP(secW);

  /* ── carousel geometry ──────────────────────────────────────────── */
  // Desktop/tablet: horizontal scroll, cards side by side
  // Phone: single-card, full width, vertical stack inside card
  const cardW = secW * CFG.cardRatio;
  const gap   = secW * CFG.gapRatio;
  const tx    = (secW-cardW)/2 - active*(cardW+gap);

  // Tablet: slightly wider card, same side-peek behaviour
  const tabCardW = secW * 0.72;
  const tabGap   = secW * 0.024;
  const tabTx    = (secW-tabCardW)/2 - active*(tabCardW+tabGap);

  // Phone: full width, single visible card, centred
  const phoneCardW = secW * 0.88;
  const phoneTx    = (secW-phoneCardW)/2 - active*(phoneCardW+secW*0.04);

  const phoneGap  = secW * 0.04;
  const activeGap   = bp==="phone" ? phoneGap : bp==="tablet" ? tabGap : gap;
  const activeTx    = bp==="phone" ? phoneTx : bp==="tablet" ? tabTx : tx;
  const activeCardW = bp==="phone" ? phoneCardW : bp==="tablet" ? tabCardW : cardW;

  /* ── progress ───────────────────────────────────────────────────── */
  const progress    = active/(N-1);
  const fillX       = progress>=1 ? VBW : ABB*progress;
  const activePhase = STAGES[active].phase;

  /* pill heights */
  const PH_IN  = CFG.pillHeightIdle;
  const PH_AC  = CFG.pillHeightActive;
  const PH_MAX = PH_AC;

  /* entrance */
  const D = CFG.entranceMs;
  const aTitle    = {animation:`ctm-up  ${D*.5}ms ease both`};
  const aCarousel = {animation:`ctm-in  ${D*.6}ms ${D*.2}ms ease both`};
  const aStepper  = {animation:`ctm-up  ${D*.5}ms ${D*.4}ms ease both`};

  /* ── phone stepper — just active pill label above trail ─────────── */
  const dotPct = (i:number)=>`${(i/(N-1))*100}%`;

  return (
    <section
      ref={sectionRef}
      onMouseEnter={()=>setPaused(true)}
      onMouseLeave={()=>setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Concept to Manufacturing stages"
      style={{
        position:"relative", display:"flex", flexDirection:"column",
        width:"100%", height:"95vh", minHeight:560, overflow:"hidden",
        background:`${CFG.white} ${DOT_SVG}`,
        backgroundSize:`${CFG.bgDotSpacing}px ${CFG.bgDotSpacing}px`,
        fontFamily:"var(--font-oxanium,'Oxanium',sans-serif)",
        color:CFG.ink, userSelect:"none", WebkitUserSelect:"none",
      }}
    >

      {/* TITLE */}
      <h2 className="ctm-t" style={{
        ...aTitle, flexShrink:0, margin:0,
        paddingTop:"clamp(16px,2.5vh,32px)",
        textAlign:"center",
        fontSize:"clamp(14px,2.2vw,28px)",
        fontWeight:600, textTransform:"uppercase",
        letterSpacing:"0.01em", color:CFG.black,
      }}>
        Concept to Manufacturing
      </h2>

      {/* CAROUSEL */}
      <div className="ctm-c" style={{
        ...aCarousel, position:"relative",
        flex:"1 1 0", minHeight:0, overflow:"hidden",
      }}>
        {/* spotlight */}
        <div aria-hidden style={{
          position:"absolute", inset:0, pointerEvents:"none", zIndex:0,
          background:"linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(237,237,237,0.70) 47.73%,rgba(255,255,255,0) 100%)",
        }}/>

        {/* track */}
        <div style={{
          position:"absolute", top:0, bottom:0, left:0,
          display:"flex", alignItems:"center", gap:activeGap,
          transform: secW ? `translateX(${activeTx}px)` : undefined,
          transition: secW ? "transform 700ms cubic-bezier(0.2,0,0,1)" : "none",
          willChange:"transform", zIndex:1,
        }}>
          {STAGES.map((s,i)=>{
            const isActive = i===active;
            const dist     = Math.abs(i-active);
            const opacity  = isActive ? 1 : dist===1 ? CFG.inactiveOpacity : CFG.farOpacity;
            const scale    = isActive ? 1 : CFG.inactiveScale;
            return (
              <CardSlide
                key={s.id}
                stage={s}
                isActive={isActive}
                opacity={opacity}
                scale={scale}
                cardW={activeCardW}
                bp={bp}
                onClick={()=>!isActive&&goTo(i)}
              />
            );
          })}
        </div>
      </div>

      {/* STEPPER */}
      <div className="ctm-s" style={{
        ...aStepper, flexShrink:0,
        /* NO horizontal padding here — trail must reach left edge.
           Pills get their own padded inner wrapper below. */
      }}>
        {/* Padded wrapper — pills only */}
        <div style={{padding:`0 clamp(10px,2.5vw,40px)`}}>

        {/* ── DESKTOP + TABLET: 7-pill row ─────────────────────────── */}
        {bp!=="phone" && (
          <div style={{
            display:"grid",
            gridTemplateColumns:`repeat(${N},1fr)`,
            gap:CFG.pillGap,
            gridTemplateRows:`${PH_MAX}px`,
            alignItems:"end",
          }}>
            {STAGES.map((s,i)=>{
              const isActive = i===active;
              return (
                <button key={s.id}
                  onClick={()=>goTo(i)}
                  onMouseEnter={()=>goTo(i)}
                  aria-current={isActive?"step":undefined}
                  style={{
                    height      : isActive ? PH_AC : PH_IN,
                    alignSelf   : "end",
                    padding     : `0 ${CFG.pillPadH}px ${CFG.pillPadB}px`,
                    display     : "flex", alignItems:"flex-end",
                    /* Active pill: near-black with angled rake + subtle noise texture */
                    background  : isActive
                      ? "linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0) 55%,rgba(255,255,255,0) 100%) #000"
                      : "linear-gradient(111deg,rgba(217,217,217,0.22) 0%,rgba(217,217,217,0.55) 48.8%,rgba(217,217,217,0.22) 100%)",
                    /* hairline specular top edge on active */
                    boxShadow   : isActive ? "inset 0 1px 0 0 rgba(255,255,255,0.14)" : "none",
                    color       : isActive ? CFG.white : CFG.ink,
                    fontSize    : CFG.pillFontSize,
                    fontWeight  : 600, fontFamily:"inherit",
                    textTransform:"uppercase", lineHeight:1.25,
                    textAlign   : "left",
                    borderRadius: CFG.pillRadius,
                    border      : "none", cursor:"pointer",
                    transition  : "background 280ms ease,color 280ms ease,height 280ms ease,box-shadow 280ms ease",
                    minWidth:0, overflow:"hidden", boxSizing:"border-box",
                  }}
                >
                  {s.pill}
                </button>
              );
            })}
          </div>
        )}

        {/* ── PHONE: floating active label, tracks the active dot ─────
            Dot centre = (active + 0.5) / N * 100% of trail width.
            We position the pill with left = that %, then shift it
            left by 50% of its own width via transform.
            clamp() keeps it from bleeding off either edge.           */}
        {bp==="phone" && (
          <div style={{
            position:"relative",
            height:PH_IN,
            marginBottom:2,
          }}>
            <button
              onClick={()=>{}} /* dots handle navigation */
              style={{
                position  :"absolute",
                bottom    : 0,
                /* centre over dot, clamped to edges */
                /* offset by half arrowhead (22.5px) for accurate dot tracking */
                left      : `clamp(0px, calc(${(active+0.5)/N} * (100% - 45px) - 60px), calc(100% - 165px))`,
                transition: "left 700ms cubic-bezier(0.2,0,0,1)",
                padding   :"8px 12px",
                background:"linear-gradient(135deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0) 55%) #000",
                boxShadow :"inset 0 1px 0 0 rgba(255,255,255,0.14)",
                color     : CFG.white,
                fontSize  : "clamp(9px,2.8vw,12px)",
                fontWeight: 600, fontFamily:"inherit",
                textTransform:"uppercase", lineHeight:1.25,
                borderRadius:CFG.pillRadius, border:"none",
                cursor    :"default", whiteSpace:"nowrap",
                minWidth  : 80, maxWidth:160, textAlign:"center",
                overflow  :"hidden", textOverflow:"ellipsis",
              }}
            >
              {STAGES[active].pill}
            </button>
          </div>
        )}

        </div>{/* end pills padding wrapper */}

        {/* TRAIL ────────────────────────────────────────────────────
            All CSS divs — no SVG for the line. No SVG transform hacks.
            
            Layout: flex row, align-items:flex-end, height=VBH(22px)
              ├── LINE WRAPPER (flex:1, relative, height=LINE_H=6px)
              │     ├── grey base (absolute, full width, static)
              │     ├── red solid fill (absolute, width=solidEnd%, transitions)
              │     ├── feather div (absolute, left=solidEnd%, width=featherW%,
              │     │               background: linear-gradient red→grey)
              │     └── glow (absolute, left=solidEnd%, 2px bright white)
              └── SVG ARROW (fixed 45×22px, the original asymmetric path)
            
            Arrowhead: fills red when active===N-1, using a clip-path
            approach so the red "sweeps in" from the left edge matching
            the trail fill speed — no discrete fill swap.
        ─────────────────────────────────────────────────────────── */}
        <div style={{
          position:"relative", marginTop:3,
          padding:`0 clamp(10px,2.5vw,40px)`,
        }}>
        {(()=>{
          const EASE      = "700ms cubic-bezier(0.2,0,0,1)";
          const LINE_H    = VBH - LT;                        /* 6px */
          const solidPct  = (active + 0.5) / N * 100;       /* % of line width */
          const featherPct = (100 / N) * 0.6;               /* fixed % width */
          const atLast    = active === N - 1;
          /* 
            Arrowhead fill logic: the arrow is always the grey shape.
            On top we overlay a red div that is clipped to the arrow shape
            via clip-path polygon matching the arrowhead.
            The red overlay's opacity goes 0→1 only at last stage.
            This avoids the fill colour jump.
          */
          return (
            <div style={{
              display:"flex", alignItems:"flex-end",
              height:VBH, position:"relative",
            }}>

              {/* LINE WRAPPER */}
              <div style={{
                flex:1, position:"relative",
                height:LINE_H,
                background:CFG.redGradEnd,   /* grey base */
                overflow:"hidden",
              }}>
                {/* red solid fill */}
                <div style={{
                  position:"absolute", inset:"0 auto 0 0",
                  width: atLast ? "100%" : `${solidPct}%`,
                  background:CFG.red,
                  transition:`width ${EASE}`,
                }}/>

                {/* feather: red→grey gradient, slides with fill tip */}
                <div style={{
                  position:"absolute", top:0, bottom:0,
                  left: atLast ? "100%" : `${solidPct}%`,
                  width:`${featherPct}%`,
                  background:`linear-gradient(90deg, ${CFG.red} 0%, ${CFG.redGradEnd} 100%)`,
                  transition:`left ${EASE}`,
                  pointerEvents:"none",
                }}/>

              </div>

              {/* SVG ARROW — fixed size, original asymmetric path */}
              <div style={{
                position:"relative", flexShrink:0,
                width:45, height:VBH,
              }}>
                {/* grey base arrow — always visible */}
                <svg viewBox="0 0 45 22" width={45} height={VBH}
                  style={{position:"absolute", inset:0, display:"block"}}>
                  <path d="M 0 16 L 3 0 L 45 22 L 0 22 Z" fill={CFG.redGradEnd}/>
                </svg>
                {/* red fill arrow — fades in at last stage via opacity */}
                <svg viewBox="0 0 45 22" width={45} height={VBH}
                  style={{
                    position:"absolute", inset:0, display:"block",
                    opacity: atLast ? 1 : 0,
                    transition:`opacity ${EASE}`,
                  }}>
                  <path d="M 0 16 L 3 0 L 45 22 L 0 22 Z" fill={CFG.red}/>
                </svg>
              </div>
            </div>
          );
        })()}

          {/* dots overlay — absolute over the full trail row (line + arrow) */}
          <div style={{
            position:"absolute", top:0, left:0, right:45, height:VBH,
            display:"grid", gridTemplateColumns:`repeat(${N},1fr)`,
          }}>
            {STAGES.map((s,i)=>{
              const done    = i<=active;
              const current = i===active;
              return (
                <button key={s.id}
                  onClick={()=>goTo(i)}
                  onMouseEnter={()=>goTo(i)}
                  aria-label={`Go to ${s.pill}`}
                  style={{
                    display:"flex", alignItems:"flex-start",
                    justifyContent:"center",
                    paddingTop:13.5,
                    background:"none", border:"none",
                    cursor:"pointer", height:VBH, boxSizing:"border-box",
                  }}
                >
                  <span style={{
                    display:"block", width:11, height:11,
                    borderRadius:"50%",
                    background : done ? CFG.red  : "#D0D0D0",
                    border     : `2px solid ${done ? CFG.redDark : "#B8B8B8"}`,
                    flexShrink : 0,
                    transition : "background 450ms ease,border-color 450ms ease,box-shadow 450ms ease",
                    boxShadow  : current ? "0 0 0 3px rgba(255,0,0,0.18)" : "none",
                  }}/>
                </button>
              );
            })}
          </div>
        </div>{/* end trail wrapper */}

        {/* PHASE STRIP — no gaps between cells, seamless strip */}
        <div style={{
          display:"grid",
          gridTemplateColumns:`repeat(${N},1fr)`,
          gap:0,
          marginTop:0,
          padding:`0 clamp(10px,2.5vw,40px)`,
          background:CFG.phaseStripBg,
        }}>
          {PHASES.map(p=>{
            const isAct = p.key===activePhase;
            return (
              <div key={p.key} style={{
                gridColumn:`span ${p.span}`,
                height:CFG.phaseH,
                display:"flex", alignItems:"center", justifyContent:"center",
                background:CFG.phaseStripBg,
                fontSize:"clamp(9px,0.85vw,15px)",
                fontWeight:isAct?600:400, fontFamily:"inherit",
                color:isAct?CFG.black:CFG.inkFaint,
                transition:"color 280ms ease",
              }}>
                {p.key}
              </div>
            );
          })}
        </div>
        {/* bottom spacer — replaces removed stepper bottom padding */}
        <div style={{height:"clamp(6px,1.2vh,16px)"}}/>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CARD SLIDE
   Handles: video play/pause, rake light, layout switch per breakpoint
═══════════════════════════════════════════════════════════════════ */
type CardSlideProps = {
  stage:Stage; isActive:boolean; opacity:number;
  scale:number; cardW:number; bp:BP; onClick:()=>void;
};

function CardSlide({stage:s,isActive,opacity,scale,cardW,bp,onClick}:CardSlideProps) {
  const {ref,lt,mv,ml} = useRakeLight(isActive);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* play only the active card's video */
  useEffect(()=>{
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.currentTime = 0;
      v.play().catch(()=>{/* autoplay blocked — silent fail */});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  },[isActive]);

  /* card inner layout:
     Desktop/tablet: row — video left 52%, text right
     Phone:          column — video top, text below                    */
  const isPhone = bp==="phone";

  return (
    <div
      aria-hidden={!isActive}
      onClick={onClick}
      style={{
        width:cardW||"58vw", flexShrink:0,
        opacity, transform:`scale(${scale})`,
        transition:"opacity 550ms ease,transform 550ms ease",
        cursor:isActive?"default":"pointer",
        overflow:"hidden",  /* prevent inactive card text bleeding */
      }}
    >
      <div style={{
        display:"flex",
        flexDirection: isPhone ? "column" : "row",
        alignItems: isPhone ? "stretch" : "center",
        gap:isPhone ? "clamp(12px,2vh,20px)" : "clamp(16px,3.5%,48px)",
        height:"100%",
        padding: isPhone ? "0 0 8px" : undefined,
      }}>

        {/* VIDEO */}
        <div style={{flexShrink:0, width: isPhone ? "100%" : "52%"}}>
          <div
            ref={ref}
            onMouseMove={mv}
            onMouseLeave={ml}
            style={{
              position:"relative",
              aspectRatio:CFG.cardBorderRadius > 0 ? "4/3" : "4/3",
              borderRadius:CFG.cardBorderRadius,
              border:CFG.cardBorder,
              boxShadow:isActive ? CFG.cardShadowActive : CFG.cardShadowIdle,
              overflow:"hidden",
              background:CFG.cardPlaceholder,
              transition:"box-shadow 400ms ease",
            }}
          >
            {s.media && (
              <video
                ref={videoRef}
                src={s.media}
                muted loop playsInline
                preload={isActive?"auto":"metadata"}
                style={{
                  position:"absolute", inset:0,
                  width:"100%", height:"100%",
                  objectFit:"cover",
                  borderRadius:CFG.cardBorderRadius-1,
                }}
              />
            )}

            {/* vignette */}
            <div aria-hidden style={{
              position:"absolute", inset:0, pointerEvents:"none",
              borderRadius:CFG.cardBorderRadius-1, zIndex:1,
              background:"radial-gradient(ellipse at 50% 50%,transparent 45%,rgba(0,0,0,0.18) 100%)",
            }}/>

            {/* rake light */}
            <div aria-hidden style={{
              position:"absolute", inset:0, pointerEvents:"none",
              borderRadius:CFG.cardBorderRadius-1, zIndex:2,
              opacity:lt.on?1:0, transition:"opacity 300ms ease",
              background:lt.on
                ? `radial-gradient(circle ${CFG.rakeRadius}px at ${lt.x}px ${lt.y}px,rgba(255,255,255,${CFG.rakeOpacity}) 0%,rgba(255,255,255,0) 70%)`
                : "none",
            }}/>
          </div>
        </div>

        {/* TEXT */}
        <div style={{flex:1, minWidth:0}}>
          <div style={{display:"flex", alignItems:"center", gap:14}}>
            <div style={{
              flexShrink:0,
              width:"clamp(32px,3vw,48px)",
              height:"clamp(32px,3vw,48px)",
            }}>
              <s.Icon className="w-full h-full text-[#FF0000]"/>
            </div>
            <div style={{
              flex:1, height:1,
              background:"linear-gradient(90deg,rgb(214,214,214) 0%,rgba(171,171,171,0) 100%)",
            }}/>
          </div>

          <h3 style={{
            marginTop:"clamp(10px,1.3vw,20px)",
            fontSize:"clamp(13px,1.6vw,24px)",
            fontWeight:600, textTransform:"uppercase",
            lineHeight:1.4, color:CFG.ink,
          }}>
            {s.heading}
          </h3>

          <p style={{
            marginTop:"clamp(6px,0.9vw,14px)",
            fontSize:"clamp(11px,1.3vw,23px)",
            lineHeight:1.3, color:CFG.ink,
          }}>
            {s.body}
          </p>
        </div>
      </div>
    </div>
  );
}