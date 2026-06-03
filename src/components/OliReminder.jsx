import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS — "Workshop Precision" aesthetic
   Dark navy header, clean white cards, amber warning system
═══════════════════════════════════════════════════════════ */
const T = {
  ink: "#0D1B2A", inkSub: "#4A5568", inkMute: "#94A3B8",
  bg: "#F0F4F8", card: "#FFFFFF", border: "#E2E8F0",
  navy: "#0D1B2A", navyGrad: "linear-gradient(160deg,#0D1B2A 0%,#1A3355 100%)",
  primary: "#1A56DB", primaryLight: "#EBF5FF",
  green: "#059669", greenBg: "#ECFDF5", greenRing: "#10B981",
  blue: "#2563EB",  blueBg: "#EFF6FF",  blueRing: "#3B82F6",
  amber: "#B45309", amberBg: "#FFFBEB", amberRing: "#F59E0B",
  red: "#B91C1C",   redBg: "#FEF2F2",   redRing: "#EF4444",
  slate: "#475569", slateBg: "#F1F5F9", slateRing: "#94A3B8",
};

const S = {
  good:    { label:"Aman",       emoji:"✅", text:T.green, bg:T.greenBg, ring:T.greenRing  },
  soon:    { label:"Perhatian",  emoji:"🔵", text:T.blue,  bg:T.blueBg,  ring:T.blueRing   },
  warning: { label:"Segera!",    emoji:"⚠️", text:T.amber, bg:T.amberBg, ring:T.amberRing  },
  overdue: { label:"Terlambat!", emoji:"🚨", text:T.red,   bg:T.redBg,   ring:T.redRing    },
  nodata:  { label:"Catat Oli",  emoji:"📋", text:T.slate, bg:T.slateBg, ring:T.slateRing  },
};

/* ═══════════════════════════════════════════════════════════
   RECOMMENDATION ENGINE — based on PDF tribology research
═══════════════════════════════════════════════════════════ */
const REC = {
  matic: {
    s: { heavy_city:{km:1500,mo:2}, city:{km:2500,mo:3}, highway:{km:3500,mo:4}, very_short:{km:2000,mo:3}, occasional:{km:3000,mo:6} },
    l: { heavy_city:{km:2000,mo:2}, city:{km:3000,mo:3}, highway:{km:4000,mo:4}, very_short:{km:2000,mo:3}, occasional:{km:3500,mo:6} },
  },
  manual: {
    s: { heavy_city:{km:2000,mo:2}, city:{km:2500,mo:3}, highway:{km:3500,mo:4}, very_short:{km:2000,mo:3}, occasional:{km:3000,mo:6} },
    l: { heavy_city:{km:2500,mo:2}, city:{km:3000,mo:3}, highway:{km:4000,mo:4}, very_short:{km:2000,mo:3}, occasional:{km:3500,mo:6} },
  },
};
const getRec = (m) => (REC[m.type==="matic"?"matic":"manual"]?.[m.cc<=125?"s":"l"]?.[m.usagePattern]) || {km:2500,mo:3};

const USAGE = [
  {id:"heavy_city",  icon:"🚦", label:"Macet Berat",       desc:"Stop-and-go parah, Jakarta / kota besar"},
  {id:"city",        icon:"🏙️", label:"Harian Kota",        desc:"Dalam kota, kadang macet, 5–30 km/hari"},
  {id:"highway",     icon:"🛣️", label:"Luar Kota / Komuter", desc:"Tol/jalan lancar, kecepatan stabil >30 km/hari"},
  {id:"very_short",  icon:"🏘️", label:"Jarak Sangat Dekat",  desc:"Hanya 1–5 km per trip, sekitar rumah"},
  {id:"occasional",  icon:"🏖️", label:"Jarang Dipakai",      desc:"Weekend, sesekali, atau diparkir berhari-hari"},
];

const BRANDS = [
  {id:"honda_beat",  label:"Honda Beat",       cc:110, type:"matic"},
  {id:"honda_vario125",label:"Honda Vario 125", cc:125, type:"matic"},
  {id:"honda_vario150",label:"Honda Vario 150/160",cc:150,type:"matic"},
  {id:"honda_scoopy",label:"Honda Scoopy",     cc:110, type:"matic"},
  {id:"honda_pcx",   label:"Honda PCX",        cc:150, type:"matic"},
  {id:"honda_genio", label:"Honda Genio",      cc:110, type:"matic"},
  {id:"honda_revo",  label:"Honda Revo",       cc:110, type:"manual"},
  {id:"honda_supra", label:"Honda Supra X",    cc:125, type:"manual"},
  {id:"honda_cb150", label:"Honda CB150R",     cc:150, type:"manual"},
  {id:"yamaha_mio",  label:"Yamaha Mio Series",cc:125, type:"matic"},
  {id:"yamaha_nmax", label:"Yamaha NMAX",      cc:155, type:"matic"},
  {id:"yamaha_aerox",label:"Yamaha Aerox",     cc:155, type:"matic"},
  {id:"yamaha_freego",label:"Yamaha FreeGo",   cc:125, type:"matic"},
  {id:"yamaha_vega", label:"Yamaha Vega",      cc:115, type:"manual"},
  {id:"yamaha_jupiter",label:"Yamaha Jupiter", cc:115, type:"manual"},
  {id:"yamaha_r15",  label:"Yamaha R15",       cc:155, type:"manual"},
  {id:"suzuki_smash",label:"Suzuki Smash",     cc:110, type:"manual"},
  {id:"suzuki_satria",label:"Suzuki Satria FU",cc:150, type:"manual"},
  {id:"kawasaki_ninja",label:"Kawasaki Ninja 150",cc:150,type:"manual"},
  {id:"custom",      label:"Lainnya (custom)", cc:null, type:null},
];

/* ═══════════════════════════════════════════════════════════
   STATUS CALCULATOR
═══════════════════════════════════════════════════════════ */
function calcStatus(motor) {
  const recs = motor.oilRecords || [];
  const last  = recs[recs.length - 1];
  if (!last) return { status:"nodata", ratio:0 };

  const rec      = getRec(motor);
  const lastDate = new Date(last.date); lastDate.setHours(0,0,0,0);
  const today    = new Date();          today.setHours(0,0,0,0);
  const daysSince    = Math.floor((today - lastDate) / 86400000);
  const totalDays    = rec.mo * 30;
  const dueDate      = new Date(lastDate); dueDate.setMonth(dueDate.getMonth() + rec.mo);
  const daysUntilDue = Math.floor((dueDate - today) / 86400000);
  const timeRatio    = daysSince / totalDays;

  let kmRatio=0, kmSince=null, dueKm=null, kmRemain=null;
  if (last.km != null && motor.currentKm != null && motor.currentKm >= last.km) {
    kmSince  = motor.currentKm - last.km;
    dueKm    = last.km + rec.km;
    kmRemain = dueKm - motor.currentKm;
    kmRatio  = kmSince / rec.km;
  }

  const ratio = Math.max(timeRatio, kmRatio);
  const status = ratio>=1?"overdue": ratio>=0.8?"warning": ratio>=0.55?"soon":"good";

  return { status, ratio:Math.min(ratio,1), daysSince, daysUntilDue, dueDate,
           kmSince, dueKm, kmRemain, rec, last, lastDate };
}

/* ═══════════════════════════════════════════════════════════
   INDEXEDDB HELPERS
═══════════════════════════════════════════════════════════ */
const DB = {name:"OliReminderDB", version:1, store:"motors"};
const dbOpen = () => new Promise((res,rej) => {
  const r = indexedDB.open(DB.name, DB.version);
  r.onupgradeneeded = e => { const db=e.target.result; if(!db.objectStoreNames.contains(DB.store)) db.createObjectStore(DB.store,{keyPath:"id"}); };
  r.onsuccess = e => res(e.target.result);
  r.onerror   = e => rej(e.target.error);
});
const dbOp = async (mode,fn) => { const db=await dbOpen(); return new Promise((res,rej)=>{ const t=db.transaction(DB.store,mode); const s=t.objectStore(DB.store); const r=fn(s); r.onsuccess=()=>{res(r.result);db.close();}; r.onerror=()=>{rej(r.error);db.close();}; }); };
const dbAll = ()    => dbOp("readonly",  s=>s.getAll());
const dbPut = item  => dbOp("readwrite", s=>s.put(item));
const dbDel = id    => dbOp("readwrite", s=>s.delete(id));

/* ═══════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════ */
const uid    = () => `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const fmtDate  = d => new Date(d).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});
const fmtShort = d => new Date(d).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"2-digit"});
const fmtKm    = n => n!=null ? n.toLocaleString("id-ID") : "—";
const inp = { width:"100%", padding:"11px 14px", borderRadius:10, border:`1.5px solid ${T.border}`,
              fontSize:14, background:"#FAFBFC", outline:"none", boxSizing:"border-box", color:T.ink,
              fontFamily:"inherit" };

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES COMPONENT
═══════════════════════════════════════════════════════════ */
function GlobalStyles() {
  return <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
    body{margin:0;background:#E8EDF2;}
    input,select,button{font-family:'Lexend',sans-serif;}
    @keyframes fadeDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .card-press:active{transform:scale(0.98)!important;transition:transform .1s!important;}
    .btn-press:active{opacity:0.85;}
    ::-webkit-scrollbar{width:0;}
  `}</style>;
}

/* ═══════════════════════════════════════════════════════════
   RING PROGRESS — gauge-like SVG circle
═══════════════════════════════════════════════════════════ */
function Ring({ ratio=0, status="good", size=54, icon }) {
  const r   = (size-8)/2;
  const c   = 2*Math.PI*r;
  const off = c*(1-Math.min(ratio,1));
  const col = S[status]?.ring || T.slateRing;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",display:"block"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={6}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={6}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{transition:"stroke-dashoffset .7s ease,stroke .3s"}}/>
      </svg>
      <span style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:size*.36,lineHeight:1}}>{icon}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOAST NOTIFICATION
═══════════════════════════════════════════════════════════ */
function Toast({ message, type="success" }) {
  const bg = {success:"#059669",error:"#DC2626",info:"#1A56DB"}[type]||"#059669";
  return (
    <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",
      background:bg,color:"#fff",padding:"11px 20px",borderRadius:14,zIndex:9999,
      fontSize:13,fontWeight:600,boxShadow:"0 8px 24px rgba(0,0,0,.25)",
      maxWidth:320,textAlign:"center",whiteSpace:"nowrap",
      animation:"fadeDown .25s ease"}}>
      {message}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MOTOR CARD
═══════════════════════════════════════════════════════════ */
function MotorCard({ motor, onSelect }) {
  const st  = calcStatus(motor);
  const cfg = S[st.status];
  const typeIcon = motor.type==="matic"?"🛵":"🏍️";
  const usageLabel = USAGE.find(u=>u.id===motor.usagePattern)?.label || "";

  return (
    <div className="card-press" onClick={()=>onSelect(motor.id)}
      style={{background:T.card,borderRadius:18,padding:"15px 15px 13px",
        boxShadow:"0 2px 10px rgba(13,27,42,.07)",
        border:`1px solid ${st.status==="overdue"?T.redRing:st.status==="warning"?T.amberRing:T.border}`,
        cursor:"pointer",marginBottom:10,transition:"transform .15s,box-shadow .15s"}}>

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <Ring ratio={st.ratio} status={st.status} size={52} icon={typeIcon}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
            <span style={{fontWeight:700,fontSize:15,color:T.ink,letterSpacing:"-.3px"}}>{motor.name}</span>
            <span style={{background:cfg.bg,color:cfg.text,padding:"2px 9px",
              borderRadius:20,fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>
              {cfg.emoji} {cfg.label}
            </span>
          </div>
          <span style={{fontSize:12,color:T.inkSub}}>
            {motor.cc}cc · {motor.type==="matic"?"Matik":"Bebek/Manual"} · {usageLabel}
          </span>
        </div>
      </div>

      {st.status==="nodata" ? (
        <div style={{fontSize:12,color:T.inkMute,textAlign:"center",padding:"2px 0",fontStyle:"italic"}}>
          Tap untuk mencatat ganti oli pertama →
        </div>
      ) : (
        <>
          <div style={{background:"#F1F5F9",borderRadius:99,height:6,overflow:"hidden",marginBottom:8}}>
            <div style={{background:cfg.ring,width:`${Math.min(st.ratio*100,100)}%`,
              height:"100%",borderRadius:99,transition:"width .7s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
            <span style={{color:T.inkSub}}>📅 {fmtShort(st.last.date)}</span>
            <span style={{color:cfg.text,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>
              {st.status==="overdue"
                ? `⚠️ ${Math.abs(st.daysUntilDue)}h terlambat`
                : st.kmRemain!=null
                  ? `~${fmtKm(Math.max(0,st.kmRemain))} km`
                  : `${Math.max(0,st.daysUntilDue)} hari lagi`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD VIEW
═══════════════════════════════════════════════════════════ */
function Dashboard({ motors, onSelect, onAdd, notifPerm, onRequestNotif }) {
  const overdue = motors.filter(m=>calcStatus(m).status==="overdue").length;
  const warning = motors.filter(m=>["warning","soon"].includes(calcStatus(m).status)).length;

  return (
    <div style={{paddingBottom:80}}>
      {/* Header */}
      <div style={{background:T.navyGrad,padding:"52px 18px 22px",color:"#fff",
        backgroundImage:"linear-gradient(160deg,#0D1B2A 0%,#1A3355 100%)"}}>
        <div style={{fontSize:12,opacity:.6,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>
          🛢️ OLI REMINDER
        </div>
        <div style={{fontSize:24,fontWeight:800,letterSpacing:"-.5px",marginBottom:2}}>
          {motors.length===0?"Mulai Pantau Motor":"Dashboard Motor"}
        </div>
        <div style={{fontSize:13,opacity:.65}}>
          {motors.length===0?"Tambah motor pertamamu 👇":`${motors.length} motor terpantau`}
        </div>

        {(overdue>0||warning>0) && (
          <div style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",
            borderRadius:12,padding:"10px 14px",marginTop:12,display:"flex",alignItems:"center",gap:10,
            animation:"fadeIn .4s ease"}}>
            <span style={{fontSize:22,animation:overdue>0?"pulse 1.5s infinite":""}}>{overdue>0?"🚨":"⚠️"}</span>
            <span style={{fontSize:13,fontWeight:600}}>
              {overdue>0?`${overdue} motor HARUS ganti oli sekarang!`:`${warning} motor segera perlu perhatian`}
            </span>
          </div>
        )}
      </div>

      <div style={{padding:"14px 14px 0"}}>
        {/* Notification Banner */}
        {notifPerm==="default" && (
          <div style={{background:T.amberBg,border:`1px solid ${T.amberRing}40`,
            borderRadius:14,padding:"12px 14px",marginBottom:12,
            display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>🔔</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:T.amber}}>Aktifkan Notifikasi</div>
              <div style={{fontSize:11,color:T.amber,opacity:.8}}>Agar HP mengingatkanmu saat oli harus diganti</div>
            </div>
            <button onClick={onRequestNotif} className="btn-press" style={{
              background:T.amber,color:"#fff",border:"none",borderRadius:8,
              padding:"7px 13px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              Aktifkan
            </button>
          </div>
        )}

        {/* Motor list */}
        {motors.length===0
          ? <EmptyState onAdd={onAdd}/>
          : <>{motors.map(m=><MotorCard key={m.id} motor={m} onSelect={onSelect}/>)}</>
        }

        {motors.length>0 && (
          <button onClick={onAdd} className="btn-press" style={{
            width:"100%",background:"transparent",
            border:`2px dashed ${T.border}`,borderRadius:16,padding:"15px",
            fontSize:14,color:T.inkMute,fontWeight:600,cursor:"pointer",marginTop:2}}>
            ➕ Tambah Motor Lain
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div style={{textAlign:"center",padding:"48px 16px",animation:"fadeIn .5s ease"}}>
      <div style={{fontSize:72,marginBottom:12,filter:"drop-shadow(0 4px 8px rgba(0,0,0,.1))"}}>🛵</div>
      <div style={{fontSize:20,fontWeight:800,color:T.ink,marginBottom:8,letterSpacing:"-.4px"}}>Belum Ada Motor</div>
      <div style={{fontSize:14,color:T.inkSub,marginBottom:28,lineHeight:1.6}}>
        Tambahkan motormu dan kami akan bantu<br/>ingatkan kapan harus ganti oli!
      </div>
      <button onClick={onAdd} className="btn-press" style={{
        background:T.navyGrad,color:"#fff",border:"none",borderRadius:16,
        padding:"14px 32px",fontSize:15,fontWeight:700,cursor:"pointer",
        boxShadow:"0 6px 20px rgba(13,27,42,.25)"}}>
        ➕ Tambah Motor Pertama
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADD MOTOR FORM — multi-step
═══════════════════════════════════════════════════════════ */
const STEPS = ["Info Motor","Pola Pakai","Ganti Oli Terakhir"];

function AddMotorForm({ initial, onSave, onCancel }) {
  const isEdit = !!initial;
  const lastRec = initial?.oilRecords?.slice(-1)[0];

  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    id:           initial?.id || uid(),
    name:         initial?.name || "",
    brandId:      initial?.brandId || "honda_beat",
    cc:           initial?.cc?.toString() || "110",
    type:         initial?.type || "matic",
    usagePattern: initial?.usagePattern || "city",
    lastDate:     lastRec?.date?.slice(0,10) || new Date().toISOString().slice(0,10),
    lastKm:       lastRec?.km?.toString() || "",
    currentKm:    initial?.currentKm?.toString() || "",
    oilRecords:   initial?.oilRecords || [],
    createdAt:    initial?.createdAt || new Date().toISOString(),
  });

  const set = (k,v) => setF(p=>({...p,[k]:v}));

  const handleBrand = (id) => {
    const b = BRANDS.find(x=>x.id===id);
    set("brandId",id);
    if(b?.cc)   set("cc",b.cc.toString());
    if(b?.type) set("type",b.type);
    if(!isEdit && b?.label!=="Lainnya (custom)") set("name",b.label);
  };

  const canNext = () => {
    if(step===0) return f.name.trim() && f.cc && f.type;
    if(step===1) return !!f.usagePattern;
    if(step===2) return !!f.lastDate;
    return true;
  };

  const submit = () => {
    const newRec = { id:uid(), date:f.lastDate, km:f.lastKm?parseInt(f.lastKm):null, notes:"dicatat via form" };
    const motor  = {
      id: f.id, name: f.name.trim(), brandId: f.brandId,
      cc: parseInt(f.cc), type: f.type, usagePattern: f.usagePattern,
      currentKm: f.currentKm ? parseInt(f.currentKm) : (f.lastKm?parseInt(f.lastKm):null),
      oilRecords: isEdit ? f.oilRecords : (f.lastDate?[newRec]:[]),
      createdAt: f.createdAt,
    };
    onSave(motor);
  };

  const previewRec = f.cc && f.usagePattern ? getRec({cc:parseInt(f.cc),type:f.type,usagePattern:f.usagePattern}) : null;

  return (
    <div style={{background:T.bg,minHeight:"100vh"}}>
      {/* Header */}
      <div style={{background:T.navyGrad,padding:"50px 18px 22px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
          <button onClick={onCancel} style={{background:"rgba(255,255,255,.15)",border:"none",
            borderRadius:10,padding:"8px 13px",color:"#fff",fontSize:16,cursor:"pointer"}}>←</button>
          <span style={{fontSize:17,fontWeight:700}}>{isEdit?"Edit Motor":"Tambah Motor"}</span>
        </div>
        {/* Step pills */}
        <div style={{display:"flex",gap:6}}>
          {STEPS.map((s,i)=>(
            <div key={i} style={{flex:1}}>
              <div style={{height:4,borderRadius:99,background:i<=step?"#fff":"rgba(255,255,255,.25)",
                transition:"background .3s",marginBottom:5}}/>
              <div style={{fontSize:10,letterSpacing:".5px",fontWeight:i===step?700:400,
                color:i<=step?"#fff":"rgba(255,255,255,.5)",textTransform:"uppercase"}}>
                {s}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"14px 14px 100px"}}>
        {/* STEP 0 */}
        {step===0 && (
          <div style={{animation:"fadeIn .3s ease"}}>
            <FC label="Merek Motor" icon="🏍️">
              <select value={f.brandId} onChange={e=>handleBrand(e.target.value)} style={inp}>
                {BRANDS.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </FC>
            <FC label="Nama Panggilan Motor" icon="🏷️">
              <input value={f.name} onChange={e=>set("name",e.target.value)}
                placeholder="cth: Motorku, Beat Harian, Maticku…" style={inp} maxLength={40}/>
            </FC>
            <div style={{display:"flex",gap:10}}>
              <FC label="CC Mesin" icon="⚙️" style={{flex:1}}>
                <select value={f.cc} onChange={e=>set("cc",e.target.value)} style={inp}>
                  {[100,110,113,115,125,150,155,160].map(c=><option key={c} value={c}>{c}cc</option>)}
                </select>
              </FC>
              <FC label="Transmisi" icon="🔧" style={{flex:1}}>
                <select value={f.type} onChange={e=>set("type",e.target.value)} style={inp}>
                  <option value="matic">Matik (CVT)</option>
                  <option value="manual">Bebek / Sport</option>
                </select>
              </FC>
            </div>
            <div style={{background:T.blueBg,border:`1px solid ${T.blueRing}40`,borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:12,fontWeight:700,color:T.blue,marginBottom:4}}>💡 Standar Oli</div>
              <div style={{fontSize:12,color:T.blue,lineHeight:1.5}}>
                {f.type==="matic"
                  ? "✅ Gunakan JASO MB — khusus untuk kopling kering CVT matik."
                  : "⚠️ WAJIB pakai JASO MA/MA2 — untuk kopling basah bebek/sport. Jangan pakai oli mobil!"}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 */}
        {step===1 && (
          <div style={{animation:"fadeIn .3s ease"}}>
            <div style={{fontSize:13,color:T.inkSub,marginBottom:10,fontWeight:500}}>
              Pilih pola pemakaian motor sehari-hari:
            </div>
            {USAGE.map(u=>(
              <div key={u.id} onClick={()=>set("usagePattern",u.id)} className="card-press"
                style={{background:f.usagePattern===u.id?T.navy:T.card,
                  color:f.usagePattern===u.id?"#fff":T.ink,
                  borderRadius:14,padding:"13px 14px",marginBottom:8,cursor:"pointer",
                  border:`1.5px solid ${f.usagePattern===u.id?"transparent":T.border}`,
                  boxShadow:f.usagePattern===u.id?"0 6px 20px rgba(13,27,42,.25)":"0 1px 4px rgba(0,0,0,.05)",
                  transition:"all .2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:24,flexShrink:0}}>{u.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{u.label}</div>
                    <div style={{fontSize:12,opacity:.75}}>{u.desc}</div>
                  </div>
                  {f.usagePattern===u.id && <span style={{fontSize:18,marginLeft:"auto"}}>✓</span>}
                </div>
              </div>
            ))}
            {previewRec && (
              <div style={{background:T.greenBg,border:`1px solid ${T.greenRing}40`,borderRadius:12,padding:"12px 14px",marginTop:4}}>
                <div style={{fontSize:12,fontWeight:700,color:T.green,marginBottom:4}}>📋 Estimasi Interval Ganti Oli</div>
                <div style={{fontSize:13,color:T.green,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>
                  🛣️ {previewRec.km.toLocaleString("id-ID")} km &nbsp;|&nbsp; ⏰ {previewRec.mo} bulan
                </div>
                <div style={{fontSize:11,color:T.green,marginTop:4,opacity:.8}}>Mana yang tercapai lebih dulu, itulah jadwalnya.</div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step===2 && (
          <div style={{animation:"fadeIn .3s ease"}}>
            <FC label="Tanggal Ganti Oli Terakhir" icon="📅">
              <input type="date" value={f.lastDate} onChange={e=>set("lastDate",e.target.value)}
                max={new Date().toISOString().slice(0,10)} style={inp}/>
              <div style={{fontSize:11,color:T.inkMute,marginTop:5}}>Kalau lupa, perkirakan saja tanggalnya.</div>
            </FC>
            <FC label="KM Odometer Saat Ganti (Opsional)" icon="🔢">
              <input type="number" value={f.lastKm} onChange={e=>set("lastKm",e.target.value)}
                placeholder="cth: 12.500" style={inp} min="0"/>
              <div style={{fontSize:11,color:T.inkMute,marginTop:5}}>
                💡 Cek speedometer sekarang untuk akurasi terbaik.
              </div>
            </FC>
            <FC label="KM Odometer Saat Ini (Opsional)" icon="📏">
              <input type="number" value={f.currentKm} onChange={e=>set("currentKm",e.target.value)}
                placeholder="Baca angka di speedometer motor" style={inp} min="0"/>
              <div style={{fontSize:11,color:T.inkMute,marginTop:5}}>
                Kalau diisi, estimasi jadwal ganti lebih akurat.
              </div>
            </FC>

            {f.lastDate && previewRec && (
              <div style={{background:T.navy,borderRadius:16,padding:"16px",color:"#fff",marginTop:4}}>
                <div style={{fontSize:12,fontWeight:700,opacity:.7,letterSpacing:".5px",textTransform:"uppercase",marginBottom:10}}>
                  📋 Rekomendasi Ganti Oli Berikutnya
                </div>
                {(() => {
                  const due = new Date(f.lastDate); due.setMonth(due.getMonth()+previewRec.mo);
                  const lastKmN = f.lastKm?parseInt(f.lastKm):null;
                  return (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:"10px 12px"}}>
                        <div style={{fontSize:11,opacity:.65,marginBottom:4}}>⏰ Tanggal</div>
                        <div style={{fontSize:13,fontWeight:700}}>{fmtShort(due)}</div>
                      </div>
                      <div style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:"10px 12px"}}>
                        <div style={{fontSize:11,opacity:.65,marginBottom:4}}>🛣️ Target KM</div>
                        <div style={{fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace"}}>
                          {lastKmN ? fmtKm(lastKmN+previewRec.km) : `+${fmtKm(previewRec.km)}`} km
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Nav buttons */}
        <div style={{display:"flex",gap:10,marginTop:20}}>
          {step>0 && (
            <button onClick={()=>setStep(s=>s-1)} className="btn-press" style={{
              flex:1,background:T.card,border:`1.5px solid ${T.border}`,borderRadius:14,
              padding:"14px",fontSize:14,fontWeight:600,color:T.inkSub,cursor:"pointer"}}>
              ← Kembali
            </button>
          )}
          <button onClick={()=>step<STEPS.length-1?setStep(s=>s+1):submit()}
            disabled={!canNext()} className="btn-press"
            style={{flex:2,background:canNext()?T.navyGrad:"#CBD5E1",border:"none",
              borderRadius:14,padding:"14px",fontSize:15,fontWeight:700,
              color:canNext()?"#fff":"#94A3B8",cursor:canNext()?"pointer":"not-allowed",
              boxShadow:canNext()?"0 6px 18px rgba(13,27,42,.25)":"none"}}>
            {step<STEPS.length-1?"Lanjut →": (isEdit?"💾 Simpan Perubahan":"✅ Simpan Motor")}
          </button>
        </div>
      </div>
    </div>
  );
}

function FC({ label, icon, children, style }) {
  return (
    <div style={{background:T.card,borderRadius:14,padding:"13px 14px",marginBottom:10,
      boxShadow:"0 1px 4px rgba(0,0,0,.05)",...style}}>
      <div style={{fontSize:11,fontWeight:700,color:T.inkSub,letterSpacing:".5px",
        textTransform:"uppercase",marginBottom:8}}>{icon} {label}</div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DETAIL VIEW
═══════════════════════════════════════════════════════════ */
function DetailView({ motor, onBack, onEdit, onDelete, onUpdateKm, onLogOil }) {
  const st  = calcStatus(motor);
  const cfg = S[st.status];
  const rec = st.rec || getRec(motor);
  const [logModal, setLogModal]   = useState(false);
  const [kmModal,  setKmModal]    = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  const typeIcon = motor.type==="matic"?"🛵":"🏍️";

  return (
    <div style={{background:T.bg,minHeight:"100vh",paddingBottom:30}}>
      {/* Header */}
      <div style={{background:T.navyGrad,padding:"50px 18px 24px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",
            borderRadius:10,padding:"8px 13px",color:"#fff",fontSize:16,cursor:"pointer"}}>←</button>
          <span style={{fontSize:17,fontWeight:700,flex:1,letterSpacing:"-.3px"}}>{motor.name}</span>
          <button onClick={onEdit} style={{background:"rgba(255,255,255,.15)",border:"none",
            borderRadius:10,padding:"7px 13px",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            ✏️ Edit
          </button>
        </div>

        {/* Status hero card */}
        <div style={{background:"rgba(255,255,255,.1)",borderRadius:18,padding:"16px",
          display:"flex",alignItems:"center",gap:16}}>
          <Ring ratio={st.ratio} status={st.status} size={68} icon={typeIcon}/>
          <div style={{flex:1}}>
            <span style={{background:cfg.bg,color:cfg.text,padding:"3px 12px",
              borderRadius:20,fontSize:11,fontWeight:700,display:"inline-block",marginBottom:8}}>
              {cfg.emoji} {cfg.label}
            </span>
            <div style={{fontSize:22,fontWeight:800,letterSpacing:"-.5px",lineHeight:1.1}}>
              {st.status==="nodata" ? "Belum ada data" :
               st.status==="overdue" ? `${Math.abs(st.daysUntilDue)} hari terlambat!` :
               `${Math.max(0,st.daysUntilDue)} hari lagi`}
            </div>
            {st.status!=="nodata" && (
              <div style={{fontSize:12,opacity:.75,marginTop:4,fontFamily:"'DM Mono',monospace"}}>
                {st.kmRemain!=null
                  ? `atau ~${fmtKm(Math.max(0,st.kmRemain))} km lagi`
                  : "Update km untuk estimasi akurat"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{padding:"14px 14px 0"}}>
        {/* Info grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          {[
            {icon:"📅",label:"Ganti Terakhir",val:st.last?fmtShort(st.last.date):"—"},
            {icon:"🔢",label:"KM Saat Ganti",val:st.last?.km!=null?fmtKm(st.last.km):"Tidak dicatat"},
            {icon:"📏",label:"KM Sekarang",val:motor.currentKm!=null?fmtKm(motor.currentKm):"Belum diisi"},
            {icon:"⏰",label:"Target Ganti",val:st.dueDate?fmtShort(st.dueDate):"—"},
          ].map((item,i)=>(
            <div key={i} style={{background:T.card,borderRadius:12,padding:"12px 13px",
              boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
              <div style={{fontSize:11,color:T.inkSub,marginBottom:4,fontWeight:500}}>{item.icon} {item.label}</div>
              <div style={{fontSize:13,fontWeight:700,color:T.ink,fontFamily:i%2===1?"'DM Mono',monospace":""}}>{item.val}</div>
            </div>
          ))}
        </div>

        {/* Recommendation card */}
        <div style={{background:T.card,borderRadius:14,padding:"14px",marginBottom:10,
          boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
          <div style={{fontSize:11,fontWeight:700,color:T.inkSub,letterSpacing:".5px",
            textTransform:"uppercase",marginBottom:10}}>📋 Interval Ganti Oli Rekomendasi</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1,background:T.navy,borderRadius:10,padding:"10px 12px",color:"#fff"}}>
              <div style={{fontSize:11,opacity:.65,marginBottom:4}}>Per Kilometer</div>
              <div style={{fontSize:16,fontWeight:800,fontFamily:"'DM Mono',monospace"}}>
                {rec.km?.toLocaleString("id-ID")} km
              </div>
            </div>
            <div style={{flex:1,background:T.navy,borderRadius:10,padding:"10px 12px",color:"#fff"}}>
              <div style={{fontSize:11,opacity:.65,marginBottom:4}}>Per Waktu</div>
              <div style={{fontSize:16,fontWeight:800,fontFamily:"'DM Mono',monospace"}}>
                {rec.mo} bulan
              </div>
            </div>
          </div>
          <div style={{fontSize:12,color:T.inkSub,lineHeight:1.5}}>
            {motor.type==="matic"
              ? "🔑 Gunakan oli JASO MB, SAE 10W-30 atau 10W-40. Ganti saat salah satu interval tercapai lebih dulu."
              : "🔑 WAJIB JASO MA/MA2, SAE 10W-30 atau 10W-40. Jangan gunakan oli mobil atau JASO MB!"}
          </div>
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:10,marginBottom:10}}>
          <button onClick={()=>setLogModal(true)} className="btn-press" style={{
            flex:2,background:T.navyGrad,border:"none",borderRadius:14,padding:"13px",
            color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",
            boxShadow:"0 4px 14px rgba(13,27,42,.25)"}}>
            🛢️ Catat Ganti Oli
          </button>
          <button onClick={()=>setKmModal(true)} className="btn-press" style={{
            flex:1,background:T.card,border:`1.5px solid ${T.border}`,borderRadius:14,
            padding:"13px",color:T.ink,fontSize:13,fontWeight:600,cursor:"pointer"}}>
            📏 Update KM
          </button>
        </div>

        {/* History */}
        {motor.oilRecords?.length>0 && (
          <div style={{background:T.card,borderRadius:14,padding:"14px",marginBottom:10,
            boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
            <div style={{fontSize:11,fontWeight:700,color:T.inkSub,letterSpacing:".5px",
              textTransform:"uppercase",marginBottom:12}}>🗂️ Riwayat Ganti Oli</div>
            {[...motor.oilRecords].reverse().map((r,i)=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",
                borderBottom:i<motor.oilRecords.length-1?`1px solid ${T.border}`:"none"}}>
                <div style={{width:36,height:36,borderRadius:"50%",
                  background:i===0?T.navy:T.slateBg,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:15,flexShrink:0}}>🛢️</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{fmtDate(r.date)}</div>
                  <div style={{fontSize:12,color:T.inkSub,fontFamily:"'DM Mono',monospace"}}>
                    {r.km!=null?`📏 ${fmtKm(r.km)} km`:"KM tidak dicatat"}
                    {r.oilBrand?` · ${r.oilBrand}`:""}
                  </div>
                </div>
                {i===0 && <span style={{fontSize:10,color:T.primary,fontWeight:700,
                  background:T.primaryLight,padding:"3px 8px",borderRadius:20}}>Terbaru</span>}
              </div>
            ))}
          </div>
        )}

        {/* Delete */}
        {!delConfirm
          ? <button onClick={()=>setDelConfirm(true)} style={{width:"100%",background:"transparent",
              border:`1px solid #FECACA`,borderRadius:12,padding:"11px",color:T.red,
              fontSize:13,fontWeight:600,cursor:"pointer"}}>🗑️ Hapus Motor Ini</button>
          : <div style={{background:T.redBg,border:`1px solid #FECACA`,borderRadius:14,padding:14}}>
              <div style={{fontSize:13,fontWeight:700,color:T.red,marginBottom:10}}>
                Yakin hapus {motor.name}?
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setDelConfirm(false)} style={{flex:1,background:T.card,
                  border:`1px solid ${T.border}`,borderRadius:10,padding:"10px",fontSize:13,
                  fontWeight:600,cursor:"pointer",color:T.ink}}>Batal</button>
                <button onClick={onDelete} style={{flex:1,background:T.red,border:"none",
                  borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer",color:"#fff"}}>
                  Ya, Hapus
                </button>
              </div>
            </div>
        }
      </div>

      {logModal && (
        <LogModal motor={motor} onSave={r=>{onLogOil(r);setLogModal(false);}} onClose={()=>setLogModal(false)}/>
      )}
      {kmModal && (
        <KmModal current={motor.currentKm} onSave={km=>{onUpdateKm(km);setKmModal(false);}} onClose={()=>setKmModal(false)}/>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODALS
═══════════════════════════════════════════════════════════ */
function Modal({ title, onClose, children }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(13,27,42,.6)",zIndex:200,
      display:"flex",alignItems:"flex-end",backdropFilter:"blur(2px)"}}>
      <div style={{background:T.card,borderRadius:"22px 22px 0 0",width:"100%",maxWidth:430,
        margin:"0 auto",maxHeight:"90vh",overflowY:"auto",animation:"slideUp .25s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"16px 16px 12px",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,background:T.card}}>
          <span style={{fontSize:16,fontWeight:700,color:T.ink}}>{title}</span>
          <button onClick={onClose} style={{background:T.slateBg,border:"none",borderRadius:"50%",
            width:32,height:32,cursor:"pointer",fontSize:18,color:T.inkSub,
            display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:"14px 16px 20px"}}>{children}</div>
      </div>
    </div>
  );
}

function LogModal({ motor, onSave, onClose }) {
  const last = motor.oilRecords?.slice(-1)[0];
  const rec  = getRec(motor);
  const [date,     setDate]     = useState(new Date().toISOString().slice(0,10));
  const [km,       setKm]       = useState(motor.currentKm?.toString()||last?.km?.toString()||"");
  const [oilBrand, setOilBrand] = useState("");
  const [notes,    setNotes]    = useState("");

  const save = () => onSave({id:uid(),date,km:km?parseInt(km):null,oilBrand:oilBrand.trim(),notes:notes.trim()});

  return (
    <Modal title="🛢️ Catat Ganti Oli" onClose={onClose}>
      {last?.km && (
        <div style={{background:T.greenBg,border:`1px solid ${T.greenRing}40`,borderRadius:10,
          padding:"10px 12px",marginBottom:14,fontSize:12,color:T.green,fontWeight:600}}>
          ✅ Target KM sebelumnya: {fmtKm(last.km + rec.km)} km
        </div>
      )}
      <div style={{marginBottom:12}}>
        <LabelSmall>📅 Tanggal Ganti Oli</LabelSmall>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          max={new Date().toISOString().slice(0,10)} style={inp}/>
      </div>
      <div style={{marginBottom:12}}>
        <LabelSmall>📏 KM Odometer Sekarang (Opsional)</LabelSmall>
        <input type="number" value={km} onChange={e=>setKm(e.target.value)}
          placeholder="Baca di speedometer motor" style={inp}/>
        <div style={{fontSize:11,color:T.inkMute,marginTop:4}}>
          💡 Lihat speedometer sekarang untuk hasil yang akurat.
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <LabelSmall>🏷️ Merek Oli (Opsional)</LabelSmall>
        <input value={oilBrand} onChange={e=>setOilBrand(e.target.value)}
          placeholder="cth: AHM Oil MPX2, Yamalube…" style={inp}/>
      </div>
      <div style={{marginBottom:16}}>
        <LabelSmall>📝 Catatan (Opsional)</LabelSmall>
        <input value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="cth: ganti di bengkel Pak Budi, Rp 45.000…" style={inp}/>
      </div>
      <button onClick={save} className="btn-press" style={{width:"100%",background:T.navyGrad,border:"none",
        borderRadius:14,padding:"14px",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>
        ✅ Simpan Catatan Ganti Oli
      </button>
    </Modal>
  );
}

function KmModal({ current, onSave, onClose }) {
  const [km, setKm] = useState(current?.toString()||"");
  return (
    <Modal title="📏 Update KM Odometer" onClose={onClose}>
      <div style={{background:T.blueBg,border:`1px solid ${T.blueRing}40`,borderRadius:10,
        padding:"10px 12px",marginBottom:14,fontSize:12,color:T.blue}}>
        💡 Lihat angka di speedometer motormu, lalu masukkan di sini. Ini membuat estimasi lebih akurat.
      </div>
      <LabelSmall>Angka di Speedometer Motor</LabelSmall>
      <input type="number" value={km} onChange={e=>setKm(e.target.value)}
        placeholder="Masukkan angka km" style={{...inp,fontSize:20,fontWeight:800,
          fontFamily:"'DM Mono',monospace",marginBottom:6}}/>
      {km && <div style={{fontSize:13,color:T.inkSub,marginBottom:16,fontFamily:"'DM Mono',monospace"}}>
        {parseInt(km).toLocaleString("id-ID")} km
      </div>}
      <button onClick={()=>km&&onSave(parseInt(km))} disabled={!km} className="btn-press"
        style={{width:"100%",background:km?T.navyGrad:"#CBD5E1",border:"none",borderRadius:14,
          padding:"14px",color:km?"#fff":"#94A3B8",fontSize:15,fontWeight:700,cursor:km?"pointer":"not-allowed"}}>
        💾 Simpan KM
      </button>
    </Modal>
  );
}

function LabelSmall({children}) {
  return <div style={{fontSize:11,fontWeight:700,color:T.inkSub,letterSpacing:".5px",
    textTransform:"uppercase",marginBottom:7}}>{children}</div>;
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS VIEW
═══════════════════════════════════════════════════════════ */
function Settings({ onBack, onExport, onImport, notifPerm, onRequestNotif, count }) {
  const fileRef = useRef(null);

  return (
    <div style={{background:T.bg,minHeight:"100vh",paddingBottom:80}}>
      <div style={{background:T.navyGrad,padding:"50px 18px 22px",color:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.15)",border:"none",
            borderRadius:10,padding:"8px 13px",color:"#fff",fontSize:16,cursor:"pointer"}}>←</button>
          <span style={{fontSize:17,fontWeight:700}}>Pengaturan</span>
        </div>
      </div>

      <div style={{padding:"14px 14px 0"}}>
        <Sec title="🔔 Notifikasi Browser">
          <div style={{fontSize:13,color:T.inkSub,lineHeight:1.6,marginBottom:10}}>
            Aktifkan agar browser mengingatkanmu saat oli harus diganti. Notifikasi muncul sekali
            sehari saat kamu membuka aplikasi ini.
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{flex:1,padding:"8px 12px",borderRadius:8,fontSize:12,fontWeight:700,
              background:notifPerm==="granted"?T.greenBg:notifPerm==="denied"?T.redBg:T.amberBg,
              color:notifPerm==="granted"?T.green:notifPerm==="denied"?T.red:T.amber}}>
              {notifPerm==="granted"?"✅ Aktif":notifPerm==="denied"?"🚫 Diblokir":"⏳ Belum aktif"}
            </span>
            {notifPerm!=="granted"&&notifPerm!=="denied"&&(
              <button onClick={onRequestNotif} style={{background:T.navy,color:"#fff",border:"none",
                borderRadius:8,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                Aktifkan
              </button>
            )}
          </div>
          {notifPerm==="denied"&&(
            <div style={{fontSize:11,color:T.red,lineHeight:1.5}}>
              Cara aktifkan: Klik ikon 🔒 di address bar → Notifikasi → Izinkan
            </div>
          )}
          <div style={{fontSize:11,color:T.inkMute,lineHeight:1.5,marginTop:6}}>
            📱 <b>Tip PWA:</b> Tambahkan halaman ini ke layar utama HP (Add to Home Screen) agar
            terasa seperti aplikasi native dan notifikasi lebih andal.
          </div>
        </Sec>

        <Sec title="💾 Backup & Restore Data">
          <div style={{fontSize:13,color:T.inkSub,lineHeight:1.6,marginBottom:12}}>
            Data tersimpan 100% di browser ini ({count} motor). Export untuk backup ke file,
            lalu import di perangkat lain.
          </div>
          <button onClick={onExport} className="btn-press" style={{width:"100%",background:T.navyGrad,
            border:"none",borderRadius:12,padding:"12px",color:"#fff",fontSize:14,fontWeight:700,
            cursor:"pointer",marginBottom:8}}>
            📤 Export Data (Download .json)
          </button>
          <button onClick={()=>fileRef.current?.click()} className="btn-press" style={{width:"100%",
            background:T.card,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"12px",
            color:T.ink,fontSize:14,fontWeight:600,cursor:"pointer"}}>
            📥 Import Data (Upload .json)
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{display:"none"}} onChange={onImport}/>
          <div style={{fontSize:11,color:T.inkMute,marginTop:8,lineHeight:1.4}}>
            ⚠️ Import menambahkan data (tidak mengganti). Export dulu sebelum import untuk menghindari duplikasi.
          </div>
        </Sec>

        <Sec title="💡 Panduan Cepat Ganti Oli">
          {[
            ["🚦 Macet berat","Ganti tiap 1.500–2.000 km atau 2 bulan"],
            ["🏙️ Harian kota","Ganti tiap 2.500 km atau 3 bulan"],
            ["🛣️ Luar kota","Ganti tiap 3.500–4.000 km atau 4 bulan"],
            ["🏘️ Jarak <5km","Mesin belum panas optimal → ganti tiap 3 bulan!"],
            ["🏖️ Jarang dipakai","Wajib ganti oli max 6 bulan walau km kecil!"],
            ["⚗️ Matic (CVT)","Gunakan JASO MB, 10W-30 atau 10W-40"],
            ["⚙️ Bebek / sport","WAJIB JASO MA/MA2. Jangan pakai oli mobil!"],
            ["🔍 Cek visual","Oli sehat = kuning kecokelatan jernih. Hitam pekat = ganti sekarang!"],
          ].map(([k,v],i)=>(
            <div key={i} style={{display:"flex",gap:8,padding:"8px 0",
              borderBottom:i<7?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:12,fontWeight:700,color:T.ink,minWidth:130,flexShrink:0}}>{k}</span>
              <span style={{fontSize:12,color:T.inkSub,lineHeight:1.4}}>{v}</span>
            </div>
          ))}
        </Sec>

        <Sec title="ℹ️ Tentang">
          <div style={{fontSize:13,color:T.inkSub,lineHeight:1.7}}>
            <b>Oli Reminder v1.0</b><br/>
            Aplikasi gratis berbasis riset tribologi untuk motor 110–150cc Indonesia.<br/><br/>
            📊 Sumber data: PDF analisis komprehensif JASO MA/MB, rekomendasi pabrikan Yamaha, Honda, Suzuki,
            serta data bengkel lapangan Indonesia.<br/><br/>
            🔒 Privasi terjaga — semua data hanya di IndexedDB browser kamu. Tidak ada server, tidak ada akun.
          </div>
        </Sec>
      </div>
    </div>
  );
}

function Sec({ title, children }) {
  return (
    <div style={{background:T.card,borderRadius:16,padding:"14px 15px",marginBottom:10,
      boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
      <div style={{fontSize:13,fontWeight:800,color:T.ink,marginBottom:12,letterSpacing:"-.2px"}}>{title}</div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BOTTOM NAV
═══════════════════════════════════════════════════════════ */
function BottomNav({ view, nav, overdueCount }) {
  const items = [
    {id:"dashboard", icon:"🏠", label:"Beranda"},
    {id:"settings",  icon:"⚙️", label:"Pengaturan"},
  ];
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:430,background:T.card,borderTop:`1px solid ${T.border}`,
      display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)"}}>
      {items.map(item=>(
        <button key={item.id} onClick={()=>nav(item.id)} style={{
          flex:1,border:"none",background:"transparent",padding:"10px 8px",cursor:"pointer",
          display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}}>
          <span style={{fontSize:22,position:"relative"}}>
            {item.icon}
            {item.id==="dashboard" && overdueCount>0 && (
              <span style={{position:"absolute",top:-4,right:-6,background:T.red,color:"#fff",
                borderRadius:99,fontSize:9,fontWeight:700,minWidth:16,height:16,
                display:"flex",alignItems:"center",justifyContent:"center",padding:"0 3px"}}>
                {overdueCount}
              </span>
            )}
          </span>
          <span style={{fontSize:10,fontWeight:view===item.id?700:500,
            color:view===item.id?T.navy:T.inkMute,letterSpacing:".3px"}}>
            {item.label}
          </span>
          {view===item.id && (
            <div style={{position:"absolute",bottom:0,width:28,height:3,
              background:T.navy,borderRadius:"3px 3px 0 0"}}/>
          )}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOADING SCREEN
═══════════════════════════════════════════════════════════ */
function Loading() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",height:"100vh",background:T.bg}}>
      <div style={{fontSize:56,marginBottom:16,animation:"spin 1.5s linear infinite",
        filter:"drop-shadow(0 4px 12px rgba(0,0,0,.15))"}}>🛢️</div>
      <div style={{fontSize:15,fontWeight:700,color:T.ink,letterSpacing:"-.2px"}}>Memuat data…</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════ */
const sortMotors = list => [...list].sort((a,b)=>{
  const o={overdue:0,warning:1,soon:2,good:3,nodata:4};
  return (o[calcStatus(a).status]||4)-(o[calcStatus(b).status]||4);
});

export default function App() {
  const [view,       setView]       = useState("dashboard");
  const [motors,     setMotors]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editing,    setEditing]    = useState(null);
  const [notifPerm,  setNotifPerm]  = useState(typeof Notification!=="undefined"?Notification.permission:"default");
  const [toast,      setToast]      = useState(null);

  const showToast = useCallback((msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  },[]);

  /* Load from IndexedDB */
  useEffect(()=>{
    dbAll().then(d=>{ setMotors(sortMotors(d)); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  /* Daily notification check */
  useEffect(()=>{
    if(loading||motors.length===0||notifPerm!=="granted") return;
    const key="oli_notif_day", today=new Date().toDateString();
    if(localStorage.getItem(key)===today) return;
    motors.forEach(m=>{
      const st=calcStatus(m);
      if(st.status==="overdue") {
        try { new Notification(`🚨 ${m.name} — Ganti Oli Terlambat!`,{body:`Sudah ${st.daysSince} hari. Segera ganti!`}); } catch{}
      } else if(st.status==="warning") {
        try { new Notification(`⚠️ ${m.name} — Oli Segera Diganti`,{body:`Sisa ~${Math.max(0,st.daysUntilDue)} hari lagi.`}); } catch{}
      }
    });
    localStorage.setItem(key,today);
  },[loading,motors,notifPerm]);

  const save = async (motor) => {
    const m={...motor,updatedAt:new Date().toISOString()};
    await dbPut(m);
    setMotors(prev=>sortMotors(prev.some(x=>x.id===m.id)?prev.map(x=>x.id===m.id?m:x):[m,...prev]));
  };

  const remove = async (id) => {
    await dbDel(id);
    setMotors(prev=>prev.filter(m=>m.id!==id));
    showToast("Motor dihapus","info");
  };

  const requestNotif = async () => {
    if(!("Notification" in window)){showToast("Browser tidak mendukung notifikasi","error");return;}
    const p=await Notification.requestPermission();
    setNotifPerm(p);
    p==="granted"?showToast("Notifikasi diaktifkan! 🎉"):showToast("Notifikasi tidak diizinkan","error");
  };

  const handleExport = () => {
    const json=JSON.stringify({version:1,exported:new Date().toISOString(),motors},null,2);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([json],{type:"application/json"}));
    a.download=`oli-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showToast("Data diekspor!");
  };

  const handleImport = async (e) => {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      try{
        const {motors:imp}=JSON.parse(ev.target.result);
        for(const m of imp) await dbPut(m);
        const all=await dbAll();
        setMotors(sortMotors(all));
        showToast(`${imp.length} motor diimpor!`);
      } catch { showToast("File tidak valid","error"); }
    };
    reader.readAsText(file);
    e.target.value="";
  };

  const selected = motors.find(m=>m.id===selectedId);
  const overdueCount = motors.filter(m=>calcStatus(m).status==="overdue").length;

  if(loading) return <><GlobalStyles/><Loading/></>;

  return (
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:T.bg,
      fontFamily:"'Lexend',sans-serif",position:"relative"}}>
      <GlobalStyles/>
      {toast && <Toast message={toast.msg} type={toast.type}/>}

      {view==="dashboard" && (
        <Dashboard motors={motors} onSelect={id=>{setSelectedId(id);setView("detail");}}
          onAdd={()=>{setEditing(null);setView("add");}}
          notifPerm={notifPerm} onRequestNotif={requestNotif}/>
      )}

      {view==="add" && (
        <AddMotorForm initial={editing}
          onSave={async m=>{
            await save(m);
            showToast(editing?"Motor diperbarui! ✏️":"Motor ditambahkan! 🎉");
            setView(editing?"detail":"dashboard");
          }}
          onCancel={()=>setView(editing?"detail":"dashboard")}/>
      )}

      {view==="detail" && selected && (
        <DetailView motor={selected}
          onBack={()=>setView("dashboard")}
          onEdit={()=>{setEditing(selected);setView("add");}}
          onDelete={async()=>{await remove(selected.id);setView("dashboard");}}
          onUpdateKm={async km=>{
            await save({...selected,currentKm:km});
            showToast("KM diperbarui! 📏");
          }}
          onLogOil={async rec=>{
            await save({...selected,
              oilRecords:[...(selected.oilRecords||[]),rec],
              currentKm:rec.km||selected.currentKm});
            showToast("Catatan ganti oli disimpan! 🛢️");
          }}/>
      )}

      {view==="settings" && (
        <Settings onBack={()=>setView("dashboard")} onExport={handleExport}
          onImport={handleImport} notifPerm={notifPerm} onRequestNotif={requestNotif}
          count={motors.length}/>
      )}

      {(view==="dashboard"||view==="settings") && (
        <BottomNav view={view} nav={setView} overdueCount={overdueCount}/>
      )}
    </div>
  );
}
