import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, CreditCard, Calculator, Wallet, BarChart3, Trophy, Settings, LogOut, Menu, X, ChevronRight, Sun, Moon, Zap } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const NAV = [
  { to:'/dashboard',  icon:LayoutDashboard, label:'Dashboard'    },
  { to:'/clients',    icon:Users,           label:'Clientes'     },
  { to:'/loans',      icon:FileText,        label:'Emprestimos'  },
  { to:'/payments',   icon:CreditCard,      label:'Pagamentos'   },
  { to:'/cash',       icon:Wallet,          label:'Caixa'        },
  { to:'/simulator',  icon:Calculator,      label:'Simulador'    },
  { to:'/reports',    icon:BarChart3,       label:'Relatorios'   },
  { to:'/ranking',    icon:Trophy,          label:'Ranking'      },
  { to:'/settings',   icon:Settings,        label:'Configuracoes'},
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink to={to} onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
         ${isActive ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-slate-800/60'}`
      }
      style={({ isActive }) => ({ color: isActive ? '#60a5fa' : 'var(--text-secondary)' })}
    >
      <Icon size={17} />
      <span>{label}</span>
      <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
    </NavLink>
  )
}

export default function Layout() {
  const [sideOpen, setSideOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const { admin, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const handleLogout = () => { logout(); toast.success('Sessao encerrada'); navigate('/login') }

  const planStatus = admin?.planStatus
  const isTrialExpiring = planStatus?.plan === 'trial' && planStatus?.daysLeft <= 5
  const isExpired = planStatus?.reason === 'trial_expired' || planStatus?.reason === 'plan_expired'

  const SidebarContent = ({ mobile }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding:'16px 12px' }}>
      {/* Logo clicavel */}
      <Link to="/dashboard" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, padding:'8px 4px 20px', borderBottom:'1px solid var(--border)', marginBottom:12 }}>
        <div style={{ width:36, height:36, background:'var(--bg-primary)', border:'2px solid #3b82f6', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 12px rgba(59,130,246,0.3)' }}>
          <span style={{ fontFamily:'Arial Black,Arial', fontWeight:900, fontSize:'1.1rem', color:'#3b82f6', lineHeight:1 }}>C</span>
        </div>
        <div>
          <p style={{ fontWeight:800, color:'var(--text-primary)', fontSize:15, lineHeight:1, letterSpacing:'0.04em' }}>CREDIX</p>
          <p style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>Gestao de Emprestimos</p>
        </div>
        {mobile && (
          <button onClick={e => { e.preventDefault(); setSideOpen(false) }} style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
            <X size={20} />
          </button>
        )}
      </Link>

      {/* Alerta trial */}
      {(isTrialExpiring || isExpired) && (
        <Link to="/plans" style={{ textDecoration:'none', display:'block', background: isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', border:`1px solid ${isExpired ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius:8, padding:'8px 10px', marginBottom:10, fontSize:11, fontWeight:700, color: isExpired ? '#ef4444' : '#f59e0b', lineHeight:1.4 }}>
          {isExpired ? '⚠️ Trial expirado! Assine agora' : `⏱️ Trial: ${planStatus.daysLeft} dias restantes`}
        </Link>
      )}

      {/* Nav */}
      <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {NAV.map(n => <NavItem key={n.to} {...n} onClick={mobile ? () => setSideOpen(false) : undefined} />)}
        {/* Link planos */}
        <NavLink to="/plans" onClick={mobile ? () => setSideOpen(false) : undefined}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, fontSize:13, fontWeight:600, color:'#a78bfa', textDecoration:'none', marginTop:8, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)' }}>
          <Zap size={15} /> Ver Planos
        </NavLink>
      </nav>

      {/* Footer */}
      <div style={{ borderTop:'1px solid var(--border)', paddingTop:12, marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
        <button onClick={toggleTheme} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-hover)', cursor:'pointer', color:'var(--text-secondary)', fontSize:13, fontWeight:500, width:'100%', transition:'all 0.15s' }}>
          {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#818cf8" />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 4px' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin?.name || 'Admin'}</p>
            <p style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin?.email}</p>
          </div>
          <button onClick={handleLogout} title="Sair" style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4, borderRadius:6, transition:'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--bg-primary)', overflow:'hidden' }}>
      <aside className="hidden lg:block" style={{ width:240, flexShrink:0, background:'var(--bg-secondary)', borderRight:'1px solid var(--border)' }}>
        <SidebarContent />
      </aside>

      {sideOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:40, display:'flex' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(2px)' }} onClick={() => setSideOpen(false)} />
          <aside style={{ position:'relative', zIndex:1, width:260, background:'var(--bg-secondary)', borderRight:'1px solid var(--border)' }}>
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <header className="flex lg:hidden" style={{ alignItems:'center', gap:12, padding:'12px 16px', background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)' }}>
          <button onClick={() => setSideOpen(true)} style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer' }}>
            <Menu size={22} />
          </button>
          <Link to="/dashboard" style={{ textDecoration:'none', fontWeight:800, fontSize:16, color:'var(--text-primary)', letterSpacing:'0.04em' }}>CREDIX</Link>
          <button onClick={toggleTheme} style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        <main style={{ flex:1, overflowY:'auto', padding:'24px' }} className="animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
