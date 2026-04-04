import { Loader2, SearchX, AlertTriangle } from 'lucide-react'

export function Loading({ text = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
      <Loader2 size={32} className="animate-spin text-sky-500" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon = SearchX, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
        <Icon size={28} className="text-slate-600" />
      </div>
      <div className="text-center">
        <p className="text-base font-medium text-slate-400">{title}</p>
        {description && <p className="text-sm text-slate-600 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirmar', danger = false }) {
  if (!open) return null
  return (
    <div className="modal-overlay">
      <div className="modal max-w-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
              <AlertTriangle size={20} className={danger ? 'text-red-400' : 'text-amber-400'} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-sm text-slate-400 mt-0.5">{message}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn-ghost">Cancelar</button>
            <button onClick={() => { onConfirm(); onClose() }}
              className={danger ? 'btn bg-red-500 hover:bg-red-400 text-white' : 'btn-primary'}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, color = 'sky', sub }) {
  const colors = {
    sky:     'text-sky-400 bg-sky-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber:   'text-amber-400 bg-amber-500/10',
    red:     'text-red-400 bg-red-500/10',
    violet:  'text-violet-400 bg-violet-500/10',
  }
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon size={18} className={colors[color].split(' ')[0]} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mt-2 text-money">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}
