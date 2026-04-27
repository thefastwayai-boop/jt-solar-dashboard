import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req, res) {
  const limit = parseInt(req.query.limit) || 50

  const { data, error } = await supabaseAdmin
    .from('calls')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json(data)
}
