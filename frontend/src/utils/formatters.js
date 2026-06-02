export const fmt = {
  currency: (v) => {
    const n = parseFloat(v) || 0
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  date: (d) => {
    if (!d) return '—'
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')
  },
  dateTime: (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('pt-BR')
  },
  percent: (v) => `${parseFloat(v || 0).toFixed(1)}%`,
}

export function maskCPF(v) {
  if (!v) return '—'
  const d = v.replace(/\D/g, '')
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`
}

export function maskPhone(v) {
  if (!v) return '—'
  const d = v.replace(/\D/g, '')
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`
}

export function statusClass(status) {
  const map = {
    'ATIVO':    'badge badge-ativo',
    'ATRASADO': 'badge badge-atrasado',
    'CRÍTICO':  'badge badge-critico',
    'QUITADO':  'badge badge-quitado',
  }
  return map[status] || 'badge badge-quitado'
}

export function riskClass(risk) {
  const map = {
    'Baixo Risco':  { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', border: 'rgba(34,197,94,0.25)'  },
    'Médio Risco':  { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
    'Alto Risco':   { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.25)'  },
  }
  return map[risk] || map['Baixo Risco']
}
