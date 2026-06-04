const DAILY_RATE = 0.01;
const FINE_PER_DAY = 50;
const MAX_FINE_DAYS = 7;
const CYCLE_DAYS = 30;

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const ref = new Date(dateStr);
  const now = new Date();
  ref.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  return Math.max(0, Math.floor((now - ref) / 86400000));
}

function calculateLoanStatus(loan, payments = []) {
  const principal = parseFloat(loan.principal || loan.amount || 0);
  let remainingCapital = principal;

  const sorted = [...payments].sort((a,b) => new Date(a.payment_date) - new Date(b.payment_date));
  let lastPaymentDate = loan.loan_date;

  for (const pmt of sorted) {
    const type = (pmt.payment_type || '').toUpperCase().trim();
    const amt = parseFloat(pmt.amount || 0);
    if (type === 'JUROS') {
      lastPaymentDate = pmt.payment_date;
    } else if (type === 'PARCIAL' || type === 'CAPITAL') {
      remainingCapital = Math.max(0, remainingCapital - amt);
      lastPaymentDate = pmt.payment_date;
    } else if (type === 'QUITACAO') {
      remainingCapital = 0;
      lastPaymentDate = pmt.payment_date;
    }
  }

  const days = daysSince(lastPaymentDate);
  const interest = parseFloat((remainingCapital * DAILY_RATE * days).toFixed(2));

  let fine = 0;
  let fineDays = 0;
  if (days > CYCLE_DAYS) {
    fineDays = Math.min(days - CYCLE_DAYS, MAX_FINE_DAYS);
    fine = fineDays * FINE_PER_DAY;
  }

  const isFullyPaid = remainingCapital === 0 && interest === 0;
  const totalDue = parseFloat((remainingCapital + interest + fine).toFixed(2));
  const totalPaid = payments.reduce((s,p) => s + parseFloat(p.amount||0), 0);

  let status = 'ATIVO';
  if (isFullyPaid) status = 'QUITADO';
  else if (days > CYCLE_DAYS + MAX_FINE_DAYS) status = 'CRÍTICO';
  else if (days > CYCLE_DAYS) status = 'ATRASADO';

  const nextDueDate = new Date(lastPaymentDate);
  nextDueDate.setDate(nextDueDate.getDate() + CYCLE_DAYS);
  const daysUntilDue = Math.max(0, Math.ceil((nextDueDate - new Date()) / 86400000));

  return {
    principal,
    amount: principal,
    capitalRestante: parseFloat(remainingCapital.toFixed(2)),
    remainingCapital: parseFloat(remainingCapital.toFixed(2)),
    interest,
    accruedInterest: interest,
    fine,
    fineDays,
    totalDue,
    currentDebt: totalDue,
    totalPaid,
    daysSinceLastPayment: days,
    totalDays: days,
    status,
    isFullyPaid,
    isNearDue: daysUntilDue <= 3,
    daysUntilDue,
    nextDueDate: nextDueDate.toISOString().slice(0,10),
    lastPaymentDate,
    cyclePayment: parseFloat((principal * DAILY_RATE * CYCLE_DAYS).toFixed(2)),
    fullSettlement: totalDue,
  };
}

function calculateLoanState(loan, payments = []) {
  return calculateLoanStatus(loan, payments);
}

function calculateDashboardStats(loans, allPayments) {
  const byLoan = {};
  allPayments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });

  let totalLent = 0, totalReceivable = 0, totalReceived = 0;
  let activeContracts = 0, lateContracts = 0, criticalContracts = 0, settledContracts = 0;

  for (const loan of loans) {
    const principal = parseFloat(loan.principal || loan.amount || 0);
    totalLent += principal;
    const calc = calculateLoanStatus(loan, byLoan[loan.id] || []);
    totalReceived += calc.totalPaid;
    if (calc.status === 'QUITADO') {
      settledContracts++;
    } else {
      totalReceivable += calc.totalDue;
      activeContracts++;
      if (calc.status === 'ATRASADO') lateContracts++;
      if (calc.status === 'CRÍTICO' || calc.status === 'CRITICO') criticalContracts++;
    }
  }

  return {
    totalLent,
    totalReceivable,
    totalReceived,
    estimatedProfit: totalReceived - totalLent,
    activeContracts,
    lateContracts,
    criticalContracts,
    settledContracts,
  };
}

function generateChargeText(loan, calc) {
  const capital = calc.capitalRestante?.toFixed(2) || '0.00';
  const juros = calc.interest?.toFixed(2) || '0.00';
  const multa = calc.fine?.toFixed(2) || '0.00';
  const total = calc.totalDue?.toFixed(2) || '0.00';
  let msg = `Ola ${loan.client_name}! CREDIX - Capital: R$ ${capital}`;
  if (parseFloat(juros) > 0) msg += ` | Juros: R$ ${juros}`;
  if (parseFloat(multa) > 0) msg += ` | Multa: R$ ${multa}`;
  msg += ` | *TOTAL: R$ ${total}*. Entre em contato para regularizar!`;
  return msg;
}

function processPayment(loan, payments, paymentType, paymentAmount) {
  const state = calculateLoanStatus(loan, payments);
  const type = (paymentType || '').toUpperCase().trim();
  const amount = parseFloat(paymentAmount);

  if (state.isFullyPaid) return { valid: false, message: 'Empréstimo já quitado.' };
  if (!['JUROS','CAPITAL','PARCIAL','QUITACAO'].includes(type)) {
    return { valid: false, message: `Tipo inválido: ${paymentType}` };
  }

  let pendingInterest = 0, newStatus = state.status, message = '';

  if (type === 'JUROS') {
    message = `Juros pagos: R$ ${amount.toFixed(2)}`;
    newStatus = 'ATIVO';
  } else if (type === 'CAPITAL' || type === 'PARCIAL') {
    const newCapital = Math.max(0, state.capitalRestante - amount);
    pendingInterest = state.interest;
    if (newCapital === 0 && pendingInterest > 0) {
      message = `Capital zerado! Ainda há R$ ${pendingInterest.toFixed(2)} de juros.`;
      newStatus = 'ATIVO';
    } else if (newCapital === 0) {
      message = 'Empréstimo QUITADO!';
      newStatus = 'QUITADO';
    } else {
      message = `Capital abatido. Restante: R$ ${newCapital.toFixed(2)}`;
      newStatus = 'ATIVO';
    }
  } else if (type === 'QUITACAO') {
    message = 'Empréstimo QUITADO!';
    newStatus = 'QUITADO';
  }

  return { valid: true, message, newStatus, pendingInterest, state };
}

module.exports = {
  calculateLoanStatus,
  calculateLoanState,
  calculateDashboardStats,
  generateChargeText,
  processPayment,
  daysSince,
};
