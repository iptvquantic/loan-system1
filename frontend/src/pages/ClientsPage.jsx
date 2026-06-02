import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Search, ChevronRight, Trash2, Users, Edit2 } from 'lucide-react'
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
    if (!f.name.trim()) return toast.error('Nome obrigatorio')
    setSaving(true)
    try {
      if (initial.id) await api.put(`/clients/${initial.id}`, f)
      else await api.post('/clients', f)
      toast.success(initial.id ? 'Cliente atualizado!' : 'Cliente cadastrado!')
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar cliente')
    } finally { setSaving(false) }
  }

  const fields = [
    { k:'name', label:'Nome completo *', placeholder:'Nome do cliente', type:'text' },
    { k:'cpf', label:'CPF', placeholder:'000.000.000-00', type:'text' },
    { k:'phone', label:'Telefone / WhatsApp', placeholder:'(22) 99999-0000', type:'text' },
    { k:'address', label:'Endereco', placeholder:'Rua, numero, bairro', type:'text' },
    { k:'income_source', label:'Fonte de renda', placeholder:'Ex: autonomo, CLT', type:'text' },
    { k:'salary_day', label:'Dia do pagamento', placeholder:'Ex: 5', type:'number' },
  ]

  return (
    <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {fields.map(fd => (
          <div key={fd.k} style={{ gridColumn: fd.k === 'name' || fd.k === 'address' ? 'span 2' : 'span 1' }}>
            <label className="label">{fd.label}</label>
            <input className="input" type={fd.type} value={f[fd.k]} onChange={e => set(fd.k, e.target.value)} placeholder={fd.placeholder} />
          </div>
        ))}
        <div style={{ gridColumn:'span 2' }}>
          <label className="label">Observacoes</label>
          <textarea className="input" value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Informacoes adicionais..." rows={2} style={{ resize:'vertical' }} />
        </div>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
        <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Salvando...' : initial.id ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </form>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/clients')
      .then(({ data }) => setClients(data))
      .catch(() => toast.error('Erro ao carregar clientes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    try {
      await api.delete(`/clients/${deleting.id}`)
      toast.success('Cliente removido')
      setDeleting(null)
      load()
    } catch { toast.error('Erro ao remover cliente') }
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf?.includes(search) ||
    c.phone?.includes(search)
  )

  if (loading) return <Loading />

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-sub">{clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary">
          <UserPlus size={15} /> Novo Cliente
        </button>
      </div>

      <div style={{ position:'relative' }}>
        <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
        <input className="input" style={{ paddingLeft:36 }} placeholder="Buscar por nome, CPF ou telefone..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState text={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'} />
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-hover)' }}>
                  {['Cliente','CPF','Telefone','Renda','Emprestimos','Risco',''].map(h => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const rc = riskClass(c.risk_level || 'Baixo Risco')
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="td">
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                            {c.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontWeight:600, color:'var(--text-primary)' }}>{c.name}</span>
                        </div>
                      </td>
                      <td className="td" style={{ fontFamily:'monospace', fontSize:12 }}>{maskCPF(c.cpf)}</td>
                      <td className="td">{maskPhone(c.phone)}</td>
                      <td className="td" style={{ color:'var(--text-muted)', fontSize:12 }}>{c.income_source || '—'}</td>
                      <td className="td">
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>
                          {c.active_loans || 0} / {c.total_loans || 0}
                        </span>
                      </td>
                      <td className="td">
                        <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:999, background:rc.bg, color:rc.color, border:`1px solid ${rc.border}` }}>
                          {c.risk_level || 'Baixo Risco'}
                        </span>
                      </td>
                      <td className="td">
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <button onClick={() => setEditing(c)} title="Editar" style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:6, padding:'5px 7px', cursor:'pointer', color:'#60a5fa' }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setDeleting(c)} title="Excluir" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, padding:'5px 7px', cursor:'pointer', color:'#ef4444' }}>
                            <Trash2 size={13} />
                          </button>
                          <Link to={`/clients/${c.id}`} title="Ver detalhes" style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:6, padding:'5px 7px', cursor:'pointer', color:'#22c55e', display:'flex' }}>
                            <ChevronRight size={13} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Novo Cliente" maxWidth="600px">
        <ClientForm onSave={() => { setShowNew(false); load() }} onClose={() => setShowNew(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar Cliente" maxWidth="600px">
        {editing && <ClientForm initial={editing} onSave={() => { setEditing(null); load() }} onClose={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete}
        title="Remover cliente" message={`Deseja remover ${deleting?.name}? Esta acao nao pode ser desfeita.`}
        confirmText="Remover" danger
      />
    </div>
  )
}
