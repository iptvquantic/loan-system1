import axios from 'axios'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://loan-system-api-af5k.onrender.com/api'

const api = axios.create({ baseURL: BASE, timeout: 30000 })

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    const msg = err.response?.data?.error || 'Erro de comunicação'
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('admin')
      window.location.href = '/login'
    } else if (status !== 404) {
      toast.error(msg)
    }
    return Promise.reject(err)
  }
)

export default api
