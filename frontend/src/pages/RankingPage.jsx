import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, AlertTriangle, TrendingUp, Star, Shield, ChevronRight } from 'lucide-react'
import api from '../utils/api'
import { fmt, riskClass } from '../utils/formatters'
import { Loading } from '../components/shared/UI'
import toast from 'react-hot-toast'

const TABS = [
  { key:'paid',     label:'Mais Pagaram',   icon: TrendingUp },
  { key:'volume',   label:'Maior Volume',   icon: Trophy     },
  { key:'loans',    label:'Mais Contratos', icon: Star       },
  { key:'risk',     label:'Risco / Alertas',icon: AlertTriangle },
]

export default function RankingPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('paid')

  useEffect(() => {
    api.get('/clients')
      .then(({ data }) => setClients(data))
      .catch(() => toast.error('Erro ao carregar ranking'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  const sorted = [...clients].sort((a, b) => {
    if (tab === 'paid')   return (b.total_paid || 0) - (a.total_paid || 0)
    if (tab === 'volume') return (parseFloat(b.total_borrowed) || 0) - (parseFloat(a.total_borrowed) || 0)
    if (tab === 'loans')  return (b.total_loans || 0) - (a.total_loans || 0)
    if (tab === 'risk')   return (b.active_loans || 0) - (a.active_loans || 0)
    return 0
  })

  const stats = {
    total: clients.length,
    low:   clients.filter(c => !c.risk_level || c.risk_level === 'Baixo Risco').length,
    mid:   clients.filter(c => c.risk_level === 'Medio Risco').length,
    high:  clients.filter(c => c.risk_level === 'Alto Risco').length,
  }

  const medals = ['🥇','🥈','🥉']

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Ranking de Clientes</h1>
        <p className="page-sub">Classificacao e perfil de risco dos seus clientes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total de Clientes', value: stats.total, color:'#60a5fa' },
          { label:'Baixo Risco',       value: stats.low,   color:'#22c55e' },
          { label:'Medio Risco',       value: stats.mid,   color:'#f59e0b' },
          { label:'Alto Risco',        value: stats.high,  color:'#ef4444' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:16 }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>{s.label}</p>
            <p style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
                background: tab === t.key ? 'var(--accent)' : 'transparent',
                color: tab === t.key ? '#fff' : 'var(--text-secondary)',
                borderColor: tab === t.key ? 'var(--accent)' : 'var(--border)',
              }}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-hover)' }}>
                {['#','Cliente','CPF','Contratos','Total Pago','Juros Pagos','Risco'].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => {
                const rc = riskClass(c.risk_level || 'Baixo Risco')
                return (
                  <tr key={c.id} className="table-row">
                    <td className="td" style={{ fontWeight:700, fontSize:16, width:40 }}>
                      {medals[i] || `#${i+1}`}
                    </td>
                    <td className="td">
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                          {c.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13 }}>{c.name}</p>
                          <p style={{ fontSize:11, color:'var(--text-muted)' }}>{c.active_loans || 0} ativo{(c.active_loans||0) !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td" style={{ fontFamily:'monospace', fontSize:12, color:'var(--text-muted)' }}>{c.cpf || '—'}</td>
                    <td className="td" style={{ fontSize:13 }}>{c.total_loans || 0} ({c.settled_loans || 0} quitados)</td>
                    <td className="td text-money" style={{ color:'#22c55e' }}>{fmt.currency(c.total_paid || 0)}</td>
                    <td className="td text-money" style={{ color:'#f59e0b' }}>{fmt.currency(c.total_interest_paid || 0)}</td>
                    <td className="td">
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, background:rc.bg, color:rc.color, border:`1px solid ${rc.border}` }}>
                        {c.risk_level || 'Baixo Risco'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
