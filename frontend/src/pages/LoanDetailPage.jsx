import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Copy, FileDown, Plus, Trash2, AlertTriangle,
  CheckCircle, Clock, TrendingUp, DollarSign, Calendar
} from 'lucide-react'
import api from '../utils/api'
import { fmt, statusClass } from '../utils/formatters'
import { Loading, ConfirmDialog } from '../components/shared/UI'
import Modal from '../components/shared/Modal'
import toast from 'react-hot-toast'

function PaymentForm({ loanId, onSave, onClose }) {
  const [f, setF] = useState({
    amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'PARCIAL', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/payments', { ...f, loan_id: loanId })
      toast.success('Pagamento registrado!')
      onSave()
    } catch {} finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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
          <option value="JUROS">JUROS — Paga só os juros</option>
          <option value="PARCIAL">PARCIAL — Abate parte da dívida</option>
          <option value="QUITACAO">QUITAÇÃO — Quita o contrato</option>
        </select>
      </div>
      <div>
        <label className="label">Observações</label>
        <input className="input" value={f.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Pix, espécie, banco..." />
      </div>
      <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
        <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Registrar Pagamento'}
        </button>
      </div>
    </form>
  )
}

function ChargeModal({ loan, calc, onClose }) {
  const text = loan?._chargeText || ''

  const copy = () => {
    navigator.clipboard.writeText(text)
    toast.success('Texto copiado!')
  }

  const printPDF = () => {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"><title>Cobrança — ${loan.client_name}</title>
      <style>
        body{font-family:monospace;padding:40px;background:#fff;color:#000;max-width:500px;margin:0 auto}
        pre{white-space:pre-wrap;font-size:14px;line-height:1.6}
        @media print{body{padding:20px}}
      </style></head><body>
      <pre>${text}</pre>
      <script>window.print();window.close();</script>
      </body></html>`)
    w.document.close()
  }

  return (
    <div className="space-y-4">
      <pre className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
        {text}
      </pre>
      <div className="flex gap-3">
        <button onClick={copy}    className="btn-primary flex-1 justify-center"><Copy size={15}/> Copiar Texto</button>
        <button onClick={printPDF} className="btn-ghost flex-1 justify-center"><FileDown size={15}/> Gerar PDF</button>
      </div>
      <button onClick={onClose} className="w-full text-xs text-slate-500 hover:text-slate-300 py-1">Fechar</button>
    </div>
  )
}

export default function LoanDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [loan, setLoan]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [payModal, setPayModal] = useState(false)
  const [chargeModal, setChargeModal] = useState(false)
  const [confirmDel, setConfirmDel]   = useState(null)
  const [chargeData, setChargeData]   = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/loans/${id}`)
      setLoan(data)
    } catch { navigate('/loans') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const openCharge = async () => {
    try {
      const { data } = await api.get(`/loans/${id}/charge`)
      setChargeData({ ...loan, _chargeText: data.text })
      setChargeModal(true)
    } catch {}
  }

  const deletePayment = async (pid) => {
    try {
      await api.delete(`/payments/${pid}`)
      toast.success('Pagamento removido')
      load()
    } catch {}
  }

  const deleteLoan = async () => {
    try {
      await api.delete(`/loans/${id}`)
      toast.success('Contrato removido')
      navigate('/loans')
    } catch {}
  }

  if (loading) return <Loading />
  if (!loan)   return null

  const isSettled = loan.status === 'QUITADO'
  const isLate    = loan.status === 'ATRASADO' || loan.status === 'CRITICO'

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link to="/loans" className="text-sm text-slate-500 hover:text-slate-300 flex items-center gap-1">
        <ArrowLeft size={14}/> Voltar para Empréstimos
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{loan.client_name}</h1>
            <span className={statusClass(loan.status)}>{loan.status}</span>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
            <Link to={`/clients/${loan.client_id}`} className="hover:text-sky-400 flex items-center gap-1">
              <span className="font-mono text-xs">{fmt.cpf(loan.client_cpf)}</span>
            </Link>
            <span className="flex items-center gap-1"><Calendar size={12}/> {fmt.date(loan.loan_date)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isSettled && (
            <>
              <button onClick={openCharge} className="btn-warning">
                <FileDown size={15}/> Gerar Cobrança
              </button>
              <button onClick={() => setPayModal(true)} className="btn-primary">
                <Plus size={15}/> Registrar Pagamento
              </button>
            </>
          )}
          <button onClick={() => setConfirmDel('loan')} className="btn-danger">
            <Trash2 size={15}/> Remover
          </button>
        </div>
      </div>

      {/* Alert bar */}
      {isLate && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border
          ${loan.status === 'CRITICO'
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-amber-500/10 border-amber-500/30'}`}>
          <AlertTriangle size={18} className={loan.status === 'CRITICO' ? 'text-red-400' : 'text-amber-400'}/>
          <div>
            <p className={`text-sm font-semibold ${loan.status === 'CRITICO' ? 'text-red-400' : 'text-amber-400'}`}>
              {loan.status === 'CRITICO'
                ? `Contrato CRÍTICO — ${loan.daysSinceLastPayment} dias sem pagamento`
                : `Contrato ATRASADO — ${loan.daysSinceLastPayment} dias sem pagamento`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Multa acumulada: {fmt.currency(loan.fine)} ({loan.fineDays} dias × R$50)
            </p>
          </div>
        </div>
      )}
      {isSettled && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <CheckCircle size={18} className="text-emerald-400"/>
          <p className="text-sm font-semibold text-emerald-400">Contrato quitado!</p>
        </div>
      )}

      {/* Calc cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Capital',       value: fmt.currency(loan.principal),   icon: DollarSign, color: 'sky' },
          { label: 'Juros Acum.',   value: fmt.currency(loan.interest),    icon: TrendingUp, color: 'violet' },
          { label: 'Multa',         value: fmt.currency(loan.fine),        icon: AlertTriangle, color: loan.fine > 0 ? 'red' : 'sky' },
          { label: 'Total Pago',    value: fmt.currency(loan.totalPaid),   icon: CheckCircle, color: 'emerald' },
          { label: 'Dívida Atual',  value: fmt.currency(loan.currentDebt), icon: Clock, color: isSettled ? 'emerald' : 'amber' },
          { label: 'Dias Corridos', value: `${loan.totalDays} dias`,       icon: Calendar, color: 'sky' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-sm flex flex-col gap-1">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={`text-base font-bold text-money ${
              color === 'emerald' ? 'text-emerald-400' :
              color === 'amber'   ? 'text-amber-400' :
              color === 'red'     ? 'text-red-400' :
              color === 'violet'  ? 'text-violet-400' : 'text-white'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-white">Detalhes do Contrato</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Data empréstimo</span><span className="text-slate-200">{fmt.date(loan.loan_date)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Próx. vencimento</span><span className={`${loan.isNearDue ? 'text-amber-400' : 'text-slate-200'}`}>{fmt.date(loan.nextDueDate)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Taxa diária</span><span className="text-slate-200">1% ao dia</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Renovação (30d)</span><span className="text-sky-400 text-money">{fmt.currency(loan.cyclePayment)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Quitação total</span><span className="text-amber-400 text-money">{fmt.currency(loan.fullSettlement)}</span></div>
          </div>
          {loan.observations && (
            <div className="p-2.5 bg-slate-800 rounded-lg text-xs text-slate-400 italic mt-2">{loan.observations}</div>
          )}
        </div>

        {/* Payment history */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-3">Histórico de Pagamentos</h3>
          {!loan.payments?.length ? (
            <p className="text-sm text-slate-500 text-center py-4">Nenhum pagamento registrado</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {loan.payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-emerald-400 text-money">{fmt.currency(p.amount)}</p>
                    <p className="text-xs text-slate-500">{fmt.date(p.payment_date)} — {p.payment_type}</p>
                    {p.notes && <p className="text-xs text-slate-600 italic">{p.notes}</p>}
                  </div>
                  <button onClick={() => setConfirmDel(p.id)}
                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={14}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Registrar Pagamento">
        <PaymentForm loanId={id} onSave={() => { setPayModal(false); load() }} onClose={() => setPayModal(false)} />
      </Modal>

      <Modal open={chargeModal} onClose={() => setChargeModal(false)} title="Cobrança — Copiar ou Imprimir" size="lg">
        <ChargeModal loan={chargeData} onClose={() => setChargeModal(false)} />
      </Modal>

      <ConfirmDialog open={confirmDel === 'loan'} onClose={() => setConfirmDel(null)}
        onConfirm={deleteLoan} title="Remover Contrato"
        message="Todos os pagamentos serão removidos. Esta ação não pode ser desfeita."
        confirmText="Remover" danger />

      <ConfirmDialog open={typeof confirmDel === 'string' && confirmDel !== 'loan'}
        onClose={() => setConfirmDel(null)}
        onConfirm={() => deletePayment(confirmDel)}
        title="Remover Pagamento" message="O status do contrato será recalculado."
        confirmText="Remover" danger />
    </div>
  )
}
