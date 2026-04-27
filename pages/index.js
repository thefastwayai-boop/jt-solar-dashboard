import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

const OBJECTION_INTEL = {
  'not interested': {
    current: 'One overcome: "It\'s a free state program — would you want me to just check if you qualify?" If still no, ends call.',
    recommendation: 'Try acknowledging the hesitation before pivoting: "Totally get it, you probably get a lot of calls." Then add social proof before the overcome: "This one\'s different — it\'s state-backed and credits directly to your ComEd bill, nothing to sign up for." Also test "2 minutes" vs "5 minutes" in the overcome — shorter feels less like a commitment.',
  },
  'already has solar': {
    current: '"Got it, sounds like you\'re already covered. Have a great day." → Ends call immediately.',
    recommendation: 'Add one qualifying question before ending: "Oh nice — did you go rooftop or community solar?" If they say rooftop, they may still qualify for the ComEd community solar credit on top of their existing system. This is a likely missed conversion — add a branch for this.',
  },
  'busy': {
    current: '"No worries — we will give you a call back. Have a great day." → Ends call, relies on retry.',
    recommendation: 'Capture a specific time instead of relying on retry slots: "No problem — morning or afternoon usually better for you?" Even a rough window means the next call hits at a better time and feels less random to the lead.',
  },
  'spouse': {
    current: '"Of course — what time works best for us to call you back?" → Capture Callback.',
    recommendation: 'This is a warm signal — they\'re interested. Make sure the callback time is flowing correctly into GHL\'s ai_callback_at field. Also consider adding: "Would it be easier if I just called back in a couple hours, or did you have a specific time?" to make scheduling feel more natural.',
  },
  'partner': {
    current: '"Of course — what time works best for us to call you back?" → Capture Callback.',
    recommendation: 'Same as spouse objection — warm lead. Confirm the callback loop is working end-to-end in GHL before going to full volume.',
  },
  'scam': {
    current: '"Fair question. It\'s a state-backed community solar program — ComEd applies the discount directly to your bill. Let me get you someone who can explain it in thirty seconds." → Transfer.',
    recommendation: 'Add one line of social proof before pushing to transfer: "We\'ve helped thousands of Illinois households through this — ComEd certifies the program directly." This reduces friction before the ask. Also consider: if they still push back after this, add a softer fallback instead of a hard transfer push.',
  },
  'is this a scam': {
    current: '"Fair question. It\'s a state-backed community solar program..." → Transfer.',
    recommendation: 'Same as scam objection above. The response is solid but could use one line of credibility before the transfer ask.',
  },
  'how did you get my number': {
    current: '"You filled out a form online about lowering your electric bill — that\'s what triggered my call." → Offer removal or continue.',
    recommendation: 'Add more specificity to increase credibility: "You filled out a form on Facebook about energy savings — that\'s the only way we reach out." The word "Facebook" matches what they actually did and removes ambiguity. If they confirm, transition more warmly: "Great — so you were looking to save on your bill. Let me get you connected."',
  },
  'ai': {
    current: '"Yeah I am an AI — I just do the initial reach-out. You would be talking to a real person on the other end. Want me to connect you now?"',
    recommendation: 'The response is honest and good. Consider adding: "Most people actually prefer it — I don\'t put you on hold or transfer you around." This reframes AI as a positive before asking for the transfer. If they still say no, consider one more branch: "No problem — want me to have someone call you back instead?" before ending.',
  },
  'robot': {
    current: '"Yeah I am an AI — I just do the initial reach-out..."',
    recommendation: 'Same as AI objection above.',
  },
  'wrong number': {
    current: '"Oh sorry about that — wrong number. Have a good one." → Ends call.',
    recommendation: 'Before ending, add: "Just to confirm — you didn\'t fill out anything about energy savings recently?" Sometimes people forget or a family member filled it out. Low effort, occasional recovery.',
  },
}

function getObjectionIntel(objection) {
  const key = (objection || '').toLowerCase().trim()
  for (const [k, v] of Object.entries(OBJECTION_INTEL)) {
    if (key.includes(k)) return v
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [calls, setCalls]     = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [playingId, setPlayingId]     = useState(null)

  const load = useCallback(async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/calls?limit=50')
      ])
      setStats(await sRes.json())
      setCalls(await cRes.json())
      setLastUpdated(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t) }, [load])

  const pct    = (n, d) => d > 0 ? (n / d * 100).toFixed(1) + '%' : '0%'
  const fmtSec = s => s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`

  const outcomeBadge = (outcome) => {
    const map = {
      transferred:        { label: 'Transferred',   cls: 'green' },
      dnc:                { label: 'DNC',            cls: 'red' },
      not_interested:     { label: 'Not Interested', cls: 'orange' },
      no_answer:          { label: 'No Answer',      cls: 'gray' },
      voicemail:          { label: 'Voicemail',      cls: 'gray' },
      wrong_number:       { label: 'Wrong Number',   cls: 'gray' },
      callback_requested: { label: 'Callback',       cls: 'blue' },
      busy:               { label: 'Busy',           cls: 'gray' },
    }
    const { label, cls } = map[outcome] || { label: outcome || '—', cls: 'gray' }
    return <span className={`badge badge-${cls}`}>{label}</span>
  }

  const qualityBadge = (q) => {
    if (q === 'good')    return <span className="badge badge-green">✓ Good</span>
    if (q === 'bad')     return <span className="badge badge-red">✗ Bad</span>
    if (q === 'neutral') return <span className="badge badge-orange">~ Neutral</span>
    return <span className="badge badge-gray">—</span>
  }

  // Build objection intel from actual call data
  const objectionSummary = (() => {
    const map = {}
    calls.forEach(c => {
      if (!c.objections) return
      c.objections.split(',').map(o => o.trim()).filter(Boolean).forEach(o => {
        if (!map[o]) map[o] = { count: 0, intel: getObjectionIntel(o) }
        map[o].count++
      })
    })
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count)
  })()

  const maxDay = stats ? Math.max(...stats.last7.map(d => d.count), 1) : 1

  return (
    <>
      <Head>
        <title>JT Solar — AI Dialer Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="header">
        <h1>☀️ JT Solar — <span>Tiffany</span> AI Dialer</h1>
        <div className="header-right">
          <span className="live-badge">● LIVE</span>
          <span className="last-updated">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}</span>
          <button className="refresh-btn" onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div className="loading"><div className="spinner" /><p>Loading dashboard…</p></div>
        ) : !stats ? (
          <div className="loading"><p>Error loading data.</p></div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="kpi-grid">
              {[
                { label: 'Total Calls',   value: stats.total,                           sub: `Today: ${stats.todayCount} | This week: ${stats.weekCount}`, color: 'green' },
                { label: 'Transfers',     value: stats.transfers,                       sub: 'Leads handed to reps',      color: 'blue' },
                { label: 'Transfer Rate', value: pct(stats.transfers, stats.total),     sub: 'Of all calls dialed',       color: 'orange' },
                { label: 'Contact Rate',  value: pct(stats.total - stats.noAnswer - stats.voicemail, stats.total), sub: 'Humans answered', color: 'teal' },
                { label: 'DNC',           value: stats.dnc,                             sub: 'Removed permanently',       color: 'red' },
                { label: 'Avg Duration',  value: fmtSec(stats.avgDuration),             sub: 'Per call',                  color: 'purple' },
              ].map(k => (
                <div key={k.label} className={`kpi-card kpi-${k.color}`}>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                  <div className="kpi-sub">{k.sub}</div>
                </div>
              ))}
            </div>

            {/* Row 2 */}
            <div className="row2">
              <div className="card">
                <div className="section-title">Outcome Breakdown</div>
                {[
                  ['Transferred',    stats.transfers,    '#28a745'],
                  ['Not Interested', stats.notInterested,'#f4a300'],
                  ['No Answer',      stats.noAnswer,     '#6c757d'],
                  ['Voicemail',      stats.voicemail,    '#6c757d'],
                  ['DNC',            stats.dnc,          '#dc3545'],
                  ['Wrong Number',   stats.wrongNumber,  '#6c757d'],
                  ['Callback',       stats.callback,     '#0d6efd'],
                  ['Busy',           stats.busy,         '#aaa'],
                ].map(([label, count, color]) => (
                  <div key={label} className="outcome-item">
                    <div className="outcome-label">{label}</div>
                    <div className="outcome-bar-wrap">
                      <div className="outcome-bar" style={{ width: `${stats.total > 0 ? count/stats.total*100 : 0}%`, background: color }} />
                    </div>
                    <div className="outcome-count">{count}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="section-title">Call Quality</div>
                <div className="quality-row">
                  {[
                    { label: '✅ GOOD',    count: stats.good,    cls: 'good' },
                    { label: '⚠️ NEUTRAL', count: stats.neutral, cls: 'neutral' },
                    { label: '❌ BAD',     count: stats.bad,     cls: 'bad' },
                  ].map(q => (
                    <div key={q.cls} className={`quality-item ${q.cls}`}>
                      <div className="q-count">{q.count}</div>
                      <div className="q-label">{q.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 24 }}>
                  <div className="section-title">Top Objections</div>
                  {stats.topObjections.length === 0
                    ? <div className="empty">No objections recorded yet</div>
                    : stats.topObjections.map(o => (
                      <div key={o.name} className="outcome-item">
                        <div className="outcome-label" style={{ fontSize: 12 }}>{o.name}</div>
                        <div className="outcome-bar-wrap">
                          <div className="outcome-bar" style={{ width: `${stats.total > 0 ? o.count/stats.total*100 : 0}%`, background: '#6f42c1' }} />
                        </div>
                        <div className="outcome-count">{o.count}</div>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="card">
                <div className="section-title">Calls — Last 7 Days</div>
                <div className="bar-chart">
                  {stats.last7.map(d => (
                    <div key={d.label} className="bar-col">
                      <div className="bar-val">{d.count}</div>
                      <div className="bar" style={{ height: Math.max(4, Math.round(d.count/maxDay*80)) }} />
                      <div className="bar-day">{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Objection Intelligence */}
            {objectionSummary.length > 0 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="section-title">🧠 Objection Intelligence</div>
                <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
                  Based on real calls. Each objection includes what Tiffany currently does and a specific recommendation to improve the bot.
                </p>
                <div className="objection-grid">
                  {objectionSummary.map(([objection, { count, intel }]) => (
                    <div key={objection} className="objection-card">
                      <div className="objection-header">
                        <div className="objection-name">"{objection}"</div>
                        <div className="objection-count">{count}x</div>
                      </div>
                      {intel ? (
                        <>
                          <div className="objection-section">
                            <div className="objection-section-label">📋 Current bot response</div>
                            <div className="objection-text current">{intel.current}</div>
                          </div>
                          <div className="objection-section">
                            <div className="objection-section-label">💡 Recommendation</div>
                            <div className="objection-text recommendation">{intel.recommendation}</div>
                          </div>
                        </>
                      ) : (
                        <div className="objection-section">
                          <div className="objection-section-label">💡 Recommendation</div>
                          <div className="objection-text recommendation">
                            This objection is not explicitly handled in the current script. Consider adding a specific branch for "{objection}" so Tiffany has a tailored response rather than falling through to a generic handler.
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calls Table */}
            <div className="card">
              <div className="section-title">Recent Calls</div>
              {calls.length === 0 ? (
                <div className="empty">No calls yet. They will appear here automatically after each call.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date / Time</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Outcome</th>
                        <th>Quality</th>
                        <th>Duration</th>
                        <th>Objections</th>
                        <th>Summary</th>
                        <th>Recording</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calls.map(c => (
                        <>
                          <tr key={c.id}>
                            <td>{new Date(c.created_at).toLocaleString()}</td>
                            <td style={{ color: '#fff', fontWeight: 600 }}>{c.contact_name || '—'}</td>
                            <td>{c.phone || '—'}</td>
                            <td>{outcomeBadge(c.outcome)}</td>
                            <td>{qualityBadge(c.quality)}</td>
                            <td>{c.duration_seconds ? fmtSec(c.duration_seconds) : '—'}</td>
                            <td style={{ fontSize: 12, color: '#999' }}>{c.objections || '—'}</td>
                            <td><div className="summary-text" title={c.summary}>{c.summary || '—'}</div></td>
                            <td>
                              {c.recording_url ? (
                                <button
                                  className="play-btn"
                                  onClick={() => setPlayingId(playingId === c.id ? null : c.id)}
                                >
                                  {playingId === c.id ? '■ Stop' : '▶ Play'}
                                </button>
                              ) : '—'}
                            </td>
                          </tr>
                          {playingId === c.id && c.recording_url && (
                            <tr key={`${c.id}-audio`} className="audio-row">
                              <td colSpan={9}>
                                <div className="audio-player-wrap">
                                  <audio
                                    controls
                                    autoPlay
                                    src={c.recording_url}
                                    style={{ width: '100%', height: 40 }}
                                    onEnded={() => setPlayingId(null)}
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f1a; color: #e0e0e0; min-height: 100vh; }

        .header { background: #1a1a2e; padding: 18px 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #2a2a4a; position: sticky; top: 0; z-index: 10; }
        .header h1 { font-size: 20px; font-weight: 700; color: #fff; }
        .header h1 span { color: #f4a300; }
        .header-right { display: flex; align-items: center; gap: 14px; }
        .live-badge { background: #28a745; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        .last-updated { font-size: 12px; color: #888; }
        .refresh-btn { background: #2a2a4a; border: 1px solid #3a3a6a; color: #ccc; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
        .refresh-btn:hover { background: #3a3a6a; color: #fff; }

        .container { padding: 24px 32px; max-width: 1600px; margin: 0 auto; }

        .kpi-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 24px; }
        .kpi-card { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 12px; padding: 20px; position: relative; overflow: hidden; }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .kpi-green::before  { background: #28a745; } .kpi-blue::before   { background: #0d6efd; }
        .kpi-orange::before { background: #f4a300; } .kpi-teal::before   { background: #20c997; }
        .kpi-red::before    { background: #dc3545; } .kpi-purple::before { background: #6f42c1; }
        .kpi-label { font-size: 11px; font-weight: 600; color: #888; letter-spacing: .8px; text-transform: uppercase; margin-bottom: 10px; }
        .kpi-value { font-size: 34px; font-weight: 800; color: #fff; line-height: 1; }
        .kpi-sub   { font-size: 12px; color: #666; margin-top: 6px; }

        .section-title { font-size: 11px; font-weight: 700; color: #666; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
        .row2 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .card { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 12px; padding: 20px; margin-bottom: 24px; }

        .outcome-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .outcome-label { font-size: 13px; color: #ccc; width: 130px; flex-shrink: 0; }
        .outcome-bar-wrap { flex: 1; background: #0f0f1a; border-radius: 4px; height: 8px; overflow: hidden; }
        .outcome-bar { height: 100%; border-radius: 4px; transition: width .6s ease; min-width: 2px; }
        .outcome-count { font-size: 13px; font-weight: 700; color: #fff; width: 28px; text-align: right; }

        .quality-row { display: flex; gap: 10px; }
        .quality-item { flex: 1; background: #0f0f1a; border-radius: 10px; padding: 14px; text-align: center; }
        .quality-item.good    { border: 1px solid #28a745; } .good .q-count    { color: #28a745; }
        .quality-item.neutral { border: 1px solid #f4a300; } .neutral .q-count { color: #f4a300; }
        .quality-item.bad     { border: 1px solid #dc3545; } .bad .q-count     { color: #dc3545; }
        .q-count { font-size: 30px; font-weight: 800; }
        .q-label { font-size: 10px; color: #888; margin-top: 4px; font-weight: 600; }

        .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 110px; margin-top: 12px; }
        .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .bar { width: 100%; background: #3a3a6a; border-radius: 4px 4px 0 0; min-height: 4px; }
        .bar:hover { background: #f4a300; }
        .bar-val { font-size: 11px; font-weight: 700; color: #fff; }
        .bar-day { font-size: 9px; color: #666; text-align: center; }

        /* Objection Intelligence */
        .objection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 16px; }
        .objection-card { background: #0f0f1a; border: 1px solid #2a2a4a; border-radius: 10px; padding: 16px; }
        .objection-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .objection-name { font-size: 15px; font-weight: 700; color: #fff; }
        .objection-count { background: #2a2a4a; color: #f4a300; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
        .objection-section { margin-bottom: 12px; }
        .objection-section-label { font-size: 10px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; margin-bottom: 6px; color: #666; }
        .objection-text { font-size: 13px; line-height: 1.6; padding: 10px 12px; border-radius: 6px; }
        .objection-text.current { background: #1a1a2e; color: #aaa; border-left: 3px solid #3a3a6a; }
        .objection-text.recommendation { background: #0d2010; color: #b8f0c8; border-left: 3px solid #28a745; }

        /* Table */
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead th { background: #0f0f1a; color: #888; font-size: 11px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; padding: 10px 14px; text-align: left; border-bottom: 1px solid #2a2a4a; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid #1f1f35; transition: background .15s; }
        tbody tr:hover { background: #1f1f35; }
        tbody td { padding: 10px 14px; color: #ccc; vertical-align: middle; }
        tbody td:first-child { color: #888; font-size: 12px; }

        .audio-row { background: #0d1a0d !important; }
        .audio-player-wrap { padding: 8px 0; }
        audio { border-radius: 6px; filter: invert(0.85) hue-rotate(180deg); }

        .play-btn { background: #1a1a2e; border: 1px solid #3a3a6a; color: #f4a300; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; white-space: nowrap; transition: all .2s; }
        .play-btn:hover { background: #f4a300; color: #000; border-color: #f4a300; }

        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .badge-green  { background: #0d2818; color: #28a745; border: 1px solid #28a745; }
        .badge-red    { background: #2a0d0d; color: #dc3545; border: 1px solid #dc3545; }
        .badge-orange { background: #2a1a00; color: #f4a300; border: 1px solid #f4a300; }
        .badge-blue   { background: #0a1a2e; color: #0d6efd; border: 1px solid #0d6efd; }
        .badge-gray   { background: #1a1a1a; color: #888;    border: 1px solid #444; }

        .summary-text { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; color: #999; }
        .empty { color: #555; font-size: 13px; padding: 24px 0; text-align: center; }
        .loading { text-align: center; padding: 80px; color: #666; }
        .spinner { width: 40px; height: 40px; border: 3px solid #2a2a4a; border-top-color: #f4a300; border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 900px)  { .row2 { grid-template-columns: 1fr; } .objection-grid { grid-template-columns: 1fr; } }
        @media (max-width: 600px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr); } .container { padding: 16px; } }
      `}</style>
    </>
  )
}
