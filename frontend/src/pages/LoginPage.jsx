import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    const res = await login(email, password)
    if (res.ok) { toast.success('Bem-vindo ao CREDIX!'); navigate('/dashboard') }
    else toast.error(res.error)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'25%', left:'50%', transform:'translateX(-50%)', width:600, height:600, background:'rgba(59,130,246,0.05)', borderRadius:'50%', filter:'blur(80px)' }} />
      </div>
      <div style={{ width:'100%', maxWidth:420, position:'relative' }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:32, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
            <div style={{ width:56, height:56, background:'var(--bg-primary)', border:'2px solid #3b82f6', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, boxShadow:'0 0 20px rgba(59,130,246,0.3)' }}>
              <span style={{ fontFamily:'Arial Black,Arial', fontWeight:900, fontSize:'1.6rem', color:'#3b82f6', lineHeight:1 }}>C</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', letterSpacing:'0.02em' }}>CREDIX</h1>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>Gestao de Emprestimos Pessoais</p>
          </div>
          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="seu@email.com" required autoFocus />
            </div>
            <div>
              <label className="label" style={{ display:'flex', justifyContent:'space-between' }}>
                <span>Senha</span>
                <Link to="/forgot-password" style={{ fontSize:11, color:'#60a5fa', textDecoration:'none', fontWeight:500 }}>Esqueci minha senha</Link>
              </label>
              <div style={{ position:'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••••" required style={{ paddingRight:40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent:'center', padding:'11px 0', fontSize:15, marginTop:4 }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid var(--border)', textAlign:'center' }}>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>Nao tem conta ainda?</p>
            <Link to="/register" style={{ display:'block', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', color:'#60a5fa', borderRadius:10, padding:'11px 0', fontSize:14, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
              Criar conta gratis — 15 dias de trial
            </Link>
          </div>
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)', marginTop:16 }}>CREDIX 2026 — Sistema privado</p>
      </div>
    </div>
  )
}
