import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Plus, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import api from '../utils/api'
import { fmt, statusClass } from '../utils/formatters'
import { Loading, Modal, Badge } from '../components/shared/UI'
import toast from 'react-hot-toast'

const PAYMENT_TYPES = [
  { value:'JUROS',    label:'Juros — paga so os juros do periodo' },
  { value:'CAPITAL',  label:'Capital — abate o capital' },
  { value:'QUITACAO', label:'Quitacao — quita tudo' },
]

export default function LoanDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loan, setLoan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPay, setShowPay] = useState(false)
  const [showCharge, setShowCharge] = useState(false)
  const [chargeData, setChargeData] = useState(null)
  const [payForm, setPayForm] = useState({ amount:'', payment_type:'JUROS', payment_date: new Date().toISOString().slice(0,10), notes:'' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const { data } = await api.get(`/loans/${id}`)
      setLoan(data)
    } catch { toast.error('Erro ao carregar contrato') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handlePay = async () => {
    if (!payForm.amount || !payForm.payment_date) return toast.error('Preencha todos os campos')
    setSaving(true)
    try {
      const res = await api.post('/payments', { loan_id: id, ...payForm })
      if (res.data.pendingInterest > 0) {
        toast.success(`Capital abatido! Atencao: ainda ha ${fmt.currency(res.data.pendingInterest)} de juros pendentes.`)
      } else {
        toast.success(res.data.message || 'Pagamento registrado!')
      }
      setShowPay(false)
      setPayForm({ amount:'', payment_type:'JUROS', payment_date: new Date().toISOString().slice(0,10), notes:'' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao registrar pagamento')
    } finally { setSaving(false) }
  }

  const handleCharge = async () => {
    try {
      const { data } = await api.get(`/loans/${id}/charge`)
      setChargeData(data)
      setShowCharge(true)
    } catch { toast.error('Erro ao gerar cobranca') }
  }

  const handleDeletePay = async (payId) => {
    if (!confirm('Remover este pagamento?')) return
    try {
      await api.delete(`/payments/${payId}`)
      toast.success('Pagamento removido')
      load()
    } catch { toast.error('Erro ao remover pagamento') }
  }

  if (loading) return <Loading />
  if (!loan) return <div style={{ color:'var(--text-muted)', padding:32 }}>Contrato nao encontrado.</div>

  const statusColors = { ATIVO:'#22c55e', ATRASADO:'#f59e0b', CRITICO':'#ef4444', QUITADO:'#94a3b8' }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding:'8px 10px' }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex:1 }}>
          <h1 className="page-title">{loan.client_name}</h1>
          <p className="page-sub">Contrato desde {fmt.date(loan.loan_date)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {loan.status !== 'QUITADO' && (
            <>
              <button onClick={handleCharge} className="btn-ghost">
                <MessageCircle size={15} /> Gerar Cobranca
              </button>
              <button onClick={() => setShowPay(true)} className="btn-primary">
                <Plus size={15} /> Registrar Pagamento
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Capital Restante', value: fmt.currency(loan.remainingCapital), color:'#60a5fa' },
          { label:'Juros Acumulados', value: fmt.currency(loan.accruedInterest), color:'#f59e0b' },
          { label:'Multa', value: fmt.currency(loan.fine || 0), color:'#ef4444' },
          { label:'Total Devido', value: fmt.currency(loan.totalDue), color:'#a78bfa' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding:16 }}>
            <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.04em', marginBottom:6 }}>{c.label}</p>
            <p style={{ fontSize:20, fontWeight:800, color:c.color, fontVariantNumeric:'tabular-nums' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Info do contrato */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>Status</p>
            <span className={statusClass(loan.status)}>{loan.status}</span>
          </div>
          <div>
            <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>Capital Original</p>
            <p style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{fmt.currency(loan.amount)}</p>
          </div>
          <div>
            <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>Dias s/ Pagamento</p>
            <p style={{ fontSize:15, fontWeight:600, color: loan.daysSinceLastPayment > 30 ? '#ef4444' : 'var(--text-primary)' }}>
              {loan.daysSinceLastPayment} dias
            </p>
          </div>
          <div>
            <p style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>Data do Emprestimo</p>
            <p style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{fmt.date(loan.loan_date)}</p>
          </div>
        </div>
        {loan.notes && (
          <div style={{ marginTop:16, padding:12, background:'var(--bg-hover)', borderRadius:8, fontSize:13, color:'var(--text-secondary)' }}>
            {loan.notes}
          </div>
        )}
      </div>

      {/* Historico de pagamentos */}
      <div className="card">
        <h3 style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', marginBottom:16 }}>Historico de Pagamentos</h3>
        {!loan.payments?.length ? (
          <p style={{ color:'var(--text-muted)', fontSize:13, textAlign:'center', padding:'24px 0' }}>Nenhum pagamento registrado</p>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Data','Tipo','Valor','Obs',''].map(h => <th key={h} className="th">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loan.payments.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="td">{fmt.date(p.payment_date)}</td>
                    <td className="td">
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999,
                        background: p.payment_type==='QUITACAO' ? 'rgba(34,197,94,0.12)' : p.payment_type==='CAPITAL' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)',
                        color: p.payment_type==='QUITACAO' ? '#22c55e' : p.payment_type==='CAPITAL' ? '#60a5fa' : '#f59e0b'
                      }}>
                        {p.payment_type}
                      </span>
                    </td>
                    <td className="td text-money" style={{ color:'#22c55e' }}>{fmt.currency(p.amount)}</td>
                    <td className="td" style={{ color:'var(--text-muted)', fontSize:12 }}>{p.notes || '—'}</td>
                    <td className="td">
                      <button onClick={() => handleDeletePay(p.id)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4 }}
                        onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pagamento */}
      <Modal open={showPay} onClose={() => setShowPay(false)} title="Registrar Pagamento">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="label">Tipo de Pagamento</label>
            <select className="input" value={payForm.payment_type} onChange={e => setPayForm(f => ({ ...f, payment_type: e.target.value }))}>
              {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input className="input" type="number" step="0.01" min="0" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
          </div>
          <div>
            <label className="label">Data do Pagamento</label>
            <input className="input" type="date" value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} />
          </div>
          <div>
            <label className="label">Observacao (opcional)</label>
            <input className="input" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ex: pagou via PIX" />
          </div>
          {payForm.payment_type === 'JUROS' && (
            <div style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:8, padding:10, fontSize:12, color:'#f59e0b' }}>
              Juros sugeridos: {fmt.currency(loan.accruedInterest)}
            </div>
          )}
          {payForm.payment_type === 'QUITACAO' && (
            <div style={{ background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, padding:10, fontSize:12, color:'#60a5fa' }}>
              Total para quitacao: {fmt.currency(loan.totalDue)}
            </div>
          )}
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
            <button onClick={() => setShowPay(false)} className="btn-ghost">Cancelar</button>
            <button onClick={handlePay} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal cobranca WhatsApp */}
      <Modal open={showCharge} onClose={() => setShowCharge(false)} title="Enviar Cobranca via WhatsApp">
        {chargeData && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'var(--bg-primary)', border:'1px solid var(--border)', borderRadius:10, padding:14, fontSize:13, color:'var(--text-secondary)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
              {chargeData.message}
            </div>
            <p style={{ fontSize:12, color:'var(--text-muted)' }}>
              Clique abaixo para abrir o WhatsApp com a mensagem ja preenchida. O cliente precisara ter WhatsApp instalado.
            </p>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setShowCharge(false)} className="btn-ghost">Fechar</button>
              <a href={chargeData.whatsappUrl} target="_blank" rel="noopener noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#22c55e', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, textDecoration:'none', cursor:'pointer' }}>
                <MessageCircle size={15} /> Abrir WhatsApp
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
