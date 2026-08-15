import { useState } from 'react'
import { Wallet, Plus, Save, Trash2, TrendingUp, TrendingDown, Edit3 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fmt } from '../utils/formatters'
import Modal from '../components/shared/Modal'
import toast from 'react-hot-toast'

function loadLS(key, def) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(def)) } catch { return def }
}
function saveLS(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

export default function CashPage() {
  const [saldo, setSaldo] = useState(() => loadLS('cx_saldo', 0))
  const [saldoInput, setSaldoInput] = useState('')
  const [editandoSaldo, setEditandoSaldo] = useState(false)
  const [lancamentos, setLancamentos] = useState(() => loadLS('cx_lancamentos', []))
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type:'entrada', amount:'', description:'', date: new Date().toISOString().slice(0,10) })
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const salvarSaldo = () => {
    const val = parseFloat(saldoInput.replace(',','.'))
    if (isNaN(val)) return toast.error('Digite um valor válido')
    setSaldo(val)
    saveLS('cx_saldo', val)
    setSaldoInput('')
    setEditandoSaldo(false)
    toast.success('Saldo atualizado!')
  }

  const addLancamento = () => {
    if (!form.amount || !form.description) return toast.error('Preencha valor e descrição')
    const amt = parseFloat(form.amount.replace(',','.'))
    if (isNaN(amt) || amt <= 0) return toast.error('Valor inválido')
    const novo = { ...form, id: Date.now(), amount: amt }
    const novos = [novo, ...lancamentos]
    setLancamentos(novos)
    saveLS('cx_lancamentos', novos)
    // Atualizar saldo automaticamente
    const novoSaldo = form.type === 'entrada' ? saldo + amt : saldo - amt
    setSaldo(novoSaldo)
    saveLS('cx_saldo', novoSaldo)
    setForm({ type:'entrada', amount:'', description:'', date: new Date().toISOString().slice(0,10) })
    setShowModal(false)
    toast.success(`${form.type === 'entrada' ? 'Entrada' : 'Saida'} registrada! Saldo atualizado.`)
  }

  const removeLancamento = (id) => {
    const item = lancamentos.find(l => l.id === id)
    if (!item) return
    const novos = lancamentos.filter(l => l.id !== id)
    setLancamentos(novos)
    saveLS('cx_lancamentos', novos)
    // Reverter do saldo
    const novoSaldo = item.type === 'entrada' ? saldo - item.amount : saldo + item.amount
    setSaldo(novoSaldo)
    saveLS('cx_saldo', novoSaldo)
    toast.success('Lançamento removido')
  }

  const filtrados = lancamentos.filter(l => {
    const d = (l.date||'').slice(0,10)
    if (dateFrom && d < dateFrom) return false
    if (dateTo && d > dateTo) return false
    return true
  })

  const totalEntradas = filtrados.filter(l=>l.type==='entrada').reduce((s,l)=>s+l.amount,0)
  const totalSaidas = filtrados.filter(l=>l.type==='saida').reduce((s,l)=>s+l.amount,0)

  // Gráfico mensal
  const monthMap = {}
  filtrados.forEach(l => {
    const m = (l.date||'').slice(0,7)
    if (!m) return
    if (!monthMap[m]) monthMap[m] = { month:m, Entradas:0, Saidas:0 }
    if (l.type==='entrada') monthMap[m].Entradas += l.amount
    else monthMap[m].Saidas += l.amount
  })
  const chartData = Object.values(monthMap).sort((a,b)=>a.month.localeCompare(b.month)).map(r=>({...r, month:r.month.slice(5)+'/'+r.month.slice(2,4)}))

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Caixa</h1>
          <p className="page-sub">Seu controle financeiro pessoal</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={15}/> Novo Lançamento
        </button>
      </div>

      {/* SALDO PRINCIPAL — destaque total */}
      <div style={{ background:'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))', border:'1px solid rgba(59,130,246,0.3)', borderRadius:16, padding:28 }}>
        <p style={{ fontSize:12, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>
          Saldo Disponível em Caixa
        </p>
        {editandoSaldo ? (
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <input
              type="number" step="0.01" autoFocus
              className="input" style={{ maxWidth:240, fontSize:22, fontWeight:800, padding:'10px 14px' }}
              value={saldoInput}
              onChange={e => setSaldoInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && salvarSaldo()}
              placeholder="0,00"
            />
            <button onClick={salvarSaldo} className="btn-primary"><Save size={15}/> Confirmar</button>
            <button onClick={() => { setEditandoSaldo(false); setSaldoInput('') }} className="btn-ghost">Cancelar</button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <p style={{ fontSize:42, fontWeight:900, color: saldo >= 0 ? '#f1f5f9' : '#ef4444', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
              {fmt.currency(saldo)}
            </p>
            <button onClick={() => { setEditandoSaldo(true); setSaldoInput(String(saldo)) }}
              style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, padding:'8px 14px', cursor:'pointer', color:'#cbd5e1', fontSize:13, fontWeight:600 }}>
              <Edit3 size={14}/> Editar saldo
            </button>
          </div>
        )}
        <p style={{ fontSize:12, color:'#64748b', marginTop:10 }}>
          ℹ️ Clique em "Editar saldo" para informar quanto você tem agora. Lançamentos de entrada/saída ajustam automaticamente.
        </p>
      </div>

      {/* Cards resumo do período */}
      {filtrados.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card" style={{ padding:16, borderLeft:'3px solid #22c55e' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>Entradas no período</p>
              <TrendingUp size={16} color="#22c55e"/>
            </div>
            <p style={{ fontSize:22, fontWeight:800, color:'#22c55e' }}>{fmt.currency(totalEntradas)}</p>
          </div>
          <div className="card" style={{ padding:16, borderLeft:'3px solid #ef4444' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>Saídas no período</p>
              <TrendingDown size={16} color="#ef4444"/>
            </div>
            <p style={{ fontSize:22, fontWeight:800, color:'#ef4444' }}>{fmt.currency(totalSaidas)}</p>
          </div>
        </div>
      )}

      {/* Filtro datas */}
      <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap' }}>
        <div>
          <label className="label">De</label>
          <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width:160 }}/>
        </div>
        <div>
          <label className="label">Até</label>
          <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width:160 }}/>
        </div>
        {(dateFrom||dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }} className="btn-ghost">Limpar</button>
        )}
      </div>

      {/* Gráfico */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:16 }}>Movimentação Mensal</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="month" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false}/>
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>fmt.currency(v)}/>
              <Area type="monotone" dataKey="Entradas" stroke="#22c55e" fill="url(#gE)" strokeWidth={2}/>
              <Area type="monotone" dataKey="Saidas" stroke="#ef4444" fill="url(#gS)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Extrato */}
      {lancamentos.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'40px 20px' }}>
          <Wallet size={32} style={{ color:'var(--text-muted)', margin:'0 auto 12px' }}/>
          <p style={{ color:'var(--text-muted)', fontSize:14 }}>Nenhum lançamento ainda.</p>
          <p style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>
            Clique em "Novo Lançamento" para registrar entradas e saídas.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Extrato de Lançamentos</h3>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{filtrados.length} de {lancamentos.length}</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-hover)', borderBottom:'1px solid var(--border)' }}>
                  {['Data','Tipo','Descrição','Valor',''].map(h=><th key={h} className="th">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(l=>(
                  <tr key={l.id} className="table-row">
                    <td className="td">{fmt.date(l.date)}</td>
                    <td className="td">
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999,
                        background:l.type==='entrada'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)',
                        color:l.type==='entrada'?'#22c55e':'#ef4444' }}>
                        {l.type==='entrada'?'ENTRADA':'SAÍDA'}
                      </span>
                    </td>
                    <td className="td" style={{ color:'var(--text-primary)' }}>{l.description}</td>
                    <td className="td text-money" style={{ color:l.type==='entrada'?'#22c55e':'#ef4444', fontWeight:700 }}>
                      {l.type==='saida'?'-':'+'}{fmt.currency(l.amount)}
                    </td>
                    <td className="td">
                      <button onClick={()=>removeLancamento(l.id)}
                        style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4, borderRadius:4 }}
                        onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                        onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Novo Lançamento">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="label">Tipo</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {['entrada','saida'].map(t=>(
                <button key={t} onClick={()=>setForm(f=>({...f,type:t}))}
                  style={{ padding:'10px', borderRadius:8, border:`2px solid ${form.type===t?(t==='entrada'?'#22c55e':'#ef4444'):'var(--border)'}`,
                    background:form.type===t?(t==='entrada'?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)'):'transparent',
                    color:form.type===t?(t==='entrada'?'#22c55e':'#ef4444'):'var(--text-secondary)',
                    cursor:'pointer', fontWeight:700, fontSize:13 }}>
                  {t==='entrada'?'⬆️ Entrada':'⬇️ Saída'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input type="number" step="0.01" className="input" value={form.amount}
              onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0,00" autoFocus/>
          </div>
          <div>
            <label className="label">Descrição</label>
            <input className="input" value={form.description}
              onChange={e=>setForm(f=>({...f,description:e.target.value}))}
              placeholder={form.type==='entrada'?'Ex: Recebimento cliente, salário...':'Ex: Aluguel, combustível, gasto pessoal...'}/>
          </div>
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
          </div>
          <div style={{ background:form.type==='entrada'?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${form.type==='entrada'?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'}`, borderRadius:8, padding:10, fontSize:12, color:form.type==='entrada'?'#22c55e':'#ef4444' }}>
            {form.type==='entrada'
              ? `✅ Seu saldo vai aumentar ${form.amount ? 'em '+fmt.currency(parseFloat(form.amount)||0) : ''}`
              : `⚠️ Seu saldo vai diminuir ${form.amount ? 'em '+fmt.currency(parseFloat(form.amount)||0) : ''}`}
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={()=>setShowModal(false)} className="btn-ghost">Cancelar</button>
            <button onClick={addLancamento} className={form.type==='entrada'?'btn-primary':'btn-danger'}>
              {form.type==='entrada'?'Registrar Entrada':'Registrar Saída'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
