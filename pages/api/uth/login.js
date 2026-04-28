
import crypto from 'crypto'

const ALLOWED_USERS = [
  { email: 'joel@jtsolargroup.com',   password: 'Gumball4705!' },
  { email: 'thefastwayai@gmail.com',  password: 'Gumball4705!' },
]

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password } = req.body
  const user = ALLOWED_USERS.find(
    u => u.email.toLowerCase() === (email || '').toLowerCase() && u.password === password
  )

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  // Create a signed session token
  const secret  = process.env.AUTH_SECRET || 'jtsolar-default-secret-change-me'
  const payload = `${user.email}:${Date.now()}`
  const sig     = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const token   = Buffer.from(`${payload}:${sig}`).toString('base64')

  res.setHeader('Set-Cookie', `jt_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`)
  res.status(200).json({ ok: true })
}
