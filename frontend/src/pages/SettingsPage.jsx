import { useState } from 'react'
import { Settings, Save, Info, Edit3, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const DEFAULT_RULES = [
  { key: 'dailyRate',     label: 'Taxa de Juros',            value: '1% ao dia sobre o capital',         editable: true,  field: 'daily_rate',     type: 'text' },
  { key: 'cycleDays',    label: 'Ciclo de Renovação',        value: '30 dias',                           editable: true,  field: 'cycle_days',     type: 'text' },
  { key: 'minPayment',   label: 'Pagamento mínimo',          value: '30% do capital a cada 30 dias',     editable: true,  field: 'min_payment',    type: 'text' },
  { key: 'finePerDay',   label: 'Multa por atraso',          value: 'R$50/dia após 30 dias sem pagamento',editable: true, field: 'fine_per_day',   type: 'text' },
  { key: 'maxFine',      label: 'Limite de multa',           value: '7 dias (máximo R$350)',              editable: true, field: 'max_fine',       type: 'text' },
  { key: 'criticalDays', label: 'Status CRÍTICO',            value: 'Após 37 dias sem pagamento',        editable: true,  field: 'critical_days',  type: 'text' },
  { key: 'calcMode',     label: 'Cálculo de juros',          value: 'Dinâmico — não salvo no banco',     editable: false  },
]

function EditableRule({ rule, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(rule.value)

  const save = () => {
    onSave(rule.key, val)
    setEditing(false)
    toast.success('Regra atualizada!')
  }
  const cancel = () => { setVal(rule.value); setEditing(false) }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontSize:14, color:'var(--text-secondary)', flex:1 }}>{rule.label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, justifyContent:'flex-end' }}>
        {editing ? (
          <>
            <input
              value={val}
              onChange={e => setVal(e.target.value)}
              className="input"
              style={{ width:260, fontSize:13, padding:'6px 10px' }}
              autoFocus
            />
            <button onClick={save} style={{ background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:6, padding:'5px 8px', cursor:'pointer', color:'#22c55e' }}>
              <Check size={14} />
            </button>
            <button onClick={cancel} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:6, padding:'5px 8px', cursor:'pointer', color:'#ef4444' }}>
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', textAlign:'right' }}>{val}</span>
            {rule.editable && (
              <button onClick={() => setEditing(true)} title="Editar" style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:6, padding:'5px 8px', cursor:'pointer', color:'#60a5fa', transition:'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(59,130,246,0.1)'}
              >
                <Edit3 size={13} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [rules, setRules] = useState(DEFAULT_RULES)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [saving, setSaving] = useState(false)

  const handleRuleSave = (key, newVal) => {
    setRules(prev => prev.map(r => r.key === key ? { ...r, value: newVal } : r))
  }

  const handlePwSave = async () => {
    if (pw !== pw2) return toast.error('Senhas não coincidem')
    if (pw.length < 6) return toast.error('Senha deve ter pelo menos 6 caracteres')
    setSaving(true)
    try {
      await api.put('/auth/password', { password: pw })
      toast.success('Senha alterada com sucesso!')
      setPw(''); setPw2('')
    } catch { toast.error('Erro ao alterar senha') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="page-sub">Gerencie sua conta e as regras do sistema</p>
      </div>

      {/* Regras do Sistema */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <div style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, padding:'6px 8px' }}>
            <Info size={16} color="#60a5fa" />
          </div>
          <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Regras do Sistema</h2>
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:999, padding:'3px 10px' }}>
            <Edit3 size={11} color="#60a5fa" />
            Clique no <Edit3 size={11} color="#60a5fa" style={{ display:'inline' }} /> para editar
          </span>
        </div>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
          Configure as regras de negócio do seu sistema de empréstimos
        </p>
        <div>
          {rules.map(rule => (
            <EditableRule key={rule.key} rule={rule} onSave={handleRuleSave} />
          ))}
        </div>
      </div>

      {/* Alterar Senha */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:8, padding:'6px 8px' }}>
            <Settings size={16} color="#a78bfa" />
          </div>
          <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Alterar Senha</h2>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:400 }}>
          <div>
            <label className="label">Nova Senha</label>
            <input type="password" className="input" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="label">Confirmar Senha</label>
            <input type="password" className="input" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="••••••••" />
          </div>
          <button onClick={handlePwSave} disabled={saving || !pw} className="btn-primary" style={{ alignSelf:'flex-start' }}>
            <Save size={15} />
            {saving ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </div>
      </div>
    </div>
  )
}
