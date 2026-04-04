import { useEffect, useState } from 'react'
import { Plus, Wallet, TrendingUp, TrendingDown, Trash2 } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import api from '../utils/api'
import { fmt } from '../utils/formatters'
import { Loading, StatCard, ConfirmDialog } from '../components/shared/UI'
import Modal from '../components/shared/Modal'
import toast from 'react-hot-toast'

const CATEGORIES = {
  ENTRADA: ['PAGAMENTO', 'JUROS', 'QUITACAO', 'OUTRO'],
  SAIDA:   ['EMPRESTIMO', 'DESPESA', 'OUTRO'],
}

function CashForm({ onSave, onClose }) {
  const [f, setF] = useState({
    type: 'ENTRADA', category: 'OUTRO', amount: '',
    description: '', flow_date: new Date().toISOString().split('T')[0]
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/cash', f)
      toast.success('Lançamento registrado!')
      onSave()
    } catch {} finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Tipo *</label>
        <div className="grid grid-cols-2 gap-2">
          {['ENTRADA','SAIDA'].map(t => (
            <button key={t} type="button"
              onClick={() => { set('type', t); set('category', CATEGORIES[t][0]) }}
              className={`py-2.5 rounded-lg text-sm font-medium border transition-all
                ${f.type === t
                  ? t === 'ENTRADA'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border-red-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              {t === 'ENTRADA' ? '↑ ENTRADA' : '↓ SAÍDA'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Categoria</label>
        <select className="input" value={f.category} onChange={e => set('category', e.target.value)}>
          {CATEGORIES[f.type].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Valor (R$) *</label>
          <input className="input" type="number" step="0.01" min="0.01" required
            value={f.amount} onChange={e => set('amount', e.target.value)} placeholder="0,00" />
        </div>
        <div>
          <label className="label">Data</label>
          <input className="input" type="date" value={f.flow_date}
            onChange={e => set('flow_date', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Descrição</label>
        <input className="input" value={f.description} onChange={e => set('description', e.target.value)}
          placeholder="Descrição do lançamento..." />
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
        <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
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

export default function CashPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [filter, setFilter] = useState({ from: '', to: '' })

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.from) params.from = filter.from
      if (filter.to)   params.to   = filter.to
      const { data: d } = await api.get('/cash', { params })
      setData(d)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filter])

  const handleDelete = async (id) => {
    try { await api.delete(`/cash/${id}`); toast.success('Removido'); load() } catch {}
  }

  const chartData = data?.monthly?.map(r => ({
    month:   r.month?.slice(5) + '/' + r.month?.slice(2,4),
    Entradas: parseFloat(r.entrada || 0),
    Saídas:  parseFloat(r.saida   || 0),
    Saldo:   parseFloat(r.entrada || 0) - parseFloat(r.saida || 0),
  })) || []

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Caixa</h1>
          <p className="page-sub">Controle de entradas e saídas financeiras</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={16}/> Lançamento Manual
        </button>
      </div>

      {/* Filtro de datas */}
      <div className="card-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="label">De</label>
          <input className="input w-40" type="date" value={filter.from}
            onChange={e => setFilter(p => ({ ...p, from: e.target.value }))} />
        </div>
        <div>
          <label className="label">Até</label>
          <input className="input w-40" type="date" value={filter.to}
            onChange={e => setFilter(p => ({ ...p, to: e.target.value }))} />
        </div>
        {(filter.from || filter.to) && (
          <button onClick={() => setFilter({ from: '', to: '' })} className="btn-ghost text-xs">Limpar</button>
        )}
      </div>

      {loading ? <Loading /> : data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card border-emerald-500/20">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Total Entradas</p>
                <TrendingUp size={18} className="text-emerald-400"/>
              </div>
              <p className="text-2xl font-bold text-emerald-400 text-money mt-2">{fmt.currency(data.totalIn)}</p>
            </div>
            <div className="stat-card border-red-500/20">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Total Saídas</p>
                <TrendingDown size={18} className="text-red-400"/>
              </div>
              <p className="text-2xl font-bold text-red-400 text-money mt-2">{fmt.currency(data.totalOut)}</p>
            </div>
            <div className={`stat-card ${parseFloat(data.balance) >= 0 ? 'border-sky-500/20' : 'border-red-500/20'}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Saldo</p>
                <Wallet size={18} className={parseFloat(data.balance) >= 0 ? 'text-sky-400' : 'text-red-400'}/>
              </div>
              <p className={`text-2xl font-bold text-money mt-2 ${parseFloat(data.balance) >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
                {fmt.currency(data.balance)}
              </p>
            </div>
          </div>

          {/* Gráfico */}
          {chartData.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Fluxo de Caixa Mensal</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                  <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false}/>
                  <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false}
                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Legend wrapperStyle={{ fontSize:12, color:'#94a3b8' }}/>
                  <Area type="monotone" dataKey="Entradas" stroke="#22c55e" fill="url(#gIn)"  strokeWidth={2}/>
                  <Area type="monotone" dataKey="Saídas"   stroke="#ef4444" fill="url(#gOut)" strokeWidth={2}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Histórico */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Histórico de Movimentações</h3>
            </div>
            {data.history?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">Nenhum lançamento encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-800">
                    <tr>
                      <th className="th">Data</th>
                      <th className="th">Tipo</th>
                      <th className="th">Categoria</th>
                      <th className="th">Descrição</th>
                      <th className="th">Valor</th>
                      <th className="th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.history?.map(h => (
                      <tr key={h.id} className="table-row">
                        <td className="td">{fmt.date(h.flow_date)}</td>
                        <td className="td">
                          <span className={`badge text-xs ${h.type === 'ENTRADA' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {h.type === 'ENTRADA' ? '↑' : '↓'} {h.type}
                          </span>
                        </td>
                        <td className="td text-slate-400 text-xs">{h.category}</td>
                        <td className="td text-slate-400 text-xs max-w-xs truncate">{h.description || '—'}</td>
                        <td className={`td text-money font-semibold ${h.type === 'ENTRADA' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.type === 'SAIDA' ? '-' : '+'}{fmt.currency(h.amount)}
                        </td>
                        <td className="td">
                          <button onClick={() => setConfirm(h.id)}
                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                            <Trash2 size={14}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Novo Lançamento">
        <CashForm onSave={() => { setModal(false); load() }} onClose={() => setModal(false)} />
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm)}
        title="Remover lançamento" message="Esta ação não pode ser desfeita."
        confirmText="Remover" danger />
    </div>
  )
}
