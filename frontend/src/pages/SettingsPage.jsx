import { useState } from 'react'
import { Settings, Save, Info, Edit3, Check, X, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

const DEFAULT_RULES = [
  { key:'dailyRate',    label:'Taxa de Juros',             value:'1% ao dia sobre o capital',          editable:true  },
  { key:'cycleDays',   label:'Ciclo de Renovacao',         value:'30 dias',                            editable:true  },
  { key:'minPayment',  label:'Pagamento minimo',           value:'30% do capital a cada 30 dias',      editable:true  },
  { key:'finePerDay',  label:'Multa por atraso',           value:'R$50/dia apos 30 dias sem pagamento',editable:true  },
  { key:'maxFine',     label:'Limite de multa',            value:'7 dias (maximo R$350)',              editable:true  },
  { key:'criticalDays',label:'Status CRITICO',             value:'Apos 37 dias sem pagamento',         editable:true  },
  { key:'calcMode',    label:'Calculo de juros',           value:'Dinamico — nao salvo no banco',      editable:false },
]

function EditableRule({ rule, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(rule.value)

  const save = () => { onSave(rule.key, val); setEditing(false); toast.success('Regra atualizada!') }
  const cancel = () => { setVal(rule.value); setEditing(false) }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border)', gap:12 }}>
      <span style={{ fontSize:14, color:'var(--text-primary)', fontWeight:500, flex:'0 0 auto', minWidth:180 }}>{rule.label}</span>
      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, justifyContent:'flex-end', flexWrap:'wrap' }}>
        {editing ? (
          <>
            <input value={val} onChange={e => setVal(e.target.value)} className="input"
              style={{ width:260, fontSize:13, padding:'7px 11px' }} autoFocus onKeyDown={e => e.key==='Enter' && save()} />
            <button onClick={save} style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.4)', borderRadius:7, padding:'6px 10px', cursor:'pointer', color:'#22c55e', fontSize:12, fontWeight:600 }}>
              <Check size={13} /> Salvar
            </button>
            <button onClick={cancel} style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:7, padding:'6px 10px', cursor:'pointer', color:'#ef4444', fontSize:12, fontWeight:600 }}>
              <X size={13} /> Cancelar
            </button>
          </>
        ) : (
          <>
            <span style={{ fontSize:13, fontWeight:600, color:'#f1f5f9' }}>{val}</span>
            {rule.editable ? (
              <button onClick={() => setEditing(true)} className="edit-btn">
                <Edit3 size={13} /> <span>Editar</span>
              </button>
            ) : (
              <span style={{ fontSize:11, color:'var(--text-muted)', background:'var(--bg-hover)', borderRadius:6, padding:'3px 8px' }}>Fixo</span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [rules, setRules] = useState(DEFAULT_RULES)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [saving, setSaving] = useState(false)

  const handleRuleSave = (key, newVal) => setRules(prev => prev.map(r => r.key === key ? { ...r, value: newVal } : r))

  const handlePwSave = async () => {
    if (pw !== pw2) return toast.error('Senhas nao coincidem')
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
        <h1 className="page-title">Configuracoes</h1>
        <p className="page-sub">Gerencie sua conta e as regras do sistema</p>
      </div>

      {/* Regras */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div style={{ background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, padding:'6px 8px' }}>
            <Info size={16} color="#60a5fa" />
          </div>
          <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Regras do Sistema</h2>
        </div>
        <p style={{ fontSize:13, color:'#94a3b8', marginBottom:4 }}>
          Configure as regras de negocio. Clique em <strong style={{ color:'#60a5fa' }}>Editar</strong> para alterar qualquer valor.
        </p>
        <div style={{ background:'rgba(59,130,246,0.06)', border:'1px dashed rgba(59,130,246,0.25)', borderRadius:8, padding:'8px 12px', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
          <Edit3 size={13} color="#60a5fa" />
          <span style={{ fontSize:12, color:'#60a5fa', fontWeight:600 }}>Dica: Clique no botao "Editar" ao lado de cada regra para personalizar</span>
        </div>
        <div>
          {rules.map(rule => <EditableRule key={rule.key} rule={rule} onSave={handleRuleSave} />)}
        </div>
      </div>

      {/* Senha */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:8, padding:'6px 8px' }}>
            <Lock size={16} color="#a78bfa" />
          </div>
          <h2 style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>Alterar Senha</h2>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:400 }}>
          <div>
            <label className="label">Nova Senha</label>
            <input type="password" className="input" value={pw} onChange={e => setPw(e.target.value)} placeholder="Minimo 6 caracteres" />
          </div>
          <div>
            <label className="label">Confirmar Senha</label>
            <input type="password" className="input" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repita a senha" />
          </div>
          <button onClick={handlePwSave} disabled={saving || !pw} className="btn-primary" style={{ alignSelf:'flex-start' }}>
            <Save size={15} /> {saving ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </div>
      </div>
    </div>
  )
}
