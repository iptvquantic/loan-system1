/**
 * CREDIX — Calculadora de Empréstimos
 * Compatível com ambas estruturas do banco (amount e principal)
 */

const DAILY_RATE = 0.01;
const FINE_PER_DAY = 50;
const MAX_FINE_DAYS = 7;
const CYCLE_DAYS = 30;

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const ref = new Date(dateStr);
  const now = new Date();
  ref.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now - ref) / (1000 * 60 * 60 * 24)));
}

function calculateLoanState(loan, payments = []) {
  // Compatível com amount E principal
  const principal = parseFloat(loan.amount || loan.principal || 0);
  let remainingCapital = principal;

  const sorted = [...payments].sort(
    (a, b) => new Date(a.payment_date) - new Date(b.payment_date)
  );

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
  const accruedInterest = parseFloat((remainingCapital * DAILY_RATE * days).toFixed(2));

  let fine = 0;
  if (days > CYCLE_DAYS) {
    const fineDays = Math.min(days - CYCLE_DAYS, MAX_FINE_DAYS);
    fine = fineDays * FINE_PER_DAY;
  }

  const isFullyPaid = remainingCapital === 0 && accruedInterest === 0;

  let status = 'ATIVO';
  if (isFullyPaid) {
    status = 'QUITADO';
  } else if (days > CYCLE_DAYS + MAX_FINE_DAYS) {
    status = 'CRÍTICO';
  } else if (days > CYCLE_DAYS) {
    status = 'ATRASADO';
  }

  const totalDue = parseFloat((remainingCapital + accruedInterest + fine).toFixed(2));

  return {
    principal,
    amount: principal,
    remainingCapital: parseFloat(remainingCapital.toFixed(2)),
    accruedInterest,
    fine,
    totalDue,
    daysSinceLastPayment: days,
    status,
    isFullyPaid,
    lastPaymentDate,
  };
}

function processPayment(loan, payments, paymentType, paymentAmount) {
  const state = calculateLoanState(loan, payments);
  const type = (paymentType || '').toUpperCase().trim();
  const amount = parseFloat(paymentAmount);

  if (state.isFullyPaid) {
    return { valid: false, message: 'Este empréstimo já está quitado.' };
  }

  if (!['JUROS','CAPITAL','PARCIAL','QUITACAO'].includes(type)) {
    return { valid: false, message: `Tipo inválido: ${paymentType}. Use JUROS, CAPITAL, PARCIAL ou QUITACAO` };
  }

  let pendingInterest = 0;
  let newStatus = state.status;
  let message = '';

  if (type === 'JUROS') {
    message = `Juros pagos: R$ ${amount.toFixed(2)}`;
    newStatus = 'ATIVO';
  } else if (type === 'CAPITAL' || type === 'PARCIAL') {
    const newCapital = Math.max(0, state.remainingCapital - amount);
    pendingInterest = state.accruedInterest;
    if (newCapital === 0 && pendingInterest > 0) {
      message = `Capital zerado! Ainda há R$ ${pendingInterest.toFixed(2)} de juros pendentes.`;
      newStatus = 'ATIVO';
    } else if (newCapital === 0 && pendingInterest === 0) {
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

module.exports = { calculateLoanState, processPayment, daysSince };
