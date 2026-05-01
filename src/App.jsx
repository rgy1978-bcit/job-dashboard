import { useState, useMemo } from "react";

const RICK_COLOR = "#2563eb";
const ELLEN_COLOR = "#16a34a";

const PROFILES = {
  rick: {
    label: "Rick", sub: "Education & Instructional Design",
    color: RICK_COLOR, lightBg: "#eff6ff", borderColor: "#bfdbfe", emoji: "📚",
    manual_links: [
      { label: "AECT Job Board",    url: "https://www.aect.org/careers/job_board.php",                    note: "Educational Communications & Technology" },
      { label: "Teamed — L&D",      url: "https://www.teamedforlearning.com/job-board/",                  note: "Instructional design & eLearning" },
      { label: "EdTechJobs.io",     url: "https://www.edtechjobs.io/",                                    note: "K-12, Higher Ed, Corporate EdTech" },
      { label: "Inside Higher Ed",  url: "https://careers.insidehighered.com/jobs/instructional-design/", note: "University roles" },
    ],
  },
  ellen: {
    label: "Ellen", sub: "PT → Non-Clinical Transition",
    color: ELLEN_COLOR, lightBg: "#f0fdf4", borderColor: "#bbf7d0", emoji: "🏥",
    manual_links: [
      { label: "APTA Career Center",           url: "https://jobs.apta.org/",                                                                               note: "Official PT association board" },
      { label: "The Non-Clinical PT",          url: "https://thenonclinicalpt.com/jobs/",                                                                    note: "Curated PT career transitions" },
      { label: "Vivian Health — Remote PT",    url: "https://www.vivian.com/therapy/physical-therapist/remote/",                                             note: "UR, case mgmt & non-clinical" },
      { label: "LinkedIn — Remote UR PT",      url: "https://www.linkedin.com/jobs/search/?keywords=utilization+review+physical+therapist&f_WT=2",            note: "Pre-filtered to Remote" },
      { label: "ZipRecruiter — Remote UR PA",  url: "https://www.ziprecruiter.com/Jobs/Remote-Utilization-Review-Physical-Therapist/--in-Pennsylvania",       note: "~$1,600–$2,073/wk avg in PA" },
    ],
  },
};

const CATEGORIES = {
  "Insurance / UR":       ["utilization review physical therapist remote","clinical reviewer physical therapist","prior authorization physical therapist","clinical appeals writer physical therapist"],
  "Case Management":      ["case manager physical therapist remote","care coordinator physical therapist"],
  "Med Device / Sales":   ["medical device clinical specialist physical therapist","orthopedic sales physical therapist"],
  "Admin / Operations":   ["rehab director physical therapist","clinical operations physical therapist"],
  "Education":            ["adjunct physical therapy faculty remote","physical therapy clinical education coordinator"],
  "Health Tech":          ["health coach remote physical therapist","wellness coordinator physical therapist"],
};
const CAT_COLORS = {
  "Insurance / UR":     { bg:"#eff6ff", text:"#1d4ed8", border:"#bfdbfe" },
  "Case Management":    { bg:"#f0fdf4", text:"#15803d", border:"#bbf7d0" },
  "Med Device / Sales": { bg:"#fff7ed", text:"#c2410c", border:"#fed7aa" },
  "Admin / Operations": { bg:"#fdf4ff", text:"#7e22ce", border:"#e9d5ff" },
  "Education":          { bg:"#fffbeb", text:"#b45309", border:"#fde68a" },
  "Health Tech":        { bg:"#f0fdfa", text:"#0f766e", border:"#99f6e4" },
};
function jobCategory(kw) {
  for (const [cat, kws] of Object.entries(CATEGORIES)) if (kws.includes(kw)) return cat;
  return null;
}

const MOCK_JOBS = [
  { id:"r1", profile:"rick",  title:"Instructional Technology Specialist",    company:"Central Bucks SD",      location:"Doylestown, PA",       remote:false, description:"Support staff and students with ed-tech integration across K-12. Google Workspace and Canvas experience preferred. Work closely with curriculum teams.",     url:"#", source:"Adzuna",      keyword:"instructional technology specialist", salary_min:52000, salary_max:68000,  posted_at:"2026-04-28T00:00:00Z" },
  { id:"r2", profile:"rick",  title:"EdTech Curriculum Coordinator",          company:"Chester County IU",     location:"Downingtown, PA",      remote:false, description:"Lead district-wide curriculum design initiatives with a focus on blended learning models. PA Academic Standards required. Team of 4 coordinators.",          url:"#", source:"SimplyHired", keyword:"edtech coordinator",               salary_min:58000, salary_max:75000,  posted_at:"2026-04-27T00:00:00Z" },
  { id:"r3", profile:"rick",  title:"High School Business & Marketing Teacher","company":"North Penn SD",      location:"Lansdale, PA",         remote:false, description:"Teach Principles of Business, Marketing, and Finance. NBEA certification a plus. Strong interest in student entrepreneurship programs.",                    url:"#", source:"Indeed",      keyword:"high school business teacher",        salary_min:48000, salary_max:62000,  posted_at:"2026-04-25T00:00:00Z" },
  { id:"r4", profile:"rick",  title:"Computer Science Teacher (9–12)",        company:"Pennsbury SD",          location:"Fairless Hills, PA",   remote:false, description:"Teach AP Computer Science Principles and intro coding courses. Python or Scratch experience preferred. Project-based learning environment.",               url:"#", source:"Adzuna",      keyword:"computer science teacher",            salary_min:50000, salary_max:65000,  posted_at:"2026-04-26T00:00:00Z" },
  { id:"r5", profile:"rick",  title:"Curriculum Developer — Digital Learning","company":"Amplify Education",  location:"Remote",               remote:true,  description:"Design standards-aligned digital curriculum for middle and high school students. Collaborate with instructional designers and content experts nationwide.", url:"#", source:"HigherEdJobs", keyword:"curriculum developer",               salary_min:65000, salary_max:85000,  posted_at:"2026-04-24T00:00:00Z" },
  { id:"r6", profile:"rick",  title:"Instructional Designer — Corporate",     company:"SEI Investments",       location:"Oaks, PA",             remote:false, description:"Create engaging e-learning content and blended training programs using Articulate 360. Education or L&D background strongly preferred.",                  url:"#", source:"SimplyHired", keyword:"instructional designer",              salary_min:70000, salary_max:90000,  posted_at:"2026-04-23T00:00:00Z" },
  { id:"e1", profile:"ellen", title:"Utilization Review Physical Therapist",  company:"eviCore (Evernorth)",  location:"Remote",               remote:true,  description:"Review PT documentation for medical necessity. Approve or deny insurance authorizations using evidence-based criteria. Top national UR employer for PTs.", url:"#", source:"Indeed",      keyword:"utilization review physical therapist remote", salary_min:75000, salary_max:95000,  posted_at:"2026-04-28T00:00:00Z" },
  { id:"e2", profile:"ellen", title:"Clinical Reviewer — Physical Therapist", company:"Acentra Health",       location:"Remote",               remote:true,  description:"Evaluate medical records against clinical criteria for rehab services. Collaborate with medical directors on complex cases. Active PA PT license required.", url:"#", source:"Adzuna",      keyword:"clinical reviewer physical therapist",        salary_min:72000, salary_max:90000,  posted_at:"2026-04-27T00:00:00Z" },
  { id:"e3", profile:"ellen", title:"Prior Authorization Specialist",         company:"Optum (UnitedHealth)", location:"Remote",               remote:true,  description:"Review prior auth requests for PT and OT services. Apply evidence-based clinical guidelines to determine appropriate level of care. Full benefits.",       url:"#", source:"SimplyHired", keyword:"prior authorization physical therapist",       salary_min:65000, salary_max:82000,  posted_at:"2026-04-26T00:00:00Z" },
  { id:"e4", profile:"ellen", title:"Licensed Appeal Writer",                 company:"Med-Metrix",           location:"Remote",               remote:true,  description:"Write clinical appeals for denied PT/OT/rehab claims on behalf of hospital clients. Active PT license required. Strong writing and analytical skills.",   url:"#", source:"Indeed",      keyword:"clinical appeals writer physical therapist",   salary_min:60000, salary_max:78000,  posted_at:"2026-04-25T00:00:00Z" },
  { id:"e5", profile:"ellen", title:"Orthopedic Clinical Specialist — Sales", company:"Stryker",              location:"Philadelphia, PA",     remote:false, description:"Support orthopedic sales reps in OR and clinic settings. Provide clinical education on joint replacement and sports med product lines. PT background valued.", url:"#", source:"Adzuna",      keyword:"medical device clinical specialist physical therapist", salary_min:80000, salary_max:110000, posted_at:"2026-04-24T00:00:00Z" },
  { id:"e6", profile:"ellen", title:"Rehab Operations Director",              company:"Select Medical",       location:"Mechanicsburg, PA",    remote:false, description:"Oversee clinical operations across outpatient PT clinics in the PA region. Lead therapist hiring, compliance, and quality improvement programs.",          url:"#", source:"PTJobSite",   keyword:"rehab director physical therapist",            salary_min:90000, salary_max:120000, posted_at:"2026-04-23T00:00:00Z" },
  { id:"e7", profile:"ellen", title:"Clinical Education Coordinator",         company:"Drexel University",    location:"Remote / Philadelphia",remote:true,  description:"Coordinate clinical placements for DPT students. Manage affiliation agreements and CI communications. Largely remote-eligible with occasional campus visits.", url:"#", source:"HigherEdJobs", keyword:"physical therapy clinical education coordinator", salary_min:58000, salary_max:72000, posted_at:"2026-04-22T00:00:00Z" },
  { id:"e8", profile:"ellen", title:"Remote Health Coach — MSK",              company:"Hinge Health",         location:"Remote",               remote:true,  description:"Guide members through digital MSK programs using PT expertise. Async coaching model with no live patient treatment. Flexible schedule. PT license required.", url:"#", source:"Indeed",      keyword:"health coach remote physical therapist",       salary_min:65000, salary_max:85000,  posted_at:"2026-04-21T00:00:00Z" },
];

const fmtSal = (min, max) => {
  if (!min && !max) return null;
  const f = n => "$" + Math.round(n/1000) + "k";
  return min && max ? `${f(min)} – ${f(max)}/yr` : min ? `${f(min)}+/yr` : `up to ${f(max)}/yr`;
};
const daysAgo = iso => {
  if (!iso) return null;
  const d = Math.floor((Date.now()-new Date(iso))/86400000);
  return d===0?"Posted today":d===1?"Posted yesterday":`Posted ${d} days ago`;
};

const SRC_COLORS = {
  Adzuna:"#2563eb", SimplyHired:"#7c3aed", Indeed:"#d97706",
  LinkedIn:"#0284c7", HigherEdJobs:"#ea580c", PTJobSite:"#0891b2",
};
const srcColor = s => SRC_COLORS[s] || "#6b7280";

export default function App() {
  const [active, setActive]       = useState("ellen");
  const [search, setSearch]       = useState("");
  const [catFilter, setCat]       = useState("All");
  const [remoteOnly, setRemote]   = useState(false);
  const [sort, setSort]           = useState("newest");
  const [expanded, setExpanded]   = useState(null);
  const [refreshState, setRefresh] = useState("idle"); // idle | loading | success | error
  const [refreshMsg, setRefreshMsg] = useState("");

  const profile     = PROFILES[active];
  const isEllen     = active === "ellen";
  const profileJobs = MOCK_JOBS.filter(j => j.profile === active);

  const cats = useMemo(() => {
    if (!isEllen) return [];
    const seen = new Set();
    profileJobs.forEach(j => { const c = jobCategory(j.keyword); if (c) seen.add(c); });
    return ["All", ...seen];
  }, [active]);

  const filtered = useMemo(() => {
    let out = profileJobs;
    if (isEllen && catFilter !== "All") out = out.filter(j => jobCategory(j.keyword) === catFilter);
    if (remoteOnly) out = out.filter(j => j.remote);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location?.toLowerCase().includes(q) || j.description?.toLowerCase().includes(q));
    }
    if (sort === "newest") out = [...out].sort((a,b) => b.posted_at > a.posted_at ? 1 : -1);
    if (sort === "salary") out = [...out].sort((a,b) => (b.salary_max||0) - (a.salary_max||0));
    return out;
  }, [active, search, catFilter, remoteOnly, sort]);

  const remoteCount = profileJobs.filter(j => j.remote).length;
  const switchProfile = id => { setActive(id); setSearch(""); setCat("All"); setRemote(false); setExpanded(null); };

  const handleRefresh = async () => {
    setRefresh("loading");
    setRefreshMsg("");
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
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
    // Reset back to idle after 8 seconds
    setTimeout(() => { setRefresh("idle"); setRefreshMsg(""); }, 8000);
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #f8fafc; }
    .dash { max-width: 1100px; margin: 0 auto; padding: 28px 16px 60px; }
    .topbar { background: white; border-bottom: 1px solid #e2e8f0; padding: 0 16px; position: sticky; top: 0; z-index: 10; }
    .topbar-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 60px; }
    .logo { font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
    .logo span { color: ${profile.color}; }
    .sync-badge { font-size: 12px; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 20px; border: 1px solid #e2e8f0; }
    .topbar-right { display: flex; align-items: center; gap: 10px; }
    .refresh-btn { display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 20px; border: 1.5px solid #e2e8f0; background: white; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all .2s; color: #374151; }
    .refresh-btn:hover:not(:disabled) { border-color: var(--pc); color: var(--pc); background: #f8fafc; }
    .refresh-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .refresh-btn.loading { border-color: #93c5fd; color: #2563eb; background: #eff6ff; }
    .refresh-btn.success { border-color: #86efac; color: #16a34a; background: #f0fdf4; }
    .refresh-btn.error   { border-color: #fca5a5; color: #dc2626; background: #fef2f2; }
    .refresh-msg { font-size: 12px; padding: 6px 12px; border-radius: 8px; max-width: 320px; }
    .refresh-msg.success { background: #f0fdf4; color: #16a34a; border: 1px solid #86efac; }
    .refresh-msg.error   { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .profile-tabs { display: flex; gap: 8px; margin: 24px 0 20px; }
    .tab { flex: 1; padding: 16px 20px; border-radius: 14px; border: 2px solid #e2e8f0; background: white; cursor: pointer; text-align: left; transition: all .2s; }
    .tab:hover { border-color: #cbd5e1; }
    .tab.active-rick { border-color: ${RICK_COLOR}; background: #eff6ff; }
    .tab.active-ellen { border-color: ${ELLEN_COLOR}; background: #f0fdf4; }
    .tab-emoji { font-size: 22px; margin-bottom: 6px; }
    .tab-name { font-size: 16px; font-weight: 700; color: #0f172a; }
    .tab-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 20px; }
    .stat { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; }
    .stat-num { font-size: 26px; font-weight: 700; letter-spacing: -1px; }
    .stat-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .controls { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; }
    .search-row { display: flex; gap: 10px; align-items: center; }
    .search-input { flex: 1; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 15px; font-family: inherit; outline: none; transition: border .15s; }
    .search-input:focus { border-color: var(--pc); }
    .filter-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .filter-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 4px; }
    .chip { padding: 5px 12px; border-radius: 20px; border: 1.5px solid #e2e8f0; background: white; font-size: 13px; font-family: inherit; cursor: pointer; transition: all .15s; color: #475569; font-weight: 500; }
    .chip:hover { border-color: #cbd5e1; background: #f8fafc; }
    .chip.on { color: white; border-color: transparent; }
    .chip.remote-on { background: #dcfce7; color: #15803d; border-color: #86efac; }
    .sort-row { display: flex; gap: 6px; margin-left: auto; }
    .layout { display: grid; grid-template-columns: 1fr 240px; gap: 20px; align-items: flex-start; }
    .jobs-grid { display: flex; flex-direction: column; gap: 12px; }
    .job-card { background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; transition: border-color .15s, box-shadow .15s; cursor: pointer; }
    .job-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .job-card-top { display: flex; gap: 14px; padding: 18px 20px; }
    .job-logo { width: 46px; height: 46px; border-radius: 10px; border: 1.5px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; background: #f8fafc; }
    .job-main { flex: 1; min-width: 0; }
    .job-title { font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 3px; }
    .job-company { font-size: 14px; color: #475569; }
    .job-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; align-items: center; }
    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-remote { background: #dcfce7; color: #15803d; }
    .badge-salary { background: #eff6ff; color: #1d4ed8; }
    .badge-source { background: #f1f5f9; color: #475569; }
    .badge-date { background: #f8fafc; color: #94a3b8; }
    .job-desc { padding: 0 20px 18px; border-top: 1px solid #f1f5f9; padding-top: 14px; font-size: 14px; color: #475569; line-height: 1.7; }
    .job-link { display: inline-block; margin-top: 10px; color: var(--pc); font-size: 13px; font-weight: 600; text-decoration: none; }
    .sidebar { display: flex; flex-direction: column; gap: 14px; }
    .side-card { background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; }
    .side-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .link-item { display: block; padding: 10px 12px; border-radius: 10px; border: 1.5px solid #e2e8f0; margin-bottom: 8px; text-decoration: none; transition: border-color .15s; }
    .link-item:hover { border-color: var(--pc); }
    .link-item:last-child { margin-bottom: 0; }
    .link-name { font-size: 13px; font-weight: 600; color: var(--pc); }
    .link-note { font-size: 11px; color: #94a3b8; margin-top: 1px; }
    .src-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .src-row:last-child { border-bottom: none; }
    .ur-item { padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #374151; }
    .ur-item:last-child { border-bottom: none; }
    .count-badge { background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 10px; }
    .empty { text-align: center; padding: 60px 20px; color: #94a3b8; font-size: 15px; }
    @media (max-width: 768px) {
      .layout { grid-template-columns: 1fr; }
      .sidebar { display: none; }
      .profile-tabs { flex-direction: column; }
      .stats { grid-template-columns: repeat(2, 1fr); }
      .sort-row { margin-left: 0; }
    }
  `;

  const pc = profile.color;

  return (
    <>
      <style>{styles}</style>
      <div style={{"--pc": pc}}>

        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-inner">
            <div className="logo">Job<span>Board</span></div>
            <div className="topbar-right">
              <div className="sync-badge">Auto Mon/Wed/Fri</div>
              <button
                className={`refresh-btn ${refreshState !== "idle" ? refreshState : ""}`}
                onClick={handleRefresh}
                disabled={refreshState === "loading"}
              >
                <span className={refreshState === "loading" ? "spin" : ""}>
                  {refreshState === "loading" ? "⟳" : refreshState === "success" ? "✓" : refreshState === "error" ? "✕" : "⟳"}
                </span>
                {refreshState === "loading" ? "Refreshing…" : refreshState === "success" ? "Done!" : refreshState === "error" ? "Failed" : "Refresh Jobs"}
              </button>
            </div>
          </div>
          {refreshMsg && (
            <div style={{maxWidth:1100, margin:"0 auto", padding:"0 16px 10px"}}>
              <div className={`refresh-msg ${refreshState}`}>{refreshMsg}</div>
            </div>
          )}
        </div>

        <div className="dash">

          {/* Profile tabs */}
          <div className="profile-tabs">
            {Object.entries(PROFILES).map(([id, p]) => (
              <button key={id} className={`tab ${active===id ? `active-${id}` : ""}`} onClick={() => switchProfile(id)}>
                <div className="tab-emoji">{p.emoji}</div>
                <div className="tab-name" style={{color: active===id ? p.color : "#0f172a"}}>{p.label}</div>
                <div className="tab-sub">{p.sub}</div>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="stats">
            <div className="stat">
              <div className="stat-num" style={{color: pc}}>{profileJobs.length}</div>
              <div className="stat-lbl">Total Jobs</div>
            </div>
            <div className="stat">
              <div className="stat-num" style={{color: "#16a34a"}}>{remoteCount}</div>
              <div className="stat-lbl">Remote</div>
            </div>
            <div className="stat">
              <div className="stat-num" style={{color: "#d97706"}}>
                {profileJobs.filter(j=>j.salary_max).length ? "$" + Math.round(Math.max(...profileJobs.filter(j=>j.salary_max).map(j=>j.salary_max))/1000) + "k" : "—"}
              </div>
              <div className="stat-lbl">Top Salary</div>
            </div>
            <div className="stat">
              <div className="stat-num" style={{color: "#7c3aed"}}>{filtered.length}</div>
              <div className="stat-lbl">Showing</div>
            </div>
          </div>

          <div className="layout">
            {/* Main column */}
            <div>
              {/* Controls */}
              <div className="controls">
                <div className="search-row">
                  <input
                    className="search-input"
                    style={{"--pc": pc}}
                    placeholder={`Search ${profile.label}'s listings…`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                {isEllen && (
                  <div className="filter-row">
                    <span className="filter-label">Type</span>
                    {cats.map(c => {
                      const cc = c !== "All" ? CAT_COLORS[c] : null;
                      const isOn = catFilter === c;
                      return (
                        <button key={c} className="chip" onClick={() => setCat(c)}
                          style={isOn && cc ? {background: cc.bg, color: cc.text, borderColor: cc.border} :
                                 isOn ? {background: pc, color: "white", borderColor: pc} : {}}>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="filter-row">
                  <button className={`chip ${remoteOnly ? "remote-on" : ""}`} onClick={() => setRemote(!remoteOnly)}>
                    ⌂ Remote only
                  </button>
                  <div className="sort-row">
                    <span className="filter-label">Sort</span>
                    {[["newest","Newest first"],["salary","Highest salary"]].map(([v,lbl]) => (
                      <button key={v} className="chip on" onClick={() => setSort(v)}
                        style={sort===v ? {background: pc, borderColor: pc} : {background: "white", color: "#475569", borderColor: "#e2e8f0"}}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Job cards */}
              <div className="jobs-grid">
                {filtered.length === 0 ? (
                  <div className="empty">No listings match your filters.</div>
                ) : filtered.map(job => {
                  const pay = fmtSal(job.salary_min, job.salary_max);
                  const age = daysAgo(job.posted_at);
                  const cat = jobCategory(job.keyword);
                  const cc  = cat ? CAT_COLORS[cat] : null;
                  const isOpen = expanded === job.id;
                  return (
                    <div key={job.id} className="job-card" style={{borderLeftColor: isOpen ? pc : undefined, borderLeftWidth: isOpen ? 3 : undefined}}>
                      <div className="job-card-top" onClick={() => setExpanded(isOpen ? null : job.id)}>
                        <div className="job-logo">{job.profile === "rick" ? "📚" : "🏥"}</div>
                        <div className="job-main">
                          <div className="job-title">{job.title}</div>
                          <div className="job-company">{job.company} &middot; {job.location}</div>
                          <div className="job-meta">
                            {job.remote && <span className="badge badge-remote">⌂ Remote</span>}
                            {pay && <span className="badge badge-salary">{pay}</span>}
                            {cc && cat && <span className="badge" style={{background: cc.bg, color: cc.text}}>{cat}</span>}
                            <span className="badge badge-source" style={{color: srcColor(job.source)}}>{job.source}</span>
                            <span className="badge badge-date">{age}</span>
                          </div>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="job-desc">
                          {job.description}
                          <br/>
                          <a href={job.url} className="job-link" style={{"--pc": pc}}>View full listing →</a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="sidebar">
              <div className="side-card">
                <div className="side-title">📌 Also check manually</div>
                {profile.manual_links.map((lnk, i) => (
                  <a key={i} href={lnk.url} target="_blank" rel="noreferrer" className="link-item" style={{"--pc": pc}}>
                    <div className="link-name">{lnk.label} ↗</div>
                    <div className="link-note">{lnk.note}</div>
                  </a>
                ))}
              </div>

              <div className="side-card">
                <div className="side-title">Auto-scraped sources</div>
                {Object.entries((() => { const m={}; profileJobs.forEach(j=>{m[j.source]=(m[j.source]||0)+1;}); return m; })()).map(([src, n]) => (
                  <div key={src} className="src-row">
                    <span style={{color: srcColor(src), fontWeight: 600}}>{src}</span>
                    <span className="count-badge">{n}</span>
                  </div>
                ))}
              </div>

              {isEllen && (
                <div className="side-card">
                  <div className="side-title">Top UR employers</div>
                  {["eviCore (Evernorth)","Acentra Health","Optum / UnitedHealth","BCBS plans","Cigna / Evernorth","Aetna / CVS Health"].map(e => (
                    <div key={e} className="ur-item">{e}</div>
                  ))}
                  <div style={{fontSize:11, color:"#94a3b8", marginTop:8}}>Most roles fully remote with PA license</div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
