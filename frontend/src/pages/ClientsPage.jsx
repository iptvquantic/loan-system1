import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Search, ChevronRight, Trash2, Users } from 'lucide-react'
import api from '../utils/api'
import { fmt, riskClass, maskCPF, maskPhone } from '../utils/formatters'
import { Loading, EmptyState, ConfirmDialog } from '../components/shared/UI'
import Modal from '../components/shared/Modal'
import toast from 'react-hot-toast'

function ClientForm({ initial = {}, onSave, onClose }) {
  const [f, setF] = useState({
    name: '', cpf: '', phone: '', address: '',
    income_source: '', salary_day: '', notes: '', ...initial
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (initial.id) {
        await api.put(`/clients/${initial.id}`, f)
        toast.success('Cliente atualizado!')
      } else {
        await api.post('/clients', f)
        toast.success('Cliente cadastrado!')
      }
      onSave()
    } catch { /* handled by interceptor */ }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Nome Completo *</label>
          <input className="input" required value={f.name}
            onChange={e => set('name', e.target.value)} placeholder="João Silva Santos" />
        </div>
        <div>
          <label className="label">CPF *</label>
          <input className="input" required value={f.cpf}
            onChange={e => set('cpf', maskCPF(e.target.value))}
            placeholder="000.000.000-00" maxLength={14} />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" value={f.phone}
            onChange={e => set('phone', maskPhone(e.target.value))}
            placeholder="(22) 99999-0000" maxLength={15} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Endereço</label>
          <input className="input" value={f.address}
            onChange={e => set('address', e.target.value)} placeholder="Rua, número, bairro, cidade" />
        </div>
        <div>
          <label className="label">Fonte de Renda</label>
          <select className="input" value={f.income_source}
            onChange={e => set('income_source', e.target.value)}>
            <option value="">Selecione...</option>
            <option>Autônomo</option>
            <option>CLT</option>
            <option>Aposentado</option>
            <option>Pensionista</option>
            <option>MEI</option>
            <option>Outro</option>
          </select>
        </div>
        <div>
          <label className="label">Dia que Recebe (1-31)</label>
          <input className="input" type="number" min={1} max={31}
            value={f.salary_day} onChange={e => set('salary_day', e.target.value)}
            placeholder="Ex: 5" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Observações</label>
          <textarea className="input h-20 resize-none" value={f.notes}
            onChange={e => set('notes', e.target.value)} placeholder="Anotações internas..." />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
        <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : (initial.id ? 'Atualizar' : 'Cadastrar')}
        </button>
      </div>
    </form>
  )
}

export default function ClientsPage() {
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [confirm, setConfirm]   = useState(null)

  const load = async (q = '') => {
    setLoading(true)
    try {
      const { data } = await api.get('/clients', { params: q ? { search: q } : {} })
      setClients(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSearch = (v) => {
    setSearch(v)
    clearTimeout(window._st)
    window._st = setTimeout(() => load(v), 400)
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/clients/${id}`)
      toast.success('Cliente removido')
      load(search)
    } catch {}
  }

  const openEdit = (c) => { setEditing(c); setModal(true) }
  const openNew  = ()  => { setEditing(null); setModal(true) }
  const onSave   = ()  => { setModal(false); load(search) }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-sub">{clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <UserPlus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input className="input pl-9" placeholder="Buscar por nome, CPF ou telefone..."
          value={search} onChange={e => handleSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? <Loading /> : clients.length === 0 ? (
          <EmptyState icon={Users} title="Nenhum cliente encontrado"
            description="Cadastre seu primeiro cliente para começar"
            action={<button onClick={openNew} className="btn-primary">Novo Cliente</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-slate-950/50">
                <tr>
                  <th className="th">Nome</th>
                  <th className="th hidden sm:table-cell">CPF</th>
                  <th className="th hidden md:table-cell">Telefone</th>
                  <th className="th hidden lg:table-cell">Renda</th>
                  <th className="th">Empréstimos</th>
                  <th className="th">Risco</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-sky-400 flex-shrink-0">
                          {c.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">{c.name}</p>
                          <p className="text-xs text-slate-500 sm:hidden">{fmt.cpf(c.cpf)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="td hidden sm:table-cell font-mono text-xs">{fmt.cpf(c.cpf)}</td>
                    <td className="td hidden md:table-cell">{fmt.phone(c.phone)}</td>
                    <td className="td hidden lg:table-cell text-slate-400">{c.income_source || '—'}</td>
                    <td className="td">
                      <span className="text-white font-medium">{c.active_loans}</span>
                      <span className="text-slate-500 text-xs"> / {c.total_loans}</span>
                    </td>
                    <td className="td">
                      <span className={riskClass(c.risk_score)}>{fmt.riskLabel(c.risk_score)}</span>
                    </td>
                    <td className="td">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(c)}
                          className="p-1.5 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-colors text-xs">
                          Editar
                        </button>
                        <Link to={`/clients/${c.id}`}
                          className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                          <ChevronRight size={16} />
                        </Link>
                        <button onClick={() => setConfirm(c.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editing ? 'Editar Cliente' : 'Novo Cliente'} size="lg">
        <ClientForm initial={editing || {}} onSave={onSave} onClose={() => setModal(false)} />
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm)}
        title="Remover Cliente" message="Tem certeza? Clientes com empréstimos ativos não podem ser removidos."
        confirmText="Remover" danger />
    </div>
  )
}
