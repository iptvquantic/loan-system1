import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, CreditCard, Calculator, Wallet, BarChart3, Trophy, Settings, LogOut, Menu, ChevronRight, Sun, Moon, Zap, X, ChevronLeft } from 'lucide-react'
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

function NavItem({ to, icon: Icon, label, collapsed, onClick }) {
  return (
    <NavLink to={to} onClick={onClick} title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg transition-all duration-150 group
         ${isActive ? 'bg-blue-500/20 border border-blue-500/30' : 'hover:bg-slate-800/60'}`
      }
      style={({ isActive }) => ({
        color: isActive ? '#60a5fa' : 'var(--text-secondary)',
        padding: collapsed ? '10px' : '9px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
      })}
    >
      <Icon size={18} style={{ flexShrink:0 }} />
      {!collapsed && <span style={{ fontSize:13, fontWeight:500 }}>{label}</span>}
      {!collapsed && <ChevronRight size={13} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />}
    </NavLink>
  )
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const { admin, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(collapsed))
  }, [collapsed])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const handleLogout = () => { logout(); toast.success('Sessao encerrada'); navigate('/login') }

  const sideW = collapsed ? 64 : 240

  const SidebarContent = ({ mobile }) => (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', padding: collapsed && !mobile ? '12px 8px' : '16px 12px', overflow:'hidden' }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap: collapsed && !mobile ? 0 : 10, padding:`8px ${collapsed && !mobile ? 4 : 4}px 16px`, borderBottom:'1px solid var(--border)', marginBottom:8, justifyContent: collapsed && !mobile ? 'center' : 'flex-start' }}>
        <Link to="/dashboard" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:10, flex:1 }}>
          <div style={{ width:34, height:34, background:'var(--bg-primary)', border:'2px solid #3b82f6', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 10px rgba(59,130,246,0.25)' }}>
            <span style={{ fontFamily:'Arial Black,Arial', fontWeight:900, fontSize:'1rem', color:'#3b82f6', lineHeight:1 }}>C</span>
          </div>
          {(!collapsed || mobile) && (
            <div>
              <p style={{ fontWeight:800, color:'var(--text-primary)', fontSize:14, lineHeight:1, letterSpacing:'0.04em' }}>CREDIX</p>
              <p style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>Gestao de Emprestimos</p>
            </div>
          )}
        </Link>
        {mobile ? (
          <button onClick={() => setMobileOpen(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', marginLeft:'auto' }}><X size={18}/></button>
        ) : (
          <button onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expandir' : 'Recolher'}
            style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', marginLeft:'auto', padding:4, borderRadius:6, display:'flex' }}>
            <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, display:'flex', flexDirection:'column', gap:2, overflowY:'auto', overflowX:'hidden' }}>
        {NAV.map(n => <NavItem key={n.to} {...n} collapsed={collapsed && !mobile} onClick={mobile ? () => setMobileOpen(false) : undefined} />)}
        {(!collapsed || mobile) && (
          <NavLink to="/plans" onClick={mobile ? () => setMobileOpen(false) : undefined}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:8, fontSize:12, fontWeight:600, color:'#a78bfa', textDecoration:'none', marginTop:6, background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)' }}>
            <Zap size={14}/> Ver Planos
          </NavLink>
        )}
        {(collapsed && !mobile) && (
          <NavLink to="/plans" title="Ver Planos"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:10, borderRadius:8, color:'#a78bfa', textDecoration:'none', marginTop:6, background:'rgba(167,139,250,0.08)' }}>
            <Zap size={16}/>
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
        <button onClick={toggleTheme} title={theme==='dark'?'Modo Claro':'Modo Escuro'}
          style={{ display:'flex', alignItems:'center', gap:8, padding: collapsed && !mobile ? '8px' : '8px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-hover)', cursor:'pointer', color:'var(--text-secondary)', fontSize:12, fontWeight:500, width:'100%', transition:'all 0.15s', justifyContent: collapsed && !mobile ? 'center' : 'flex-start' }}>
          {theme==='dark' ? <Sun size={15} color="#fbbf24"/> : <Moon size={15} color="#818cf8"/>}
          {(!collapsed || mobile) && (theme==='dark' ? 'Modo Claro' : 'Modo Escuro')}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding: collapsed && !mobile ? '6px 4px' : '6px 4px' }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#3b82f6,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {admin?.name?.[0]?.toUpperCase()||'A'}
          </div>
          {(!collapsed || mobile) && (
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin?.name||'Admin'}</p>
              <p style={{ fontSize:10, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{admin?.email}</p>
            </div>
          )}
          <button onClick={handleLogout} title="Sair"
            style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:4, borderRadius:6, flexShrink:0 }}
            onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
            <LogOut size={15}/>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', height:'100vh', background:'var(--bg-primary)', overflow:'hidden' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block" style={{ width:sideW, flexShrink:0, background:'var(--bg-secondary)', borderRight:'1px solid var(--border)', transition:'width 0.2s ease', overflow:'hidden' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:40, display:'flex' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(2px)' }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position:'relative', zIndex:1, width:260, background:'var(--bg-secondary)', borderRight:'1px solid var(--border)' }}>
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Mobile header */}
        <header className="flex lg:hidden" style={{ alignItems:'center', gap:12, padding:'10px 16px', background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background:'none', border:'none', color:'var(--text-secondary)', cursor:'pointer' }}>
            <Menu size={22}/>
          </button>
          <Link to="/dashboard" style={{ textDecoration:'none', fontWeight:800, fontSize:16, color:'var(--text-primary)', letterSpacing:'0.04em' }}>CREDIX</Link>
          <button onClick={toggleTheme} style={{ marginLeft:'auto', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
            {theme==='dark' ? <Sun size={18}/> : <Moon size={18}/>}
          </button>
        </header>
        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'20px' }} className="animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
