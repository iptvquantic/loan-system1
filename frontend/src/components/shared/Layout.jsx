import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, CreditCard, Bell,
  Calculator, Wallet, BarChart3, Trophy, Settings,
  LogOut, Menu, X, ChevronRight, TrendingUp
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/clients',    icon: Users,            label: 'Clientes'   },
  { to: '/loans',      icon: FileText,         label: 'Empréstimos'},
  { to: '/payments',   icon: CreditCard,       label: 'Pagamentos' },
  { to: '/cash',       icon: Wallet,           label: 'Caixa'      },
  { to: '/simulator',  icon: Calculator,       label: 'Simulador'  },
  { to: '/reports',    icon: BarChart3,        label: 'Relatórios' },
  { to: '/ranking',    icon: Trophy,           label: 'Ranking'    },
  { to: '/settings',   icon: Settings,         label: 'Configurações'},
]

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
         ${isActive
           ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
           : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
      <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
    </NavLink>
  )
}

export default function Layout() {
  const [sideOpen, setSideOpen] = useState(false)
  const { admin, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Sessão encerrada')
    navigate('/login')
  }

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center shadow-glow flex-shrink-0">
          <TrendingUp size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-none">LoanSystem</p>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de Empréstimos</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map(item => (
          <NavItem key={item.to} {...item} onClick={() => mobile && setSideOpen(false)} />
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800 mb-2">
          <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xs font-bold flex-shrink-0">
            {admin?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{admin?.name ?? 'Admin'}</p>
            <p className="text-xs text-slate-500 truncate">{admin?.email ?? ''}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sideOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSideOpen(false)} />
          <aside className="relative z-10 w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="absolute top-4 right-4">
              <button onClick={() => setSideOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <button onClick={() => setSideOpen(true)} className="text-slate-400 hover:text-white p-1">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">LoanSystem</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
