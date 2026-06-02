import { useEffect, useState } from 'react'
import { Check, Star, Zap, Crown, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { fmt } from '../utils/formatters'

const PLANS_STATIC = [
  {
    id: 'monthly', name: 'Mensal', price: 14.90, period: 'mes', days: 30,
    savings: null, highlight: false, link: 'https://pag.ae/81RuUMgB6',
    features: ['Contratos ilimitados','Clientes ilimitados','Dashboard completo','Suporte por WhatsApp']
  },
  {
    id: 'quarterly', name: 'Trimestral', price: 39.90, period: '3 meses', days: 90,
    savings: '11% de economia', highlight: true, link: 'https://pag.ae/81RuVe3jn',
    features: ['Tudo do Mensal','Relatorios avancados','Exportacao de dados','Prioridade no suporte']
  },
  {
    id: 'annual', name: 'Anual', price: 149.90, period: 'ano', days: 365,
    savings: '37% de economia', highlight: false, link: 'https://pag.ae/81RuVvkg6',
    features: ['Tudo do Trimestral','Backup automatico','API de integracao','Suporte dedicado']
  }
]

const ICONS = { monthly: Zap, quarterly: Star, annual: Crown }
const COLORS = {
  monthly:   { accent:'#38bdf8', bg:'rgba(56,189,248,0.08)',  border:'rgba(56,189,248,0.2)'  },
  quarterly: { accent:'#a78bfa', bg:'rgba(167,139,250,0.08)', border:'rgba(167,139,250,0.3)' },
  annual:    { accent:'#fbbf24', bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.2)'  },
}

export default function PlansPage() {
  const { admin } = useAuthStore()
  const planStatus = admin?.planStatus

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-primary)', padding:'40px 16px' }}>
      <div style={{ maxWidth:980, margin:'0 auto' }}>
        <Link to="/dashboard" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--text-muted)', fontSize:13, textDecoration:'none', marginBottom:32 }}>
          <ArrowLeft size={16} /> Voltar ao sistema
        </Link>

        <div style={{ textAlign:'center', marginBottom:48 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:999, padding:'6px 16px', marginBottom:16 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#60a5fa', textTransform:'uppercase', letterSpacing:'0.06em' }}>Planos CREDIX</span>
          </div>
          <h1 style={{ fontSize:36, fontWeight:800, color:'var(--text-primary)', lineHeight:1.2, marginBottom:12 }}>
            Escolha seu plano
          </h1>
          <p style={{ fontSize:16, color:'var(--text-muted)', maxWidth:500, margin:'0 auto' }}>
            Gerencie seus emprestimos com seguranca e profissionalismo. Sem taxa de adesao.
          </p>

          {planStatus?.plan === 'trial' && planStatus?.active && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:10, padding:'10px 20px', marginTop:20 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e' }} />
              <span style={{ fontSize:14, color:'#22c55e', fontWeight:600 }}>
                Trial ativo - {planStatus.daysLeft} dias restantes
              </span>
            </div>
          )}
          {planStatus?.reason === 'trial_expired' && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'10px 20px', marginTop:20 }}>
              <span style={{ fontSize:14, color:'#ef4444', fontWeight:600 }}>Seu trial expirou! Assine um plano para continuar.</span>
            </div>
          )}
        </div>

        {/* Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24, marginBottom:48 }}>
          {PLANS_STATIC.map(plan => {
            const Icon = ICONS[plan.id] || Star
            const c = COLORS[plan.id] || COLORS.monthly
            return (
              <div key={plan.id} style={{
                background: plan.highlight ? 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(59,130,246,0.1))' : 'var(--bg-card)',
                border: plan.highlight ? '2px solid rgba(167,139,250,0.5)' : '1px solid var(--border)',
                borderRadius:16, padding:28, position:'relative',
                transform: plan.highlight ? 'scale(1.03)' : 'scale(1)',
                boxShadow: plan.highlight ? '0 8px 40px rgba(139,92,246,0.2)' : 'none',
              }}>
                {plan.highlight && (
                  <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#7c3aed,#3b82f6)', color:'#fff', fontSize:11, fontWeight:700, padding:'5px 16px', borderRadius:999, whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    Mais Popular
                  </div>
                )}

                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                  <div style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:10, padding:10 }}>
                    <Icon size={22} color={c.accent} />
                  </div>
                  <div>
                    <p style={{ fontWeight:700, fontSize:17, color:'var(--text-primary)' }}>{plan.name}</p>
                    {plan.savings && <p style={{ fontSize:11, color:'#22c55e', fontWeight:600 }}>{plan.savings}</p>}
                  </div>
                </div>

                <div style={{ marginBottom:24 }}>
                  <span style={{ fontSize:38, fontWeight:800, color:'var(--text-primary)' }}>
                    {fmt.currency(plan.price)}
                  </span>
                  <span style={{ fontSize:13, color:'var(--text-muted)', marginLeft:4 }}>/{plan.period}</span>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(34,197,94,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Check size={11} color="#22c55e" />
                      </div>
                      <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <a href={plan.link} target="_blank" rel="noopener noreferrer" style={{
                  display:'block', textAlign:'center', textDecoration:'none',
                  background: plan.highlight ? 'linear-gradient(135deg,#7c3aed,#3b82f6)' : c.bg,
                  border: plan.highlight ? 'none' : `1px solid ${c.border}`,
                  color: plan.highlight ? '#fff' : c.accent,
                  borderRadius:10, padding:'13px 0', fontWeight:700, fontSize:14, cursor:'pointer'
                }}>
                  Pagar com Pix
                </a>
                <p style={{ textAlign:'center', fontSize:11, color:'var(--text-muted)', marginTop:8 }}>
                  Pagamento seguro via PagSeguro
                </p>
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:28 }}>
          <h3 style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:20, textAlign:'center' }}>Perguntas frequentes</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:20 }}>
            {[
              ['Posso cancelar quando quiser?','Sim! Nao ha fidelidade. Cancele quando quiser sem multas.'],
              ['O trial e realmente gratis?','Sim, 15 dias completos sem precisar de cartao de credito.'],
              ['Como funciona o pagamento?','Via Pix pelo PagSeguro. Apos o pagamento, ative seu plano.'],
              ['Meus dados ficam seguros?','Sim! Utilizamos banco de dados criptografado e conexao HTTPS.'],
            ].map(([q, a]) => (
              <div key={q}>
                <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>{q}</p>
                <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)', marginTop:24 }}>
          CREDIX 2026 - Sistema profissional de gestao de emprestimos
        </p>
      </div>
    </div>
  )
}
