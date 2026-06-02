export default function Modal({ open, onClose, title, children, maxWidth = '480px' }) {
  if (!open) return null
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24, width:'100%', maxWidth, animation:'fadeIn 0.2s ease-out' }}>
        {title && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)' }}>{title}</h2>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:22, lineHeight:1, padding:'0 4px' }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
