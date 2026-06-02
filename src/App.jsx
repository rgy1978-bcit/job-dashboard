import { useState, useMemo, useEffect, useRef } from "react";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase     = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const RICK_COLOR  = "#2563eb";
const ELLEN_COLOR = "#16a34a";

const PROFILES = {
  rick: {
    label:"Rick", sub:"Education & Instructional Design", color:RICK_COLOR, emoji:"📚",
    manual_links:[
      { label:"AECT Job Board",          url:"https://www.aect.org/careers/job_board.php",                                                                note:"Educational Communications & Technology" },
      { label:"Teamed — L&D",            url:"https://www.teamedforlearning.com/job-board/",                                                              note:"Instructional design & eLearning" },
      { label:"EdTechJobs.io",           url:"https://www.edtechjobs.io/",                                                                                note:"K-12, Higher Ed, Corporate EdTech" },
      { label:"Inside Higher Ed",        url:"https://careers.insidehighered.com/jobs/instructional-design/",                                             note:"University roles" },
      { label:"HigherEdJobs Pittsburgh", url:"https://www.higheredjobs.com/search/advanced_action.cfm?Keyword=business+AI+education&Region=41&PosType=1", note:"Pittsburgh region faculty roles" },
      { label:"Chronicle of Higher Ed",  url:"https://jobs.chronicle.com/jobs/faculty/?location=pittsburgh",                                              note:"Premium higher ed faculty board" },
      { label:"Dice — EdTech",           url:"https://www.dice.com/jobs?q=instructional+technology&location=Pittsburgh%2C+PA",                            note:"Tech-focused, good for CS roles" },
      { label:"CareerBuilder",           url:"https://www.careerbuilder.com/jobs?keywords=instructional+technology&location=Pittsburgh%2C+PA",            note:"2.4M+ applications/month" },
      { label:"Monster — Pittsburgh",    url:"https://www.monster.com/jobs/search?q=instructional+designer&where=Pittsburgh%2C+PA",                       note:"Broad coverage" },
    ],
  },
  ellen: {
    label:"Ellen", sub:"PT — Non-Clinical Transition", color:ELLEN_COLOR, emoji:"🏥",
    manual_links:[
      { label:"APTA Career Center",           url:"https://jobs.apta.org/",                                                                               note:"Filter by non-clinical" },
      { label:"The Non-Clinical PT",          url:"https://thenonclinicalpt.com/jobs/",                                                                    note:"Curated PT career transitions" },
      { label:"Vivian Health — Remote PT",    url:"https://www.vivian.com/therapy/physical-therapist/remote/",                                             note:"UR, case mgmt & non-clinical" },
      { label:"LinkedIn — Remote UR PT",      url:"https://www.linkedin.com/jobs/search/?keywords=utilization+review+physical+therapist&f_WT=2",           note:"Pre-filtered to Remote" },
      { label:"ZipRecruiter — Remote UR PA",  url:"https://www.ziprecruiter.com/Jobs/Remote-Utilization-Review-Physical-Therapist/--in-Pennsylvania",      note:"~$1,600-$2,073/wk avg in PA" },
      { label:"FlexJobs — Remote Healthcare", url:"https://www.flexjobs.com/jobs/healthcare",                                                              note:"100K vetted remote listings" },
      { label:"CareerBuilder — Pittsburgh",   url:"https://www.careerbuilder.com/jobs?keywords=physical+therapist&location=Pittsburgh%2C+PA",              note:"High volume, broad coverage" },
      { label:"USAJobs — VA Pittsburgh",      url:"https://www.usajobs.gov/Search/Results?k=physical+therapist&l=Pittsburgh%2C+PA",                       note:"VA Pittsburgh is a major PT employer" },
    ],
  },
};

const CATEGORIES = {
  "Insurance / UR":      ["utilization review physical therapist remote","clinical reviewer physical therapist","prior authorization physical therapist","clinical appeals writer physical therapist","utilization management therapist"],
  "Case Management":     ["case manager physical therapist remote","care coordinator physical therapist"],
  "Med Device / Sales":  ["medical device clinical specialist physical therapist","orthopedic sales physical therapist"],
  "Admin / Operations":  ["rehab director physical therapist","clinical operations physical therapist"],
  "Education":           ["adjunct physical therapy faculty remote","physical therapy clinical education coordinator","clinical education specialist physical therapist"],
  "Health Tech":         ["health coach remote physical therapist","wellness coordinator physical therapist"],
  "Pediatric / Clinical":["pediatric physical therapist","physical therapist pediatrics","pediatric pt outpatient","physical therapist childrens hospital","early intervention physical therapist","school physical therapist"],
};
const CAT_COLORS = {
  "Insurance / UR":      {bg:"#eff6ff",text:"#1d4ed8",border:"#bfdbfe"},
  "Case Management":     {bg:"#f0fdf4",text:"#15803d",border:"#bbf7d0"},
  "Med Device / Sales":  {bg:"#fff7ed",text:"#c2410c",border:"#fed7aa"},
  "Admin / Operations":  {bg:"#fdf4ff",text:"#7e22ce",border:"#e9d5ff"},
  "Education":           {bg:"#fffbeb",text:"#b45309",border:"#fde68a"},
  "Health Tech":         {bg:"#f0fdfa",text:"#0f766e",border:"#99f6e4"},
  "Pediatric / Clinical":{bg:"#fdf2f8",text:"#9d174d",border:"#f9a8d4"},
};
const NON_CLINICAL = ["Insurance / UR","Case Management","Med Device / Sales","Admin / Operations","Education","Health Tech"];

function jobCategory(kw) {
  if (!kw) return null;
  for (const [cat,kws] of Object.entries(CATEGORIES)) if (kws.includes(kw.toLowerCase())) return cat;
  return null;
}

const SRC_COLORS = {Adzuna:"#2563eb",SimplyHired:"#7c3aed",Indeed:"#d97706",LinkedIn:"#0284c7",HigherEdJobs:"#ea580c",PTJobSite:"#0891b2",USAJobs:"#dc2626",TinyFish:"#f97316"};
const srcColor = s => { if (!s) return "#6b7280"; for (const [k,v] of Object.entries(SRC_COLORS)) if (s.includes(k)) return v; return "#6b7280"; };
const fmtSal = (min,max) => { if (!min&&!max) return null; const f=n=>"$"+Math.round(n/1000)+"k"; return min&&max?f(min)+" - "+f(max)+"/yr":min?f(min)+"+/yr":"up to "+f(max)+"/yr"; };
const daysAgo = iso => { if (!iso) return null; const d=Math.floor((Date.now()-new Date(iso))/86400000); return d===0?"Today":d===1?"Yesterday":d+"d ago"; };
function detectJobType(job) {
  const t=((job.title||"")+" "+(job.description||"")).toLowerCase();
  if (t.includes("adjunct")) return "Adjunct";
  if (t.includes("part-time")||t.includes("part time")) return "Part-time";
  if (t.includes("contract")||t.includes("per diem")) return "Contract";
  return "Full-time";
}

const PGH_ZONES = {
  "Within Pittsburgh":  ["pittsburgh"],
  "Within 20 miles":    ["pittsburgh","cranberry","wexford","bethel park","mt lebanon","canonsburg","monroeville","carnegie","coraopolis","moon","robinson","ross","shadyside","squirrel hill","oakland","lawrenceville","bloomfield"],
  "Within 40 miles":    ["pittsburgh","cranberry","wexford","bethel park","mt lebanon","canonsburg","monroeville","carnegie","coraopolis","moon","robinson","ross","shadyside","squirrel hill","oakland","lawrenceville","bloomfield","butler","greensburg","new castle","beaver","washington","connellsville","latrobe","indiana","kittanning","mckeesport"],
  "Statewide PA":       [],
};
function matchesLocation(job,cityText,zone) {
  if (job.remote) return true;
  const loc=(job.location||"").toLowerCase();
  if (cityText.trim()) return loc.includes(cityText.trim().toLowerCase());
  if (zone&&zone!=="Anywhere") {
    if (zone==="Statewide PA") return loc.includes("pa")||loc.includes("pennsylvania")||loc==="";
    const cities=PGH_ZONES[zone]||[];
    if (!cities.length) return true;
    return cities.some(c=>loc.includes(c));
  }
  return true;
}

function isExcluded(job, exclusions) {
  if (!exclusions||exclusions.length===0) return false;
  const text = ((job.title||"")+" "+(job.company||"")+" "+(job.description||"")).toLowerCase();
  return exclusions.some(ex => text.includes(ex.toLowerCase()));
}

const defaultFilters = () => ({salaryMin:0,jobType:"Any",includeKeyword:"",workSetting:"All",nonClinicalOnly:false,hideClinical:false,cityText:"",radiusZone:"Anywhere"});

// ── Supabase helpers ───────────────────────────────────────────────────────
const EXCL_TABLE = "job_exclusions";

async function loadStatusesFromDB() {
  if (!supabase) return {};
  const {data,error} = await supabase.from("job_statuses").select("job_id,profile,status");
  if (error||!data) return {};
  const map={};
  data.forEach(r=>{map[r.job_id]=r.status;});
  return map;
}
async function saveStatusToDB(jobId,profile,status) {
  if (!supabase) return;
  if (status==="none") { await supabase.from("job_statuses").delete().eq("job_id",jobId); }
  else { await supabase.from("job_statuses").upsert({job_id:jobId,profile,status,updated_at:new Date().toISOString()},{onConflict:"job_id,profile"}); }
}
async function loadExclusionsFromDB(profile) {
  if (!supabase) return [];
  const {data,error} = await supabase.from(EXCL_TABLE).select("word").eq("profile",profile);
  if (error||!data) return [];
  return data.map(r=>r.word);
}
async function addExclusionToDB(profile,word) {
  if (!supabase) return;
  await supabase.from(EXCL_TABLE).upsert({profile,word},{onConflict:"profile,word"});
}
async function removeExclusionFromDB(profile,word) {
  if (!supabase) return;
  await supabase.from(EXCL_TABLE).delete().eq("profile",profile).eq("word",word);
}

// ── Exclusions Panel ───────────────────────────────────────────────────────
function ExclusionsPanel({ profile, exclusions, onAdd, onRemove }) {
  const [input, setInput] = useState("");
  const pc = profile.color;

  const handleAdd = () => {
    const w = input.trim().toLowerCase();
    if (!w||exclusions.includes(w)) { setInput(""); return; }
    onAdd(w);
    setInput("");
  };

  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>
        🚫 Excluded Words
      </div>
      <div style={{fontSize:11,color:"#94a3b8",marginBottom:8}}>
        Jobs containing these words will be hidden automatically.
      </div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleAdd()}
          placeholder='e.g. "elementary" or "travel"'
          style={{flex:1,padding:"7px 10px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:12,fontFamily:"inherit",outline:"none"}}
          onFocus={e=>e.target.style.borderColor=pc}
          onBlur={e=>e.target.style.borderColor="#e2e8f0"}
        />
        <button onClick={handleAdd} disabled={!input.trim()} style={{
          padding:"7px 12px",borderRadius:8,border:"none",background:pc,color:"white",
          fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:input.trim()?"pointer":"not-allowed",
          opacity:input.trim()?1:0.5,
        }}>+ Add</button>
      </div>
      {exclusions.length===0 ? (
        <div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic"}}>No exclusions yet</div>
      ) : (
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {exclusions.map(w=>(
            <span key={w} style={{
              display:"inline-flex",alignItems:"center",gap:5,
              padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,
              background:"#fef2f2",color:"#dc2626",border:"1px solid #fca5a5",
            }}>
              {w}
              <span onClick={()=>onRemove(w)} style={{cursor:"pointer",fontSize:14,lineHeight:1,marginLeft:2}}>×</span>
            </span>
          ))}
        </div>
      )}
      {exclusions.length>0&&(
        <div style={{fontSize:11,color:"#94a3b8",marginTop:8}}>
          {exclusions.length} word{exclusions.length>1?"s":""} excluded · synced across devices
        </div>
      )}
    </div>
  );
}

// ── Filter Panel (desktop + mobile shared) ─────────────────────────────────
function FilterPanel({ profile, filters, setFilters, isEllen, exclusions, onAddExclusion, onRemoveExclusion, onClose }) {
  const pc = profile.color;
  const SALARY_OPTS = [0,40000,50000,60000,70000,80000,90000,100000];
  const JOB_TYPES   = ["Any","Full-time","Part-time","Contract","Adjunct"];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {onClose&&(
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>Filters & Exclusions</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8",padding:"4px"}}>×</button>
        </div>
      )}

      {/* Location */}
      <div>
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Location</div>
        <input value={filters.cityText} onChange={e=>setFilters(f=>({...f,cityText:e.target.value,radiusZone:"Anywhere"}))}
          placeholder="City name (e.g. Pittsburgh)"
          style={{width:"100%",padding:"7px 10px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:12,fontFamily:"inherit",outline:"none",marginBottom:8}}
          onFocus={e=>e.target.style.borderColor=pc} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
        />
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:6}}>Or Pittsburgh radius:</div>
        {["Anywhere",...Object.keys(PGH_ZONES)].map(r=>(
          <label key={r} style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#374151",cursor:"pointer",marginBottom:4}}>
            <input type="radio" name={"radius_"+profile.label} checked={filters.radiusZone===r&&!filters.cityText}
              onChange={()=>setFilters(f=>({...f,radiusZone:r,cityText:""}))} style={{accentColor:pc}}/>
            {r}
          </label>
        ))}
      </div>

      {/* Salary */}
      <div>
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>
          Min Salary {filters.salaryMin>0?"— $"+Math.round(filters.salaryMin/1000)+"k+":"— Any"}
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {SALARY_OPTS.map(s=>(
            <button key={s} onClick={()=>setFilters(f=>({...f,salaryMin:s}))} style={{padding:"4px 9px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:500,border:"1.5px solid "+(filters.salaryMin===s?pc:"#e2e8f0"),background:filters.salaryMin===s?pc+"22":"white",color:filters.salaryMin===s?pc:"#475569"}}>
              {s===0?"Any":"$"+Math.round(s/1000)+"k+"}
            </button>
          ))}
        </div>
      </div>

      {/* Job Type — Rick only */}
      {!isEllen&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Job Type</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {JOB_TYPES.map(t=>(
              <button key={t} onClick={()=>setFilters(f=>({...f,jobType:t}))} style={{padding:"4px 9px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:500,border:"1.5px solid "+(filters.jobType===t?pc:"#e2e8f0"),background:filters.jobType===t?pc+"22":"white",color:filters.jobType===t?pc:"#475569"}}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Must include — Rick only */}
      {!isEllen&&(
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Must Include Keyword</div>
          <input value={filters.includeKeyword} onChange={e=>setFilters(f=>({...f,includeKeyword:e.target.value}))}
            placeholder='e.g. "Pittsburgh" or "AI"'
            style={{width:"100%",padding:"7px 10px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:12,fontFamily:"inherit",outline:"none"}}
            onFocus={e=>e.target.style.borderColor=pc} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
          />
        </div>
      )}

      {/* Ellen-specific */}
      {isEllen&&(
        <>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Work Setting</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {["All","Remote only","Onsite only"].map(t=>(
                <button key={t} onClick={()=>setFilters(f=>({...f,workSetting:t}))} style={{padding:"4px 9px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:500,border:"1.5px solid "+(filters.workSetting===t?pc:"#e2e8f0"),background:filters.workSetting===t?pc+"22":"white",color:filters.workSetting===t?pc:"#475569"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Role Type</div>
            <label style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#374151",cursor:"pointer",marginBottom:8}}>
              <input type="checkbox" checked={filters.nonClinicalOnly} onChange={e=>setFilters(f=>({...f,nonClinicalOnly:e.target.checked}))} style={{accentColor:pc}}/>
              Non-clinical only
            </label>
            <label style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#374151",cursor:"pointer"}}>
              <input type="checkbox" checked={filters.hideClinical} onChange={e=>setFilters(f=>({...f,hideClinical:e.target.checked}))} style={{accentColor:pc}}/>
              Hide clinical (keep pediatric)
            </label>
          </div>
        </>
      )}

      {/* Exclusions */}
      <div style={{borderTop:"1px solid #f1f5f9",paddingTop:18}}>
        <ExclusionsPanel profile={profile} exclusions={exclusions} onAdd={onAddExclusion} onRemove={onRemoveExclusion}/>
      </div>

      <button onClick={()=>setFilters(defaultFilters())} style={{padding:"8px",borderRadius:9,border:"1.5px solid #e2e8f0",background:"white",color:"#64748b",fontSize:12,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>
        Reset all filters
      </button>
    </div>
  );
}

// ── Job Card ───────────────────────────────────────────────────────────────
function JobCard({ job, profileColor, isEllen, status, onStatus }) {
  const [open, setOpen]       = useState(false);
  const [swipeX, setSwipeX]   = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(null);

  const pay=fmtSal(job.salary_min,job.salary_max), age=daysAgo(job.posted_at), cat=jobCategory(job.keyword), cc=cat?CAT_COLORS[cat]:null, type=detectJobType(job);
  const isSaved=status==="saved", isApplied=status==="applied", isDismissed=status==="dismissed";

  const onTouchStart=e=>{startX.current=e.touches[0].clientX;setSwiping(true);};
  const onTouchMove=e=>{if(startX.current===null)return;setSwipeX(Math.max(-120,Math.min(120,e.touches[0].clientX-startX.current)));};
  const onTouchEnd=()=>{
    if(swipeX>60){onStatus("saved");setSwipeX(0);}
    else if(swipeX<-60){onStatus("dismissed");setSwipeX(0);}
    else setSwipeX(0);
    setSwiping(false);startX.current=null;
  };

  return (
    <div style={{position:"relative",marginBottom:2,overflow:"hidden",borderRadius:14}}>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",pointerEvents:"none",zIndex:0}}>
        <span style={{fontSize:28,opacity:swipeX>30?1:0.15,transition:"opacity .15s"}}>👍</span>
        <span style={{fontSize:28,opacity:swipeX<-30?1:0.15,transition:"opacity .15s"}}>👎</span>
      </div>
      <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onClick={()=>setOpen(!open)}
        style={{position:"relative",zIndex:1,background:isDismissed?"#f8fafc":"white",borderRadius:14,overflow:"hidden",cursor:"pointer",
          border:open?"1.5px solid "+profileColor:isSaved?"1.5px solid #86efac":isApplied?"1.5px solid #93c5fd":"1.5px solid #e2e8f0",
          borderLeft:"3px solid "+(isSaved?"#16a34a":isApplied?"#2563eb":isDismissed?"#e2e8f0":profileColor),
          opacity:isDismissed?0.5:1,transform:"translateX("+swipeX+"px)",
          transition:swiping?"none":"transform .3s ease, opacity .2s",
          boxShadow:open?"0 4px 12px rgba(0,0,0,0.06)":"none",
        }}>
        <div style={{display:"flex",gap:12,padding:"14px 16px"}}>
          <div style={{width:42,height:42,borderRadius:10,border:"1.5px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,background:"#f8fafc"}}>
            {job.profile==="rick"?"📚":"🏥"}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{fontSize:14,fontWeight:700,color:isDismissed?"#94a3b8":"#0f172a",lineHeight:1.3}}>{job.title}</div>
              <div style={{display:"flex",gap:5,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                <button title="Save" onClick={()=>onStatus(isSaved?"none":"saved")} style={{width:30,height:30,borderRadius:"50%",border:"1.5px solid "+(isSaved?"#86efac":"#e2e8f0"),background:isSaved?"#f0fdf4":"white",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{isSaved?"💚":"🤍"}</button>
                <button title="Dismiss" onClick={()=>onStatus(isDismissed?"none":"dismissed")} style={{width:30,height:30,borderRadius:"50%",border:"1.5px solid "+(isDismissed?"#fca5a5":"#e2e8f0"),background:isDismissed?"#fef2f2":"white",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
            </div>
            <div style={{fontSize:12,color:"#475569",marginTop:2}}>{job.company}{job.location?" · "+job.location:""}</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8,alignItems:"center"}}>
              {job.remote&&<span style={{background:"#dcfce7",color:"#15803d",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700}}>⌂ Remote</span>}
              {type&&<span style={{background:"#f1f5f9",color:"#374151",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{type}</span>}
              {pay&&<span style={{background:"#eff6ff",color:"#1d4ed8",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{pay}</span>}
              {isEllen&&cc&&cat&&<span style={{background:cc.bg,color:cc.text,border:"1px solid "+cc.border,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{cat}</span>}
              {job.source&&<span style={{background:"#f8fafc",color:srcColor(job.source),padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{job.source}</span>}
              {age&&<span style={{color:"#94a3b8",fontSize:11}}>{age}</span>}
              {isApplied&&<span style={{background:"#eff6ff",color:"#2563eb",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700}}>✓ Applied</span>}
            </div>
          </div>
        </div>
        {open&&(
          <div style={{padding:"12px 16px 14px",borderTop:"1px solid #f1f5f9",fontSize:13,color:"#475569",lineHeight:1.7}}>
            {job.description||"Click the link below to view the full job description."}
            <div style={{display:"flex",gap:10,marginTop:12,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
              <a href={job.url} target="_blank" rel="noreferrer" style={{color:profileColor,fontSize:13,fontWeight:600,textDecoration:"none"}}>View full listing →</a>
              {isSaved&&!isApplied&&<button onClick={()=>onStatus("applied")} style={{background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Mark as Applied ✓</button>}
              {isApplied&&<button onClick={()=>onStatus("saved")} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fca5a5",borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Undo Applied</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Keyword Search ─────────────────────────────────────────────────────────
function KeywordSearch({ profile, onResults, onSaveKeyword }) {
  const [kw,setKw]=useState(""), [loading,setLoading]=useState(false), [msg,setMsg]=useState("");
  const pc=profile.color;
  const search=async()=>{
    if(!kw.trim())return;
    setLoading(true);setMsg("");
    try{
      const res=await fetch("/api/search-jobs?keyword="+encodeURIComponent(kw)+"&profile="+profile.label);
      const data=await res.json();
      if(res.ok&&data.jobs?.length){onResults(data.jobs,kw);setMsg(data.jobs.length+" results — see Search Results tab");}
      else setMsg("No results found — try a different keyword.");
    }catch{setMsg("Search unavailable.");}
    setLoading(false);
  };
  return (
    <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:14,marginBottom:14}}>
      <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>🔍 Custom Keyword Search</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <input value={kw} onChange={e=>setKw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()}
          placeholder="Type a keyword and press Search…"
          style={{flex:1,minWidth:160,padding:"8px 11px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none"}}
          onFocus={e=>e.target.style.borderColor=pc} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
        />
        <button onClick={search} disabled={loading||!kw.trim()} style={{padding:"8px 16px",borderRadius:8,border:"none",background:pc,color:"white",fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>{loading?"Searching…":"Search"}</button>
        <button onClick={()=>{if(kw.trim()){onSaveKeyword(kw.trim());setMsg('"'+kw+'" saved to future scrapes!');}}} disabled={!kw.trim()}
          style={{padding:"8px 12px",borderRadius:8,border:"1.5px solid "+pc,background:"white",color:pc,fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:"pointer"}}>+ Save</button>
      </div>
      {msg&&<div style={{marginTop:7,fontSize:12,color:"#64748b"}}>{msg}</div>}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ profile, profileJobs, isEllen }) {
  const bySource={};
  profileJobs.forEach(j=>{bySource[j.source]=(bySource[j.source]||0)+1;});
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:14}}>
        <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Also Check Manually</div>
        {profile.manual_links.map((lnk,i)=>(
          <a key={i} href={lnk.url} target="_blank" rel="noreferrer"
            style={{display:"block",padding:"8px 10px",borderRadius:9,border:"1.5px solid #e2e8f0",marginBottom:6,textDecoration:"none",transition:"border-color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=profile.color}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}
          >
            <div style={{fontSize:12,fontWeight:600,color:profile.color}}>{lnk.label} ↗</div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{lnk.note}</div>
          </a>
        ))}
      </div>
      <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:14}}>
        <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Auto-Scraped Sources</div>
        {Object.entries(bySource).map(([src,n])=>(
          <div key={src} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #f1f5f9",fontSize:12}}>
            <span style={{color:srcColor(src),fontWeight:600}}>{src}</span>
            <span style={{background:"#f1f5f9",color:"#64748b",fontSize:11,fontWeight:600,padding:"2px 6px",borderRadius:10}}>{n}</span>
          </div>
        ))}
      </div>
      {isEllen&&(
        <div style={{background:"white",border:"1.5px solid #e2e8f0",borderRadius:14,padding:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Top UR Employers</div>
          {["eviCore (Evernorth)","Acentra Health","Optum / UnitedHealth","BCBS plans","Cigna / Evernorth","Aetna / CVS Health"].map(e=>(
            <div key={e} style={{padding:"5px 0",borderBottom:"1px solid #f1f5f9",fontSize:12,color:"#374151"}}>{e}</div>
          ))}
          <div style={{fontSize:11,color:"#94a3b8",marginTop:7}}>Most roles fully remote with PA license</div>
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [active,setActive]               = useState("rick");
  const [mainTab,setMainTab]             = useState("browse");
  const [search,setSearch]               = useState("");
  const [sort,setSort]                   = useState("newest");
  const [filters,setFilters]             = useState(defaultFilters());
  const [showFilters,setShowFilters]     = useState(true);
  const [showMobileFilters,setShowMobileFilters] = useState(false);
  const [showDismissed,setShowDismissed] = useState(false);
  const [allJobs,setAllJobs]             = useState([]);
  const [searchResults,setSearchResults] = useState([]);
  const [searchKeyword,setSearchKeyword] = useState("");
  const [dataLoading,setDataLoading]     = useState(true);
  const [lastUpdated,setLastUpdated]     = useState("");
  const [statuses,setStatuses]           = useState({});
  const [syncMsg,setSyncMsg]             = useState("");
  const [exclusions,setExclusions]       = useState({rick:[],ellen:[]});
  const [refreshState,setRefresh]        = useState("idle");
  const [refreshMsg,setRefreshMsg]       = useState("");

  // Load jobs
  useEffect(()=>{
    fetch("/jobs.json").then(r=>r.json()).then(data=>{
      setAllJobs(data.jobs||[]);
      if(data.updated_at){const d=new Date(data.updated_at);setLastUpdated(d.toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}));}
      setDataLoading(false);
    }).catch(()=>setDataLoading(false));
  },[]);

  // Load statuses + exclusions from Supabase
  useEffect(()=>{
    loadStatusesFromDB().then(s=>setStatuses(s));
    Promise.all([
      loadExclusionsFromDB("rick"),
      loadExclusionsFromDB("ellen"),
    ]).then(([r,e])=>setExclusions({rick:r,ellen:e}));
  },[]);

  // Close mobile drawer on resize to desktop
  useEffect(()=>{
    const handler=()=>{ if(window.innerWidth>900) setShowMobileFilters(false); };
    window.addEventListener("resize",handler);
    return ()=>window.removeEventListener("resize",handler);
  },[]);

  const handleStatus=async(jobId,newStatus)=>{
    const updated={...statuses};
    if(newStatus==="none") delete updated[jobId]; else updated[jobId]=newStatus;
    setStatuses(updated);
    setSyncMsg("Saving…");
    await saveStatusToDB(jobId,active,newStatus);
    setSyncMsg("✓ Saved");
    setTimeout(()=>setSyncMsg(""),2000);
  };

  const handleAddExclusion=async(word)=>{
    const updated={...exclusions,[active]:[...exclusions[active],word]};
    setExclusions(updated);
    await addExclusionToDB(active,word);
  };

  const handleRemoveExclusion=async(word)=>{
    const updated={...exclusions,[active]:exclusions[active].filter(w=>w!==word)};
    setExclusions(updated);
    await removeExclusionFromDB(active,word);
  };

  const handleRefresh=async()=>{
    setRefresh("loading");setRefreshMsg("");
    try{
      const res=await fetch("/api/refresh",{method:"POST"});
      const data=await res.json();
      if(res.ok){setRefresh("success");setRefreshMsg("Scraper running — new results in ~2 min. Reload to see them.");}
      else{setRefresh("error");setRefreshMsg(data.error||"Something went wrong.");}
    }catch{setRefresh("error");setRefreshMsg("Could not reach server.");}
    setTimeout(()=>{setRefresh("idle");setRefreshMsg("");},8000);
  };

  const handleSaveKeyword=async(kw)=>{
    try{await fetch("/api/save-keyword",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({keyword:kw,profile:active})});}catch{}
  };

  const handleSearchResults=(jobs,kw)=>{setSearchResults(jobs);setSearchKeyword(kw);setMainTab("search");};

  const profile    = PROFILES[active];
  const isEllen    = active==="ellen";
  const pc         = profile.color;
  const profileJobs= allJobs.filter(j=>j.profile===active);
  const curExclusions = exclusions[active]||[];

  const applyFilters=jobs=>{
    let out=jobs;
    // Exclusions first
    out=out.filter(j=>!isExcluded(j,curExclusions));
    if(filters.salaryMin>0) out=out.filter(j=>!j.salary_max||(j.salary_max>=filters.salaryMin)||(j.salary_min>=filters.salaryMin));
    if(!isEllen&&filters.jobType!=="Any") out=out.filter(j=>detectJobType(j)===filters.jobType);
    if(!isEllen&&filters.includeKeyword.trim()){const kw=filters.includeKeyword.trim().toLowerCase();out=out.filter(j=>(j.title||"").toLowerCase().includes(kw)||(j.description||"").toLowerCase().includes(kw)||(j.location||"").toLowerCase().includes(kw));}
    if(isEllen&&filters.workSetting==="Remote only") out=out.filter(j=>j.remote);
    if(isEllen&&filters.workSetting==="Onsite only") out=out.filter(j=>!j.remote);
    if(isEllen&&filters.nonClinicalOnly) out=out.filter(j=>{const cat=jobCategory(j.keyword);return cat&&NON_CLINICAL.includes(cat);});
    if(isEllen&&filters.hideClinical) out=out.filter(j=>jobCategory(j.keyword)!=="Pediatric / Clinical");
    if(filters.cityText.trim()||(filters.radiusZone&&filters.radiusZone!=="Anywhere")) out=out.filter(j=>matchesLocation(j,filters.cityText,filters.radiusZone));
    if(search.trim()){const q=search.toLowerCase();out=out.filter(j=>(j.title||"").toLowerCase().includes(q)||(j.company||"").toLowerCase().includes(q)||(j.location||"").toLowerCase().includes(q)||(j.description||"").toLowerCase().includes(q));}
    return out;
  };

  const sortJobs=jobs=>{
    if(sort==="newest") return [...jobs].sort((a,b)=>(b.posted_at||"")>(a.posted_at||"")?1:-1);
    if(sort==="salary") return [...jobs].sort((a,b)=>(b.salary_max||0)-(a.salary_max||0));
    return jobs;
  };

  const browseJobs  = useMemo(()=>{let out=applyFilters(profileJobs);if(!showDismissed)out=out.filter(j=>statuses[j.id]!=="dismissed");return sortJobs(out);},[active,allJobs,filters,search,sort,statuses,showDismissed,exclusions]);
  const savedJobs   = useMemo(()=>sortJobs(profileJobs.filter(j=>statuses[j.id]==="saved")),[active,allJobs,statuses,sort]);
  const appliedJobs = useMemo(()=>sortJobs(profileJobs.filter(j=>statuses[j.id]==="applied")),[active,allJobs,statuses,sort]);
  const dismissedCount=profileJobs.filter(j=>statuses[j.id]==="dismissed").length;
  const remoteCount=profileJobs.filter(j=>j.remote).length;
  const topSalary=profileJobs.filter(j=>j.salary_max).length?"$"+Math.round(Math.max(...profileJobs.filter(j=>j.salary_max).map(j=>j.salary_max))/1000)+"k":"—";
  const excludedCount=profileJobs.filter(j=>isExcluded(j,curExclusions)).length;

  const switchProfile=id=>{setActive(id);setSearch("");setFilters(defaultFilters());setMainTab("browse");setSearchResults([]);setSearchKeyword("");setShowMobileFilters(false);};

  const activeFilters=[];
  if(filters.salaryMin>0) activeFilters.push({label:"Min $"+Math.round(filters.salaryMin/1000)+"k",reset:()=>setFilters(f=>({...f,salaryMin:0}))});
  if(filters.jobType!=="Any") activeFilters.push({label:filters.jobType,reset:()=>setFilters(f=>({...f,jobType:"Any"}))});
  if(filters.includeKeyword) activeFilters.push({label:'Must include "'+filters.includeKeyword+'"',reset:()=>setFilters(f=>({...f,includeKeyword:""}))});
  if(filters.workSetting!=="All") activeFilters.push({label:filters.workSetting,reset:()=>setFilters(f=>({...f,workSetting:"All"}))});
  if(filters.nonClinicalOnly) activeFilters.push({label:"Non-clinical only",reset:()=>setFilters(f=>({...f,nonClinicalOnly:false}))});
  if(filters.hideClinical) activeFilters.push({label:"Hide clinical",reset:()=>setFilters(f=>({...f,hideClinical:false}))});
  if(filters.cityText) activeFilters.push({label:"City: "+filters.cityText,reset:()=>setFilters(f=>({...f,cityText:""}))});
  if(filters.radiusZone!=="Anywhere"&&!filters.cityText) activeFilters.push({label:filters.radiusZone,reset:()=>setFilters(f=>({...f,radiusZone:"Anywhere"}))});

  const totalActiveFilters = activeFilters.length + curExclusions.length;

  const refreshBtnStyle={display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:20,border:"1.5px solid "+(refreshState==="success"?"#86efac":refreshState==="error"?"#fca5a5":refreshState==="loading"?"#93c5fd":"#e2e8f0"),background:refreshState==="success"?"#f0fdf4":refreshState==="error"?"#fef2f2":refreshState==="loading"?"#eff6ff":"white",color:refreshState==="success"?"#16a34a":refreshState==="error"?"#dc2626":refreshState==="loading"?"#2563eb":"#374151",fontSize:13,fontWeight:600,fontFamily:"inherit",cursor:refreshState==="loading"?"not-allowed":"pointer",transition:"all .2s"};

  const TabBtn=({id,label,count})=>(
    <button onClick={()=>setMainTab(id)} style={{padding:"8px 14px",borderRadius:9,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",background:mainTab===id?pc:"transparent",color:mainTab===id?"white":"#64748b",transition:"all .2s",whiteSpace:"nowrap"}}>
      {label}{count>0&&<span style={{background:mainTab===id?"rgba(255,255,255,0.3)":pc+"22",color:mainTab===id?"white":pc,borderRadius:20,padding:"1px 7px",fontSize:11,marginLeft:4}}>{count}</span>}
    </button>
  );

  return (
    <div style={{fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",background:"#f8fafc",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .filter-col{display:block}
        .sidebar-col{display:block}
        @media(max-width:900px){
          .main-layout{grid-template-columns:1fr!important}
          .sidebar-col{display:none!important}
          .filter-col{display:none!important}
          .mobile-filter-btn{display:flex!important}
        }
        @media(max-width:700px){
          .stats-grid{grid-template-columns:repeat(3,1fr)!important}
          .profile-tabs{flex-direction:column!important}
        }
        .mobile-filter-btn{display:none}
      `}</style>

      {/* Mobile filter drawer overlay */}
      {showMobileFilters&&(
        <>
          <div onClick={()=>setShowMobileFilters(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:50}}/>
          <div style={{position:"fixed",bottom:0,left:0,right:0,background:"white",borderRadius:"20px 20px 0 0",padding:"20px 20px 40px",zIndex:51,maxHeight:"85vh",overflowY:"auto",animation:"slideUp .3s ease"}}>
            <FilterPanel
              profile={profile} filters={filters} setFilters={setFilters} isEllen={isEllen}
              exclusions={curExclusions} onAddExclusion={handleAddExclusion} onRemoveExclusion={handleRemoveExclusion}
              onClose={()=>setShowMobileFilters(false)}
            />
          </div>
        </>
      )}

      {/* Topbar */}
      <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"0 16px",position:"sticky",top:0,zIndex:10}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
          <div style={{fontSize:18,fontWeight:700,color:"#0f172a",letterSpacing:"-0.5px"}}>Job<span style={{color:pc}}>Board</span></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {syncMsg&&<span style={{fontSize:12,color:"#16a34a",fontWeight:600}}>{syncMsg}</span>}
            <div style={{fontSize:12,color:"#64748b",background:"#f1f5f9",padding:"4px 10px",borderRadius:20,border:"1px solid #e2e8f0"}}>{lastUpdated?"Updated "+lastUpdated:"Auto Mon/Wed/Fri"}</div>
            <button style={refreshBtnStyle} onClick={handleRefresh} disabled={refreshState==="loading"}>
              <span style={refreshState==="loading"?{display:"inline-block",animation:"spin 1s linear infinite"}:{}}>⟳</span>
              {refreshState==="loading"?"Refreshing…":refreshState==="success"?"Done!":refreshState==="error"?"Failed":"Refresh Jobs"}
            </button>
          </div>
        </div>
        {refreshMsg&&<div style={{maxWidth:1200,margin:"0 auto",paddingBottom:10}}><div style={{fontSize:12,padding:"6px 12px",borderRadius:8,background:refreshState==="success"?"#f0fdf4":"#fef2f2",color:refreshState==="success"?"#16a34a":"#dc2626",border:"1px solid "+(refreshState==="success"?"#86efac":"#fca5a5")}}>{refreshMsg}</div></div>}
      </div>

      <div style={{maxWidth:1200,margin:"0 auto",padding:"24px 16px 60px"}}>

        {/* Profile tabs */}
        <div className="profile-tabs" style={{display:"flex",gap:8,marginBottom:20}}>
          {Object.entries(PROFILES).map(([id,p])=>(
            <button key={id} onClick={()=>switchProfile(id)} style={{flex:1,padding:"14px 18px",borderRadius:14,cursor:"pointer",textAlign:"left",border:"2px solid "+(active===id?p.color:"#e2e8f0"),background:active===id?(id==="rick"?"#eff6ff":"#f0fdf4"):"white",transition:"all .2s"}}>
              <div style={{fontSize:20,marginBottom:5}}>{p.emoji}</div>
              <div style={{fontSize:15,fontWeight:700,color:active===id?p.color:"#0f172a"}}>{p.label}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{p.sub}</div>
            </button>
          ))}
        </div>

        {/* Last updated bar */}
        <div style={{background:"white",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span>🕐</span>
            <span style={{fontSize:13,fontWeight:600,color:"#374151"}}>Last updated: </span>
            <span style={{fontSize:13,color:pc,fontWeight:700}}>{lastUpdated||"Not yet synced"}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:12,color:"#94a3b8"}}>Auto Mon · Wed · Fri at 3am ET</span>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}></span>
            <span style={{fontSize:12,color:"#22c55e",fontWeight:600}}>Live</span>
          </div>
        </div>

        {dataLoading?(
          <div style={{textAlign:"center",padding:"80px 20px",color:"#94a3b8",fontSize:16}}>Loading jobs…</div>
        ):(
          <>
            {/* Stats */}
            <div className="stats-grid" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
              {[
                ["Total",profileJobs.length,pc],
                ["Remote",remoteCount,"#16a34a"],
                ["Top Salary",topSalary,"#d97706"],
                ["💚 Saved",savedJobs.length,"#16a34a"],
                ["✓ Applied",appliedJobs.length,"#2563eb"],
              ].map(([lbl,val,col])=>(
                <div key={lbl} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontSize:22,fontWeight:700,color:col,letterSpacing:-1}}>{val}</div>
                  <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginTop:2}}>{lbl}</div>
                </div>
              ))}
            </div>

            {/* Main tabs */}
            <div style={{background:"white",border:"1px solid #e2e8f0",borderRadius:12,padding:"6px",marginBottom:16,display:"inline-flex",gap:4,flexWrap:"wrap"}}>
              <TabBtn id="browse"  label="Browse"    count={browseJobs.length}/>
              <TabBtn id="saved"   label="💚 Saved"  count={savedJobs.length}/>
              <TabBtn id="applied" label="✓ Applied" count={appliedJobs.length}/>
              {searchResults.length>0&&<TabBtn id="search" label={"🔍 "+searchKeyword} count={searchResults.length}/>}
            </div>

            {/* Active filter badges */}
            {(activeFilters.length>0||curExclusions.length>0)&&mainTab==="browse"&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
                <span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>Active:</span>
                {activeFilters.map((f,i)=>(
                  <span key={i} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,background:pc+"22",color:pc,border:"1px solid "+pc+"44"}}>
                    {f.label}<span onClick={f.reset} style={{cursor:"pointer",fontSize:14,lineHeight:1}}>×</span>
                  </span>
                ))}
                {curExclusions.map(w=>(
                  <span key={w} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,background:"#fef2f2",color:"#dc2626",border:"1px solid #fca5a5"}}>
                    🚫 {w}<span onClick={()=>handleRemoveExclusion(w)} style={{cursor:"pointer",fontSize:14,lineHeight:1}}>×</span>
                  </span>
                ))}
                {totalActiveFilters>0&&<button onClick={()=>{setFilters(defaultFilters());}} style={{fontSize:12,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Clear filters</button>}
              </div>
            )}

            <div className="main-layout" style={{display:"grid",gridTemplateColumns:"240px 1fr 210px",gap:14,alignItems:"flex-start"}}>

              {/* Desktop filter column */}
              <div className="filter-col">
                {mainTab==="browse"&&(
                  <>
                    <button onClick={()=>setShowFilters(!showFilters)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151",fontFamily:"inherit",marginBottom:8}}>
                      <span>🔧 Filters {totalActiveFilters>0?"("+totalActiveFilters+")":""}</span>
                      <span>{showFilters?"▲":"▼"}</span>
                    </button>
                    {showFilters&&(
                      <div style={{background:"white",border:"1px solid #e2e8f0",borderRadius:14,padding:18}}>
                        <FilterPanel
                          profile={profile} filters={filters} setFilters={setFilters} isEllen={isEllen}
                          exclusions={curExclusions} onAddExclusion={handleAddExclusion} onRemoveExclusion={handleRemoveExclusion}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Main content */}
              <div>
                {/* Mobile filter button */}
                {mainTab==="browse"&&(
                  <button className="mobile-filter-btn" onClick={()=>setShowMobileFilters(true)}
                    style={{width:"100%",padding:"10px 16px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"white",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151",fontFamily:"inherit",marginBottom:12,alignItems:"center",justifyContent:"space-between"}}>
                    <span>🔧 Filters & Exclusions {totalActiveFilters>0?"("+totalActiveFilters+" active)":""}</span>
                    <span style={{color:"#94a3b8"}}>▲</span>
                  </button>
                )}

                <KeywordSearch profile={profile} onResults={handleSearchResults} onSaveKeyword={handleSaveKeyword}/>

                {/* Browse */}
                {mainTab==="browse"&&(
                  <>
                    <div style={{background:"white",border:"1px solid #e2e8f0",borderRadius:12,padding:"10px 12px",marginBottom:12,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                      <input value={search} onChange={e=>setSearch(e.target.value)}
                        placeholder={"Search "+profile.label+"'s listings…"}
                        style={{flex:1,minWidth:160,padding:"7px 10px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none"}}
                        onFocus={e=>e.target.style.borderColor=pc} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
                      />
                      <button onClick={()=>setSort("newest")} style={{padding:"5px 11px",borderRadius:20,border:"1.5px solid "+(sort==="newest"?pc:"#e2e8f0"),background:sort==="newest"?pc+"22":"white",color:sort==="newest"?pc:"#475569",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Newest</button>
                      <button onClick={()=>setSort("salary")} style={{padding:"5px 11px",borderRadius:20,border:"1.5px solid "+(sort==="salary"?pc:"#e2e8f0"),background:sort==="salary"?pc+"22":"white",color:sort==="salary"?pc:"#475569",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Salary</button>
                    </div>
                    <div style={{fontSize:12,color:"#94a3b8",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                      <span>{browseJobs.length} listings{excludedCount>0?" · "+excludedCount+" excluded":""}{totalActiveFilters>0?" · "+totalActiveFilters+" filter"+(totalActiveFilters>1?"s":"")+" active":""}</span>
                      {dismissedCount>0&&<button onClick={()=>setShowDismissed(!showDismissed)} style={{fontSize:12,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>{showDismissed?"Hide":"Show"} {dismissedCount} dismissed</button>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {browseJobs.length===0
                        ?<div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8",fontSize:14,background:"white",borderRadius:14,border:"1px solid #e2e8f0"}}>
                          No listings match your filters.
                          <div style={{marginTop:8}}><button onClick={()=>setFilters(defaultFilters())} style={{color:pc,background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,textDecoration:"underline"}}>Clear filters</button></div>
                        </div>
                        :browseJobs.map(job=><JobCard key={job.id} job={job} profileColor={pc} isEllen={isEllen} status={statuses[job.id]} onStatus={s=>handleStatus(job.id,s)}/>)
                      }
                    </div>
                  </>
                )}

                {/* Search Results */}
                {mainTab==="search"&&(
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <div style={{fontSize:13,color:"#94a3b8"}}>🔍 {searchResults.length} results for <strong>"{searchKeyword}"</strong></div>
                      <button onClick={()=>{setSearchResults([]);setSearchKeyword("");setMainTab("browse");}} style={{fontSize:12,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Clear</button>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {searchResults.map(job=><JobCard key={job.id} job={job} profileColor={pc} isEllen={isEllen} status={statuses[job.id]} onStatus={s=>handleStatus(job.id,s)}/>)}
                    </div>
                  </div>
                )}

                {/* Saved */}
                {mainTab==="saved"&&(
                  <div>
                    <div style={{fontSize:13,color:"#94a3b8",marginBottom:12}}>💚 {savedJobs.length} saved — synced across all your devices</div>
                    {savedJobs.length===0
                      ?<div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8",fontSize:14,background:"white",borderRadius:14,border:"1px solid #e2e8f0"}}>No saved jobs yet. Browse and tap 💚 to save ones you like!</div>
                      :<div style={{display:"flex",flexDirection:"column",gap:8}}>{savedJobs.map(job=><JobCard key={job.id} job={job} profileColor={pc} isEllen={isEllen} status={statuses[job.id]} onStatus={s=>handleStatus(job.id,s)}/>)}</div>
                    }
                  </div>
                )}

                {/* Applied */}
                {mainTab==="applied"&&(
                  <div>
                    <div style={{fontSize:13,color:"#94a3b8",marginBottom:12}}>✓ {appliedJobs.length} applied — synced across all devices</div>
                    {appliedJobs.length===0
                      ?<div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8",fontSize:14,background:"white",borderRadius:14,border:"1px solid #e2e8f0"}}>No applications yet. Save a job then click "Mark as Applied"!</div>
                      :<div style={{display:"flex",flexDirection:"column",gap:8}}>{appliedJobs.map(job=><JobCard key={job.id} job={job} profileColor={pc} isEllen={isEllen} status={statuses[job.id]} onStatus={s=>handleStatus(job.id,s)}/>)}</div>
                    }
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="sidebar-col">
                <Sidebar profile={profile} profileJobs={profileJobs} isEllen={isEllen}/>
              </div>
            </div>
          </>
        )}

        <div style={{marginTop:40,textAlign:"center",color:"#94a3b8",fontSize:12}}>
          Swipe right to save · Swipe left to dismiss · Filters & exclusions sync across devices
        </div>
      </div>
    </div>
  );
}
