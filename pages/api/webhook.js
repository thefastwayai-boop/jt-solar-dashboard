import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const payload = req.body

  // Forward to GHL immediately (don't wait)
  fetch(process.env.GHL_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(err => console.error('GHL forward failed:', err))

  // Only store end-of-call reports
  const type = payload?.message?.type
  if (type === 'end-of-call-report') {
    const msg      = payload.message      || {}
    const call     = msg.call             || {}
    const metadata = call.metadata        || {}
    const customer = call.customer        || {}
    const analysis = msg.analysis         || {}
    const data     = analysis.structuredData || {}

    const objections = Array.isArray(data.objections_raised)
      ? data.objections_raised.join(', ')
      : data.objections_raised || ''

    await supabaseAdmin.from('calls').insert({
      contact_name:       customer.name         || null,
      phone:              customer.number        || null,
      ghl_contact_id:     metadata.contact_id   || null,
      duration_seconds:   Math.round(msg.durationSeconds || 0),
      ended_reason:       msg.endedReason        || null,
      answered_by:        msg.call?.answeredBy   || null,
      outcome:            data.outcome           || null,
      quality:            data.quality           || null,
      customer_sentiment: data.customer_sentiment || null,
      transfer_completed: data.transfer_completed ?? null,
      objections,
      summary:            msg.summary            || null,
      recording_url:      msg.recordingUrl       || null,
    })
  }

  res.status(200).json({ status: 'ok' })
}
