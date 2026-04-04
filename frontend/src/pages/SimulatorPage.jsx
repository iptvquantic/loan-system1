import { useState } from 'react'
import { Calculator, TrendingUp, AlertTriangle } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import api from '../utils/api'
import { fmt } from '../utils/formatters'

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs">
      <p className="text-slate-400 mb-1">Dia {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {fmt.currency(p.value)}</p>
      ))}
    </div>
  )
}

export default function SimulatorPage() {
  const [amount, setAmount]   = useState('')
  const [days, setDays]       = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  const simulate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.get('/simulator', { params: { amount, days } })
      setResult(data)
    } finally { setLoading(false) }
  }

  const presets = [
    { label: 'R$500 / 30d',  amount: 500,  days: 30  },
    { label: 'R$1k / 30d',   amount: 1000, days: 30  },
    { label: 'R$1k / 60d',   amount: 1000, days: 60  },
    { label: 'R$2k / 90d',   amount: 2000, days: 90  },
    { label: 'R$5k / 30d',   amount: 5000, days: 30  },
    { label: 'R$10k / 60d',  amount: 10000,days: 60  },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="page-title">Simulador de Empréstimo</h1>
        <p className="page-sub">Calcule juros, multas e projeções antes de emprestar</p>
      </div>

      {/* Presets */}
      <div>
        <p className="label mb-2">Atalhos</p>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button key={p.label}
              onClick={() => { setAmount(String(p.amount)); setDays(String(p.days)) }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs rounded-full transition-colors">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={simulate} className="card">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Valor Emprestado (R$)</label>
            <input className="input" type="number" min="1" step="0.01" required
              value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex: 1000" />
          </div>
          <div>
            <label className="label">Quantidade de Dias</label>
            <input className="input" type="number" min="1" max="730" required
              value={days} onChange={e => setDays(e.target.value)} placeholder="Ex: 45" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              <Calculator size={16}/> {loading ? 'Calculando...' : 'Calcular'}
            </button>
          </div>
        </div>
      </form>

      {/* Result */}
      {result && (
        <div className="space-y-5">
          {/* Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Capital',        value: fmt.currency(result.principal),    color: 'text-white' },
              { label: 'Dias',           value: `${result.days} dias`,             color: 'text-sky-400' },
              { label: 'Juros',          value: fmt.currency(result.interest),     color: 'text-violet-400' },
              { label: 'Multa',         value: fmt.currency(result.fine),         color: result.fine > 0 ? 'text-red-400' : 'text-slate-500' },
              { label: 'Total',          value: fmt.currency(result.total),        color: 'text-amber-400' },
              { label: 'Renovação 30d',  value: fmt.currency(result.cyclePayment), color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card-sm">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className={`text-base font-bold text-money ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Alert se tiver multa */}
          {result.fine > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5"/>
              <div className="text-sm">
                <p className="font-semibold text-red-400">Multa por atraso aplicada</p>
                <p className="text-red-400/70 mt-1">
                  Após 30 dias sem pagamento, incide multa de R$50/dia por {result.fineDays} dia{result.fineDays !== 1 ? 's' : ''}.
                  Multa máxima: R$350 (7 dias). Após isso, status CRÍTICO.
                </p>
              </div>
            </div>
          )}

          {/* Projeção texto */}
          <div className="card">
            <h3 className="text-sm font-semibold text-white mb-4">Resumo Financeiro</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Capital emprestado</span>
                  <span className="text-white text-money">{fmt.currency(result.principal)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Juros (1%/dia × {result.days}d)</span>
                  <span className="text-violet-400 text-money">{fmt.currency(result.interest)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Multa atraso</span>
                  <span className={`text-money ${result.fine > 0 ? 'text-red-400' : 'text-slate-500'}`}>{fmt.currency(result.fine)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-white font-semibold">Total a receber</span>
                  <span className="text-amber-400 font-bold text-money">{fmt.currency(result.total)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">Para renovar em 30 dias</p>
                  <p className="text-xl font-bold text-emerald-400 text-money">{fmt.currency(result.cyclePayment)}</p>
                  <p className="text-xs text-slate-500 mt-1">= 30% do capital</p>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">Para quitar hoje</p>
                  <p className="text-xl font-bold text-amber-400 text-money">{fmt.currency(result.total)}</p>
                  <p className="text-xs text-slate-500 mt-1">capital + juros + multa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico projeção */}
          {result.projection?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Projeção Mês a Mês</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={result.projection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false}
                    tickFormatter={v => `${v}d`} />
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize:12, color:'#94a3b8' }} />
                  <ReferenceLine x={30} stroke="#f59e0b" strokeDasharray="4 4"
                    label={{ value: '30d', fill: '#f59e0b', fontSize: 11 }} />
                  <Line type="monotone" dataKey="total"    name="Total Devido"  stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="interest" name="Juros"         stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fine"     name="Multa"         stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-600 mt-2 text-center">
                Linha amarela (30d) = momento em que juros rendem 30% do capital
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
