import { useState, useMemo, useEffect } from "react";

const RICK_COLOR  = "#2563eb";
const ELLEN_COLOR = "#16a34a";

const PROFILES = {
  rick: {
    label:"Rick", sub:"Education & Instructional Design", color:RICK_COLOR, emoji:"📚",
    manual_links:[
      { label:"AECT Job Board",          url:"https://www.aect.org/careers/job_board.php",                                                                       note:"Educational Communications & Technology" },
      { label:"Teamed — L&D",            url:"https://www.teamedforlearning.com/job-board/",                                                                     note:"Instructional design & eLearning" },
      { label:"EdTechJobs.io",           url:"https://www.edtechjobs.io/",                                                                                       note:"K-12, Higher Ed, Corporate EdTech" },
      { label:"Inside Higher Ed",        url:"https://careers.insidehighered.com/jobs/instructional-design/",                                                    note:"University roles" },
      { label:"HigherEdJobs Pittsburgh", url:"https://www.higheredjobs.com/search/advanced_action.cfm?Keyword=business+AI+education&Region=41&PosType=1",        note:"Pittsburgh region faculty roles" },
      { label:"Chronicle of Higher Ed",  url:"https://jobs.chronicle.com/jobs/faculty/?location=pittsburgh",                                                     note:"Premium higher ed faculty board" },
      { label:"Dice — EdTech",           url:"https://www.dice.com/jobs?q=instructional+technology&location=Pittsburgh%2C+PA",                                   note:"Tech-focused, good for CS roles" },
      { label:"CareerBuilder",           url:"https://www.careerbuilder.com/jobs?keywords=instructional+technology&location=Pittsburgh%2C+PA",                   note:"2.4M+ applications/month" },
      { label:"Monster — Pittsburgh",    url:"https://www.monster.com/jobs/search?q=instructional+designer&where=Pittsburgh%2C+PA",                              note:"Broad coverage" },
    ],
  },
  ellen: {
    label:"Ellen", sub:"PT — Non-Clinical Transition", color:ELLEN_COLOR, emoji:"🏥",
    manual_links:[
      { label:"APTA Career Center",           url:"https://jobs.apta.org/",                                                                                      note:"Filter by non-clinical" },
      { label:"The Non-Clinical PT",          url:"https://thenonclinicalpt.com/jobs/",                                                                           note:"Curated PT career transitions" },
      { label:"Vivian Health — Remote PT",    url:"https://www.vivian.com/therapy/physical-therapist/remote/",                                                    note:"UR, case mgmt & non-clinical" },
      { label:"LinkedIn — Remote UR PT",      url:"https://www.linkedin.com/jobs/search/?keywords=utilization+review+physical+therapist&f_WT=2",                  note:"Pre-filtered to Remote" },
      { label:"ZipRecruiter — Remote UR PA",  url:"https://www.ziprecruiter.com/Jobs/Remote-Utilization-Review-Physical-Therapist/--in-Pennsylvania",             note:"~$1,600-$2,073/wk avg in PA" },
      { label:"FlexJobs — Remote Healthcare", url:"https://www.flexjobs.com/jobs/healthcare",                                                                     note:"100K vetted remote listings" },
      { label:"CareerBuilder — Pittsburgh",   url:"https://www.careerbuilder.com/jobs?keywords=physical+therapist&location=Pittsburgh%2C+PA",                    note:"High volume, broad coverage" },
      { label:"USAJobs — VA Pittsburgh",      url:"https://www.usajobs.gov/Search/Results?k=physical+therapist&l=Pittsburgh%2C+PA",                              note:"VA Pittsburgh is a major PT employer" },
    ],
  },
};

const CLINICAL_KEYWORDS = [
  "pediatric physical therapist","physical therapist pediatrics","pediatric pt outpatient",
  "physical therapist childrens hospital","early intervention physical therapist","school physical therapist",
];
const NON_CLINICAL_CATEGORIES = ["Insurance / UR","Case Management","Med Device / Sales","Admin / Operations","Education","Health Tech"];

const CATEGORIES = {
  "Insurance / UR":      ["utilization review physical therapist remote","clinical reviewer physical therapist","prior authorization physical therapist","clinical appeals writer physical therapist","utilization management therapist"],
  "Case Management":     ["case manager physical therapist remote","care coordinator physical therapist"],
  "Med Device / Sales":  ["medical device clinical specialist physical therapist","orthopedic sales physical therapist"],
  "Admin / Operations":  ["rehab director physical therapist","clinical operations physical therapist"],
  "Education":           ["adjunct physical therapy faculty remote","physical therapy clinical education coordinator","clinical education specialist physical therapist"],
  "Health Tech":         ["health coach remote physical therapist","wellness coordinator physical therapist"],
  "Pediatric / Clinical":CLINICAL_KEYWORDS,
};

const CAT_COLORS = {
  "Insurance / UR":      { bg:"#eff6ff", text:"#1d4ed8", border:"#bfdbfe" },
  "Case Management":     { bg:"#f0fdf4", text:"#15803d", border:"#bbf7d0" },
  "Med Device / Sales":  { bg:"#fff7ed", text:"#c2410c", border:"#fed7aa" },
  "Admin / Operations":  { bg:"#fdf4ff", text:"#7e22ce", border:"#e9d5ff" },
  "Education":           { bg:"#fffbeb", text:"#b45309", border:"#fde68a" },
  "Health Tech":         { bg:"#f0fdfa", text:"#0f766e", border:"#99f6e4" },
  "Pediatric / Clinical":{ bg:"#fdf2f8", text:"#9d174d", border:"#f9a8d4" },
};

// Pittsburgh-area cities by approximate radius
const PGH_RADIUS_ZONES = {
  "Within Pittsburgh city": ["pittsburgh"],
  "Within 20 miles": ["pittsburgh","cranberry","wexford","south hills","bethel park","mt lebanon","mt. lebanon","canonsburg","monroeville","wilkinsburg","edgewood","swissvale","homestead","carnegie","coraopolis","moon township","moon","robinson","ross","north hills","shadyside","squirrel hill","oakland","lawrenceville","bloomfield"],
  "Within 40 miles": ["pittsburgh","cranberry","wexford","south hills","bethel park","mt lebanon","mt. lebanon","canonsburg","monroeville","wilkinsburg","edgewood","swissvale","homestead","carnegie","coraopolis","moon township","moon","robinson","ross","north hills","shadyside","squirrel hill","oakland","lawrenceville","bloomfield","butler","greensburg","new castle","beaver","washington","connellsville","latrobe","indiana","kittanning","uniontown","charleroi","mckeesport","clairton","duquesne"],
  "Statewide PA": [], // empty = no city filter, just "PA" check
};

function jobCategory(kw) {
  if (!kw) return null;
  for (const [cat, kws] of Object.entries(CATEGORIES)) {
    if (kws.includes(kw.toLowerCase())) return cat;
  }
  return null;
}
function isClinical(kw) {
  return CLINICAL_KEYWORDS.includes((kw || "").toLowerCase());
}

const SRC_COLORS = {
  Adzuna:"#2563eb", SimplyHired:"#7c3aed", Indeed:"#d97706",
  LinkedIn:"#0284c7", HigherEdJobs:"#ea580c", PTJobSite:"#0891b2", USAJobs:"#dc2626",
};
const srcColor = s => { if (!s) return "#6b7280"; for (const [k,v] of Object.entries(SRC_COLORS)) { if (s.includes(k)) return v; } return "#6b7280"; };
const fmtSal = (min,max) => { if (!min&&!max) return null; const f=n=>"$"+Math.round(n/1000)+"k"; return min&&max?f(min)+" - "+f(max)+"/yr":min?f(min)+"+/yr":"up to "+f(max)+"/yr"; };
const daysAgo = iso => { if (!iso) return null; const d=Math.floor((Date.now()-new Date(iso))/86400000); return d===0?"Today":d===1?"Yesterday":d+"d ago"; };

// ── Job Type detector ──────────────────────────────────────────────────────
function detectJobType(job) {
  const text = ((job.title||"")+" "+(job.description||"")).toLowerCase();
  if (text.includes("adjunct")) return "Adjunct";
  if (text.includes("part-time")||text.includes("part time")) return "Part-time";
  if (text.includes("contract")||text.includes("per diem")) return "Contract";
  if (text.includes("full-time")||text.includes("full time")) return "Full-time";
  return "Full-time"; // default assumption
}

// ── Location match ─────────────────────────────────────────────────────────
function matchesLocation(job, cityText, radiusZone) {
  const loc = (job.location || "").toLowerCase();
  if (job.remote) return true; // always include remote jobs

  if (cityText.trim()) {
    return loc.includes(cityText.trim().toLowerCase());
  }

  if (radiusZone && radiusZone !== "Anywhere") {
    if (radiusZone === "Statewide PA") {
      return loc.includes("pa") || loc.includes("pennsylvania") || loc === "";
    }
    const cities = PGH_RADIUS_ZONES[radiusZone] || [];
    if (cities.length === 0) return true;
    return cities.some(c => loc.includes(c));
  }

  return true;
}

// ── Components ─────────────────────────────────────────────────────────────
function Chip({ label, active, onClick, color, small }) {
  return (
    <button onClick={onClick} style={{
      padding: small ? "3px 9px" : "5px 13px",
      borderRadius:20, cursor:"pointer", fontSize: small ? 12 : 13,
      fontFamily:"inherit", fontWeight:500,
      border:"1.5px solid "+(active?(color||"#2563eb"):"#e2e8f0"),
      background: active?(color?color+"22":"#eff6ff"):"white",
      color: active?(color||"#2563eb"):"#475569",
      transition:"all .15s", whiteSpace:"nowrap",
    }}>{label}</button>
  );
}

function ActiveFilterBadge({ label, onRemove, color }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600,
      background:color+"22", color, border:"1px solid "+color+"44",
    }}>
      {label}
      <span onClick={onRemove} style={{ cursor:"pointer", fontSize:14, lineHeight:1 }}>×</span>
    </span>
  );
}

function JobCard({ job, profileColor, isEllen }) {
  const [open, setOpen] = useState(false);
  const age  = daysAgo(job.posted_at);
  const pay  = fmtSal(job.salary_min, job.salary_max);
  const cat  = jobCategory(job.keyword);
  const cc   = cat ? CAT_COLORS[cat] : null;
  const sc   = srcColor(job.source);
  const type = detectJobType(job);

  return (
    <div onClick={()=>setOpen(!open)} style={{
      background:"white", borderRadius:14, overflow:"hidden", cursor:"pointer",
      border: open ? "1.5px solid "+profileColor : "1.5px solid #e2e8f0",
      borderLeft:"3px solid "+profileColor,
      boxShadow: open ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
      transition:"border-color .15s, box-shadow .15s",
    }}>
      <div style={{ display:"flex", gap:14, padding:"16px 18px" }}>
        <div style={{ width:44, height:44, borderRadius:10, border:"1.5px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0, background:"#f8fafc" }}>
          {job.profile==="rick"?"📚":"🏥"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", lineHeight:1.3, marginBottom:3 }}>{job.title}</div>
          <div style={{ fontSize:13, color:"#475569" }}>{job.company}{job.location?" · "+job.location:""}</div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:9, alignItems:"center" }}>
            {job.remote && <span style={{ background:"#dcfce7", color:"#15803d", padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:700 }}>⌂ Remote</span>}
            {type && <span style={{ background:"#f1f5f9", color:"#374151", padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:600 }}>{type}</span>}
            {pay && <span style={{ background:"#eff6ff", color:"#1d4ed8", padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:600 }}>{pay}</span>}
            {isEllen && cc && cat && <span style={{ background:cc.bg, color:cc.text, border:"1px solid "+cc.border, padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:600 }}>{cat}</span>}
            {job.source && <span style={{ background:"#f8fafc", color:sc, padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:600 }}>{job.source}</span>}
            {age && <span style={{ color:"#94a3b8", fontSize:11 }}>{age}</span>}
          </div>
        </div>
      </div>
      {open && (
        <div style={{ padding:"14px 18px 16px", borderTop:"1px solid #f1f5f9", fontSize:14, color:"#475569", lineHeight:1.7 }}>
          {job.description || "Click the link below to view the full job description."}
          <div style={{ marginTop:10 }}>
            <a href={job.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
              style={{ color:profileColor, fontSize:13, fontWeight:600, textDecoration:"none" }}>
              View full listing →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({ active, profile, filters, setFilters, isEllen }) {
  const pc = profile.color;
  const JOB_TYPES = ["Any","Full-time","Part-time","Contract","Adjunct"];
  const SALARY_OPTS = [0,40000,50000,60000,70000,80000,90000,100000];
  const RADIUS_OPTS = ["Anywhere",...Object.keys(PGH_RADIUS_ZONES)];

  return (
    <div style={{
      background:"white", border:"1px solid #e2e8f0", borderRadius:14,
      padding:20, display:"flex", flexDirection:"column", gap:20,
    }}>
      <div style={{ fontWeight:700, fontSize:15, color:"#0f172a" }}>Filters</div>

      {/* ── Location ── */}
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Location</div>
        <input
          value={filters.cityText}
          onChange={e=>setFilters(f=>({...f,cityText:e.target.value,radiusZone:"Anywhere"}))}
          placeholder="City name (e.g. Pittsburgh)"
          style={{ width:"100%", padding:"8px 12px", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:8 }}
          onFocus={e=>e.target.style.borderColor=pc}
          onBlur={e=>e.target.style.borderColor="#e2e8f0"}
        />
        <div style={{ fontSize:12, color:"#94a3b8", marginBottom:6 }}>Or filter by distance from Pittsburgh</div>
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {RADIUS_OPTS.map(r=>(
            <label key={r} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#374151", cursor:"pointer" }}>
              <input type="radio" name="radius" checked={filters.radiusZone===r&&!filters.cityText}
                onChange={()=>setFilters(f=>({...f,radiusZone:r,cityText:""}))}
                style={{ accentColor:pc }} />
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* ── Salary Minimum ── */}
      <div>
        <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
          Min Salary {filters.salaryMin > 0 ? "— $"+Math.round(filters.salaryMin/1000)+"k+" : "— Any"}
        </div>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {SALARY_OPTS.map(s=>(
            <Chip key={s} small label={s===0?"Any":"$"+Math.round(s/1000)+"k+"} active={filters.salaryMin===s}
              onClick={()=>setFilters(f=>({...f,salaryMin:s}))} color={pc} />
          ))}
        </div>
      </div>

      {/* ── Job Type (Rick only) ── */}
      {!isEllen && (
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Job Type</div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {JOB_TYPES.map(t=>(
              <Chip key={t} small label={t} active={filters.jobType===t} onClick={()=>setFilters(f=>({...f,jobType:t}))} color={pc} />
            ))}
          </div>
        </div>
      )}

      {/* ── Keyword Include (Rick only) ── */}
      {!isEllen && (
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Must Include Keyword</div>
          <input
            value={filters.includeKeyword}
            onChange={e=>setFilters(f=>({...f,includeKeyword:e.target.value}))}
            placeholder="e.g. Pittsburgh, adjunct, AI"
            style={{ width:"100%", padding:"8px 12px", border:"1.5px solid #e2e8f0", borderRadius:9, fontSize:13, fontFamily:"inherit", outline:"none" }}
            onFocus={e=>e.target.style.borderColor=pc}
            onBlur={e=>e.target.style.borderColor="#e2e8f0"}
          />
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:4 }}>Only show jobs containing this word in title or description</div>
        </div>
      )}

      {/* ── Ellen-specific ── */}
      {isEllen && (
        <>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Work Setting</div>
            <div style={{ display:"flex", gap:5 }}>
              {["All","Remote only","Onsite only"].map(t=>(
                <Chip key={t} small label={t} active={filters.workSetting===t} onClick={()=>setFilters(f=>({...f,workSetting:t}))} color={pc} />
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Role Type</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#374151", cursor:"pointer" }}>
                <input type="checkbox" checked={filters.nonClinicalOnly}
                  onChange={e=>setFilters(f=>({...f,nonClinicalOnly:e.target.checked}))}
                  style={{ accentColor:pc }} />
                Non-clinical roles only
              </label>
              <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"#374151", cursor:"pointer" }}>
                <input type="checkbox" checked={filters.hideClinical}
                  onChange={e=>setFilters(f=>({...f,hideClinical:e.target.checked}))}
                  style={{ accentColor:pc }} />
                Hide clinical treating (keep pediatric)
              </label>
            </div>
          </div>
        </>
      )}

      {/* ── Reset ── */}
      <button onClick={()=>setFilters(defaultFilters())} style={{
        padding:"8px 16px", borderRadius:9, border:"1.5px solid #e2e8f0",
        background:"white", color:"#64748b", fontSize:13, fontWeight:600,
        fontFamily:"inherit", cursor:"pointer", transition:"all .15s",
      }}
        onMouseEnter={e=>{e.target.style.borderColor="#94a3b8";e.target.style.color="#374151";}}
        onMouseLeave={e=>{e.target.style.borderColor="#e2e8f0";e.target.style.color="#64748b";}}
      >
        Reset all filters
      </button>
    </div>
  );
}

function Sidebar({ profile, profileJobs, isEllen }) {
  const bySource = {};
  profileJobs.forEach(j=>{ bySource[j.source]=(bySource[j.source]||0)+1; });
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:14, padding:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Also Check Manually</div>
        {profile.manual_links.map((lnk,i)=>(
          <a key={i} href={lnk.url} target="_blank" rel="noreferrer"
            style={{ display:"block", padding:"9px 11px", borderRadius:10, border:"1.5px solid #e2e8f0", marginBottom:7, textDecoration:"none", transition:"border-color .15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=profile.color}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#e2e8f0"}
          >
            <div style={{ fontSize:12, fontWeight:600, color:profile.color }}>{lnk.label} ↗</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>{lnk.note}</div>
          </a>
        ))}
      </div>
      <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:14, padding:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>Auto-Scraped Sources</div>
        {Object.entries(bySource).map(([src,n])=>(
          <div key={src} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
            <span style={{ color:srcColor(src), fontWeight:600 }}>{src}</span>
            <span style={{ background:"#f1f5f9", color:"#64748b", fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:10 }}>{n}</span>
          </div>
        ))}
      </div>
      {isEllen && (
        <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:14, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>Top UR Employers</div>
          {["eviCore (Evernorth)","Acentra Health","Optum / UnitedHealth","BCBS plans","Cigna / Evernorth","Aetna / CVS Health"].map(e=>(
            <div key={e} style={{ padding:"5px 0", borderBottom:"1px solid #f1f5f9", fontSize:13, color:"#374151" }}>{e}</div>
          ))}
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:7 }}>Most roles fully remote with PA license</div>
        </div>
      )}
    </div>
  );
}

const defaultFilters = () => ({
  salaryMin:       0,
  jobType:         "Any",
  includeKeyword:  "",
  workSetting:     "All",
  nonClinicalOnly: false,
  hideClinical:    false,
  cityText:        "",
  radiusZone:      "Anywhere",
});

export default function App() {
  const [active, setActive]           = useState("rick");
  const [search, setSearch]           = useState("");
  const [sort, setSort]               = useState("newest");
  const [filters, setFilters]         = useState(defaultFilters());
  const [showFilters, setShowFilters] = useState(true);
  const [allJobs, setAllJobs]         = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [refreshState, setRefresh]    = useState("idle");
  const [refreshMsg, setRefreshMsg]   = useState("");

  useEffect(() => {
    fetch("/jobs.json")
      .then(r=>r.json())
      .then(data=>{
        setAllJobs(data.jobs||[]);
        if (data.updated_at) {
          const d=new Date(data.updated_at);
          setLastUpdated(d.toLocaleDateString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}));
        }
        setDataLoading(false);
      })
      .catch(()=>setDataLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefresh("loading"); setRefreshMsg("");
    try {
      const res=await fetch("/api/refresh",{method:"POST"});
      const data=await res.json();
      if (res.ok) { setRefresh("success"); setRefreshMsg("Scraper running — new results in ~2 min. Reload to see them."); }
      else         { setRefresh("error");   setRefreshMsg(data.error||"Something went wrong."); }
    } catch(e) { setRefresh("error"); setRefreshMsg("Could not reach server."); }
    setTimeout(()=>{setRefresh("idle");setRefreshMsg("");},8000);
  };

  const profile     = PROFILES[active];
  const isEllen     = active==="ellen";
  const profileJobs = allJobs.filter(j=>j.profile===active);

  const filtered = useMemo(()=>{
    let out = profileJobs;

    // Salary minimum
    if (filters.salaryMin>0) out=out.filter(j=>!j.salary_max||(j.salary_max>=filters.salaryMin)||(j.salary_min>=filters.salaryMin));

    // Job type (Rick)
    if (!isEllen && filters.jobType!=="Any") out=out.filter(j=>detectJobType(j)===filters.jobType);

    // Must-include keyword (Rick)
    if (!isEllen && filters.includeKeyword.trim()) {
      const kw=filters.includeKeyword.trim().toLowerCase();
      out=out.filter(j=>(j.title||"").toLowerCase().includes(kw)||(j.description||"").toLowerCase().includes(kw)||(j.location||"").toLowerCase().includes(kw));
    }

    // Ellen: work setting
    if (isEllen && filters.workSetting==="Remote only") out=out.filter(j=>j.remote);
    if (isEllen && filters.workSetting==="Onsite only") out=out.filter(j=>!j.remote);

    // Ellen: non-clinical only
    if (isEllen && filters.nonClinicalOnly) {
      out=out.filter(j=>{ const cat=jobCategory(j.keyword); return cat && NON_CLINICAL_CATEGORIES.includes(cat); });
    }

    // Ellen: hide clinical except pediatric
    if (isEllen && filters.hideClinical) {
      out=out.filter(j=>{ const cat=jobCategory(j.keyword); return cat!=="Pediatric / Clinical"||isClinical(j.keyword); });
    }

    // Location filter
    if (filters.cityText.trim()||(filters.radiusZone&&filters.radiusZone!=="Anywhere")) {
      out=out.filter(j=>matchesLocation(j,filters.cityText,filters.radiusZone));
    }

    // Search
    if (search.trim()) {
      const q=search.toLowerCase();
      out=out.filter(j=>(j.title||"").toLowerCase().includes(q)||(j.company||"").toLowerCase().includes(q)||(j.location||"").toLowerCase().includes(q)||(j.description||"").toLowerCase().includes(q));
    }

    if (sort==="newest") out=[...out].sort((a,b)=>(b.posted_at||"")>(a.posted_at||"")?1:-1);
    if (sort==="salary") out=[...out].sort((a,b)=>(b.salary_max||0)-(a.salary_max||0));
    return out;
  },[active,allJobs,filters,search,sort]);

  // Active filter badges
  const activeFilters = [];
  if (filters.salaryMin>0) activeFilters.push({ label:"Min $"+Math.round(filters.salaryMin/1000)+"k", key:"salaryMin", reset:()=>setFilters(f=>({...f,salaryMin:0})) });
  if (filters.jobType!=="Any") activeFilters.push({ label:filters.jobType, key:"jobType", reset:()=>setFilters(f=>({...f,jobType:"Any"})) });
  if (filters.includeKeyword) activeFilters.push({ label:'Must include "'+filters.includeKeyword+'"', key:"kw", reset:()=>setFilters(f=>({...f,includeKeyword:""})) });
  if (filters.workSetting!=="All") activeFilters.push({ label:filters.workSetting, key:"ws", reset:()=>setFilters(f=>({...f,workSetting:"All"})) });
  if (filters.nonClinicalOnly) activeFilters.push({ label:"Non-clinical only", key:"nc", reset:()=>setFilters(f=>({...f,nonClinicalOnly:false})) });
  if (filters.hideClinical) activeFilters.push({ label:"Hide clinical (excl. peds)", key:"hc", reset:()=>setFilters(f=>({...f,hideClinical:false})) });
  if (filters.cityText) activeFilters.push({ label:"City: "+filters.cityText, key:"city", reset:()=>setFilters(f=>({...f,cityText:""})) });
  if (filters.radiusZone!=="Anywhere"&&!filters.cityText) activeFilters.push({ label:filters.radiusZone, key:"radius", reset:()=>setFilters(f=>({...f,radiusZone:"Anywhere"})) });

  const remoteCount = profileJobs.filter(j=>j.remote).length;
  const topSalary   = profileJobs.filter(j=>j.salary_max).length ? "$"+Math.round(Math.max(...profileJobs.filter(j=>j.salary_max).map(j=>j.salary_max))/1000)+"k" : "—";
  const switchProfile = id=>{ setActive(id); setSearch(""); setFilters(defaultFilters()); };
  const pc = profile.color;

  const btnStyle = (state) => ({
    display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:20,
    border:"1.5px solid "+(state==="success"?"#86efac":state==="error"?"#fca5a5":state==="loading"?"#93c5fd":"#e2e8f0"),
    background:state==="success"?"#f0fdf4":state==="error"?"#fef2f2":state==="loading"?"#eff6ff":"white",
    color:state==="success"?"#16a34a":state==="error"?"#dc2626":state==="loading"?"#2563eb":"#374151",
    fontSize:13, fontWeight:600, fontFamily:"inherit", cursor:state==="loading"?"not-allowed":"pointer", transition:"all .2s",
  });

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", background:"#f8fafc", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:900px){.main-layout{grid-template-columns:1fr!important}.sidebar-col{display:none!important}}
        @media(max-width:700px){.stats-grid{grid-template-columns:repeat(2,1fr)!important}.profile-tabs{flex-direction:column!important}}
      `}</style>

      {/* Topbar */}
      <div style={{ background:"white", borderBottom:"1px solid #e2e8f0", padding:"0 16px", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
          <div style={{ fontSize:18, fontWeight:700, color:"#0f172a", letterSpacing:"-0.5px" }}>Job<span style={{color:pc}}>Board</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:12, color:"#64748b", background:"#f1f5f9", padding:"4px 10px", borderRadius:20, border:"1px solid #e2e8f0" }}>
              {lastUpdated?"Updated "+lastUpdated:"Auto Mon/Wed/Fri"}
            </div>
            <button style={btnStyle(refreshState)} onClick={handleRefresh} disabled={refreshState==="loading"}>
              <span style={refreshState==="loading"?{display:"inline-block",animation:"spin 1s linear infinite"}:{}}></span>
              {refreshState==="loading"?"Refreshing…":refreshState==="success"?"Done!":refreshState==="error"?"Failed":"⟳ Refresh Jobs"}
            </button>
          </div>
        </div>
        {refreshMsg&&(
          <div style={{maxWidth:1200,margin:"0 auto",paddingBottom:10}}>
            <div style={{fontSize:12,padding:"6px 12px",borderRadius:8,background:refreshState==="success"?"#f0fdf4":"#fef2f2",color:refreshState==="success"?"#16a34a":"#dc2626",border:"1px solid "+(refreshState==="success"?"#86efac":"#fca5a5")}}>{refreshMsg}</div>
          </div>
        )}
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 16px 60px" }}>

        {/* Profile tabs */}
        <div className="profile-tabs" style={{ display:"flex", gap:8, marginBottom:20 }}>
          {Object.entries(PROFILES).map(([id,p])=>(
            <button key={id} onClick={()=>switchProfile(id)} style={{
              flex:1, padding:"14px 18px", borderRadius:14, cursor:"pointer", textAlign:"left",
              border:"2px solid "+(active===id?p.color:"#e2e8f0"),
              background:active===id?(id==="rick"?"#eff6ff":"#f0fdf4"):"white",
              transition:"all .2s",
            }}>
              <div style={{fontSize:20,marginBottom:5}}>{p.emoji}</div>
              <div style={{fontSize:15,fontWeight:700,color:active===id?p.color:"#0f172a"}}>{p.label}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{p.sub}</div>
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div style={{textAlign:"center",padding:"80px 20px",color:"#94a3b8",fontSize:16}}>Loading jobs…</div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
              {[["Total Jobs",profileJobs.length,pc],["Remote",remoteCount,"#16a34a"],["Top Salary",topSalary,"#d97706"],["Showing",filtered.length,"#7c3aed"]].map(([lbl,val,col])=>(
                <div key={lbl} style={{background:"white",border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 16px"}}>
                  <div style={{fontSize:26,fontWeight:700,color:col,letterSpacing:-1}}>{val}</div>
                  <div style={{fontSize:11,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.5px",marginTop:2}}>{lbl}</div>
                </div>
              ))}
            </div>

            {/* Active filter badges */}
            {activeFilters.length>0&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:14}}>
                <span style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>Active filters:</span>
                {activeFilters.map(f=>(
                  <ActiveFilterBadge key={f.key} label={f.label} onRemove={f.reset} color={pc} />
                ))}
                <button onClick={()=>setFilters(defaultFilters())} style={{fontSize:12,color:"#94a3b8",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Clear all</button>
              </div>
            )}

            <div className="main-layout" style={{display:"grid",gridTemplateColumns:"260px 1fr 220px",gap:16,alignItems:"flex-start"}}>

              {/* Filter panel */}
              <div>
                <button onClick={()=>setShowFilters(!showFilters)} style={{
                  width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0",
                  background:"white", cursor:"pointer", fontSize:13, fontWeight:600, color:"#374151",
                  fontFamily:"inherit", marginBottom:8,
                }}>
                  <span>🔧 Filters {activeFilters.length>0?"("+activeFilters.length+")":""}</span>
                  <span>{showFilters?"▲":"▼"}</span>
                </button>
                {showFilters&&(
                  <FilterPanel active={active} profile={profile} filters={filters} setFilters={setFilters} isEllen={isEllen} />
                )}
              </div>

              {/* Job list */}
              <div>
                <div style={{background:"white",border:"1px solid #e2e8f0",borderRadius:14,padding:"12px 14px",marginBottom:16,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder={"Search "+profile.label+"'s listings…"}
                    style={{flex:1,minWidth:180,padding:"8px 12px",border:"1.5px solid #e2e8f0",borderRadius:9,fontSize:14,fontFamily:"inherit",outline:"none"}}
                    onFocus={e=>e.target.style.borderColor=pc} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
                  />
                  <Chip label="Newest first" active={sort==="newest"} onClick={()=>setSort("newest")} color={pc} small />
                  <Chip label="Highest salary" active={sort==="salary"} onClick={()=>setSort("salary")} color={pc} small />
                </div>

                <div style={{fontSize:13,color:"#94a3b8",marginBottom:12}}>
                  {filtered.length} of {profileJobs.length} listings
                  {activeFilters.length>0?" · "+activeFilters.length+" filter"+(activeFilters.length>1?"s":"")+" active":""}
                </div>

                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {filtered.length===0
                    ?<div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8",fontSize:15,background:"white",borderRadius:14,border:"1px solid #e2e8f0"}}>
                      No listings match your filters.
                      <div style={{marginTop:10}}><button onClick={()=>setFilters(defaultFilters())} style={{color:pc,background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,textDecoration:"underline"}}>Clear all filters</button></div>
                    </div>
                    :filtered.map(job=><JobCard key={job.id} job={job} profileColor={pc} isEllen={isEllen} />)
                  }
                </div>
              </div>

              {/* Sidebar */}
              <div className="sidebar-col">
                <Sidebar profile={profile} profileJobs={profileJobs} isEllen={isEllen} />
              </div>

            </div>
          </>
        )}

        <div style={{marginTop:40,textAlign:"center",color:"#94a3b8",fontSize:12}}>
          Scraped automatically via GitHub Actions · Click any card to expand · Sidebar links open external boards
        </div>
      </div>
    </div>
  );
}