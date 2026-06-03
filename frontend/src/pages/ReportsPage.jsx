import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users, CheckCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../utils/api'
import { fmt, statusClass } from '../utils/formatters'
import { Loading, StatCard } from '../components/shared/UI'
import toast from 'react-hot-toast'

const COLORS = ['#0ea5e9','#f59e0b','#ef4444','#22c55e']

export default function ReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/dashboard'), api.get('/loans')])
      .then(([dash, loans]) => {
        setData({ stats: dash.data?.stats || {}, loans: loans.data || [], alerts: dash.data?.alerts || [] })
      })
      .catch(() => toast.error('Erro ao carregar relatorios'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  const stats = data?.stats || {}
  const loans = data?.loans || []

  const pieData = [
    { name:'Ativos',    value: stats.activeContracts   || 0 },
    { name:'Atrasados', value: stats.lateContracts     || 0 },
    { name:'Criticos',  value: stats.criticalContracts || 0 },
    { name:'Quitados',  value: stats.settledContracts  || 0 },
  ].filter(d => d.value > 0)

  const topDebtors = [...loans]
    .filter(l => l.status !== 'QUITADO')
    .sort((a,b) => (parseFloat(b.totalDue)||0) - (parseFloat(a.totalDue)||0))
    .slice(0,7)

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Relatorios</h1>
        <p className="page-sub">Visao financeira completa do sistema</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Emprestado" value={fmt.currency(stats.totalLent||0)} icon={DollarSign} color="sky" />
        <StatCard label="Total Arrecadado" value={fmt.currency(stats.totalReceived||0)} icon={TrendingUp} color="emerald" />
        <StatCard label="Lucro Acumulado" value={fmt.currency(stats.estimatedProfit||0)} icon={TrendingUp} color="violet" />
        <StatCard label="A Receber" value={fmt.currency(stats.totalReceivable||0)} icon={DollarSign} color="amber" />
        <StatCard label="Contratos Ativos" value={stats.activeContracts||0} icon={BarChart3} color="sky" />
        <StatCard label="Em Atraso" value={stats.lateContracts||0} icon={Users} color="amber" />
        <StatCard label="Criticos" value={stats.criticalContracts||0} icon={Users} color="red" />
        <StatCard label="Quitados" value={stats.settledContracts||0} icon={CheckCircle} color="slate" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {pieData.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:16 }}>Distribuicao por Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend wrapperStyle={{ fontSize:12, color:'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {topDebtors.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:16 }}>Top Maiores Dividas</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topDebtors.map(l => ({
                name: l.client_name?.split(' ')[0] || '?',
                Capital: parseFloat(l.remainingCapital)||0,
                Juros: parseFloat(l.accruedInterest)||0,
                Multa: parseFloat(l.fine)||0,
              }))} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} />
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt.currency(v)} />
                <Legend wrapperStyle={{ fontSize:12, color:'var(--text-secondary)' }} />
                <Bar dataKey="Capital" fill="#0ea5e9" stackId="a" />
                <Bar dataKey="Juros"   fill="#a78bfa" stackId="a" />
                <Bar dataKey="Multa"   fill="#ef4444" stackId="a" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {loans.length > 0 && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Todos os Contratos — {loans.length} registros</h3>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-hover)', borderBottom:'1px solid var(--border)' }}>
                  {['Cliente','Capital','Juros','Multa','Pago','Divida','Dias','Status'].map(h => <th key={h} className="th">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loans.map(l => (
                  <tr key={l.id} className="table-row">
                    <td className="td" style={{ fontWeight:600, color:'var(--text-primary)' }}>{l.client_name||'—'}</td>
                    <td className="td text-money">{fmt.currency(l.amount)}</td>
                    <td className="td text-money" style={{ color:'#f59e0b' }}>{fmt.currency(l.accruedInterest||0)}</td>
                    <td className="td text-money" style={{ color:'#ef4444' }}>{fmt.currency(l.fine||0)}</td>
                    <td className="td text-money" style={{ color:'#22c55e' }}>{fmt.currency(l.totalPaid||0)}</td>
                    <td className="td text-money" style={{ color:'#a78bfa', fontWeight:700 }}>{fmt.currency(l.totalDue||0)}</td>
                    <td className="td" style={{ fontSize:12 }}>{l.daysSinceLastPayment||0}d</td>
                    <td className="td"><span className={statusClass(l.status)}>{l.status}</span></td>
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
