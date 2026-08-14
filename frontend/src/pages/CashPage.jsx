import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, Plus, RefreshCw, Save } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'
import { fmt } from '../utils/formatters'
import { Loading } from '../components/shared/UI'
import Modal from '../components/shared/Modal'
import toast from 'react-hot-toast'

export default function CashPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [saldoManual, setSaldoManual] = useState(() => {
    return parseFloat(localStorage.getItem('credix_saldo_manual') || '0')
  })
  const [saldoInput, setSaldoInput] = useState('')
  const [manual, setManual] = useState({ type:'entrada', amount:'', description:'', date: new Date().toISOString().slice(0,10) })
  const [manuais, setManuais] = useState(() => {
    try { return JSON.parse(localStorage.getItem('credix_manuais') || '[]') } catch { return [] }
  })

  const load = async () => {
    try {
      setLoading(true)
      const params = {}
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      const { data: d } = await api.get('/cash', { params })
      setData(d)
    } catch {
      // cash endpoint pode não existir — buscar via payments
      try {
        const { data: pays } = await api.get('/payments')
        const payments = Array.isArray(pays) ? pays : []
        let totalIn = 0
        const monthMap = {}
        payments.forEach(p => {
          const amt = parseFloat(p.amount||0)
          const month = (p.payment_date||'').slice(0,7)
          totalIn += amt
          if (month) {
            if (!monthMap[month]) monthMap[month] = { month, Entradas:0, Saidas:0 }
            monthMap[month].Entradas += amt
          }
        })
        // Adicionar lançamentos manuais de saída
        let totalOut = 0
        manuais.filter(m => m.type === 'saida').forEach(m => {
          totalOut += parseFloat(m.amount||0)
          const month = (m.date||'').slice(0,7)
          if (month) {
            if (!monthMap[month]) monthMap[month] = { month, Entradas:0, Saidas:0 }
            monthMap[month].Saidas += parseFloat(m.amount||0)
          }
        })
        manuais.filter(m => m.type === 'entrada').forEach(m => {
          totalIn += parseFloat(m.amount||0)
          const month = (m.date||'').slice(0,7)
          if (month) {
            if (!monthMap[month]) monthMap[month] = { month, Entradas:0, Saidas:0 }
            monthMap[month].Entradas += parseFloat(m.amount||0)
          }
        })
        const chartData = Object.values(monthMap)
          .sort((a,b) => a.month.localeCompare(b.month))
          .map(r => ({ ...r, month: r.month.slice(5)+'/'+r.month.slice(2,4) }))
        setData({ totalIn, totalOut, saldo: totalIn - totalOut, chartData, payments })
      } catch { toast.error('Erro ao carregar caixa') }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [dateFrom, dateTo])

  const salvarSaldo = () => {
    const val = parseFloat(saldoInput)
    if (isNaN(val)) return toast.error('Digite um valor válido')
    setSaldoManual(val)
    localStorage.setItem('credix_saldo_manual', String(val))
    setSaldoInput('')
    toast.success('Saldo atualizado!')
  }

  const addManual = () => {
    if (!manual.amount || !manual.description) return toast.error('Preencha todos os campos')
    const novo = { ...manual, id: Date.now(), amount: parseFloat(manual.amount) }
    const novos = [novo, ...manuais]
    setManuais(novos)
    localStorage.setItem('credix_manuais', JSON.stringify(novos))
    setManual({ type:'entrada', amount:'', description:'', date: new Date().toISOString().slice(0,10) })
    setShowManual(false)
    toast.success('Lançamento registrado!')
    load()
  }

  const removeManual = (id) => {
    const novos = manuais.filter(m => m.id !== id)
    setManuais(novos)
    localStorage.setItem('credix_manuais', JSON.stringify(novos))
    load()
  }

  if (loading) return <Loading />

  const totalIn = parseFloat(data?.totalIn||0) + manuais.filter(m=>m.type==='entrada').reduce((s,m)=>s+parseFloat(m.amount||0),0)
  const totalOut = parseFloat(data?.totalOut||0) + manuais.filter(m=>m.type==='saida').reduce((s,m)=>s+parseFloat(m.amount||0),0)
  const saldoCalc = totalIn - totalOut
  const saldoFinal = saldoManual > 0 ? saldoManual : saldoCalc

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Caixa</h1>
          <p className="page-sub">Controle de entradas e saidas financeiras</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={load} className="btn-ghost"><RefreshCw size={15}/> Atualizar</button>
          <button onClick={() => setShowManual(true)} className="btn-primary"><Plus size={15}/> Lancamento Manual</button>
        </div>
      </div>

      {/* Saldo manual */}
      <div className="card" style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)' }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#60a5fa', marginBottom:10 }}>💰 Saldo Real em Caixa (atualize manualmente)</p>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input type="number" step="0.01" className="input" style={{ maxWidth:200 }}
            value={saldoInput} onChange={e => setSaldoInput(e.target.value)}
            placeholder={`Atual: ${fmt.currency(saldoManual)}`}
          />
          <button onClick={salvarSaldo} className="btn-primary"><Save size={15}/> Salvar Saldo</button>
          <span style={{ fontSize:13, color:'var(--text-muted)' }}>
            Informe quanto você tem em caixa agora
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <div>
          <label className="label">De</label>
          <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width:160 }} />
        </div>
        <div>
          <label className="label">Ate</label>
          <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width:160 }} />
        </div>
        {(dateFrom||dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }} className="btn-ghost" style={{ marginTop:20 }}>Limpar</button>
        )}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card" style={{ padding:20, borderLeft:'3px solid #22c55e' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>Total Entradas</p>
            <TrendingUp size={18} color="#22c55e" />
          </div>
          <p style={{ fontSize:26, fontWeight:800, color:'#22c55e' }}>{fmt.currency(totalIn)}</p>
          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Pagamentos recebidos + lançamentos</p>
        </div>
        <div className="card" style={{ padding:20, borderLeft:'3px solid #ef4444' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>Total Saidas</p>
            <TrendingDown size={18} color="#ef4444" />
          </div>
          <p style={{ fontSize:26, fontWeight:800, color:'#ef4444' }}>{fmt.currency(totalOut)}</p>
          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Lançamentos manuais de saida</p>
        </div>
        <div className="card" style={{ padding:20, borderLeft:`3px solid ${saldoFinal >= 0 ? '#0ea5e9' : '#ef4444'}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>
              {saldoManual > 0 ? 'Saldo em Caixa (manual)' : 'Saldo Calculado'}
            </p>
            <Wallet size={18} color={saldoFinal >= 0 ? '#0ea5e9' : '#ef4444'} />
          </div>
          <p style={{ fontSize:26, fontWeight:800, color: saldoFinal >= 0 ? '#0ea5e9' : '#ef4444' }}>{fmt.currency(saldoFinal)}</p>
          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
            {saldoManual > 0 ? 'Valor informado manualmente' : 'Entradas − Saidas'}
          </p>
        </div>
      </div>

      {/* Gráfico */}
      {data?.chartData?.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', marginBottom:16 }}>Fluxo de Caixa Mensal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.chartData}>
              <defs>
                <linearGradient id="gEnt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gSai" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt.currency(v)} />
              <Area type="monotone" dataKey="Entradas" stroke="#22c55e" fill="url(#gEnt)" strokeWidth={2} />
              <Area type="monotone" dataKey="Saidas" stroke="#ef4444" fill="url(#gSai)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lançamentos manuais */}
      {manuais.length > 0 && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Lançamentos Manuais</h3>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-hover)', borderBottom:'1px solid var(--border)' }}>
                  {['Data','Tipo','Descricao','Valor',''].map(h => <th key={h} className="th">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {manuais.map(m => (
                  <tr key={m.id} className="table-row">
                    <td className="td">{fmt.date(m.date)}</td>
                    <td className="td">
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:999,
                        background: m.type==='entrada' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: m.type==='entrada' ? '#22c55e' : '#ef4444' }}>
                        {m.type === 'entrada' ? 'ENTRADA' : 'SAIDA'}
                      </span>
                    </td>
                    <td className="td" style={{ color:'var(--text-primary)' }}>{m.description}</td>
                    <td className="td text-money" style={{ color: m.type==='entrada' ? '#22c55e' : '#ef4444' }}>
                      {m.type==='saida' ? '-' : '+'}{fmt.currency(m.amount)}
                    </td>
                    <td className="td">
                      <button onClick={() => removeManual(m.id)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:18 }}
                        onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal lançamento */}
      <Modal open={showManual} onClose={() => setShowManual(false)} title="Novo Lançamento Manual">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={manual.type} onChange={e => setManual(f=>({...f,type:e.target.value}))}>
              <option value="entrada">Entrada (receita)</option>
              <option value="saida">Saida (despesa)</option>
            </select>
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input type="number" step="0.01" className="input" value={manual.amount} onChange={e => setManual(f=>({...f,amount:e.target.value}))} placeholder="0,00" />
          </div>
          <div>
            <label className="label">Descricao</label>
            <input className="input" value={manual.description} onChange={e => setManual(f=>({...f,description:e.target.value}))} placeholder="Ex: Aluguel, despesa pessoal..." />
          </div>
          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={manual.date} onChange={e => setManual(f=>({...f,date:e.target.value}))} />
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button onClick={() => setShowManual(false)} className="btn-ghost">Cancelar</button>
            <button onClick={addManual} className="btn-primary">Registrar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
