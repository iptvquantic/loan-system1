import { create } from 'zustand'
import api from '../utils/api'

const stored = localStorage.getItem('admin')

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  admin: stored ? JSON.parse(stored) : null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('admin', JSON.stringify(data.admin))
      set({ token: data.token, admin: data.admin, loading: false })
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
