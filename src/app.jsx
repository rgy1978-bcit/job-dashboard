import { useState, useMemo } from "react";

const C = {
  bg:"#0d0f14", surface:"#151820", border:"#1e2433", borderHover:"#2e3a50",
  green:"#22c55e", muted:"#4a5568", text:"#e2e8f0", textDim:"#8892a4", tag:"#1a2035",
};
const SRC = { Adzuna:"#3b82f6", SimplyHired:"#a855f7", Indeed:"#f59e0b", LinkedIn:"#0ea5e9" };
const sc = s => {
  if (!s) return "#6b7280";
  if (s.includes("HigherEdJobs")) return "#f97316";
  if (s.includes("PTJobSite"))    return "#06b6d4";
  return SRC[s] || "#6b7280";
};

const PROFILES = {
  rick: {
    label:"Rick", sub:"Education & Instructional Design", color:"#3b82f6", emoji:"📚",
    manual_links:[
      { label:"AECT Job Board",     url:"https://www.aect.org/careers/job_board.php",                            note:"Assoc. for Educational Comm. & Technology" },
      { label:"Teamed — L&D Jobs",  url:"https://www.teamedforlearning.com/job-board/",                          note:"Instructional design & eLearning" },
      { label:"EdTechJobs.io",      url:"https://www.edtechjobs.io/",                                            note:"K-12, Higher Ed, Corporate EdTech" },
      { label:"Inside Higher Ed",   url:"https://careers.insidehighered.com/jobs/instructional-design/",         note:"University instructional design roles" },
    ],
  },
  ellen: {
    label:"Ellen", sub:"PT → Non-Clinical Transition", color:"#22c55e", emoji:"🏥",
    manual_links:[
      { label:"APTA Career Center",             url:"https://jobs.apta.org/",                                                                                 note:"Filter by 'non-clinical' — official PT board" },
      { label:"The Non-Clinical PT Job Board",  url:"https://thenonclinicalpt.com/jobs/",                                                                      note:"Curated board for PT career transitions" },
      { label:"Vivian Health — Remote PT",      url:"https://www.vivian.com/therapy/physical-therapist/remote/",                                               note:"UR, case mgmt & non-clinical remote" },
      { label:"LinkedIn — Remote UR PT",        url:"https://www.linkedin.com/jobs/search/?keywords=utilization+review+physical+therapist&f_WT=2",              note:"Pre-filtered to Remote listings" },
      { label:"ZipRecruiter — Remote UR (PA)",  url:"https://www.ziprecruiter.com/Jobs/Remote-Utilization-Review-Physical-Therapist/--in-Pennsylvania",         note:"~$1,600–$2,073/wk avg in PA" },
    ],
  },
};

// Category groupings for Ellen's non-clinical roles
const CATEGORIES = {
  "Insurance / UR":  ["utilization review physical therapist remote","clinical reviewer physical therapist","prior authorization physical therapist","clinical appeals writer physical therapist","utilization management therapist"],
  "Case Management": ["case manager physical therapist remote","care coordinator physical therapist"],
  "Med Device / Sales": ["medical device clinical specialist physical therapist","orthopedic sales physical therapist"],
  "Admin / Operations": ["rehab director physical therapist","clinical operations physical therapist"],
  "Education / Academia": ["adjunct physical therapy faculty remote","physical therapy clinical education coordinator"],
  "Health Tech / Coaching": ["health coach remote physical therapist","wellness coordinator physical therapist"],
};
function jobCategory(kw) {
  for (const [cat, kws] of Object.entries(CATEGORIES)) {
    if (kws.includes(kw)) return cat;
  }
  return null;
}

const MOCK_JOBS = [
  { id:"r1", profile:"rick",  title:"Instructional Technology Specialist",    company:"Central Bucks SD",     location:"Doylestown, PA",     remote:false, description:"Support staff and students with ed-tech integration across K-12. Google Workspace and Canvas preferred.",                                                         url:"#", source:"Adzuna",      keyword:"instructional technology specialist" , salary_min:52000, salary_max:68000,  posted_at:"2026-04-28T00:00:00Z" },
  { id:"r2", profile:"rick",  title:"EdTech Curriculum Coordinator",          company:"Chester County IU",    location:"Downingtown, PA",    remote:false, description:"Lead district-wide curriculum design with blended learning focus. PA Academic Standards required.",                                                            url:"#", source:"SimplyHired", keyword:"edtech coordinator"                  , salary_min:58000, salary_max:75000,  posted_at:"2026-04-27T00:00:00Z" },
  { id:"r3", profile:"rick",  title:"High School Business Teacher",           company:"North Penn SD",         location:"Lansdale, PA",        remote:false, description:"Teach Principles of Business, Marketing, and Finance. NBEA certification a plus.",                                                                        url:"#", source:"Indeed",      keyword:"high school business teacher"         , salary_min:48000, salary_max:62000,  posted_at:"2026-04-25T00:00:00Z" },
  { id:"r4", profile:"rick",  title:"Computer Science Teacher (9–12)",        company:"Pennsbury SD",          location:"Fairless Hills, PA",  remote:false, description:"Teach AP CS Principles and intro coding. Python or Scratch. Project-based learning.",                                                                    url:"#", source:"Adzuna",      keyword:"computer science teacher"             , salary_min:50000, salary_max:65000,  posted_at:"2026-04-26T00:00:00Z" },
  { id:"r5", profile:"rick",  title:"Curriculum Developer — Digital Learning",company:"Amplify Education",    location:"Remote",              remote:true,  description:"Design standards-aligned digital curriculum for middle and high school students.",                                                                        url:"#", source:"HigherEdJobs — Instructional Technology", keyword:"curriculum developer", salary_min:65000, salary_max:85000, posted_at:"2026-04-24T00:00:00Z" },
  { id:"r6", profile:"rick",  title:"Instructional Designer — Corporate",     company:"SEI Investments",       location:"Oaks, PA",            remote:false, description:"Create e-learning content and blended training programs using Articulate 360.",                                                                          url:"#", source:"SimplyHired", keyword:"instructional designer"               , salary_min:70000, salary_max:90000,  posted_at:"2026-04-23T00:00:00Z" },
  { id:"e1", profile:"ellen", title:"Utilization Review Physical Therapist",  company:"eviCore (Evernorth)",  location:"Remote",              remote:true,  description:"Review PT documentation for medical necessity. Approve/deny authorizations using evidence-based criteria. Top UR employer for PTs nationally.",             url:"#", source:"Indeed",      keyword:"utilization review physical therapist remote" , salary_min:75000, salary_max:95000,  posted_at:"2026-04-28T00:00:00Z" },
  { id:"e2", profile:"ellen", title:"Clinical Reviewer — Physical Therapist", company:"Acentra Health",       location:"Remote",              remote:true,  description:"Evaluate medical records against clinical criteria for rehab services. Collaborate with medical directors on complex cases. Active PT license required.",   url:"#", source:"Adzuna",      keyword:"clinical reviewer physical therapist"         , salary_min:72000, salary_max:90000,  posted_at:"2026-04-27T00:00:00Z" },
  { id:"e3", profile:"ellen", title:"Prior Authorization Specialist — PT",    company:"Optum (UnitedHealth)", location:"Remote",              remote:true,  description:"Review prior auth requests for PT/OT services. Apply clinical guidelines to determine appropriate level of care. Full benefits, flexible schedule.",            url:"#", source:"SimplyHired", keyword:"prior authorization physical therapist"        , salary_min:65000, salary_max:82000,  posted_at:"2026-04-26T00:00:00Z" },
  { id:"e4", profile:"ellen", title:"Licensed Appeal Writer",                 company:"Med-Metrix",           location:"Remote",              remote:true,  description:"Write clinical appeals for denied PT/OT/rehab claims on behalf of hospital clients. Active clinical license required. Strong writing skills essential.",        url:"#", source:"Indeed",      keyword:"clinical appeals writer physical therapist"   , salary_min:60000, salary_max:78000,  posted_at:"2026-04-25T00:00:00Z" },
  { id:"e5", profile:"ellen", title:"Orthopedic Clinical Specialist — Sales", company:"Stryker",              location:"Philadelphia, PA",    remote:false, description:"Support ortho sales reps in OR and clinic settings. Clinical education on joint replacement and sports med product lines. PT background highly valued.",      url:"#", source:"Adzuna",      keyword:"medical device clinical specialist physical therapist", salary_min:80000, salary_max:110000, posted_at:"2026-04-24T00:00:00Z" },
  { id:"e6", profile:"ellen", title:"Rehab Operations Director",              company:"Select Medical",       location:"Mechanicsburg, PA",   remote:false, description:"Oversee clinical operations across outpatient PT clinics in PA. Lead therapist hiring, compliance, and quality programs.",                                    url:"#", source:"PTJobSite — Non-Clinical", keyword:"rehab director physical therapist", salary_min:90000, salary_max:120000, posted_at:"2026-04-23T00:00:00Z" },
  { id:"e7", profile:"ellen", title:"Clinical Education Coordinator — PT",    company:"Drexel University",    location:"Remote / Philadelphia",remote:true,  description:"Coordinate clinical placements and education for DPT students. Manage affiliation agreements and CI communications. Largely remote-eligible.",              url:"#", source:"HigherEdJobs — Instructional Technology", keyword:"physical therapy clinical education coordinator", salary_min:58000, salary_max:72000, posted_at:"2026-04-22T00:00:00Z" },
  { id:"e8", profile:"ellen", title:"Remote Health Coach — MSK",              company:"Hinge Health",         location:"Remote",              remote:true,  description:"Guide members through digital MSK programs using PT expertise. Async coaching model — no live patient treatment. Flexible hours. PT license required.",    url:"#", source:"Indeed",      keyword:"health coach remote physical therapist"        , salary_min:65000, salary_max:85000,  posted_at:"2026-04-21T00:00:00Z" },
];

const fmtSal = (min, max) => {
  if (!min && !max) return null;
  const f = n => "$" + Math.round(n/1000) + "k";
  return min && max ? `${f(min)} – ${f(max)}` : min ? `${f(min)}+` : `up to ${f(max)}`;
};
const daysAgo = iso => {
  if (!iso) return null;
  const d = Math.floor((Date.now()-new Date(iso))/86400000);
  return d===0?"Today":d===1?"Yesterday":`${d}d ago`;
};

function Chip({ label, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding:"4px 10px", borderRadius:20, cursor:"pointer", fontSize:11, fontFamily:"monospace",
      border:`1px solid ${active?(color||"#3b82f6"):C.border}`,
      background:active?(color?color+"22":"#1d3a6e"):"transparent",
      color:active?(color||"#3b82f6"):C.textDim, transition:"all .15s", whiteSpace:"nowrap",
    }}>{label}</button>
  );
}

function JobCard({ job, profileColor, showCategory }) {
  const [open, setOpen] = useState(false);
  const age = daysAgo(job.posted_at);
  const pay = fmtSal(job.salary_min, job.salary_max);
  const c   = sc(job.source);
  const cat = jobCategory(job.keyword);
  return (
    <div onClick={()=>setOpen(!open)} style={{
      background:C.surface, borderRadius:10, padding:"14px 16px", cursor:"pointer",
      border:`1px solid ${open?C.borderHover:C.border}`, borderLeft:`3px solid ${profileColor}`,
      transition:"border-color .15s",
    }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
        <div style={{flex:1}}>
          <div style={{color:C.text,fontWeight:600,fontSize:13,lineHeight:1.3}}>{job.title}</div>
          <div style={{color:C.textDim,fontSize:12,marginTop:2}}>
            {job.company}{job.location&&<span style={{color:C.muted}}> · {job.location}</span>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}}>
          <span style={{fontSize:9,fontWeight:700,color:c,background:c+"18",padding:"2px 6px",borderRadius:10,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:0.5}}>{job.source}</span>
          {age&&<span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{age}</span>}
        </div>
      </div>
      <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
        {job.remote&&(
          <span style={{fontSize:10,background:"#0f2a1a",color:C.green,padding:"2px 7px",borderRadius:4,fontFamily:"monospace",fontWeight:700}}>⌂ Remote</span>
        )}
        {showCategory&&cat&&(
          <span style={{fontSize:10,background:"#1a1f2e",color:"#a78bfa",padding:"2px 7px",borderRadius:4,fontFamily:"monospace"}}>{cat}</span>
        )}
        {pay&&<span style={{fontSize:10,background:C.tag,color:C.green,padding:"2px 6px",borderRadius:4,fontFamily:"monospace"}}>{pay}</span>}
      </div>
      {open&&job.description&&(
        <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`,color:C.textDim,fontSize:12,lineHeight:1.6}}>
          {job.description}
          <div style={{marginTop:8,fontSize:11,color:profileColor}}>View full listing →</div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ id, active, onClick }) {
  const p = PROFILES[id];
  return (
    <button onClick={onClick} style={{
      flex:1,padding:"12px 14px",cursor:"pointer",fontFamily:"system-ui",
      background:active?C.surface:"transparent",
      border:`1px solid ${active?p.color+"55":C.border}`,
      borderBottom:active?`2px solid ${p.color}`:`1px solid ${C.border}`,
      borderRadius:10,transition:"all .2s",
    }}>
      <div style={{fontSize:16,marginBottom:3}}>{p.emoji}</div>
      <div style={{color:active?p.color:C.textDim,fontWeight:600,fontSize:13}}>{p.label}</div>
      <div style={{color:C.muted,fontSize:11,marginTop:1}}>{p.sub}</div>
    </button>
  );
}

function ManualLinks({ links, color }) {
  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px"}}>
      <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>📌 Also Check Manually</div>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {links.map((lnk,i)=>(
          <a key={i} href={lnk.url} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}>
            <div style={{padding:"8px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:"#0d0f14",transition:"border-color .15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=color+"66"}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
            >
              <div style={{color,fontWeight:600,fontSize:12}}>{lnk.label} ↗</div>
              <div style={{color:C.muted,fontSize:11,marginTop:1}}>{lnk.note}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function SourcesPanel({ profileJobs, activeProfile }) {
  const bySource = {};
  profileJobs.forEach(j=>{bySource[j.source]=(bySource[j.source]||0)+1;});
  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginTop:10}}>
      <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Auto-Scraped Sources</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {Object.entries(bySource).map(([src,n])=>(
          <div key={src} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:sc(src),fontSize:11,fontWeight:600}}>{src}</span>
            <span style={{color:C.muted,fontSize:10,fontFamily:"monospace"}}>{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activeProfile, setActive] = useState("ellen");
  const [search, setSearch]        = useState("");
  const [catFilter, setCat]        = useState("All");
  const [remoteOnly, setRemote]    = useState(false);
  const [sort, setSort]            = useState("newest");

  const profile     = PROFILES[activeProfile];
  const profileJobs = MOCK_JOBS.filter(j=>j.profile===activeProfile);
  const isEllen     = activeProfile==="ellen";

  const cats = useMemo(()=>{
    if (!isEllen) return [];
    const seen = new Set();
    profileJobs.forEach(j=>{ const c=jobCategory(j.keyword); if(c) seen.add(c); });
    return ["All",...seen];
  },[activeProfile]);

  const bySource = useMemo(()=>{const m={};profileJobs.forEach(j=>{m[j.source]=(m[j.source]||0)+1;});return m;},[activeProfile]);

  const filtered = useMemo(()=>{
    let out = profileJobs;
    if (isEllen&&catFilter!=="All") out=out.filter(j=>jobCategory(j.keyword)===catFilter);
    if (remoteOnly) out=out.filter(j=>j.remote);
    if (search.trim()){
      const q=search.toLowerCase();
      out=out.filter(j=>j.title.toLowerCase().includes(q)||j.company.toLowerCase().includes(q)||j.location?.toLowerCase().includes(q)||j.description?.toLowerCase().includes(q));
    }
    if (sort==="newest") out=[...out].sort((a,b)=>b.posted_at>a.posted_at?1:-1);
    if (sort==="salary") out=[...out].sort((a,b)=>(b.salary_max||0)-(a.salary_max||0));
    return out;
  },[activeProfile,search,catFilter,remoteOnly,sort]);

  const remoteCount = profileJobs.filter(j=>j.remote).length;

  const switchProfile = id=>{setActive(id);setSearch("");setCat("All");setRemote(false);};

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"system-ui,sans-serif",padding:"24px 16px 60px"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}input::placeholder{color:${C.muted}}a{text-decoration:none}`}</style>
      <div style={{maxWidth:960,margin:"0 auto"}}>

        <div style={{marginBottom:18}}>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-0.5}}>
            Job Board <span style={{color:profile.color}}>Dashboard</span>
          </h1>
          <div style={{color:C.textDim,fontSize:11,marginTop:3,fontFamily:"monospace"}}>
            Auto-refreshes Mon · Wed · Fri · Last sync: Apr 29, 7:00 AM
          </div>
        </div>

        {/* Profile Tabs */}
        <div style={{display:"flex",gap:10,marginBottom:18}}>
          {Object.keys(PROFILES).map(id=><ProfileTab key={id} id={id} active={activeProfile===id} onClick={()=>switchProfile(id)}/>)}
        </div>

        <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
          {/* Main column */}
          <div style={{flex:1,minWidth:0}}>

            {/* Stats row */}
            <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
              {[["Total",profileJobs.length,profile.color],["Remote",remoteCount,C.green],...Object.entries(bySource).map(([s,n])=>[s,n,sc(s)])].map(([lbl,val,col])=>(
                <div key={lbl} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",flex:1,minWidth:60}}>
                  <div style={{fontSize:20,fontWeight:700,color:col,fontFamily:"monospace"}}>{val}</div>
                  <div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:1,marginTop:1}}>{lbl}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={`Search ${profile.label}'s listings…`}
              style={{width:"100%",padding:"9px 12px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:13,outline:"none",marginBottom:10}}
            />

            {/* Ellen category filter */}
            {isEllen&&(
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>TYPE</span>
                {cats.map(cat=><Chip key={cat} label={cat} active={catFilter===cat} onClick={()=>setCat(cat)} color={profile.color}/>)}
              </div>
            )}

            {/* Remote toggle + sort */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",marginBottom:14}}>
              <button onClick={()=>setRemote(!remoteOnly)} style={{
                padding:"4px 10px",borderRadius:20,cursor:"pointer",fontSize:11,fontFamily:"monospace",
                border:`1px solid ${remoteOnly?C.green:C.border}`,
                background:remoteOnly?"#0f2a1a":"transparent",
                color:remoteOnly?C.green:C.textDim,transition:"all .15s",
              }}>⌂ Remote Only</button>
              <div style={{marginLeft:"auto",display:"flex",gap:5}}>
                <Chip label="↓ Newest" active={sort==="newest"} onClick={()=>setSort("newest")} color={profile.color}/>
                <Chip label="↓ Salary" active={sort==="salary"} onClick={()=>setSort("salary")} color={profile.color}/>
              </div>
            </div>

            <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:10}}>
              {filtered.length} of {profileJobs.length} listings{remoteOnly&&` · remote only`}
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filtered.length===0
                ?<div style={{textAlign:"center",color:C.muted,padding:40,fontFamily:"monospace"}}>No jobs match your filters.</div>
                :filtered.map(j=><JobCard key={j.id} job={j} profileColor={profile.color} showCategory={isEllen}/>)
              }
            </div>
          </div>

          {/* Sidebar */}
          <div style={{width:215,flexShrink:0}}>
            <ManualLinks links={profile.manual_links} color={profile.color}/>
            <SourcesPanel profileJobs={profileJobs} activeProfile={activeProfile}/>
            {isEllen&&(
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginTop:10}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Top UR Employers</div>
                {["eviCore (Evernorth)","Acentra Health","Optum / UnitedHealth","BCBS plans","Cigna / Evernorth","Aetna / CVS Health"].map(e=>(
                  <div key={e} style={{fontSize:11,color:C.textDim,padding:"3px 0",borderBottom:`1px solid ${C.border}`}}>{e}</div>
                ))}
                <div style={{fontSize:10,color:C.muted,marginTop:7}}>Most UR roles are fully remote with PA license accepted</div>
              </div>
            )}
          </div>
        </div>

        <div style={{marginTop:32,textAlign:"center",color:C.muted,fontSize:10,fontFamily:"monospace"}}>
          Scraped via GitHub Actions · Click card to expand · Sidebar links open external boards
        </div>
      </div>
    </div>
  );
}
