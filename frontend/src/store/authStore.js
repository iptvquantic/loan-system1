import { create } from 'zustand'
import api from '../utils/api'

function loadStored() {
  try {
    const token = localStorage.getItem('token')
    const admin = localStorage.getItem('admin')
    return { token, admin: admin ? JSON.parse(admin) : null }
  } catch { return { token: null, admin: null } }
}

const stored = loadStored()

export const useAuthStore = create((set) => ({
  token: stored.token,
  admin: stored.admin,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('admin', JSON.stringify(data.user))
      set({ token: data.token, admin: data.user, loading: false })
      return { ok: true }
    } catch (e) {
      set({ loading: false })
      return { ok: false, error: e.response?.data?.error || 'Erro no login' }
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    set({ token: null, admin: null })
  },
}))
