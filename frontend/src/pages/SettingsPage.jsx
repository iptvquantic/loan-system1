import { useState } from 'react'
import { Settings, Lock, Eye, EyeOff, Info } from 'lucide-react'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { admin } = useAuthStore()
  const [pw, setPw]   = useState({ current: '', new: '', confirm: '' })
  const [show, setShow] = useState({ current: false, new: false })
  const [saving, setSaving] = useState(false)

  const handlePw = async (e) => {
    e.preventDefault()
    if (pw.new !== pw.confirm) return toast.error('As senhas não coincidem')
    if (pw.new.length < 6)     return toast.error('Nova senha: mínimo 6 caracteres')
    setSaving(true)
    try {
      await api.put('/auth/password', { currentPassword: pw.current, newPassword: pw.new })
      toast.success('Senha alterada com sucesso!')
      setPw({ current: '', new: '', confirm: '' })
    } catch {} finally { setSaving(false) }
  }

  const Input = ({ label, field, placeholder }) => (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input type={show[field] ? 'text' : 'password'}
          className="input pr-10" placeholder={placeholder}
          value={pw[field] || pw[field === 'confirm' ? 'confirm' : field]}
          onChange={e => setPw(p => ({ ...p, [field === 'confirm' ? 'confirm' : field]: e.target.value }))}
          required />
        {field !== 'confirm' && (
          <button type="button" onClick={() => setShow(p => ({ ...p, [field]: !p[field] }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            {show[field] ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="page-sub">Gerenciar conta e preferências do sistema</p>
      </div>

      {/* Admin info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Settings size={18} className="text-sky-400"/>
          <h2 className="text-sm font-semibold text-white">Informações da Conta</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Nome</p>
            <p className="font-medium text-white">{admin?.name}</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Email</p>
            <p className="font-medium text-white">{admin?.email}</p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Lock size={18} className="text-sky-400"/>
          <h2 className="text-sm font-semibold text-white">Alterar Senha</h2>
        </div>
        <form onSubmit={handlePw} className="space-y-4">
          <Input label="Senha Atual"   field="current" placeholder="••••••••" />
          <Input label="Nova Senha"    field="new"     placeholder="Mínimo 6 caracteres" />
          <div>
            <label className="label">Confirmar Nova Senha</label>
            <input type="password" className="input" placeholder="Repita a nova senha"
              value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} required />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>

      {/* System info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Info size={18} className="text-sky-400"/>
          <h2 className="text-sm font-semibold text-white">Regras do Sistema</h2>
        </div>
        <div className="space-y-3 text-sm">
          {[
            ['Taxa de Juros',         '1% ao dia sobre o capital'],
            ['Ciclo de Renovação',    '30 dias'],
            ['Pagamento mínimo',      '30% do capital a cada 30 dias'],
            ['Multa por atraso',      'R$50/dia após 30 dias sem pagamento'],
            ['Limite de multa',       '7 dias (máximo R$350)'],
            ['Status CRÍTICO',        'Após 37 dias sem pagamento'],
            ['Cálculo de juros',      'Dinâmico — não salvo no banco'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-slate-800 last:border-0">
              <span className="text-slate-400">{k}</span>
              <span className="text-white font-medium text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sync */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <Settings size={18} className="text-sky-400"/>
          <h2 className="text-sm font-semibold text-white">Manutenção</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Sincronize os status de todos os contratos com base nos cálculos atuais.
          Execute se notar status desatualizados.
        </p>
        <button
          onClick={() =>
            api.post('/loans/sync-statuses')
              .then(({ data }) => toast.success(data.message))
              .catch(() => toast.error('Erro ao sincronizar'))
          }
          className="btn-ghost">
          Sincronizar Status dos Contratos
        </button>
      </div>
    </div>
  )
}
