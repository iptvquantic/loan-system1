import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Eye, EyeOff, Loader2, Lock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const { login, loading }      = useAuthStore()
  const navigate                = useNavigate()

  const handle = async (e) => {
    e.preventDefault()
    const res = await login(email, password)
    if (res.ok) {
      toast.success('Bem-vindo!')
      navigate('/dashboard')
    } else {
      toast.error(res.error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center shadow-glow mb-4">
              <TrendingUp size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">LoanSystem</h1>
            <p className="text-slate-500 text-sm mt-1">Gestão de Empréstimos Pessoais</p>
          </div>

          {/* Form */}
          <form onSubmit={handle} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="admin@loan.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-base mt-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-xs text-slate-500 text-center">
              <span className="font-medium text-slate-400">Demo:</span>{' '}
              admin@loan.com / admin123
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Sistema privado. Acesso restrito ao administrador.
        </p>
      </div>
    </div>
  )
}
