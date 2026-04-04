import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, CreditCard, Search, Trash2 } from 'lucide-react'
import api from '../utils/api'
import { fmt } from '../utils/formatters'
import { Loading, EmptyState, ConfirmDialog } from '../components/shared/UI'
import Modal from '../components/shared/Modal'
import toast from 'react-hot-toast'

function NewPaymentForm({ onSave, onClose }) {
  const [loans, setLoans]   = useState([])
  const [f, setF] = useState({
    loan_id: '', amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'PARCIAL', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  useEffect(() => {
    api.get('/loans', { params: { status: 'ATIVO' } })
      .then(({ data }) => setLoans(data.filter(l => l.status !== 'QUITADO')))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/payments', f)
      toast.success('Pagamento registrado!')
      onSave()
    } catch {} finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Contrato *</label>
        <select className="input" required value={f.loan_id} onChange={e => set('loan_id', e.target.value)}>
          <option value="">Selecione o contrato...</option>
          {loans.map(l => (
            <option key={l.id} value={l.id}>
              {l.client_name} — {fmt.currency(l.principal)} ({l.status})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Valor (R$) *</label>
          <input className="input" type="number" step="0.01" min="0.01" required
            value={f.amount} onChange={e => set('amount', e.target.value)} placeholder="0,00" />
        </div>
        <div>
          <label className="label">Data *</label>
          <input className="input" type="date" required value={f.payment_date}
            onChange={e => set('payment_date', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Tipo *</label>
        <select className="input" value={f.payment_type} onChange={e => set('payment_type', e.target.value)}>
          <option value="JUROS">JUROS</option>
          <option value="PARCIAL">PARCIAL</option>
          <option value="QUITACAO">QUITAÇÃO</option>
        </select>
      </div>
      <div>
        <label className="label">Observações</label>
        <input className="input" value={f.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Pix, espécie, transferência..." />
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [confirm, setConfirm]   = useState(null)
  const [search, setSearch]     = useState('')

  const load = async () => {
    setLoading(true)
    try {
      // Busca todos os contratos e seus pagamentos
      const { data: loans } = await api.get('/loans')
      const all = []
      loans.forEach(l => {
        if (l.payments) {
          l.payments.forEach(p => all.push({ ...p, client_name: l.client_name, loan_principal: l.principal }))
        }
      })
      // Alternativa: buscar do dashboard que tem tudo
      // Aqui buscamos direto dos loans com pagamentos incluídos
      setPayments(all)
    } finally { setLoading(false) }
  }

  // Melhor abordagem: buscar pagamentos via loans individualmente seria lento
  // Vamos listar contratos e clicar para ver pagamentos, ou buscar summary
  const loadAll = async () => {
    setLoading(true)
    try {
      const { data: loans } = await api.get('/loans')
      // Para cada loan, fazer uma chamada seria custoso
      // Usamos os dados que já vêm nos loans (sem pagamentos inline)
      // A página de pagamentos mostra todos agrupados por contrato
      setPayments(loans.filter(l => l.totalPaid > 0))
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const filtered = payments.filter(l => {
    if (!search) return true
    return l.client_name?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Pagamentos</h1>
          <p className="page-sub">Registre e visualize todos os pagamentos</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={16}/> Registrar Pagamento
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
        <input className="input pl-9" placeholder="Buscar por cliente..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? <Loading /> : filtered.length === 0 ? (
          <EmptyState icon={CreditCard} title="Nenhum pagamento encontrado"
            action={<button onClick={() => setModal(true)} className="btn-primary">Registrar Pagamento</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-950/50">
                <tr>
                  <th className="th">Cliente</th>
                  <th className="th">Capital</th>
                  <th className="th">Total Pago</th>
                  <th className="th hidden md:table-cell">Qtd. Pagamentos</th>
                  <th className="th">Status</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="table-row">
                    <td className="td">
                      <p className="font-medium text-white">{l.client_name}</p>
                    </td>
                    <td className="td text-money">{fmt.currency(l.principal)}</td>
                    <td className="td text-money text-emerald-400">{fmt.currency(l.totalPaid)}</td>
                    <td className="td hidden md:table-cell text-slate-400">—</td>
                    <td className="td">
                      <span className={`badge ${l.status === 'QUITADO' ? 'badge-quitado' : 'badge-ativo'}`}>{l.status}</span>
                    </td>
                    <td className="td">
                      <Link to={`/loans/${l.id}`}
                        className="text-sky-400 hover:underline text-xs">Ver contrato</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Pagamento">
        <NewPaymentForm onSave={() => { setModal(false); loadAll() }} onClose={() => setModal(false)} />
      </Modal>
    </div>
  )
}
