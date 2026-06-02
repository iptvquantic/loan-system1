import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { AlertTriangle, Zap } from 'lucide-react'

export default function TrialBanner() {
  const { admin } = useAuthStore()
  const ps = admin?.planStatus
  if (!ps || ps.plan === 'admin') return null

  if (ps.reason === 'trial_expired' || ps.reason === 'plan_expired') {
    return (
      <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <AlertTriangle size={16} color="#ef4444" />
        <span style={{ fontSize:13, color:'#ef4444', fontWeight:600, flex:1 }}>
          {ps.reason === 'trial_expired' ? 'Seu trial expirou!' : 'Seu plano expirou!'} Assine para continuar usando o CREDIX.
        </span>
        <Link to="/plans" style={{ background:'#ef4444', color:'#fff', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, textDecoration:'none' }}>
          Ver Planos
        </Link>
      </div>
    )
  }

  if (ps.plan === 'trial' && ps.daysLeft <= 5) {
    return (
      <div style={{ background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <Zap size={16} color="#f59e0b" />
        <span style={{ fontSize:13, color:'#f59e0b', fontWeight:600, flex:1 }}>
          Trial expira em {ps.daysLeft} dia{ps.daysLeft !== 1 ? 's' : ''}! Assine agora para não perder acesso.
        </span>
        <Link to="/plans" style={{ background:'#f59e0b', color:'#fff', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, textDecoration:'none' }}>
          Assinar
        </Link>
      </div>
    )
  }

  return null
}
