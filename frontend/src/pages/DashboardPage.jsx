import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, AlertTriangle, TrendingUp, RefreshCw, ChevronRight, FileText, Plus } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'
import { fmt, statusClass } from '../utils/formatters'
import { Loading } from '../components/shared/UI'
import TrialBanner from '../components/shared/TrialBanner'
import toast from 'react-hot-toast'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <p style={{ color:'var(--text-muted)', marginBottom:6 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color:p.color, fontWeight:600 }}>{p.name}: {fmt.currency(p.value)}</p>)}
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const { data: d } = await api.get('/dashboard')
      setData(d)
    } catch { toast.error('Erro ao carregar dashboard') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const chartData = () => {
    if (!data) return []
    const map = {}
    data.monthlyLent?.forEach(r => { map[r.month] = { month: r.month, Emprestado: parseFloat(r.lent||0) } })
    data.monthlyReceived?.forEach(r => {
      if (!map[r.month]) map[r.month] = { month: r.month, Emprestado: 0 }
      map[r.month].Recebido = parseFloat(r.received||0)
    })
    return Object.values(map).sort((a,b) => a.month.localeCompare(b.month)).map(r => ({
      ...r, month: r.month.slice(5)+'/'+r.month.slice(2,4)
    }))
  }

  if (loading) return <Loading />
  const stats = data?.stats || {}
  const alerts = data?.alerts || []
  const temAtivos = (stats.activeContracts||0) > 0

  return (
    <div className="space-y-5 animate-fade-in">
      <TrialBanner />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Visao atual dos contratos em aberto</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} className="btn-ghost"><RefreshCw size={15}/> Atualizar</button>
          <Link to="/loans" className="btn-primary"><Plus size={15}/> Novo Emprestimo</Link>
        </div>
      </div>

      {/* Estado: sem contratos ativos */}
      {!temAtivos ? (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'40px 24px', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
          <h2 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>
            Nenhum contrato ativo no momento
          </h2>
          <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24, maxWidth:400, margin:'0 auto 24px' }}>
            {stats.settledContracts > 0
              ? `Voce tem ${stats.settledContracts} contrato(s) quitado(s). Cadastre novos emprestimos para comecar um novo periodo.`
              : 'Cadastre seu primeiro cliente e emprestimo para comecar.'}
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/loans" className="btn-primary"><Plus size={15}/> Novo Emprestimo</Link>
            {stats.settledContracts > 0 && (
              <Link to="/reports" className="btn-ghost"><FileText size={15}/> Ver Historico</Link>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Cards principais — só dados ATIVOS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card" style={{ padding:18, borderLeft:'3px solid #0ea5e9' }}>
              <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.05em', marginBottom:8 }}>Capital em Aberto</p>
              <p style={{ fontSize:24, fontWeight:800, color:'#0ea5e9', fontVariantNumeric:'tabular-nums' }}>{fmt.currency(stats.totalLentActive||0)}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Capital ainda nao quitado</p>
            </div>
            <div className="card" style={{ padding:18, borderLeft:'3px solid #a78bfa' }}>
              <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.05em', marginBottom:8 }}>A Receber</p>
              <p style={{ fontSize:24, fontWeight:800, color:'#a78bfa', fontVariantNumeric:'tabular-nums' }}>{fmt.currency(stats.totalReceivable||0)}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Capital + juros + multas</p>
            </div>
            <div className="card" style={{ padding:18, borderLeft:'3px solid #22c55e' }}>
              <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.05em', marginBottom:8 }}>Ativos</p>
              <p style={{ fontSize:24, fontWeight:800, color:'#22c55e' }}>{stats.activeContracts||0}</p>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{stats.settledContracts||0} quitado(s)</p>
            </div>
            <div className="card" style={{ padding:18, borderLeft:`3px solid ${(stats.lateContracts||0) > 0 ? '#ef4444' : '#f59e0b'}` }}>
              <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.05em', marginBottom:8 }}>Em Atraso / Criticos</p>
              <p style={{ fontSize:24, fontWeight:800, color:(stats.lateContracts||0)+(stats.criticalContracts||0) > 0 ? '#ef4444' : '#22c55e' }}>
                {(stats.lateContracts||0) + (stats.criticalContracts||0)}
              </p>
              <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{stats.lateContracts||0} atrasado · {stats.criticalContracts||0} critico</p>
            </div>
          </div>

          {/* Grafico mensal */}
          {chartData().length > 0 && (
            <div className="card">
              <h3 style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:16 }}>Fluxo Mensal — Emprestado vs Recebido</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData()}>
                  <defs>
                    <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} />
                  <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Emprestado" stroke="#0ea5e9" fill="url(#gE)" strokeWidth={2} name="Emprestado" />
                  <Area type="monotone" dataKey="Recebido" stroke="#22c55e" fill="url(#gR)" strokeWidth={2} name="Recebido" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', gap:16, marginTop:8, justifyContent:'center' }}>
                <span style={{ fontSize:12, color:'#0ea5e9', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:12, height:3, background:'#0ea5e9', borderRadius:2, display:'inline-block' }}/>Emprestado
                </span>
                <span style={{ fontSize:12, color:'#22c55e', display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:12, height:3, background:'#22c55e', borderRadius:2, display:'inline-block' }}/>Recebido
                </span>
              </div>
            </div>
          )}

          {/* Alertas */}
          {alerts.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
                  <AlertTriangle size={15} color="#f59e0b"/> Contratos que precisam de atencao
                </h3>
                <Link to="/loans" style={{ fontSize:12, color:'#60a5fa', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}>
                  Ver todos <ChevronRight size={13}/>
                </Link>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid var(--border)' }}>
                      {['Cliente','Capital','Divida','Dias','Status',''].map(h => <th key={h} className="th">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map(l => (
                      <tr key={l.id} className="table-row">
                        <td className="td" style={{ fontWeight:600, color:'var(--text-primary)' }}>{l.client_name}</td>
                        <td className="td text-money">{fmt.currency(l.principal)}</td>
                        <td className="td text-money" style={{ color:'#f59e0b' }}>{fmt.currency(l.currentDebt)}</td>
                        <td className="td"><span style={{ fontSize:12, fontWeight:700, color: l.daysSinceLastPayment > 30 ? '#ef4444' : '#f59e0b' }}>{l.daysSinceLastPayment}d</span></td>
                        <td className="td"><span className={statusClass(l.status)}>{l.status}</span></td>
                        <td className="td"><Link to={`/loans/${l.id}`} style={{ color:'#60a5fa', fontSize:12, textDecoration:'none' }}>Ver</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Link discreto para historico */}
      <div style={{ textAlign:'center', paddingTop:8 }}>
        <Link to="/reports" style={{ fontSize:12, color:'var(--text-muted)', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
          <FileText size={13}/> Ver historico completo e lucro total em Relatorios
        </Link>
      </div>
    </div>
  )
}
