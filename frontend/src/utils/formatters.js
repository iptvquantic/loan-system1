export const fmt = {
  currency: (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0),

  date: (d) => {
    if (!d) return '—'
    const [y, m, day] = String(d).split('T')[0].split('-')
    return `${day}/${m}/${y}`
  },

  cpf: (v) => {
    if (!v) return '—'
    const n = v.replace(/\D/g, '')
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  },

  phone: (v) => {
    if (!v) return '—'
    const n = v.replace(/\D/g, '')
    if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    if (n.length === 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    return v
  },

  percent: (v) => `${(v * 100).toFixed(1)}%`,

  days: (d) => `${d} dia${d !== 1 ? 's' : ''}`,

  statusLabel: (s) => ({
    ATIVO: 'Ativo', ATRASADO: 'Atrasado', CRITICO: 'Crítico', QUITADO: 'Quitado'
  })[s] ?? s,

  riskLabel: (r) => ({ BAIXO: 'Baixo Risco', MEDIO: 'Médio Risco', ALTO: 'Alto Risco' })[r] ?? r,
}

export function statusClass(s) {
  return { ATIVO:'badge-ativo', ATRASADO:'badge-atrasado', CRITICO:'badge-critico', QUITADO:'badge-quitado' }[s] ?? 'badge'
}

export function riskClass(r) {
  return { BAIXO:'badge-baixo', MEDIO:'badge-medio', ALTO:'badge-alto' }[r] ?? 'badge'
}

export function maskCPF(v) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
}

export function maskPhone(v) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{2})(\d)/,'($1) $2')
    .replace(/(\d{5})(\d)/,'$1-$2')
}
