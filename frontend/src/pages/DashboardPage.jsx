import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign, Users, FileText, AlertTriangle, TrendingUp, RefreshCw, ChevronRight
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import api from '../utils/api'
import { fmt, statusClass } from '../utils/formatters'
import { Loading, StatCard } from '../components/shared/UI'
import toast from 'react-hot-toast'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs">
      <p className="text-slate-400 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt.currency(p.value)}
        </p>
      ))}
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

  // Mescla dados mensais para gráfico
  const chartData = () => {
    if (!data) return []
    const map = {}
    data.monthlyLent?.forEach(r => {
      map[r.month] = { month: r.month, Emprestado: parseFloat(r.lent || 0) }
    })
    data.monthlyReceived?.forEach(r => {
      if (!map[r.month]) map[r.month] = { month: r.month, Emprestado: 0 }
      map[r.month].Recebido = parseFloat(r.received || 0)
    })
    return Object.values(map).sort((a,b) => a.month.localeCompare(b.month)).map(r => ({
      ...r,
      month: r.month.slice(5) + '/' + r.month.slice(2,4)
    }))
  }

  if (loading) return <Loading />

  const { stats, alerts } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Visão geral do sistema de empréstimos</p>
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Emprestado"   value={fmt.currency(stats.totalLent)}       icon={DollarSign}   color="sky"     />
        <StatCard label="A Receber"          value={fmt.currency(stats.totalReceivable)} icon={TrendingUp}   color="violet"  />
        <StatCard label="Lucro Total"        value={fmt.currency(stats.estimatedProfit)} icon={TrendingUp}   color="emerald" />
        <StatCard label="Contratos Ativos"   value={stats.activeContracts}               icon={FileText}     color="sky"     />
        <StatCard label="Em Atraso"          value={stats.lateContracts}                 icon={AlertTriangle}color="amber"   />
        <StatCard label="Críticos"           value={stats.criticalContracts}             icon={AlertTriangle}color="red"     />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Fluxo Mensal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData()}>
              <defs>
                <linearGradient id="gEmp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12, color:'#94a3b8' }} />
              <Area type="monotone" dataKey="Emprestado" stroke="#0ea5e9" fill="url(#gEmp)" strokeWidth={2} />
              <Area type="monotone" dataKey="Recebido"   stroke="#22c55e" fill="url(#gRec)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Contratos por Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[{
              name: 'Total',
              Ativos:   stats.activeContracts,
              Atrasados:stats.lateContracts,
              Críticos: stats.criticalContracts,
              Quitados: stats.settledContracts,
            }]} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} />
              <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:12, color:'#94a3b8' }} />
              <Bar dataKey="Ativos"    fill="#0ea5e9" radius={[4,4,0,0]} />
              <Bar dataKey="Atrasados" fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="Críticos"  fill="#ef4444" radius={[4,4,0,0]} />
              <Bar dataKey="Quitados"  fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas */}
      {alerts?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              Alertas — Contratos que precisam de atenção
            </h3>
            <Link to="/loans" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="th">Cliente</th>
                  <th className="th">Capital</th>
                  <th className="th">Dívida Atual</th>
                  <th className="th">Dias s/ Pgto</th>
                  <th className="th">Status</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(l => (
                  <tr key={l.id} className="table-row">
                    <td className="td font-medium text-white">{l.client_name}</td>
                    <td className="td text-money">{fmt.currency(l.principal)}</td>
                    <td className="td text-money text-amber-400">{fmt.currency(l.currentDebt)}</td>
                    <td className="td">
                      <span className={`text-xs font-semibold ${l.daysSinceLastPayment > 30 ? 'text-red-400' : 'text-amber-400'}`}>
                        {l.daysSinceLastPayment} dias
                      </span>
                    </td>
                    <td className="td">
                      <span className={statusClass(l.status)}>{l.status}</span>
                    </td>
                    <td className="td">
                      <Link to={`/loans/${l.id}`} className="text-sky-400 hover:underline text-xs">Ver</Link>
                    </td>
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
