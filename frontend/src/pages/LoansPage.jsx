import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, ChevronRight, FileText, Search, Filter } from 'lucide-react'
import api from '../utils/api'
import { fmt, statusClass } from '../utils/formatters'
import { Loading, EmptyState } from '../components/shared/UI'
import Modal from '../components/shared/Modal'
import toast from 'react-hot-toast'

const STATUS_OPTS = ['', 'ATIVO', 'ATRASADO', 'CRITICO', 'QUITADO']

function NewLoanForm({ onSave, onClose, defaultClientId = '' }) {
  const [clients, setClients] = useState([])
  const [f, setF] = useState({
    client_id: defaultClientId, principal: '', loan_date: new Date().toISOString().split('T')[0], observations: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  useEffect(() => {
    api.get('/clients').then(({ data }) => setClients(data))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/loans', f)
      toast.success('Empréstimo criado!')
      onSave()
    } catch {} finally { setSaving(false) }
  }

  const preview = () => {
    const p = parseFloat(f.principal)
    if (!p) return null
    const interest30 = p * 0.30
    const total30    = p + interest30
    return { interest30, total30, daily: p * 0.01 }
  }

  const prev = preview()

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Cliente *</label>
        <select className="input" required value={f.client_id} onChange={e => set('client_id', e.target.value)}>
          <option value="">Selecione o cliente...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {fmt.cpf(c.cpf)}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Valor Emprestado (R$) *</label>
          <input className="input" type="number" step="0.01" min="1" required
            value={f.principal} onChange={e => set('principal', e.target.value)}
            placeholder="0,00" />
        </div>
        <div>
          <label className="label">Data do Empréstimo</label>
          <input className="input" type="date" value={f.loan_date}
            onChange={e => set('loan_date', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Observações</label>
        <textarea className="input h-20 resize-none" value={f.observations}
          onChange={e => set('observations', e.target.value)} placeholder="Notas internas..." />
      </div>

      {/* Preview */}
      {prev && (
        <div className="p-4 bg-slate-800/70 rounded-xl border border-slate-700/50 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Prévia — 30 dias</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-white text-money">{fmt.currency(prev.daily)}</p>
              <p className="text-xs text-slate-500">Juros/dia</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-400 text-money">{fmt.currency(prev.interest30)}</p>
              <p className="text-xs text-slate-500">Juros 30d</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-400 text-money">{fmt.currency(prev.total30)}</p>
              <p className="text-xs text-slate-500">Total 30d</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
        <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Criando...' : 'Criar Empréstimo'}
        </button>
      </div>
    </form>
  )
}

export default function LoansPage() {
  const [loans, setLoans]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [statusFilter, setStatus] = useState('')
  const [search, setSearch]     = useState('')
  const [searchParams]          = useSearchParams()
  const defaultClient           = searchParams.get('client_id') || ''

  const load = async (st = '') => {
    setLoading(true)
    try {
      const params = {}
      if (st) params.status = st
      const { data } = await api.get('/loans', { params })
      setLoans(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load(statusFilter) }, [statusFilter])

  const filtered = loans.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.client_name?.toLowerCase().includes(q) || l.client_cpf?.includes(q)
  })

  const onSave = () => { setModal(false); load(statusFilter) }

  const statusCount = (s) => loans.filter(l => l.status === s).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Empréstimos</h1>
          <p className="page-sub">{filtered.length} contrato{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => api.post('/loans/sync-statuses').then(() => { toast.success('Status sincronizados'); load(statusFilter) })}
            className="btn-ghost text-xs">Sincronizar</button>
          <button onClick={() => setModal(true)} className="btn-primary">
            <Plus size={16}/> Novo Empréstimo
          </button>
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTS.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border
              ${statusFilter === s
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}>
            {s || 'Todos'} {s ? `(${statusCount(s)})` : `(${loans.length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
        <input className="input pl-9" placeholder="Buscar por cliente ou CPF..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? <Loading /> : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhum contrato encontrado"
            action={<button onClick={() => setModal(true)} className="btn-primary">Novo Empréstimo</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-950/50">
                <tr>
                  <th className="th">Cliente</th>
                  <th className="th">Capital</th>
                  <th className="th">Dívida Atual</th>
                  <th className="th hidden md:table-cell">Juros</th>
                  <th className="th hidden sm:table-cell">Dias</th>
                  <th className="th">Status</th>
                  <th className="th hidden lg:table-cell">Venc.</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className={`table-row ${l.status === 'CRITICO' ? 'bg-red-500/5' : l.status === 'ATRASADO' ? 'bg-amber-500/5' : ''}`}>
                    <td className="td">
                      <div>
                        <p className="font-medium text-white text-sm">{l.client_name}</p>
                        <p className="text-xs text-slate-500 hidden sm:block">{fmt.date(l.loan_date)}</p>
                      </div>
                    </td>
                    <td className="td text-money">{fmt.currency(l.principal)}</td>
                    <td className="td text-money">
                      <span className={l.status === 'QUITADO' ? 'text-emerald-400' : 'text-amber-400'}>
                        {fmt.currency(l.currentDebt)}
                      </span>
                    </td>
                    <td className="td hidden md:table-cell text-money text-slate-400">{fmt.currency(l.interest)}</td>
                    <td className="td hidden sm:table-cell text-slate-400">{l.totalDays}d</td>
                    <td className="td">
                      <span className={statusClass(l.status)}>{l.status}</span>
                    </td>
                    <td className="td hidden lg:table-cell text-xs text-slate-500">{fmt.date(l.nextDueDate)}</td>
                    <td className="td">
                      <Link to={`/loans/${l.id}`}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors block">
                        <ChevronRight size={16}/>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Novo Empréstimo" size="lg">
        <NewLoanForm onSave={onSave} onClose={() => setModal(false)} defaultClientId={defaultClient} />
      </Modal>
    </div>
  )
}
