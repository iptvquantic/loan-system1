import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, AlertTriangle, TrendingUp, Star, Shield, ChevronRight } from 'lucide-react'
import api from '../utils/api'
import { fmt, riskClass } from '../utils/formatters'
import { Loading } from '../components/shared/UI'
import toast from 'react-hot-toast'

export default function RankingPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('paid')

  useEffect(() => {
    api.get('/clients/ranking')
      .then(({ data }) => setClients(data))
      .catch(() => toast.error('Erro ao carregar ranking'))
      .finally(() => setLoading(false))
  }, [])

  const sorted = {
    paid:   [...clients].sort((a,b) => parseFloat(b.total_paid)   - parseFloat(a.total_paid)),
    volume: [...clients].sort((a,b) => parseFloat(b.total_lent)   - parseFloat(a.total_lent)),
    loans:  [...clients].sort((a,b) => b.total_loans              - a.total_loans),
    risk:   [...clients].filter(c => c.risk_score !== 'BAIXO').sort((a,b) => {
      const order = { ALTO:0, MEDIO:1, BAIXO:2 }
      return order[a.risk_score] - order[b.risk_score]
    }),
  }

  const medal = (i) => {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return `#${i+1}`
  }

  const tabs = [
    { key: 'paid',   icon: TrendingUp, label: 'Mais Pagaram'      },
    { key: 'volume', icon: Trophy,     label: 'Maior Volume'      },
    { key: 'loans',  icon: Star,       label: 'Mais Contratos'    },
    { key: 'risk',   icon: AlertTriangle, label: 'Risco / Alertas' },
  ]

  const current = sorted[tab]

  const metricLabel = {
    paid:   (c) => ({ value: fmt.currency(c.total_paid),    label: 'Total pago' }),
    volume: (c) => ({ value: fmt.currency(c.total_lent),    label: 'Emprestado' }),
    loans:  (c) => ({ value: c.total_loans + ' contratos',  label: `${c.settled_loans} quitados` }),
    risk:   (c) => ({ value: fmt.riskLabel(c.risk_score),   label: '' }),
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Ranking de Clientes</h1>
        <p className="page-sub">Análise de performance e risco da carteira</p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card-sm">
            <p className="text-xs text-slate-500">Total de Clientes</p>
            <p className="text-2xl font-bold text-white mt-1">{clients.length}</p>
          </div>
          <div className="card-sm">
            <p className="text-xs text-slate-500 text-emerald-400/80">Baixo Risco</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {clients.filter(c => c.risk_score === 'BAIXO').length}
            </p>
          </div>
          <div className="card-sm">
            <p className="text-xs text-amber-400/80">Médio Risco</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {clients.filter(c => c.risk_score === 'MEDIO').length}
            </p>
          </div>
          <div className="card-sm">
            <p className="text-xs text-red-400/80">Alto Risco ⚠️</p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {clients.filter(c => c.risk_score === 'ALTO').length}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all
              ${tab === key
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'}`}>
            <Icon size={14}/> <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Danger alert */}
      {tab === 'risk' && sorted.risk.filter(c => c.risk_score === 'ALTO').length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-semibold text-red-400">
              {sorted.risk.filter(c => c.risk_score === 'ALTO').length} cliente{sorted.risk.filter(c => c.risk_score === 'ALTO').length !== 1 ? 's' : ''} de ALTO RISCO
            </p>
            <p className="text-xs text-red-400/70 mt-1">
              Estes clientes possuem histórico de atrasos críticos. Considere suspender novos empréstimos.
            </p>
          </div>
        </div>
      )}

      {loading ? <Loading /> : (
        <div className="card p-0 overflow-hidden">
          {current.length === 0 ? (
            <div className="py-16 text-center">
              <Shield size={40} className="text-slate-700 mx-auto mb-3"/>
              <p className="text-slate-500">
                {tab === 'risk' ? 'Nenhum cliente com risco médio ou alto. 🎉' : 'Nenhum dado disponível'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-800 bg-slate-950/50">
                  <tr>
                    <th className="th w-12">#</th>
                    <th className="th">Cliente</th>
                    <th className="th hidden sm:table-cell">CPF</th>
                    <th className="th hidden md:table-cell">Contratos</th>
                    <th className="th">
                      {tab === 'paid'   && 'Total Pago'}
                      {tab === 'volume' && 'Total Emprestado'}
                      {tab === 'loans'  && 'Contratos'}
                      {tab === 'risk'   && 'Risco'}
                    </th>
                    <th className="th hidden lg:table-cell">Juros Pagos</th>
                    <th className="th">Risco</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody>
                  {current.map((c, i) => {
                    const m = metricLabel[tab](c)
                    const isHigh = c.risk_score === 'ALTO'
                    return (
                      <tr key={c.id} className={`table-row ${isHigh && tab === 'risk' ? 'bg-red-500/5' : ''}`}>
                        <td className="td">
                          <span className={`text-lg ${i < 3 ? '' : 'text-slate-500 text-sm'}`}>
                            {medal(i)}
                          </span>
                        </td>
                        <td className="td">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                              ${isHigh ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-sky-400'}`}>
                              {c.name[0].toUpperCase()}
                            </div>
                            <span className="font-medium text-white text-sm">{c.name}</span>
                          </div>
                        </td>
                        <td className="td hidden sm:table-cell font-mono text-xs text-slate-400">{fmt.cpf(c.cpf)}</td>
                        <td className="td hidden md:table-cell text-slate-400">{c.total_loans} ({c.settled_loans} quitados)</td>
                        <td className="td">
                          <p className="text-money font-semibold text-white">{m.value}</p>
                          {m.label && <p className="text-xs text-slate-500">{m.label}</p>}
                        </td>
                        <td className="td hidden lg:table-cell text-money text-violet-400">
                          {fmt.currency(c.interest_paid)}
                        </td>
                        <td className="td">
                          <span className={riskClass(c.risk_score)}>{fmt.riskLabel(c.risk_score)}</span>
                        </td>
                        <td className="td">
                          <Link to={`/clients/${c.id}`}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors block">
                            <ChevronRight size={16}/>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
