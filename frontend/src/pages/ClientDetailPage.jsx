import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Upload, Phone, MapPin, Briefcase,
  Calendar, AlertTriangle, Plus, ExternalLink
} from 'lucide-react'
import api from '../utils/api'
import { fmt, statusClass, riskClass } from '../utils/formatters'
import { Loading, StatCard } from '../components/shared/UI'
import Modal from '../components/shared/Modal'
import toast from 'react-hot-toast'

function DocUpload({ clientId, onDone }) {
  const [files, setFiles] = useState({ doc_residence: null, doc_id_front: null, doc_id_back: null })
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData()
    Object.entries(files).forEach(([k, v]) => { if (v) form.append(k, v) })
    if (!Object.values(files).some(Boolean)) return toast.error('Selecione ao menos um arquivo')
    setSaving(true)
    try {
      await api.post(`/clients/${clientId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Documentos enviados!')
      onDone()
    } catch {} finally { setSaving(false) }
  }

  const DocInput = ({ field, label }) => (
    <div>
      <label className="label">{label}</label>
      <label className="flex items-center gap-2 cursor-pointer border border-dashed border-slate-700 rounded-lg px-3 py-2.5 hover:border-sky-500/50 transition-colors">
        <Upload size={14} className="text-slate-500" />
        <span className="text-sm text-slate-400 flex-1 truncate">
          {files[field]?.name || 'Clique para selecionar (JPG, PNG, PDF)'}
        </span>
        <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
          onChange={e => setFiles(p => ({ ...p, [field]: e.target.files[0] }))} />
      </label>
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      <DocInput field="doc_residence" label="Comprovante de Residência" />
      <DocInput field="doc_id_front"  label="Identidade — Frente" />
      <DocInput field="doc_id_back"   label="Identidade — Verso" />
      <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enviando...' : 'Enviar Documentos'}
        </button>
      </div>
    </form>
  )
}

export default function ClientDetailPage() {
  const { id }  = useParams()
  const navigate = useNavigate()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [docModal, setDocModal] = useState(false)
  const [tab, setTab]         = useState('loans')

  const load = async () => {
    setLoading(true)
    try {
      const { data: d } = await api.get(`/clients/${id}`)
      setData(d)
    } catch { navigate('/clients') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  if (loading) return <Loading />
  if (!data)   return null

  const { client, loans, payments, risk } = data

  const totalDebt = loans.filter(l => l.status !== 'QUITADO').reduce((s, l) => s + (parseFloat(l.principal) || 0), 0)
  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount), 0)

  const DocCard = ({ label, path }) => (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="flex items-center gap-2">
        <FileText size={16} className={path ? 'text-sky-400' : 'text-slate-600'} />
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      {path ? (
        <a href={`/${path}`} target="_blank" rel="noreferrer"
          className="text-xs text-sky-400 hover:underline flex items-center gap-1">
          Ver <ExternalLink size={12} />
        </a>
      ) : (
        <span className="text-xs text-slate-600">Não enviado</span>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div>
        <Link to="/clients" className="text-sm text-slate-500 hover:text-slate-300 flex items-center gap-1 mb-4">
          <ArrowLeft size={14} /> Voltar para Clientes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-2xl font-bold text-sky-400 flex-shrink-0">
              {client.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{client.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-400">
                <span className="font-mono text-xs">{fmt.cpf(client.cpf)}</span>
                {client.phone && <span className="flex items-center gap-1"><Phone size={12}/>{fmt.phone(client.phone)}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={riskClass(risk.score)}>{fmt.riskLabel(risk.score)}</span>
            <Link to={`/loans?client_id=${id}`} className="btn-primary text-xs">
              <Plus size={14} /> Novo Empréstimo
            </Link>
          </div>
        </div>
      </div>

      {/* Info + Stats */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Info card */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-white">Informações</h3>
          {client.address && (
            <div className="flex gap-2 text-sm text-slate-400">
              <MapPin size={14} className="text-slate-600 mt-0.5 flex-shrink-0" />
              <span>{client.address}</span>
            </div>
          )}
          {client.income_source && (
            <div className="flex gap-2 text-sm text-slate-400">
              <Briefcase size={14} className="text-slate-600 flex-shrink-0" />
              <span>{client.income_source} {client.salary_day ? `— recebe dia ${client.salary_day}` : ''}</span>
            </div>
          )}
          <div className="flex gap-2 text-sm text-slate-400">
            <Calendar size={14} className="text-slate-600 flex-shrink-0" />
            <span>Cadastrado em {fmt.date(client.created_at)}</span>
          </div>
          {client.notes && (
            <div className="mt-2 p-2.5 bg-slate-800 rounded-lg text-xs text-slate-400 italic">
              {client.notes}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Contratos"    value={loans.length}          color="sky"     />
          <StatCard label="Ativos"       value={loans.filter(l=>l.status!=='QUITADO').length} color="violet" />
          <StatCard label="Total Devido" value={fmt.currency(totalDebt)} color="amber"  />
          <StatCard label="Total Pago"   value={fmt.currency(totalPaid)} color="emerald"/>
        </div>
      </div>

      {/* Risk bar */}
      {risk.score === 'ALTO' && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">Cliente de Alto Risco</p>
            <p className="text-xs text-red-400/70 mt-0.5">
              Este cliente possui histórico de atrasos e/ou contratos críticos. Avalie antes de novos empréstimos.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-slate-800 px-2 pt-2 gap-1">
          {[['loans','Contratos'], ['payments','Pagamentos'], ['docs','Documentos']].map(([key,lbl]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px
                ${tab === key
                  ? 'text-sky-400 border-sky-500 bg-sky-500/5'
                  : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* CONTRATOS */}
          {tab === 'loans' && (
            loans.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Nenhum contrato</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="th">Data</th>
                      <th className="th">Capital</th>
                      <th className="th">Dívida Atual</th>
                      <th className="th">Dias</th>
                      <th className="th">Status</th>
                      <th className="th"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(l => (
                      <tr key={l.id} className="table-row">
                        <td className="td">{fmt.date(l.loan_date)}</td>
                        <td className="td text-money">{fmt.currency(l.principal)}</td>
                        <td className="td text-money text-amber-400">{fmt.currency(l.currentDebt)}</td>
                        <td className="td text-slate-400">{l.totalDays}d</td>
                        <td className="td"><span className={statusClass(l.status)}>{l.status}</span></td>
                        <td className="td">
                          <Link to={`/loans/${l.id}`}
                            className="text-sky-400 hover:underline text-xs flex items-center gap-1">
                            Ver <ExternalLink size={11}/>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* PAGAMENTOS */}
          {tab === 'payments' && (
            payments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">Nenhum pagamento registrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="th">Data</th>
                      <th className="th">Valor</th>
                      <th className="th">Tipo</th>
                      <th className="th">Obs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="table-row">
                        <td className="td">{fmt.date(p.payment_date)}</td>
                        <td className="td text-money text-emerald-400">{fmt.currency(p.amount)}</td>
                        <td className="td">
                          <span className={`badge ${
                            p.payment_type === 'QUITACAO' ? 'bg-emerald-500/20 text-emerald-400' :
                            p.payment_type === 'PARCIAL'  ? 'bg-sky-500/20 text-sky-400' :
                            'bg-violet-500/20 text-violet-400'}`}>{p.payment_type}</span>
                        </td>
                        <td className="td text-slate-500 text-xs">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* DOCUMENTOS */}
          {tab === 'docs' && (
            <div className="space-y-3">
              <DocCard label="Comprovante de Residência" path={client.doc_residence} />
              <DocCard label="Identidade — Frente"       path={client.doc_id_front}  />
              <DocCard label="Identidade — Verso"        path={client.doc_id_back}   />
              <button onClick={() => setDocModal(true)} className="btn-ghost w-full justify-center mt-2">
                <Upload size={15}/> Enviar / Atualizar Documentos
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal open={docModal} onClose={() => setDocModal(false)} title="Upload de Documentos">
        <DocUpload clientId={id} onDone={() => { setDocModal(false); load() }} />
      </Modal>
    </div>
  )
}
