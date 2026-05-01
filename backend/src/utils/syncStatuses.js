const { query } = require('../models/db');
const { calculateLoanStatus } = require('./loanCalculator');

async function syncAllStatuses() {
  try {
    const loans = (await query(`SELECT * FROM loans WHERE status != 'QUITADO'`)).rows;
    const payments = (await query('SELECT * FROM payments')).rows;
    const byLoan = {};
    payments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });
    let updated = 0;
    for (const loan of loans) {
      const calc = calculateLoanStatus(loan, byLoan[loan.id] || []);
      if (calc.status !== loan.status) {
        await query('UPDATE loans SET status=$1 WHERE id=$2', [calc.status, loan.id]);
        updated++;
      }
    }
    if (updated > 0) console.log(`[SYNC] ${updated} contratos atualizados - ${new Date().toLocaleString('pt-BR')}`);
  } catch (e) {
    console.error('[SYNC ERROR]', e.message);
  }
}

module.exports = syncAllStatuses;
