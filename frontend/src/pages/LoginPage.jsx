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
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', padding:16, position:'relative', overflow:'hidden' }}>
      {/* Background glow */}
      <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:500, height:500, background:'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>
        <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:24, padding:'40px 36px', boxShadow:'0 25px 80px rgba(0,0,0,0.5)' }}>

          {/* Logo grande */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:32 }}>
            <Link to="/" style={{ textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ width:72, height:72, background:'#0f172a', border:'3px solid #3b82f6', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 30px rgba(59,130,246,0.4)', transition:'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
              >
                <span style={{ fontFamily:'Arial Black,Arial', fontWeight:900, fontSize:'2rem', color:'#3b82f6', lineHeight:1 }}>C</span>
              </div>
              <div style={{ textAlign:'center' }}>
                <h1 style={{ fontSize:26, fontWeight:900, color:'#f1f5f9', letterSpacing:'0.06em', lineHeight:1 }}>CREDIX</h1>
                <p style={{ fontSize:13, color:'#94a3b8', marginTop:4, fontWeight:400 }}>Gestao de Emprestimos Pessoais</p>
              </div>
            </Link>
          </div>

          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#cbd5e1', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width:'100%', background:'#0f172a', border:'1.5px solid #334155', borderRadius:10, padding:'11px 14px', color:'#f1f5f9', fontSize:14, outline:'none', transition:'border-color 0.15s, box-shadow 0.15s', boxSizing:'border-box' }}
                placeholder="seu@email.com" required autoFocus
                onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.15)' }}
                onBlur={e => { e.target.style.borderColor='#334155'; e.target.style.boxShadow='none' }}
              />
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.06em' }}>Senha</label>
                <Link to="/forgot-password" style={{ fontSize:12, color:'#60a5fa', textDecoration:'none', fontWeight:600 }}>Esqueci minha senha</Link>
              </div>
              <div style={{ position:'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width:'100%', background:'#0f172a', border:'1.5px solid #334155', borderRadius:10, padding:'11px 42px 11px 14px', color:'#f1f5f9', fontSize:14, outline:'none', transition:'border-color 0.15s, box-shadow 0.15s', boxSizing:'border-box' }}
                  placeholder="••••••••" required
                  onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.15)' }}
                  onBlur={e => { e.target.style.borderColor='#334155'; e.target.style.boxShadow='none' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer', padding:4, display:'flex', alignItems:'center' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: loading ? '#1d4ed8' : '#3b82f6', color:'#fff', border:'none', borderRadius:10, padding:'13px 0', fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.15s', marginTop:4, boxShadow:'0 4px 15px rgba(59,130,246,0.3)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background='#2563eb' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background='#3b82f6' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{ marginTop:24, paddingTop:24, borderTop:'1px solid #334155' }}>
            <p style={{ fontSize:14, color:'#94a3b8', textAlign:'center', marginBottom:12, fontWeight:500 }}>Ainda nao tem uma conta?</p>
            <Link to="/register"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(59,130,246,0.1)', border:'1.5px solid rgba(59,130,246,0.3)', color:'#60a5fa', borderRadius:10, padding:'12px 0', fontSize:14, fontWeight:700, textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(59,130,246,0.18)'; e.currentTarget.style.borderColor='#3b82f6' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(59,130,246,0.1)'; e.currentTarget.style.borderColor='rgba(59,130,246,0.3)' }}
            >
              Criar conta gratis — 15 dias de trial
            </Link>
          </div>
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'#475569', marginTop:20 }}>CREDIX 2026 — Sistema privado e seguro</p>
      </div>
    </div>
  )
}
