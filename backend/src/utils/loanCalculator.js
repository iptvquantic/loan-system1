/**
 * CREDIX — Calculadora de Empréstimos
 * Juros: 1% ao dia sobre capital restante
 * Multa: R$50/dia após 30 dias sem pgto (máx 7 dias = R$350)
 */

const DAILY_RATE = 0.01;
const FINE_PER_DAY = 50;
const MAX_FINE_DAYS = 7;
const CYCLE_DAYS = 30;

/**
 * Calcula dias desde o último pagamento (ou data do empréstimo)
 */
function daysSince(dateStr) {
  const ref = new Date(dateStr);
  const now = new Date();
  ref.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((now - ref) / (1000 * 60 * 60 * 24)));
}

/**
 * Calcula o estado atual de um empréstimo
 */
function calculateLoanState(loan, payments = []) {
  const principal = parseFloat(loan.amount);
  let remainingCapital = principal;

  // Ordena pagamentos por data
  const sorted = [...payments].sort(
    (a, b) => new Date(a.payment_date) - new Date(b.payment_date)
  );

  let lastPaymentDate = loan.loan_date;

  for (const pmt of sorted) {
    const type = (pmt.payment_type || '').toUpperCase();
    const amount = parseFloat(pmt.amount);

    if (type === 'JUROS') {
      // Só atualiza a data de referência
      lastPaymentDate = pmt.payment_date;
    } else if (type === 'PARCIAL' || type === 'CAPITAL') {
      remainingCapital = Math.max(0, remainingCapital - amount);
      lastPaymentDate = pmt.payment_date;
    } else if (type === 'QUITACAO') {
      remainingCapital = 0;
      lastPaymentDate = pmt.payment_date;
    }
  }

  // Dias desde último pagamento
  const days = daysSince(lastPaymentDate);

  // Juros acumulados sobre capital restante
  const accruedInterest = parseFloat((remainingCapital * DAILY_RATE * days).toFixed(2));

  // Multa: só após 30 dias sem pagamento
  let fine = 0;
  if (days > CYCLE_DAYS) {
    const fineDays = Math.min(days - CYCLE_DAYS, MAX_FINE_DAYS);
    fine = fineDays * FINE_PER_DAY;
  }

  // QUITADO somente quando capital E juros zerados
  const isFullyPaid = remainingCapital === 0 && accruedInterest === 0;

  // Status
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

/**
 * Valida e processa um pagamento
 * Retorna { valid, message, newStatus, pendingInterest }
 */
function processPayment(loan, payments, paymentType, paymentAmount) {
  const state = calculateLoanState(loan, payments);
  const type = (paymentType || '').toUpperCase();
  const amount = parseFloat(paymentAmount);

  if (state.isFullyPaid) {
    return { valid: false, message: 'Este empréstimo já está quitado.' };
  }

  let pendingInterest = 0;
  let newStatus = state.status;
  let message = '';

  if (type === 'JUROS') {
    message = `Pagamento de juros: R$ ${amount.toFixed(2)} registrado.`;
    newStatus = 'ATIVO';
  } else if (type === 'CAPITAL' || type === 'PARCIAL') {
    const newCapital = Math.max(0, state.remainingCapital - amount);
    // Verifica juros pendentes APÓS abate do capital
    pendingInterest = state.accruedInterest;

    if (newCapital === 0 && pendingInterest > 0) {
      message = `Capital zerado! Atenção: ainda há R$ ${pendingInterest.toFixed(2)} de juros pendentes. O contrato permanece ATIVO até quitar os juros.`;
      newStatus = 'ATIVO';
    } else if (newCapital === 0 && pendingInterest === 0) {
      message = 'Empréstimo QUITADO com sucesso!';
      newStatus = 'QUITADO';
    } else {
      message = `Capital abatido. Saldo restante: R$ ${newCapital.toFixed(2)}`;
      newStatus = 'ATIVO';
    }
  } else if (type === 'QUITACAO') {
    message = 'Empréstimo QUITADO com sucesso!';
    newStatus = 'QUITADO';
  } else {
    return { valid: false, message: `Tipo de pagamento inválido: ${paymentType}` };
  }

  return {
    valid: true,
    message,
    newStatus,
    pendingInterest,
    state,
  };
}

module.exports = { calculateLoanState, processPayment, daysSince };
