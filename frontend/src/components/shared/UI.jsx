import { Loader2 } from 'lucide-react'

export function Loading({ text = 'Carregando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="loading-spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{text}</p>
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, color = 'sky', sub }) {
  const colors = {
    sky:     { icon: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.2)'  },
    violet:  { icon: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
    emerald: { icon: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)'  },
    amber:   { icon: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)'  },
    red:     { icon: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)' },
    slate:   { icon: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
  }
  const c = colors[color] || colors.sky
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '6px' }}>
          <Icon size={16} style={{ color: c.icon }} />
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, maxWidth = '480px' }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box animate-fade-in" style={{ maxWidth }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Empty({ text = 'Nenhum registro encontrado' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 13 }}>
      {text}
    </div>
  )
}

export function Badge({ status }) {
  const map = {
    'ATIVO':    'badge badge-ativo',
    'ATRASADO': 'badge badge-atrasado',
    'CRÍTICO':  'badge badge-critico',
    'QUITADO':  'badge badge-quitado',
  }
  return <span className={map[status] || 'badge badge-quitado'}>{status}</span>
}

export function EmptyState({ text = 'Nenhum registro encontrado', icon }) {
  return (
    <div style={{ textAlign:'center', padding:'48px 0', color:'var(--text-muted)', fontSize:13 }}>
      {text}
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Confirmar', danger }) {
  if (!open) return null
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:400 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{title}</h2>
        <p style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:24 }}>{message}</p>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
