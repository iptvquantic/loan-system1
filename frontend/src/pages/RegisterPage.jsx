import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, UserPlus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handle = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('As senhas não coincidem')
    if (form.password.length < 6) return toast.error('Senha deve ter pelo menos 6 caracteres')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name, email: form.email, password: form.password
      })
      localStorage.setItem('token', data.token)
      localStorage.setItem('admin', JSON.stringify(data.user))
      toast.success('Conta criada! Aproveite seus 15 dias gratis!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar conta')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:460, position:'relative' }}>
        <div style={{ background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', borderRadius:12, padding:'12px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, padding:'4px 8px', fontSize:12, fontWeight:700, color:'#fff' }}>GRATIS</div>
          <p style={{ color:'#fff', fontSize:13, fontWeight:600 }}>15 dias de teste gratis sem cartao de credito!</p>
        </div>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:32, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
            <div style={{ width:56, height:56, background:'var(--bg-primary)', border:'2px solid #3b82f6', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
              <span style={{ fontFamily:'Arial Black,Arial', fontWeight:900, fontSize:'1.6rem', color:'#3b82f6', lineHeight:1 }}>C</span>
            </div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)' }}>Criar conta no CREDIX</h1>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>Gestao de Emprestimos Pessoais</p>
          </div>
          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="label">Nome completo</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="Seu nome" required autoFocus />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="seu@email.com" required />
            </div>
            <div>
              <label className="label">Senha</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Minimo 6 caracteres" required style={{ paddingRight:40 }} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirmar senha</label>
              <input className="input" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repita a senha" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent:'center', padding:'11px 0', fontSize:15, marginTop:4 }}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
              {loading ? 'Criando conta...' : 'Criar conta gratis'}
            </button>
          </form>
          <div style={{ marginTop:20, padding:16, background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:10 }}>
            {['15 dias gratis sem cartao','Contratos e clientes ilimitados','Suporte via WhatsApp','Cancele quando quiser'].map(b => (
              <div key={b} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <Check size={14} color="#22c55e" />
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{b}</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign:'center', fontSize:13, color:'var(--text-muted)', marginTop:20 }}>
            Ja tem conta?{' '}
            <Link to="/login" style={{ color:'#60a5fa', fontWeight:600, textDecoration:'none' }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
