import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, UserPlus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function RegisterPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handle = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('As senhas nao coincidem')
    if (form.password.length < 6) return toast.error('Senha deve ter pelo menos 6 caracteres')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', { name:form.name, email:form.email, password:form.password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('admin', JSON.stringify(data.user))
      toast.success('Conta criada! Aproveite seus 15 dias gratis!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar conta')
    } finally { setLoading(false) }
  }

  const inputStyle = { width:'100%', background:'#0f172a', border:'1.5px solid #334155', borderRadius:10, padding:'11px 14px', color:'#f1f5f9', fontSize:14, outline:'none', transition:'border-color 0.15s, box-shadow 0.15s', boxSizing:'border-box' }
  const focus = e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.15)' }
  const blur  = e => { e.target.style.borderColor='#334155'; e.target.style.boxShadow='none' }

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', display:'flex', alignItems:'center', justifyContent:'center', padding:16, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'15%', left:'50%', transform:'translateX(-50%)', width:500, height:500, background:'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:480, position:'relative', zIndex:1 }}>
        {/* Banner trial */}
        <div style={{ background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', borderRadius:14, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:12, boxShadow:'0 4px 20px rgba(124,58,237,0.3)' }}>
          <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>GRATIS</div>
          <p style={{ color:'#fff', fontSize:14, fontWeight:600, lineHeight:1.4 }}>15 dias de teste gratis — sem cartao de credito necessario!</p>
        </div>

        <div style={{ background:'#1e293b', border:'1px solid #334155', borderRadius:24, padding:'36px 36px', boxShadow:'0 25px 80px rgba(0,0,0,0.5)' }}>
          {/* Logo */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
            <div style={{ width:68, height:68, background:'#0f172a', border:'3px solid #3b82f6', borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, boxShadow:'0 0 28px rgba(59,130,246,0.35)' }}>
              <span style={{ fontFamily:'Arial Black,Arial', fontWeight:900, fontSize:'2rem', color:'#3b82f6', lineHeight:1 }}>C</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:900, color:'#f1f5f9', letterSpacing:'0.02em' }}>Criar conta no CREDIX</h1>
            <p style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>Gestao de Emprestimos Pessoais</p>
          </div>

          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#cbd5e1', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Nome completo</label>
              <input style={inputStyle} value={form.name} onChange={set('name')} placeholder="Seu nome completo" required autoFocus onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#cbd5e1', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" required onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#cbd5e1', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Senha</label>
              <div style={{ position:'relative' }}>
                <input style={{ ...inputStyle, paddingRight:44 }} type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Minimo 6 caracteres" required onFocus={focus} onBlur={blur} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer', display:'flex', alignItems:'center' }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#cbd5e1', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Confirmar senha</label>
              <input style={inputStyle} type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repita a senha" required onFocus={focus} onBlur={blur} />
            </div>
            <button type="submit" disabled={loading}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: loading ? '#5b21b6' : '#7c3aed', color:'#fff', border:'none', borderRadius:10, padding:'13px 0', fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', marginTop:4, boxShadow:'0 4px 15px rgba(124,58,237,0.35)', transition:'all 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background='#6d28d9' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background='#7c3aed' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              {loading ? 'Criando conta...' : 'Criar conta gratis'}
            </button>
          </form>

          {/* Beneficios */}
          <div style={{ marginTop:20, padding:14, background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:10 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'#60a5fa', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.04em' }}>O que esta incluido:</p>
            {['15 dias gratis sem cartao','Contratos e clientes ilimitados','Suporte via WhatsApp','Cancele quando quiser'].map(b => (
              <div key={b} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(34,197,94,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Check size={11} color="#22c55e" />
                </div>
                <span style={{ fontSize:13, color:'#cbd5e1' }}>{b}</span>
              </div>
            ))}
          </div>

          <p style={{ textAlign:'center', fontSize:14, color:'#94a3b8', marginTop:20 }}>
            Ja tem conta?{' '}
            <Link to="/login" style={{ color:'#60a5fa', fontWeight:700, textDecoration:'none' }}>Entrar agora</Link>
          </p>
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'#475569', marginTop:16 }}>CREDIX 2026 — Sistema privado e seguro</p>
      </div>
    </div>
  )
}
