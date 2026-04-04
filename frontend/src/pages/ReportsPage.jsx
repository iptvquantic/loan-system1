import { useEffect, useState } from 'react'
import { BarChart3, Download, TrendingUp, DollarSign, Users, CheckCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../utils/api'
import { fmt, statusClass } from '../utils/formatters'
import { Loading, StatCard } from '../components/shared/UI'
import toast from 'react-hot-toast'

const COLORS = { ATIVO: '#0ea5e9', ATRASADO: '#f59e0b', CRITICO: '#ef4444', QUITADO: '#22c55e' }

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {fmt.currency(p.value)}</p>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api.get('/reports')
      .then(({ data: d }) => setData(d))
      .catch(() => toast.error('Erro ao carregar relatórios'))
      .finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await api.get('/reports/export', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }))
      const a   = document.createElement('a')
      a.href     = url
      a.download = `relatorio-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exportado!')
    } catch { toast.error('Erro ao exportar') }
    finally { setExporting(false) }
  }

  if (loading) return <Loading />
  if (!data)   return null

  const { summary, loans } = data

  const pieData = [
    { name: 'Ativos',    value: summary.active,   color: COLORS.ATIVO    },
    { name: 'Atrasados', value: summary.late,      color: COLORS.ATRASADO },
    { name: 'Críticos',  value: summary.critical,  color: COLORS.CRITICO  },
    { name: 'Quitados',  value: summary.settled,   color: COLORS.QUITADO  },
  ].filter(d => d.value > 0)

  const top10 = [...loans]
    .sort((a, b) => b.currentDebt - a.currentDebt)
    .slice(0, 10)

  const barData = top10.map(l => ({
    name:     l.client_name?.split(' ')[0] || '—',
    Capital:  l.principal,
    Juros:    l.interest,
    Multa:    l.fine,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-sub">Visão analítica de todo o portfólio</p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="btn-primary">
          <Download size={16}/> {exporting ? 'Exportando...' : 'Exportar CSV'}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Emprestado"   value={fmt.currency(summary.totalLent)}       icon={DollarSign}   color="sky"     />
        <StatCard label="Total Arrecadado"   value={fmt.currency(summary.totalCollected)}  icon={TrendingUp}   color="emerald" />
        <StatCard label="Lucro Acumulado"    value={fmt.currency(summary.profit)}          icon={TrendingUp}   color="violet"  />
        <StatCard label="A Receber"          value={fmt.currency(summary.totalReceivable)} icon={DollarSign}   color="amber"   />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Contratos Ativos"   value={summary.active}   color="sky"     />
        <StatCard label="Em Atraso"          value={summary.late}     color="amber"   />
        <StatCard label="Críticos"           value={summary.critical} color="red"     />
        <StatCard label="Quitados"           value={summary.settled}  icon={CheckCircle} color="emerald" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pie */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background:'#1e293b', border:'1px solid #334155', borderRadius:'8px', fontSize:'12px' }} />
              <Legend wrapperStyle={{ fontSize:12, color:'#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar top debtors */}
        {barData.length > 0 && (
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Top 10 — Maiores Dívidas</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} />
                <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false}
                  tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ fontSize:11, color:'#94a3b8' }} />
                <Bar dataKey="Capital" fill="#0ea5e9" stackId="a" radius={[0,0,0,0]} />
                <Bar dataKey="Juros"   fill="#8b5cf6" stackId="a" />
                <Bar dataKey="Multa"   fill="#ef4444" stackId="a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Full table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Todos os Contratos</h3>
          <span className="text-xs text-slate-500">{loans.length} contratos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-800 bg-slate-950/50">
              <tr>
                <th className="th">Cliente</th>
                <th className="th">CPF</th>
                <th className="th">Capital</th>
                <th className="th">Juros</th>
                <th className="th">Multa</th>
                <th className="th">Pago</th>
                <th className="th">Dívida Atual</th>
                <th className="th">Dias</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(l => (
                <tr key={l.id} className="table-row">
                  <td className="td font-medium text-white">{l.client_name}</td>
                  <td className="td font-mono text-xs text-slate-400">{fmt.cpf(l.client_cpf)}</td>
                  <td className="td text-money">{fmt.currency(l.principal)}</td>
                  <td className="td text-money text-violet-400">{fmt.currency(l.interest)}</td>
                  <td className="td text-money text-red-400">{fmt.currency(l.fine)}</td>
                  <td className="td text-money text-emerald-400">{fmt.currency(l.totalPaid)}</td>
                  <td className="td text-money text-amber-400">{fmt.currency(l.currentDebt)}</td>
                  <td className="td text-slate-400">{l.totalDays}d</td>
                  <td className="td"><span className={statusClass(l.status)}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
