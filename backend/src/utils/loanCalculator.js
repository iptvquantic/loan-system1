/**
 * MOTOR DE CÁLCULO CORRIGIDO
 * - Juros calculados SOMENTE sobre o capital RESTANTE após abatimentos
 * - Dias reiniciam do ÚLTIMO pagamento (não da data do empréstimo)
 * - Status baseado em dias desde o ÚLTIMO pagamento
 */

const DAILY_RATE    = 0.01;
const FINE_PER_DAY  = 50.00;
const MAX_FINE_DAYS = 7;
const CYCLE_DAYS    = 30;

function daysSince(dateStr) {
  const start = new Date(dateStr);
  const now   = new Date();
  start.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  return Math.max(0, Math.floor((now - start) / 86_400_000));
}

function daysSinceLastPayment(loanDate, payments = []) {
  if (!payments.length) return daysSince(loanDate);
  const last = payments.reduce((max, p) => {
    const d = new Date(p.payment_date);
    return d > max ? d : max;
  }, new Date(0));
  last.setHours(0,0,0,0);
  const now = new Date();
  now.setHours(0,0,0,0);
  return Math.max(0, Math.floor((now - last) / 86_400_000));
}

function r2(v) { return Math.round(v * 100) / 100; }

function calculateLoanStatus(loan, payments = []) {
  const principal = parseFloat(loan.principal);

  // Capital restante = capital original - soma dos pagamentos PARCIAL e QUITACAO
  const capitalAbatido = payments
    .filter(p => p.payment_type === 'PARCIAL' || p.payment_type === 'QUITACAO')
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const capitalRestante = Math.max(principal - capitalAbatido, 0);

  // Dias desde o ÚLTIMO pagamento (qualquer tipo)
  const daysSincePay = daysSinceLastPayment(loan.loan_date, payments);

  // Dias totais desde o empréstimo
  const totalDays = daysSince(loan.loan_date);

  // Juros calculados SOMENTE sobre os dias desde o último pagamento
  // sobre o capital restante
  const interest = r2(capitalRestante * DAILY_RATE * daysSincePay);

  // Multa: após 30 dias sem pagamento
  let fine = 0, fineDays = 0;
  if (daysSincePay > CYCLE_DAYS) {
    fineDays = Math.min(daysSincePay - CYCLE_DAYS, MAX_FINE_DAYS);
    fine = r2(fineDays * FINE_PER_DAY);
  }

  // Total pago
  const totalPaid = r2(payments.reduce((s, p) => s + parseFloat(p.amount), 0));

  // Dívida atual = capital restante + juros do período + multa
  const currentDebt = r2(Math.max(capitalRestante + interest + fine, 0));

  // Valor para renovar (30% do capital restante)
  const cyclePayment = r2(capitalRestante * 0.30);

  // Quitação total
  const fullSettlement = r2(capitalRestante + interest + fine);

  // Próximo vencimento = último pagamento + 30 dias
  let baseDate = new Date(loan.loan_date);
  if (payments.length > 0) {
    baseDate = payments.reduce((max, p) => {
      const d = new Date(p.payment_date);
      return d > max ? d : max;
    }, new Date(0));
  }
  const nextDueDate = new Date(baseDate);
  nextDueDate.setDate(nextDueDate.getDate() + CYCLE_DAYS);
  const daysUntilDue = Math.floor((nextDueDate - new Date()) / 86_400_000);

  // Status automático baseado em dias desde último pagamento
  let status = 'ATIVO';
  if (capitalRestante <= 0.01 || totalPaid >= fullSettlement - 0.01) {
    status = 'QUITADO';
  } else if (daysSincePay > CYCLE_DAYS + MAX_FINE_DAYS) {
    status = 'CRITICO';
  } else if (daysSincePay > CYCLE_DAYS) {
    status = 'ATRASADO';
  }

  return {
    principal: r2(principal),
    capitalRestante: r2(capitalRestante),
    totalDays,
    daysSinceLastPayment: daysSincePay,
    interest,
    fine,
    fineDays,
    totalPaid,
    currentDebt,
    fullSettlement,
    cyclePayment,
    status,
    nextDueDate: nextDueDate.toISOString().split('T')[0],
    daysUntilDue,
    isNearDue: daysUntilDue >= 0 && daysUntilDue <= 5,
  };
}

function generateChargeText(loan, calc, clientName) {
  const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (d) => { const [y,m,day] = d.split('-'); return `${day}/${m}/${y}`; };
  return `━━━━━━━━━━━━━━━━━━━━━━━━
💰 COBRANÇA — EMPRÉSTIMO
━━━━━━━━━━━━━━━━━━━━━━━━

👤 CLIENTE: ${clientName}
📅 Data do empréstimo: ${fmtDate(loan.loan_date)}
💵 Capital original: ${fmt(calc.principal)}
💵 Capital restante: ${fmt(calc.capitalRestante)}

⏱ Dias desde último pagamento: ${calc.daysSinceLastPayment} dias
📈 Juros do período: ${fmt(calc.interest)}
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

function calculateRiskScore(loans, payments) {
  if (!loans.length) return { score: 'BAIXO', points: 0 };
  let points = 0;
  const byLoan = {};
  payments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });
  loans.forEach(loan => {
    const calc = calculateLoanStatus(loan, byLoan[loan.id] || []);
    if (calc.status === 'CRITICO')  points += 10;
    if (calc.status === 'ATRASADO') points += 5;
    if (calc.fine > 0)              points += 3;
  });
  const settled = loans.filter(l => l.status === 'QUITADO').length;
  if (loans.length > 0 && settled / loans.length > 0.7) points -= 5;
  let score = 'BAIXO';
  if (points >= 15) score = 'ALTO';
  else if (points >= 6) score = 'MEDIO';
  return { score, points };
}

function calculateDashboardStats(loans, payments) {
  const byLoan = {};
  payments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });
  let totalLent=0, totalReceivable=0, totalCollected=0;
  let active=0, late=0, critical=0, settled=0;

  loans.forEach(loan => {
    const lp   = byLoan[loan.id] || [];
    const calc = calculateLoanStatus(loan, lp);
    totalLent      += calc.principal;
    totalCollected += calc.totalPaid;
    if (calc.status === 'QUITADO') { settled++; }
    else {
      totalReceivable += calc.currentDebt;
      if (calc.status === 'CRITICO')  { critical++; late++; }
      else if (calc.status === 'ATRASADO') { late++; active++; }
      else active++;
    }
  });

  return {
    totalLent:       Math.round(totalLent*100)/100,
    totalReceivable: Math.round(totalReceivable*100)/100,
    totalCollected:  Math.round(totalCollected*100)/100,
    estimatedProfit: Math.round((totalCollected-totalLent)*100)/100,
    activeContracts: active,
    lateContracts:   late,
    criticalContracts: critical,
    settledContracts: settled,
    totalContracts:  loans.length,
  };
}

module.exports = {
  calculateLoanStatus,
  calculateDashboardStats,
  calculateRiskScore,
  generateChargeText,
  daysSince,
  DAILY_RATE, FINE_PER_DAY, MAX_FINE_DAYS, CYCLE_DAYS
};
