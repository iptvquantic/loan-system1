import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, Users, FileText, AlertTriangle, TrendingUp, RefreshCw, ChevronRight, TrendingDown } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import api from '../utils/api'
import { fmt, statusClass } from '../utils/formatters'
import { Loading, StatCard } from '../components/shared/UI'
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

const emptyStats = {
  totalLentActive: 0, totalReceivable: 0, estimatedProfit: 0,
  totalLent: 0, totalReceived: 0,
  activeContracts: 0, lateContracts: 0, criticalContracts: 0, settledContracts: 0
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
  const stats = data?.stats || emptyStats
  const alerts = data?.alerts || []
  const temAtivos = stats.activeContracts > 0

  return (
    <div className="space-y-5 animate-fade-in">
      <TrialBanner />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Visao geral financeira — CREDIX</p>
        </div>
        <button onClick={load} className="btn-ghost"><RefreshCw size={15}/> Atualizar</button>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard
          label="Capital em Aberto"
          value={fmt.currency(stats.totalLentActive || 0)}
          icon={DollarSign} color="sky"
          sub={temAtivos ? `${stats.activeContracts} contrato(s) ativo(s)` : 'Nenhum contrato ativo'}
        />
        <StatCard
          label="A Receber (com juros)"
          value={fmt.currency(stats.totalReceivable || 0)}
          icon={TrendingUp} color="violet"
          sub="Soma de todas as dívidas atuais"
        />
        <StatCard
          label="Total Recebido"
          value={fmt.currency(stats.totalReceived || 0)}
          icon={TrendingUp} color="emerald"
          sub="Todos os pagamentos históricos"
        />
        <StatCard
          label="Lucro Real"
          value={fmt.currency(stats.estimatedProfit || 0)}
          icon={TrendingDown} color={stats.estimatedProfit >= 0 ? 'emerald' : 'red'}
          sub="Recebido − Capital emprestado"
        />
      </div>

      {/* Cards de contratos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card" style={{ padding:16, borderLeft:'3px solid #0ea5e9' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>Ativos</p>
          <p style={{ fontSize:28, fontWeight:800, color:'#0ea5e9' }}>{stats.activeContracts||0}</p>
        </div>
        <div className="card" style={{ padding:16, borderLeft:'3px solid #f59e0b' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>Em Atraso</p>
          <p style={{ fontSize:28, fontWeight:800, color:'#f59e0b' }}>{stats.lateContracts||0}</p>
        </div>
        <div className="card" style={{ padding:16, borderLeft:'3px solid #ef4444' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>Criticos</p>
          <p style={{ fontSize:28, fontWeight:800, color:'#ef4444' }}>{stats.criticalContracts||0}</p>
        </div>
        <div className="card" style={{ padding:16, borderLeft:'3px solid #22c55e' }}>
          <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>Quitados</p>
          <p style={{ fontSize:28, fontWeight:800, color:'#22c55e' }}>{stats.settledContracts||0}</p>
        </div>
      </div>

      {/* Aviso quando todos quitados */}
      {!temAtivos && stats.settledContracts > 0 && (
        <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:24 }}>🎉</span>
          <div>
            <p style={{ fontWeight:700, color:'#22c55e', fontSize:15 }}>Todos os contratos quitados!</p>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:2 }}>
              Voce recebeu {fmt.currency(stats.totalReceived||0)} no total e teve um lucro de {fmt.currency(stats.estimatedProfit||0)}.
              Cadastre novos emprestimos para continuar.
            </p>
          </div>
          <Link to="/loans" className="btn-primary" style={{ marginLeft:'auto', whiteSpace:'nowrap' }}>
            Novo Emprestimo
          </Link>
        </div>
      )}

      {/* Graficos */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:16 }}>Fluxo Mensal (Emprestado vs Recebido)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData()}>
              <defs>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12, color:'var(--text-secondary)' }} />
              <Area type="monotone" dataKey="Emprestado" stroke="#0ea5e9" fill="url(#gE)" strokeWidth={2} />
              <Area type="monotone" dataKey="Recebido" stroke="#22c55e" fill="url(#gR)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:16 }}>Contratos por Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{
              name:'Contratos',
              Ativos: stats.activeContracts||0,
              Atrasados: stats.lateContracts||0,
              Criticos: stats.criticalContracts||0,
              Quitados: stats.settledContracts||0,
            }]} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12, color:'var(--text-secondary)' }} />
              <Bar dataKey="Ativos" fill="#0ea5e9" radius={[4,4,0,0]} />
              <Bar dataKey="Atrasados" fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="Criticos" fill="#ef4444" radius={[4,4,0,0]} />
              <Bar dataKey="Quitados" fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:6 }}>
              <AlertTriangle size={15} color="#f59e0b"/> Alertas — Contratos em atencao
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
    </div>
  )
}
