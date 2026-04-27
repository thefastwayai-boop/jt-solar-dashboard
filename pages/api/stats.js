import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const period = req.query.period || 'all'

  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let fromDate = null
  if (period === '1d') { fromDate = new Date(today) }
  if (period === '7d') { fromDate = new Date(today); fromDate.setDate(today.getDate() - 6) }
  if (period === '1m') { fromDate = new Date(today); fromDate.setDate(today.getDate() - 30) }

  let query = supabaseAdmin
    .from('calls')
    .select('created_at, outcome, quality, customer_sentiment, transfer_completed, duration_seconds, ended_reason, answered_by, objections')
    .order('created_at', { ascending: false })

  if (fromDate) query = query.gte('created_at', fromDate.toISOString())

  const { data: rows, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const weekStart = new Date(today); weekStart.setDate(today.getDate() - 6)

  let total = 0, todayCount = 0, weekCount = 0
  let transfers = 0, dnc = 0, notInterested = 0, noAnswer = 0
  let voicemail = 0, wrongNumber = 0, callback = 0, busy = 0, other = 0
  let good = 0, neutral = 0, bad = 0
  let totalDuration = 0, durationCount = 0
  const dailyCounts = {}
  const objectionMap = {}

  rows.forEach(row => {
    const date    = new Date(row.created_at)
    const outcome = (row.outcome || '').toLowerCase()
    const quality = (row.quality || '').toLowerCase()
    const duration = row.duration_seconds || 0
    const dayKey  = date.toISOString().split('T')[0]

    total++
    if (date >= today)     todayCount++
    if (date >= weekStart) weekCount++
    dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1

    if (outcome === 'transferred')             transfers++
    else if (outcome === 'dnc')                dnc++
    else if (outcome === 'not_interested')     notInterested++
    else if (outcome === 'no_answer')          noAnswer++
    else if (outcome === 'voicemail')          voicemail++
    else if (outcome === 'wrong_number')       wrongNumber++
    else if (outcome === 'callback_requested') callback++
    else if (outcome === 'busy')               busy++
    else other++

    if (quality === 'good')         good++
    else if (quality === 'bad')     bad++
    else if (quality === 'neutral') neutral++

    if (duration > 0) { totalDuration += duration; durationCount++ }

    if (row.objections) {
      row.objections.split(',').map(o => o.trim()).filter(Boolean).forEach(o => {
        objectionMap[o] = (objectionMap[o] || 0) + 1
      })
    }
  })

  // Last 7 days chart (always shows last 7 regardless of filter)
  const last7 = []
  for (let i = 6; i >= 0; i--) {
    const d   = new Date(today); d.setDate(today.getDate() - i)
    const key = d.toISOString().split('T')[0]
    last7.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
      count: dailyCounts[key] || 0
    })
  }

  const topObjections = Object.entries(objectionMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, count]) => ({ name, count }))

  const contactedReasons = new Set(['customer-ended-call', 'assistant-forwarded-call', 'assistant-ended-call'])
  const contacted = rows.filter(r => contactedReasons.has((r.ended_reason || '').toLowerCase())).length

  res.status(200).json({
    total, todayCount, weekCount, transfers,
    transferRate: total > 0 ? transfers / total : 0,
    contactRate:  total > 0 ? (total - contacted) / total : 0,
    dnc, notInterested, noAnswer, voicemail, wrongNumber, callback, busy, other,
    good, neutral, bad,
    avgDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
    last7, topObjections
  })
}
