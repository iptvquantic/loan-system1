/**
 * ============================================================
 * MOTOR DE CÁLCULO — LOAN SYSTEM
 * Regras:
 *  - 1% ao dia sobre o capital
 *  - A cada 30 dias: pagar 30% juros OU quitar capital+30%
 *  - Após 30 dias sem pagamento: multa R$50/dia (máx 7 dias)
 *  - Status: ATIVO | ATRASADO | CRITICO | QUITADO
 *  - Juros NÃO ficam salvos no banco — calculados dinamicamente
 * ============================================================
 */

const DAILY_RATE     = 0.01;   // 1% ao dia
const FINE_PER_DAY   = 50.00;  // R$50/dia de multa
const MAX_FINE_DAYS  = 7;      // máximo de dias de multa
const CYCLE_DAYS     = 30;     // ciclo de 30 dias
const CYCLE_RATE     = 0.30;   // 30% ao ciclo

/** Dias corridos desde uma data */
function daysSince(dateStr) {
  const start = new Date(dateStr);
  const now   = new Date();
  start.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  return Math.max(0, Math.floor((now - start) / 86_400_000));
}

/** Dias desde o último pagamento (ou desde o empréstimo) */
function daysSinceLastPayment(loanDate, payments = []) {
  if (!payments.length) return daysSince(loanDate);
  const last = payments.reduce((max, p) => {
    const d = new Date(p.payment_date);
    return d > max ? d : max;
  }, new Date(0));
  last.setHours(0,0,0,0);
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.max(0, Math.floor((now - last) / 86_400_000));
}

/** Total pago em todos os pagamentos */
function sumPayments(payments = []) {
  return payments.reduce((s, p) => s + parseFloat(p.amount), 0);
}

/**
 * calculateLoanStatus — função central
 * Retorna todos os valores calculados dinamicamente
 */
function calculateLoanStatus(loan, payments = []) {
  const principal    = parseFloat(loan.principal);
  const totalDays    = daysSince(loan.loan_date);
  const daysSincePay = daysSinceLastPayment(loan.loan_date, payments);
  const paid         = sumPayments(payments);

  // Juros simples: 1%/dia sobre o capital original
  const interest = principal * DAILY_RATE * totalDays;

  // Multa: após 30 dias sem pagamento, R$50/dia (máx 7 dias)
  let fine = 0, fineDays = 0;
  if (daysSincePay > CYCLE_DAYS) {
    fineDays = Math.min(daysSincePay - CYCLE_DAYS, MAX_FINE_DAYS);
    fine     = fineDays * FINE_PER_DAY;
  }

  const fullSettlement = principal + interest + fine;
  const currentDebt    = Math.max(fullSettlement - paid, 0);

  // Valor mínimo para renovar (pagar juros do ciclo)
  const cyclePayment = principal * CYCLE_RATE;

  // Status automático
  let status = 'ATIVO';
  if (paid >= fullSettlement - 0.01) {
    status = 'QUITADO';
  } else if (daysSincePay > CYCLE_DAYS + MAX_FINE_DAYS) {
    status = 'CRITICO';
  } else if (daysSincePay > CYCLE_DAYS) {
    status = 'ATRASADO';
  }

  // Próximo vencimento
  const loanDate      = new Date(loan.loan_date);
  const nextDueDate   = new Date(loanDate);
  nextDueDate.setDate(nextDueDate.getDate() + CYCLE_DAYS);

  const daysUntilDue = Math.floor(
    (nextDueDate - new Date()) / 86_400_000
  );

  return {
    principal:         r2(principal),
    totalDays,
    daysSinceLastPayment: daysSincePay,
    interest:          r2(interest),
    fine:              r2(fine),
    fineDays,
    totalPaid:         r2(paid),
    currentDebt:       r2(currentDebt),
    fullSettlement:    r2(fullSettlement),
    cyclePayment:      r2(cyclePayment),
    status,
    nextDueDate:       nextDueDate.toISOString().split('T')[0],
    daysUntilDue,
    isNearDue:         daysUntilDue >= 0 && daysUntilDue <= 5,
  };
}

/** Gera texto de cobrança para copiar/enviar manualmente */
function generateChargeText(loan, calc, clientName) {
  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (d) => {
    const [y,m,day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return `━━━━━━━━━━━━━━━━━━━━━━━━
💰 COBRANÇA — EMPRÉSTIMO
━━━━━━━━━━━━━━━━━━━━━━━━

👤 CLIENTE: ${clientName}
📅 Data do empréstimo: ${fmtDate(loan.loan_date)}
💵 Valor emprestado: ${fmt(calc.principal)}

⏱ Dias corridos: ${calc.totalDays} dias
📈 Juros acumulados: ${fmt(calc.interest)}
⚠️ Multa atraso: ${fmt(calc.fine)}

💳 TOTAL ATUALIZADO: ${fmt(calc.currentDebt)}
🔖 Status: ${calc.status}

━━━━━━━━━━━━━━━━━━━━━━━━
Para regularizar hoje:

✅ Opção 1 — Renovar prazo
   Pague os juros: ${fmt(calc.cyclePayment)}
   Prazo renova por mais 30 dias.

✅ Opção 2 — Quitar total
   Valor total: ${fmt(calc.fullSettlement)}

━━━━━━━━━━━━━━━━━━━━━━━━
Gerado em: ${new Date().toLocaleString('pt-BR')}`;
}

/** Calcula score de risco do cliente */
function calculateRiskScore(loans, payments) {
  if (!loans.length) return { score: 'BAIXO', points: 0 };

  let points = 0;
  const paymentsByLoan = {};
  payments.forEach(p => {
    if (!paymentsByLoan[p.loan_id]) paymentsByLoan[p.loan_id] = [];
    paymentsByLoan[p.loan_id].push(p);
  });

  loans.forEach(loan => {
    const lp   = paymentsByLoan[loan.id] || [];
    const calc = calculateLoanStatus(loan, lp);
    if (calc.status === 'CRITICO')  points += 10;
    if (calc.status === 'ATRASADO') points += 5;
    if (calc.fine > 0)              points += 3;
  });

  const total     = loans.length;
  const settled   = loans.filter(l => l.status === 'QUITADO').length;
  const settleRate = total > 0 ? settled / total : 0;
  if (settleRate > 0.7) points -= 5;

  let score = 'BAIXO';
  if (points >= 15) score = 'ALTO';
  else if (points >= 6) score = 'MEDIO';

  return { score, points };
}

/** Calcula stats do dashboard */
function calculateDashboardStats(loans, payments) {
  const byLoan = {};
  payments.forEach(p => {
    if (!byLoan[p.loan_id]) byLoan[p.loan_id] = [];
    byLoan[p.loan_id].push(p);
  });

  let totalLent = 0, totalReceivable = 0, totalCollected = 0;
  let active = 0, late = 0, critical = 0, settled = 0;
  let totalInterestEarned = 0;

  loans.forEach(loan => {
    const lp   = byLoan[loan.id] || [];
    const calc = calculateLoanStatus(loan, lp);
    totalLent += calc.principal;
    totalCollected += calc.totalPaid;

    if (calc.status === 'QUITADO') {
      settled++;
      totalInterestEarned += calc.totalPaid - calc.principal;
    } else {
      totalReceivable += calc.currentDebt;
      if (calc.status === 'CRITICO')  { critical++; late++; }
      else if (calc.status === 'ATRASADO') { late++; active++; }
      else active++;
    }
  });

  return {
    totalLent:           r2(totalLent),
    totalReceivable:     r2(totalReceivable),
    totalCollected:      r2(totalCollected),
    estimatedProfit:     r2(totalCollected - totalLent),
    totalInterestEarned: r2(totalInterestEarned),
    activeContracts:     active,
    lateContracts:       late,
    criticalContracts:   critical,
    settledContracts:    settled,
    totalContracts:      loans.length,
  };
}

function r2(v) { return Math.round(v * 100) / 100; }

module.exports = {
  calculateLoanStatus,
  calculateDashboardStats,
  calculateRiskScore,
  generateChargeText,
  daysSince,
  DAILY_RATE, FINE_PER_DAY, MAX_FINE_DAYS, CYCLE_DAYS
};
