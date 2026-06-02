import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setSent(true)
    setLoading(false)
    toast.success('Se o email existir, voce recebera as instrucoes!')
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:32, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
          <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--text-muted)', fontSize:13, textDecoration:'none', marginBottom:24 }}>
            <ArrowLeft size={15} /> Voltar ao login
          </Link>

          {!sent ? (
            <>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:24 }}>
                <div style={{ width:52, height:52, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                  <Mail size={24} color="#60a5fa" />
                </div>
                <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text-primary)' }}>Recuperar senha</h1>
                <p style={{ fontSize:13, color:'var(--text-muted)', marginTop:4, textAlign:'center' }}>
                  Digite seu email e enviaremos as instrucoes para redefinir sua senha.
                </p>
              </div>
              <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label className="label">Email</label>
                  <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required autoFocus />
                </div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ justifyContent:'center', padding:'11px 0' }}>
                  {loading ? 'Enviando...' : 'Enviar instrucoes'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <Check size={28} color="#22c55e" />
              </div>
              <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>Email enviado!</h2>
              <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:20 }}>
                Se o email <strong style={{ color:'var(--text-primary)' }}>{email}</strong> estiver cadastrado, voce recebera as instrucoes em breve.
              </p>
              <Link to="/login" className="btn-primary" style={{ display:'inline-flex', justifyContent:'center', padding:'10px 24px', textDecoration:'none' }}>
                Voltar ao login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
