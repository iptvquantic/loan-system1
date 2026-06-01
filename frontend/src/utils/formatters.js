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

export function statusClass(status) {
  const map = {
    'ATIVO':    'badge badge-ativo',
    'ATRASADO': 'badge badge-atrasado',
    'CRÍTICO':  'badge badge-critico',
    'QUITADO':  'badge badge-quitado',
  }
  return map[status] || 'badge badge-quitado'
}
