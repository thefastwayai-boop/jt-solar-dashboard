import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Login() {
  const router = useRouter()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (res.ok) {
        router.push('/')
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid email or password.')
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>JT Solar — Login</title></Head>
      <div className="page">
        <div className="card">
          <div className="logo">☀️</div>
          <h1>JT Solar</h1>
          <p>AI Dialer Dashboard</p>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label>Password</label>
              <div className="pass-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="show-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#0f0f1a; color:#e0e0e0; min-height:100vh; }
      `}</style>

      <style jsx>{`
        .page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
        .card { background:#1a1a2e; border:1px solid #2a2a4a; border-radius:16px; padding:40px; width:100%; max-width:400px; }
        .logo { font-size:48px; text-align:center; margin-bottom:12px; }
        h1 { font-size:24px; font-weight:800; color:#fff; text-align:center; margin-bottom:4px; }
        p { font-size:14px; color:#666; text-align:center; margin-bottom:32px; }
        .field { margin-bottom:16px; }
        label { display:block; font-size:11px; font-weight:700; color:#888; letter-spacing:.8px; text-transform:uppercase; margin-bottom:6px; }
        input { width:100%; background:#0f0f1a; border:1px solid #2a2a4a; border-radius:8px; color:#fff; font-size:14px; padding:12px 14px; outline:none; transition:border-color .2s; }
        input:focus { border-color:#f4a300; }
        input::placeholder { color:#444; }
        .pass-wrap { position:relative; }
        .pass-wrap input { padding-right:44px; }
        .show-btn { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:16px; padding:4px; width:auto; margin:0; color:#888; }
        .show-btn:hover { background:none; color:#fff; }
        .error { background:#2a0d0d; border:1px solid #dc3545; color:#dc3545; font-size:13px; padding:10px 14px; border-radius:8px; margin-bottom:16px; }
        button { width:100%; background:#f4a300; border:none; border-radius:8px; color:#000; font-size:15px; font-weight:800; padding:14px; cursor:pointer; transition:background .2s; margin-top:8px; }
        button:hover { background:#e09500; }
        button:disabled { background:#3a3a6a; color:#666; cursor:not-allowed; }
      `}</style>
    </>
  )
}
