import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

// ─── Objection intel map ──────────────────────────────────────
const OBJECTION_INTEL = {
  'not interested': {
    current: 'One overcome: "It\'s a free state program — would you want me to just check if you qualify?" If still no, ends call.',
    recommendation: 'Try acknowledging the hesitation before pivoting: "Totally get it, you probably get a lot of calls." Then add social proof: "This one\'s different — it\'s state-backed and credits directly to your ComEd bill, nothing to sign up for." Also test "2 minutes" vs "5 minutes" in the overcome.',
  },
  'already has solar': {
    current: '"Got it, sounds like you\'re already covered. Have a great day." → Ends call immediately.',
    recommendation: 'Add one qualifying question before ending: "Oh nice — did you go rooftop or community solar?" If rooftop, they may still qualify for the ComEd community solar credit on top. Likely missed conversions.',
  },
  'busy': {
    current: '"No worries — we will give you a call back. Have a great day." → Ends call, relies on retry.',
    recommendation: 'Capture a specific time instead of relying on retry slots: "No problem — morning or afternoon usually better for you?" Even a rough window means the next call hits at a better time.',
  },
  'spouse': { current: '"Of course — what time works best for us to call you back?" → Capture Callback.', recommendation: 'Warm lead. Make sure callback time is flowing correctly into GHL ai_callback_at field. Consider adding: "Would it be easier if I just called back in a couple hours?" to make scheduling more natural.' },
  'partner': { current: '"Of course — what time works best for us to call you back?" → Capture Callback.', recommendation: 'Same as spouse — warm lead. Confirm the callback loop is working end-to-end in GHL before going to full volume.' },
  'scam': { current: '"Fair question. It\'s a state-backed community solar program..." → Transfer.', recommendation: 'Add one line of social proof: "We\'ve helped thousands of Illinois households — ComEd certifies the program directly." Reduces friction before the transfer ask.' },
  'is this a scam': { current: '"Fair question. It\'s a state-backed community solar program..." → Transfer.', recommendation: 'Same as scam objection. Solid response but could use one credibility line before the push.' },
  'how did you get my number': { current: '"You filled out a form online about lowering your electric bill — that\'s what triggered my call."', recommendation: 'Add specificity: "You filled out a form on Facebook about energy savings." The word Facebook matches what they did and removes ambiguity.' },
  'ai': { current: '"Yeah I am an AI — I just do the initial reach-out. You would be talking to a real person on the other end."', recommendation: 'Consider adding: "Most people actually prefer it — I don\'t put you on hold or transfer you around." Reframes AI as positive. If they still say no, try: "Want me to have someone call you back instead?" before ending.' },
  'robot': { current: '"Yeah I am an AI..."', recommendation: 'Same as AI objection above.' },
  'wrong number': { current: '"Oh sorry about that — wrong number. Have a good one." → Ends call.', recommendation: 'Before ending, add: "Just to confirm — you didn\'t fill out anything about energy savings recently?" Sometimes people forget or a family member filled it out.' },
}

function getObjectionIntel(objection) {
  const key = (objection || '').toLowerCase().trim()
  for (const [k, v] of Object.entries(OBJECTION_INTEL)) {
    if (key.includes(k)) return v
  }
  return null
}

// ─── Main component ───────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab]           = useState('james')
  const [period, setPeriod]     = useState('all')
  const [stats, setStats]       = useState(null)
  const [calls, setCalls]       = useState([])
  const [repData, setRepData]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [repLoading, setRepLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [playingId, setPlayingId]     = useState(null)
  const [callFilter, setCallFilter]   = useState(null)

  const loadJames = useCallback(async (p) => {
    const activePeriod = p || period
    try {
      const [sRes, cRes] = await Promise.all([
        fetch(`/api/stats?period=${activePeriod}`),
        fetch(`/api/calls?limit=50&period=${activePeriod}`)
      ])
      setStats(await sRes.json())
      setCalls(await cRes.json())
      setLastUpdated(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [period])

  const loadReps = useCallback(async () => {
    if (repData) return
    setRepLoading(true)
    try {
      const res = await fetch('/api/reps')
      setRepData(await res.json())
    } catch (e) { console.error(e) }
    finally { setRepLoading(false) }
  }, [repData])

  useEffect(() => { loadJames(period); const t = setInterval(() => loadJames(period), 60000); return () => clearInterval(t) }, [period])
  useEffect(() => { if (tab === 'reps') loadReps() }, [tab, loadReps])

  const pct    = (n, d) => d > 0 ? (n / d * 100).toFixed(1) + '%' : '0%'
  const fmtSec = s => s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`
  const fmtKwh = k => k >= 1000 ? (k/1000).toFixed(1) + 'K' : Math.round(k).toLocaleString()

  const outcomeBadge = (outcome) => {
    const map = { transferred: ['Transferred','green'], dnc: ['DNC','red'], not_interested: ['Not Interested','orange'], no_answer: ['No Answer','gray'], voicemail: ['Voicemail','gray'], wrong_number: ['Wrong Number','gray'], callback_requested: ['Callback','blue'], busy: ['Busy','gray'] }
    const [label, cls] = map[outcome] || [outcome || '—', 'gray']
    return <span className={`badge badge-${cls}`}>{label}</span>
  }
  const qualityBadge = q => {
    if (q === 'good') return <span className="badge badge-green">✓ Good</span>
    if (q === 'bad')  return <span className="badge badge-red">✗ Bad</span>
    return null
  }

  const objectionSummary = (() => {
    const map = {}
    calls.forEach(c => { if (!c.objections) return; c.objections.split(',').map(o => o.trim()).filter(Boolean).forEach(o => { if (!map[o]) map[o] = { count: 0, intel: getObjectionIntel(o) }; map[o].count++ }) })
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count)
  })()

  const maxDay = stats ? Math.max(...stats.last7.map(d => d.count), 1) : 1

  // Rep colors
  const REP_COLORS = ['#f4a300', '#0d6efd', '#28a745', '#dc3545', '#6f42c1', '#20c997']

  return (
    <>
      <Head><title>JT Solar Dashboard</title><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>

      {/* Header */}
      <div className="header">
        <h1>☀️ JT Solar</h1>
        <div className="tabs">
          <button className={`tab-btn ${tab === 'james' ? 'active' : ''}`} onClick={() => setTab('james')}>🤖 James AI Dialer</button>
          <button className={`tab-btn ${tab === 'reps' ? 'active' : ''}`} onClick={() => setTab('reps')}>👥 Sales Reps</button>
        </div>
        <div className="header-right">
          {tab === 'james' && (
            <select className="period-select" value={period} onChange={e => { setPeriod(e.target.value); setLoading(true) }}>
              <option value="1d">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="1m">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          )}
          <span className="live-badge">● LIVE</span>
          <span className="last-updated">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}</span>
          <button className="refresh-btn" onClick={tab === 'james' ? () => loadJames(period) : () => { setRepData(null); loadReps() }}>↻ Refresh</button>
        </div>
      </div>

      <div className="container">

        {/* ── JAMES TAB ── */}
        {tab === 'james' && (
          loading ? <div className="loading"><div className="spinner" /><p>Loading…</p></div> :
          !stats  ? <div className="loading"><p>Error loading data.</p></div> : <>

            <div className="kpi-grid">
              {[
                { label: 'Total Calls',    value: stats.total,                       sub: `Today: ${stats.todayCount} | This week: ${stats.weekCount}`, color: 'green',   filter: null },
                { label: 'Picked Up',      value: stats.contacted,                   sub: 'Click to view',          color: 'teal',    filter: 'picked_up' },
                { label: 'Transfers',      value: stats.transfers,                   sub: 'Click to view',          color: 'blue',    filter: 'transferred' },
                { label: 'Transfer Rate',  value: pct(stats.transfers, stats.total), sub: 'Of all calls dialed',    color: 'orange',  filter: null },
                { label: 'DNC',            value: stats.dnc,                         sub: 'Click to view',          color: 'red',     filter: 'dnc' },
                { label: 'Avg Duration',   value: fmtSec(stats.avgDuration),         sub: 'Per call',               color: 'purple',  filter: null },
              ].map(k => (
                <div
                  key={k.label}
                  className={`kpi-card kpi-${k.color}${k.filter ? ' kpi-clickable' : ''}${callFilter === k.filter && k.filter ? ' kpi-active' : ''}`}
                  onClick={() => k.filter ? setCallFilter(callFilter === k.filter ? null : k.filter) : null}
                >
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                  <div className="kpi-sub">{callFilter === k.filter && k.filter ? '▲ Showing below' : k.sub}</div>
                </div>
              ))}
            </div>

            <div className="row2">
              <div className="card">
                <div className="section-title">Outcome Breakdown</div>
                {[['Transferred',stats.transfers,'#28a745'],['Not Interested',stats.notInterested,'#f4a300'],['No Answer',stats.noAnswer,'#6c757d'],['Voicemail',stats.voicemail,'#6c757d'],['DNC',stats.dnc,'#dc3545'],['Wrong Number',stats.wrongNumber,'#6c757d'],['Callback',stats.callback,'#0d6efd'],['Busy',stats.busy,'#aaa']].map(([label,count,color]) => (
                  <div key={label} className="outcome-item">
                    <div className="outcome-label">{label}</div>
                    <div className="outcome-bar-wrap"><div className="outcome-bar" style={{ width:`${stats.total>0?count/stats.total*100:0}%`, background:color }} /></div>
                    <div className="outcome-count">{count}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="section-title">Call Quality</div>
                <div className="quality-row">
                  {[{label:'✅ GOOD',count:stats.good,cls:'good'},{label:'⚠️ NEUTRAL',count:stats.neutral,cls:'neutral'},{label:'❌ BAD',count:stats.bad,cls:'bad'}].map(q => (
                    <div key={q.cls} className={`quality-item ${q.cls}`}><div className="q-count">{q.count}</div><div className="q-label">{q.label}</div></div>
                  ))}
                </div>
                <div style={{ marginTop:24 }}>
                  <div className="section-title">Top Objections</div>
                  {stats.topObjections.length === 0 ? <div className="empty">No objections yet</div> : stats.topObjections.map(o => (
                    <div key={o.name} className="outcome-item">
                      <div className="outcome-label" style={{fontSize:12}}>{o.name}</div>
                      <div className="outcome-bar-wrap"><div className="outcome-bar" style={{width:`${stats.total>0?o.count/stats.total*100:0}%`,background:'#6f42c1'}} /></div>
                      <div className="outcome-count">{o.count}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="section-title">Calls — Last 7 Days</div>
                <div className="bar-chart">
                  {stats.last7.map(d => (
                    <div key={d.label} className="bar-col">
                      <div className="bar-val">{d.count}</div>
                      <div className="bar" style={{height:Math.max(4,Math.round(d.count/maxDay*80))}} />
                      <div className="bar-day">{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {objectionSummary.length > 0 && (
              <div className="card" style={{marginBottom:24}}>
                <div className="section-title">🧠 Objection Intelligence</div>
                <p style={{fontSize:13,color:'#666',marginBottom:20}}>Based on real calls. What James currently says and how to improve it.</p>
                <div className="objection-grid">
                  {objectionSummary.map(([objection,{count,intel}]) => (
                    <div key={objection} className="objection-card">
                      <div className="objection-header">
                        <div className="objection-name">"{objection}"</div>
                        <div className="objection-count">{count}x</div>
                      </div>
                      {intel ? <>
                        <div className="objection-section"><div className="objection-section-label">📋 Current response</div><div className="objection-text current">{intel.current}</div></div>
                        <div className="objection-section"><div className="objection-section-label">💡 Recommendation</div><div className="objection-text recommendation">{intel.recommendation}</div></div>
                      </> : (
                        <div className="objection-section"><div className="objection-section-label">💡 Recommendation</div><div className="objection-text recommendation">This objection isn't explicitly handled. Consider adding a specific branch for "{objection}".</div></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <div className="section-title" style={{marginBottom:0}}>
                  {callFilter === 'picked_up'   ? '📞 People Who Picked Up' :
                   callFilter === 'transferred'  ? '✅ Transferred Calls' :
                   callFilter === 'dnc'          ? '🚫 DNC Calls' :
                   'Recent Calls'}
                </div>
                {callFilter && <button className="clear-filter-btn" onClick={() => setCallFilter(null)}>✕ Clear filter</button>}
              </div>
              {(() => {
                const filtered = callFilter === 'picked_up'  ? calls.filter(c => c.outcome === 'transferred' || c.outcome === 'not_interested') :
                                 callFilter === 'transferred' ? calls.filter(c => c.outcome === 'transferred') :
                                 callFilter === 'dnc'         ? calls.filter(c => c.outcome === 'dnc') :
                                 calls

                const pickedUpTransfers    = filtered.filter(c => c.outcome === 'transferred').length
                const pickedUpNotInterested = filtered.filter(c => c.outcome === 'not_interested').length
                const total                = filtered.length

                return filtered.length === 0 ? <div className="empty">No calls match this filter.</div> : (
                <>
                {callFilter === 'picked_up' && total > 0 && (
                  <div className="filter-stats-bar">
                    <div className="filter-stat">
                      <div className="filter-stat-value" style={{color:'#28a745'}}>{pickedUpTransfers}</div>
                      <div className="filter-stat-label">Transferred</div>
                      <div className="filter-stat-pct" style={{color:'#28a745'}}>{pct(pickedUpTransfers, total)}</div>
                    </div>
                    <div className="filter-stat-divider" />
                    <div className="filter-stat">
                      <div className="filter-stat-value" style={{color:'#f4a300'}}>{pickedUpNotInterested}</div>
                      <div className="filter-stat-label">Not Interested</div>
                      <div className="filter-stat-pct" style={{color:'#f4a300'}}>{pct(pickedUpNotInterested, total)}</div>
                    </div>
                    <div className="filter-stat-divider" />
                    <div className="filter-stat">
                      <div className="filter-stat-value" style={{color:'#fff'}}>{total}</div>
                      <div className="filter-stat-label">Total Engaged</div>
                      <div className="filter-stat-pct" style={{color:'#666'}}>100%</div>
                    </div>
                  </div>
                )}
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Date / Time</th><th>Name</th><th>Phone</th><th>Outcome</th><th>Quality</th><th>Duration</th><th>Objections</th><th>Summary</th><th>Recording</th></tr></thead>
                    <tbody>
                      {filtered.map(c => (
                        <>
                          <tr key={c.id}>
                            <td>{new Date(c.created_at).toLocaleString()}</td>
                            <td style={{color:'#fff',fontWeight:600}}>{c.contact_name||'Unknown'}</td>
                            <td>{c.phone||'—'}</td>
                            <td>{outcomeBadge(c.outcome)}</td>
                            <td>{['customer-ended-call','assistant-forwarded-call','assistant-ended-call'].includes(c.ended_reason) ? qualityBadge(c.quality) : null}</td>
                            <td>{c.duration_seconds?fmtSec(c.duration_seconds):'—'}</td>
                            <td style={{fontSize:12,color:'#999'}}>{c.objections||'—'}</td>
                            <td><div className="summary-text" title={c.summary}>{c.summary||'—'}</div></td>
                            <td>{c.recording_url ? <button className="play-btn" onClick={()=>setPlayingId(playingId===c.id?null:c.id)}>{playingId===c.id?'■ Stop':'▶ Play'}</button> : '—'}</td>
                          </tr>
                          {playingId===c.id && c.recording_url && (
                            <tr key={`${c.id}-audio`} className="audio-row">
                              <td colSpan={9}><div className="audio-player-wrap"><audio controls autoPlay src={c.recording_url} style={{width:'100%',height:40}} onEnded={()=>setPlayingId(null)} /></div></td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>)})()}
            </div>
          </>
        )}

        {/* ── REPS TAB ── */}
        {tab === 'reps' && (
          repLoading ? <div className="loading"><div className="spinner" /><p>Loading rep data…</p></div> :
          !repData   ? <div className="loading"><p>No data yet.</p></div> : <>

            {/* Rep KPI cards */}
            <div style={{display:'grid',gridTemplateColumns:`repeat(${repData.repStats.length},1fr)`,gap:16,marginBottom:24}}>
              {repData.repStats.map((rep, i) => (
                <div key={rep.rep} className="rep-hero-card" style={{'--rep-color': REP_COLORS[i]}}>
                  <div className="rep-hero-name">{rep.rep}</div>
                  <div className="rep-hero-grid">
                    {[
                      ['Leads',        rep.leads.toLocaleString()],
                      ['Contacts',     rep.contacts.toLocaleString()],
                      ['Contact Rate', pct(rep.contacts, rep.leads)],
                      ['Sign-ups',     rep.signups.toLocaleString()],
                      ['Sign-up Rate', pct(rep.signups, rep.contacts)],
                      ['Docs Acq.',    rep.docsAcq.toLocaleString()],
                      ['Follow-Ups',   rep.followUps.toLocaleString()],
                      ['Total kWh',    fmtKwh(rep.totalKwh)],
                    ].map(([label, value]) => (
                      <div key={label} className="rep-stat">
                        <div className="rep-stat-label">{label}</div>
                        <div className="rep-stat-value">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Head to head bars */}
            <div className="card" style={{marginBottom:24}}>
              <div className="section-title">Head to Head</div>
              {[
                ['Leads',       repData.repStats.map(r => r.leads)],
                ['Contacts',    repData.repStats.map(r => r.contacts)],
                ['Sign-ups',    repData.repStats.map(r => r.signups)],
                ['Docs Acq.',   repData.repStats.map(r => r.docsAcq)],
                ['Total kWh',   repData.repStats.map(r => r.totalKwh)],
              ].map(([label, values]) => {
                const max = Math.max(...values, 1)
                return (
                  <div key={label} style={{marginBottom:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#666',letterSpacing:'.8px',textTransform:'uppercase',marginBottom:6}}>{label}</div>
                    {repData.repStats.map((rep, i) => (
                      <div key={rep.rep} style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                        <div style={{width:70,fontSize:12,color:'#ccc',flexShrink:0}}>{rep.rep}</div>
                        <div style={{flex:1,background:'#0f0f1a',borderRadius:4,height:10,overflow:'hidden'}}>
                          <div style={{height:'100%',borderRadius:4,background:REP_COLORS[i],width:`${values[i]/max*100}%`,transition:'width .6s ease'}} />
                        </div>
                        <div style={{width:60,fontSize:13,fontWeight:700,color:'#fff',textAlign:'right'}}>
                          {label === 'Total kWh' ? fmtKwh(values[i]) : values[i].toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Weekly breakdown table */}
            <div className="card">
              <div className="section-title">Weekly Breakdown</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Rep</th>
                      <th>Leads</th>
                      <th>Contacts</th>
                      <th>Contact Rate</th>
                      <th>Sign-ups</th>
                      <th>Sign-up Rate</th>
                      <th>Docs Acq.</th>
                      <th>Follow-Ups</th>
                      <th>kWh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repData.records.map((row, i) => {
                      const repIdx = repData.repStats.findIndex(r => r.rep === row.rep)
                      return (
                        <tr key={i}>
                          <td style={{fontWeight:600,color:'#f4a300'}}>{row.week}</td>
                          <td style={{fontWeight:700,color:REP_COLORS[repIdx]||'#fff'}}>{row.rep}</td>
                          <td>{row.leads.toLocaleString()}</td>
                          <td>{row.contacts.toLocaleString()}</td>
                          <td>{row.leads > 0 ? pct(row.contacts, row.leads) : '—'}</td>
                          <td>{row.signups.toLocaleString()}</td>
                          <td>{row.contacts > 0 ? pct(row.signups, row.contacts) : '—'}</td>
                          <td>{row.docsAcq.toLocaleString()}</td>
                          <td>{row.followUps.toLocaleString()}</td>
                          <td style={{fontWeight:700,color:'#20c997'}}>{fmtKwh(row.signupKwh + row.docsKwh)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#0f0f1a; color:#e0e0e0; min-height:100vh; }

        .header { background:#1a1a2e; padding:14px 32px; display:flex; align-items:center; gap:24px; border-bottom:1px solid #2a2a4a; position:sticky; top:0; z-index:10; }
        .header h1 { font-size:18px; font-weight:700; color:#fff; white-space:nowrap; }
        .tabs { display:flex; gap:4px; flex:1; }
        .tab-btn { background:transparent; border:1px solid #2a2a4a; color:#888; padding:7px 18px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; transition:all .2s; }
        .tab-btn:hover { border-color:#3a3a6a; color:#ccc; }
        .tab-btn.active { background:#f4a300; border-color:#f4a300; color:#000; }
        .header-right { display:flex; align-items:center; gap:12px; margin-left:auto; }
        .live-badge { background:#28a745; color:#fff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; animation:pulse 2s infinite; white-space:nowrap; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        .last-updated { font-size:12px; color:#888; white-space:nowrap; }
        .refresh-btn { background:#2a2a4a; border:1px solid #3a3a6a; color:#ccc; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:13px; white-space:nowrap; }
        .refresh-btn:hover { background:#3a3a6a; color:#fff; }
        .period-select { background:#2a2a4a; border:1px solid #3a3a6a; color:#fff; padding:6px 12px; border-radius:6px; font-size:13px; cursor:pointer; outline:none; }
        .period-select:hover { border-color:#f4a300; }

        .container { padding:24px 32px; max-width:1600px; margin:0 auto; }

        /* KPI */
        .kpi-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; margin-bottom:24px; }
        .kpi-card { background:#1a1a2e; border:1px solid #2a2a4a; border-radius:12px; padding:20px; position:relative; overflow:hidden; }
        .kpi-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
        .kpi-green::before{background:#28a745} .kpi-blue::before{background:#0d6efd} .kpi-orange::before{background:#f4a300} .kpi-teal::before{background:#20c997} .kpi-red::before{background:#dc3545} .kpi-purple::before{background:#6f42c1}
        .kpi-clickable { cursor:pointer; transition:transform .15s, border-color .15s; }
        .kpi-clickable:hover { transform:translateY(-2px); border-color:#f4a300; }
        .kpi-active { border-color:#f4a300 !important; box-shadow:0 0 0 2px #f4a30033; }
        .clear-filter-btn { background:#2a2a4a; border:1px solid #3a3a6a; color:#f4a300; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:700; }
        .clear-filter-btn:hover { background:#f4a300; color:#000; border-color:#f4a300; }
        .filter-stats-bar { display:flex; align-items:center; gap:0; background:#0f0f1a; border:1px solid #2a2a4a; border-radius:10px; padding:16px 24px; margin-bottom:16px; }
        .filter-stat { flex:1; text-align:center; }
        .filter-stat-value { font-size:32px; font-weight:800; line-height:1; }
        .filter-stat-label { font-size:11px; color:#888; font-weight:600; letter-spacing:.8px; text-transform:uppercase; margin:4px 0; }
        .filter-stat-pct { font-size:18px; font-weight:700; }
        .filter-stat-divider { width:1px; height:60px; background:#2a2a4a; flex-shrink:0; }
        .kpi-label { font-size:11px; font-weight:600; color:#888; letter-spacing:.8px; text-transform:uppercase; margin-bottom:10px; }
        .kpi-value { font-size:34px; font-weight:800; color:#fff; line-height:1; }
        .kpi-sub   { font-size:12px; color:#666; margin-top:6px; }

        .section-title { font-size:11px; font-weight:700; color:#666; letter-spacing:1px; text-transform:uppercase; margin-bottom:14px; }
        .row2 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:24px; }
        .card { background:#1a1a2e; border:1px solid #2a2a4a; border-radius:12px; padding:20px; margin-bottom:24px; }

        .outcome-item { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
        .outcome-label { font-size:13px; color:#ccc; width:130px; flex-shrink:0; }
        .outcome-bar-wrap { flex:1; background:#0f0f1a; border-radius:4px; height:8px; overflow:hidden; }
        .outcome-bar { height:100%; border-radius:4px; transition:width .6s ease; min-width:2px; }
        .outcome-count { font-size:13px; font-weight:700; color:#fff; width:28px; text-align:right; }

        .quality-row { display:flex; gap:10px; }
        .quality-item { flex:1; background:#0f0f1a; border-radius:10px; padding:14px; text-align:center; }
        .quality-item.good{border:1px solid #28a745} .good .q-count{color:#28a745}
        .quality-item.neutral{border:1px solid #f4a300} .neutral .q-count{color:#f4a300}
        .quality-item.bad{border:1px solid #dc3545} .bad .q-count{color:#dc3545}
        .q-count { font-size:30px; font-weight:800; }
        .q-label { font-size:10px; color:#888; margin-top:4px; font-weight:600; }

        .bar-chart { display:flex; align-items:flex-end; gap:8px; height:110px; margin-top:12px; }
        .bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; }
        .bar { width:100%; background:#3a3a6a; border-radius:4px 4px 0 0; min-height:4px; }
        .bar:hover { background:#f4a300; }
        .bar-val { font-size:11px; font-weight:700; color:#fff; }
        .bar-day { font-size:9px; color:#666; text-align:center; }

        /* Objection cards */
        .objection-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(440px,1fr)); gap:16px; }
        .objection-card { background:#0f0f1a; border:1px solid #2a2a4a; border-radius:10px; padding:16px; }
        .objection-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .objection-name { font-size:15px; font-weight:700; color:#fff; }
        .objection-count { background:#2a2a4a; color:#f4a300; font-size:12px; font-weight:700; padding:3px 10px; border-radius:20px; }
        .objection-section { margin-bottom:12px; }
        .objection-section-label { font-size:10px; font-weight:700; letter-spacing:.8px; text-transform:uppercase; margin-bottom:6px; color:#666; }
        .objection-text { font-size:13px; line-height:1.6; padding:10px 12px; border-radius:6px; }
        .objection-text.current { background:#1a1a2e; color:#aaa; border-left:3px solid #3a3a6a; }
        .objection-text.recommendation { background:#0d2010; color:#b8f0c8; border-left:3px solid #28a745; }

        /* Rep cards */
        .rep-hero-card { background:#1a1a2e; border:2px solid var(--rep-color); border-radius:14px; padding:24px; }
        .rep-hero-name { font-size:22px; font-weight:800; color:var(--rep-color); margin-bottom:18px; }
        .rep-hero-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .rep-stat { background:#0f0f1a; border-radius:8px; padding:12px; }
        .rep-stat-label { font-size:10px; font-weight:700; color:#666; letter-spacing:.8px; text-transform:uppercase; margin-bottom:4px; }
        .rep-stat-value { font-size:22px; font-weight:800; color:#fff; }

        /* Table */
        .table-wrap { overflow-x:auto; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        thead th { background:#0f0f1a; color:#888; font-size:11px; font-weight:700; letter-spacing:.8px; text-transform:uppercase; padding:10px 14px; text-align:left; border-bottom:1px solid #2a2a4a; white-space:nowrap; }
        tbody tr { border-bottom:1px solid #1f1f35; transition:background .15s; }
        tbody tr:hover { background:#1f1f35; }
        tbody td { padding:10px 14px; color:#ccc; vertical-align:middle; }
        tbody td:first-child { color:#888; font-size:12px; }

        .audio-row { background:#0d1a0d !important; }
        .audio-player-wrap { padding:8px 0; }
        audio { border-radius:6px; filter:invert(0.85) hue-rotate(180deg); }
        .play-btn { background:#1a1a2e; border:1px solid #3a3a6a; color:#f4a300; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:700; white-space:nowrap; }
        .play-btn:hover { background:#f4a300; color:#000; border-color:#f4a300; }

        .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
        .badge-green{background:#0d2818;color:#28a745;border:1px solid #28a745}
        .badge-red{background:#2a0d0d;color:#dc3545;border:1px solid #dc3545}
        .badge-orange{background:#2a1a00;color:#f4a300;border:1px solid #f4a300}
        .badge-blue{background:#0a1a2e;color:#0d6efd;border:1px solid #0d6efd}
        .badge-gray{background:#1a1a1a;color:#888;border:1px solid #444}

        .summary-text { max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:12px; color:#999; }
        .empty { color:#555; font-size:13px; padding:24px 0; text-align:center; }
        .loading { text-align:center; padding:80px; color:#666; }
        .spinner { width:40px; height:40px; border:3px solid #2a2a4a; border-top-color:#f4a300; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto 16px; }
        @keyframes spin { to{transform:rotate(360deg)} }

        @media(max-width:1200px){.kpi-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:900px){.row2{grid-template-columns:1fr}.objection-grid{grid-template-columns:1fr}}
        @media(max-width:600px){.kpi-grid{grid-template-columns:repeat(2,1fr)}.container{padding:16px}.header{flex-wrap:wrap}}
      `}</style>
    </>
  )
}
