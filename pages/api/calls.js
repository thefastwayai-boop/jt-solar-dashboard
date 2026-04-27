import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const limit  = parseInt(req.query.limit) || 50
  const period = req.query.period || 'all'

  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let fromDate = null
  if (period === '1d') { fromDate = new Date(today) }
  if (period === '7d') { fromDate = new Date(today); fromDate.setDate(today.getDate() - 6) }
  if (period === '1m') { fromDate = new Date(today); fromDate.setDate(today.getDate() - 30) }

  let query = supabaseAdmin
    .from('calls')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (fromDate) query = query.gte('created_at', fromDate.toISOString())

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json(data)
}
