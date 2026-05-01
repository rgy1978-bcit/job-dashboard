import { useState, useMemo, useEffect } from "react";

const RICK_COLOR = "#2563eb";
const ELLEN_COLOR = "#16a34a";

const PROFILES = {
  rick: {
    label: "Rick", sub: "Education & Instructional Design",
    color: RICK_COLOR, lightBg: "#eff6ff", borderColor: "#bfdbfe", emoji: "📚",
    manual_links: [
      { label: "AECT Job Board",       url: "https://www.aect.org/careers/job_board.php",                            note: "Educational Communications & Technology" },
      { label: "Teamed — L&D",         url: "https://www.teamedforlearning.com/job-board/",                          note: "Instructional design & eLearning" },
      { label: "EdTechJobs.io",        url: "https://www.edtechjobs.io/",                                            note: "K-12, Higher Ed, Corporate EdTech" },
      { label: "Inside Higher Ed",     url: "https://careers.insidehighered.com/jobs/instructional-design/",         note: "University roles" },
      { label: "HigherEdJobs Pittsburgh", url: "https://www.higheredjobs.com/search/advanced_action.cfm?Keyword=business+AI+education&Region=41&PosType=1", note: "Pittsburgh region faculty roles" },
      { label: "Chronicle of Higher Ed", url: "https://jobs.chronicle.com/jobs/faculty/?location=pittsburgh",        note: "Premium higher ed faculty board" },
      { label: "Academic Keys",        url: "https://business.academickeys.com/",                                    note: "Faculty roles in business schools" },
      { label: "Dice — EdTech",        url: "https://www.dice.com/jobs?q=instructional+technology&location=Pittsburgh%2C+PA", note: "Tech-focused, good for CS roles" },
      { label: "CareerBuilder — Pittsburgh", url: "https://www.careerbuilder.com/jobs?keywords=instructional+technology&location=Pittsburgh%2C+PA", note: "2.4M+ applications/month" },
      { label: "Monster — Pittsburgh", url: "https://www.monster.com/jobs/search?q=instructional+designer&where=Pittsburgh%2C+PA", note: "Broad coverage" },
    ],
  },
  ellen: {
    label: "Ellen", sub: "PT — Non-Clinical Transition",
    color: ELLEN_COLOR, lightBg: "#f0fdf4", borderColor: "#bbf7d0", emoji: "🏥",
    manual_links: [
      { label: "APTA Career Center",          url: "https://jobs.apta.org/",                                                                                note: "Filter by non-clinical — official PT board" },
      { label: "The Non-Clinical PT",         url: "https://thenonclinicalpt.com/jobs/",                                                                     note: "Curated PT career transitions" },
      { label: "Vivian Health — Remote PT",   url: "https://www.vivian.com/therapy/physical-therapist/remote/",                                              note: "UR, case mgmt & non-clinical" },
      { label: "LinkedIn — Remote UR PT",     url: "https://www.linkedin.com/jobs/search/?keywords=utilization+review+physical+therapist&f_WT=2",             note: "Pre-filtered to Remote" },
      { label: "ZipRecruiter — Remote UR PA", url: "https://www.ziprecruiter.com/Jobs/Remote-Utilization-Review-Physical-Therapist/--in-Pennsylvania",        note: "~$1,600-$2,073/wk avg in PA" },
      { label: "FlexJobs — Remote Healthcare",url: "https://www.flexjobs.com/jobs/healthcare",                                                               note: "100K vetted remote listings" },
      { label: "CareerBuilder — Pittsburgh",  url: "https://www.careerbuilder.com/jobs?keywords=physical+therapist&location=Pittsburgh%2C+PA",                note: "High volume, broad coverage" },
      { label: "Monster — Pittsburgh",        url: "https://www.monster.com/jobs/search?q=physical+therapist&where=Pittsburgh%2C+PA",                         note: "Catches listings not on other boards" },
      { label: "USAJobs — VA Pittsburgh",     url: "https://www.usajobs.gov/Search/Results?k=physical+therapist&l=Pittsburgh%2C+PA",                          note: "VA Pittsburgh is a major PT employer" },
    ],
  },
};

const CATEGORIES = {
  "Insurance / UR":     ["utilization review physical therapist remote","clinical reviewer physical therapist","prior authorization physical therapist","clinical appeals writer physical therapist","utilization management therapist"],
  "Case Management":    ["case manager physical therapist remote","care coordinator physical therapist"],
  "Med Device / Sales": ["medical device clinical specialist physical therapist","orthopedic sales physical therapist"],
  "Admin / Operations": ["rehab director physical therapist","clinical operations physical therapist"],
  "Education":          ["adjunct physical therapy faculty remote","physical therapy clinical education coordinator","clinical education specialist physical therapist"],
  "Health Tech":        ["health coach remote physical therapist","wellness coordinator physical therapist"],
  "Pediatric / Clinical":["pediatric physical therapist","physical therapist pediatrics","pediatric PT outpatient","physical therapist childrens hospital","early intervention physical therapist","school physical therapist"],
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

function jobCategory(kw) {
  if (!kw) return null;
  for (const [cat, kws] of Object.entries(CATEGORIES)) {
    if (kws.includes(kw)) return cat;
  }
  return null;
}

const SRC_COLORS = {
  Adzuna:"#2563eb", SimplyHired:"#7c3aed", Indeed:"#d97706",
  LinkedIn:"#0284c7", HigherEdJobs:"#ea580c", PTJobSite:"#0891b2", USAJobs:"#dc2626",
};
const srcColor = s => {
  if (!s) return "#6b7280";
  for (const [k, v] of Object.entries(SRC_COLORS)) {
    if (s.includes(k)) return v;
  }
  return "#6b7280";
};

const fmtSal = (min, max) => {
  if (!min && !max) return null;
  const f = n => "$" + Math.round(n / 1000) + "k";
  return (min && max) ? f(min) + " - " + f(max) + "/yr" : min ? f(min) + "+/yr" : "up to " + f(max) + "/yr";
};

const daysAgo = iso => {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  return d === 0 ? "Posted today" : d === 1 ? "Posted yesterday" : "Posted " + d + " days ago";
};

function Chip({ label, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding:"4px 12px", borderRadius:20, cursor:"pointer", fontSize:13,
      fontFamily:"inherit", fontWeight:500,
      border:"1.5px solid " + (active ? (color || "#2563eb") : "#e2e8f0"),
      background: active ? (color ? color + "22" : "#eff6ff") : "white",
      color: active ? (color || "#2563eb") : "#475569",
      transition:"all .15s", whiteSpace:"nowrap",
    }}>{label}</button>
  );
}

function JobCard({ job, profileColor }) {
  const [open, setOpen] = useState(false);
  const age = daysAgo(job.posted_at);
  const pay = fmtSal(job.salary_min, job.salary_max);
  const cat = jobCategory(job.keyword);
  const cc  = cat ? CAT_COLORS[cat] : null;
  const sc  = srcColor(job.source);

  return (
    <div onClick={() => setOpen(!open)} style={{
      background:"white", borderRadius:14, overflow:"hidden", cursor:"pointer",
      border: open ? "1.5px solid " + profileColor : "1.5px solid #e2e8f0",
      borderLeft: "3px solid " + profileColor,
      boxShadow: open ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
      transition:"border-color .15s, box-shadow .15s",
    }}>
      <div style={{ display:"flex", gap:14, padding:"18px 20px" }}>
        <div style={{ width:46, height:46, borderRadius:10, border:"1.5px solid #e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0, background:"#f8fafc" }}>
          {job.profile === "rick" ? "📚" : "🏥"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:16, fontWeight:700, color:"#0f172a", lineHeight:1.3, marginBottom:3 }}>{job.title}</div>
          <div style={{ fontSize:14, color:"#475569" }}>{job.company}{job.location ? " · " + job.location : ""}</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10, alignItems:"center" }}>
            {job.remote && <span style={{ background:"#dcfce7", color:"#15803d", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600 }}>Remote</span>}
            {pay && <span style={{ background:"#eff6ff", color:"#1d4ed8", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600 }}>{pay}</span>}
            {cc && cat && <span style={{ background:cc.bg, color:cc.text, border:"1px solid " + cc.border, padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600 }}>{cat}</span>}
            {job.source && <span style={{ background:"#f1f5f9", color:sc, padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:600 }}>{job.source}</span>}
            {age && <span style={{ background:"#f8fafc", color:"#94a3b8", padding:"3px 10px", borderRadius:20, fontSize:12 }}>{age}</span>}
          </div>
        </div>
      </div>
      {open && (
        <div style={{ padding:"0 20px 18px", borderTop:"1px solid #f1f5f9", paddingTop:14, fontSize:14, color:"#475569", lineHeight:1.7 }}>
          {job.description || "Click the link below to view the full job description."}
          <div style={{ marginTop:10 }}>
            <a href={job.url} target="_blank" rel="noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color:profileColor, fontSize:13, fontWeight:600, textDecoration:"none" }}>
              View full listing →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({ id, active, onClick }) {
  const p = PROFILES[id];
  return (
    <button onClick={onClick} style={{
      flex:1, padding:"16px 20px", borderRadius:14, border:"2px solid " + (active ? p.color : "#e2e8f0"),
      background: active ? (id === "rick" ? "#eff6ff" : "#f0fdf4") : "white",
      cursor:"pointer", textAlign:"left", transition:"all .2s",
    }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{p.emoji}</div>
      <div style={{ fontSize:16, fontWeight:700, color: active ? p.color : "#0f172a" }}>{p.label}</div>
      <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{p.sub}</div>
    </button>
  );
}

function Sidebar({ profile, profileJobs, isEllen }) {
  const bySource = {};
  profileJobs.forEach(j => { bySource[j.source] = (bySource[j.source] || 0) + 1; });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:14, padding:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Also Check Manually</div>
        {profile.manual_links.map((lnk, i) => (
          <a key={i} href={lnk.url} target="_blank" rel="noreferrer"
            style={{ display:"block", padding:"10px 12px", borderRadius:10, border:"1.5px solid #e2e8f0", marginBottom:8, textDecoration:"none", transition:"border-color .15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = profile.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
          >
            <div style={{ fontSize:13, fontWeight:600, color:profile.color }}>{lnk.label} ↗</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:1 }}>{lnk.note}</div>
          </a>
        ))}
      </div>

      <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:14, padding:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Auto-Scraped Sources</div>
        {Object.entries(bySource).map(([src, n]) => (
          <div key={src} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #f1f5f9", fontSize:13 }}>
            <span style={{ color:srcColor(src), fontWeight:600 }}>{src}</span>
            <span style={{ background:"#f1f5f9", color:"#64748b", fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:10 }}>{n}</span>
          </div>
        ))}
      </div>

      {isEllen && (
        <div style={{ background:"white", border:"1.5px solid #e2e8f0", borderRadius:14, padding:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Top UR Employers</div>
          {["eviCore (Evernorth)","Acentra Health","Optum / UnitedHealth","BCBS plans","Cigna / Evernorth","Aetna / CVS Health"].map(e => (
            <div key={e} style={{ padding:"6px 0", borderBottom:"1px solid #f1f5f9", fontSize:13, color:"#374151" }}>{e}</div>
          ))}
          <div style={{ fontSize:11, color:"#94a3b8", marginTop:8 }}>Most roles fully remote with PA license</div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [active, setActive]           = useState("rick");
  const [search, setSearch]           = useState("");
  const [catFilter, setCat]           = useState("All");
  const [remoteOnly, setRemote]       = useState(false);
  const [sort, setSort]               = useState("newest");
  const [expanded, setExpanded]       = useState(null);
  const [refreshState, setRefresh]    = useState("idle");
  const [refreshMsg, setRefreshMsg]   = useState("");
  const [allJobs, setAllJobs]         = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    fetch("/jobs.json")
      .then(r => r.json())
      .then(data => {
        setAllJobs(data.jobs || []);
        if (data.updated_at) {
          const d = new Date(data.updated_at);
          setLastUpdated(d.toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }));
        }
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefresh("loading");
    setRefreshMsg("");
    try {
      const res  = await fetch("/api/refresh", { method:"POST" });
      const data = await res.json();
      if (res.ok) {
        setRefresh("success");
        setRefreshMsg("Scraper running — new results in ~2 min. Reload page to see them.");
      } else {
        setRefresh("error");
        setRefreshMsg(data.error || "Something went wrong.");
      }
    } catch (err) {
      setRefresh("error");
      setRefreshMsg("Could not reach server. Check your connection.");
    }
    setTimeout(() => { setRefresh("idle"); setRefreshMsg(""); }, 8000);
  };

  const profile     = PROFILES[active];
  const isEllen     = active === "ellen";
  const profileJobs = allJobs.filter(j => j.profile === active);

  const cats = useMemo(() => {
    if (!isEllen) return [];
    const seen = new Set();
    profileJobs.forEach(j => { const c = jobCategory(j.keyword); if (c) seen.add(c); });
    return ["All", ...seen];
  }, [active, allJobs]);

  const filtered = useMemo(() => {
    let out = profileJobs;
    if (isEllen && catFilter !== "All") out = out.filter(j => jobCategory(j.keyword) === catFilter);
    if (remoteOnly) out = out.filter(j => j.remote);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q)
      );
    }
    if (sort === "newest") out = [...out].sort((a,b) => (b.posted_at || "") > (a.posted_at || "") ? 1 : -1);
    if (sort === "salary") out = [...out].sort((a,b) => (b.salary_max || 0) - (a.salary_max || 0));
    return out;
  }, [active, allJobs, search, catFilter, remoteOnly, sort]);

  const remoteCount = profileJobs.filter(j => j.remote).length;
  const topSalary   = profileJobs.filter(j => j.salary_max).length
    ? "$" + Math.round(Math.max(...profileJobs.filter(j => j.salary_max).map(j => j.salary_max)) / 1000) + "k"
    : "—";

  const switchProfile = id => { setActive(id); setSearch(""); setCat("All"); setRemote(false); setExpanded(null); };

  const refreshBtnStyle = {
    display:"flex", alignItems:"center", gap:6, padding:"7px 16px",
    borderRadius:20, border:"1.5px solid " + (refreshState === "success" ? "#86efac" : refreshState === "error" ? "#fca5a5" : refreshState === "loading" ? "#93c5fd" : "#e2e8f0"),
    background: refreshState === "success" ? "#f0fdf4" : refreshState === "error" ? "#fef2f2" : refreshState === "loading" ? "#eff6ff" : "white",
    color: refreshState === "success" ? "#16a34a" : refreshState === "error" ? "#dc2626" : refreshState === "loading" ? "#2563eb" : "#374151",
    fontSize:13, fontWeight:600, fontFamily:"inherit", cursor: refreshState === "loading" ? "not-allowed" : "pointer",
    transition:"all .2s",
  };

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif", background:"#f8fafc", minHeight:"100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @media (max-width: 768px) {
          .layout { grid-template-columns: 1fr !important; }
          .sidebar-col { display: none !important; }
          .profile-tabs { flex-direction: column !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      {/* Topbar */}
      <div style={{ background:"white", borderBottom:"1px solid #e2e8f0", padding:"0 16px", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
          <div style={{ fontSize:18, fontWeight:700, color:"#0f172a", letterSpacing:"-0.5px" }}>
            Job<span style={{ color:profile.color }}>Board</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:12, color:"#64748b", background:"#f1f5f9", padding:"4px 10px", borderRadius:20, border:"1px solid #e2e8f0" }}>
              {lastUpdated ? "Updated " + lastUpdated : "Auto Mon/Wed/Fri"}
            </div>
            <button style={refreshBtnStyle} onClick={handleRefresh} disabled={refreshState === "loading"}>
              <span style={refreshState === "loading" ? { display:"inline-block", animation:"spin 1s linear infinite" } : {}}>⟳</span>
              {refreshState === "loading" ? "Refreshing…" : refreshState === "success" ? "Done!" : refreshState === "error" ? "Failed" : "Refresh Jobs"}
            </button>
          </div>
        </div>
        {refreshMsg && (
          <div style={{ maxWidth:1100, margin:"0 auto", paddingBottom:10 }}>
            <div style={{
              fontSize:12, padding:"6px 12px", borderRadius:8,
              background: refreshState === "success" ? "#f0fdf4" : "#fef2f2",
              color:       refreshState === "success" ? "#16a34a" : "#dc2626",
              border:      "1px solid " + (refreshState === "success" ? "#86efac" : "#fca5a5"),
            }}>{refreshMsg}</div>
          </div>
        )}
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 16px 60px" }}>

        {/* Profile Tabs */}
        <div className="profile-tabs" style={{ display:"flex", gap:8, marginBottom:20 }}>
          {Object.keys(PROFILES).map(id => <ProfileTab key={id} id={id} active={active === id} onClick={() => switchProfile(id)} />)}
        </div>

        {dataLoading ? (
          <div style={{ textAlign:"center", padding:"80px 20px", color:"#94a3b8", fontSize:16 }}>Loading jobs…</div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
              {[
                ["Total Jobs",  profileJobs.length, profile.color],
                ["Remote",      remoteCount,         "#16a34a"],
                ["Top Salary",  topSalary,           "#d97706"],
                ["Showing",     filtered.length,     "#7c3aed"],
              ].map(([lbl, val, col]) => (
                <div key={lbl} style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:"14px 16px" }}>
                  <div style={{ fontSize:26, fontWeight:700, color:col, letterSpacing:-1 }}>{val}</div>
                  <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px", marginTop:2 }}>{lbl}</div>
                </div>
              ))}
            </div>

            <div className="layout" style={{ display:"grid", gridTemplateColumns:"1fr 240px", gap:20, alignItems:"flex-start" }}>
              {/* Main column */}
              <div>
                {/* Controls */}
                <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:14, padding:16, marginBottom:20, display:"flex", flexDirection:"column", gap:12 }}>
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={"Search " + profile.label + "'s listings…"}
                    style={{ padding:"10px 14px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:15, fontFamily:"inherit", outline:"none", transition:"border .15s" }}
                    onFocus={e => e.target.style.borderColor = profile.color}
                    onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                  />
                  {isEllen && cats.length > 0 && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", marginRight:4 }}>Type</span>
                      {cats.map(c => {
                        const cc = c !== "All" ? CAT_COLORS[c] : null;
                        return (
                          <button key={c} onClick={() => setCat(c)} style={{
                            padding:"5px 12px", borderRadius:20, cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:500,
                            border:"1.5px solid " + (catFilter === c ? (cc ? cc.border : profile.color) : "#e2e8f0"),
                            background: catFilter === c ? (cc ? cc.bg : "#f0fdf4") : "white",
                            color: catFilter === c ? (cc ? cc.text : profile.color) : "#475569",
                            transition:"all .15s",
                          }}>{c}</button>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                    <button onClick={() => setRemote(!remoteOnly)} style={{
                      padding:"5px 12px", borderRadius:20, cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:500,
                      border:"1.5px solid " + (remoteOnly ? "#86efac" : "#e2e8f0"),
                      background: remoteOnly ? "#dcfce7" : "white",
                      color: remoteOnly ? "#15803d" : "#475569",
                      transition:"all .15s",
                    }}>Remote only</button>
                    <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px", alignSelf:"center" }}>Sort</span>
                      <Chip label="Newest first" active={sort === "newest"} onClick={() => setSort("newest")} color={profile.color} />
                      <Chip label="Highest salary" active={sort === "salary"} onClick={() => setSort("salary")} color={profile.color} />
                    </div>
                  </div>
                </div>

                <div style={{ fontSize:13, color:"#94a3b8", marginBottom:12 }}>
                  {filtered.length} of {profileJobs.length} listings
                  {remoteOnly ? " · remote only" : ""}
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {filtered.length === 0
                    ? <div style={{ textAlign:"center", padding:"60px 20px", color:"#94a3b8", fontSize:15 }}>No listings match your filters.</div>
                    : filtered.map(job => <JobCard key={job.id} job={job} profileColor={profile.color} />)
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

        <div style={{ marginTop:40, textAlign:"center", color:"#94a3b8", fontSize:12 }}>
          Scraped automatically via GitHub Actions · Click any card to expand · Sidebar links open external boards
        </div>
      </div>
    </div>
  );
}