const db = require('../models/db');
const { calculateLoanStatus } = require('../utils/loanCalculator');

const getDashboard = async (req, res) => {
  try {
    const loansRes = await db.query(`
      SELECT l.*, c.name as client_name, c.phone as client_phone
      FROM loans l JOIN clients c ON l.client_id = c.id
    `);

    let totalLent = 0;
    let totalLentActive = 0;
    let totalReceivable = 0;
    let totalReceived = 0;
    let activeContracts = 0;
    let lateContracts = 0;
    let criticalContracts = 0;
    let settledContracts = 0;
    const alerts = [];
    const monthlyLentMap = {};
    const monthlyReceivedMap = {};

    for (const loan of loansRes.rows) {
      const principal = parseFloat(loan.principal || loan.amount || 0);
      totalLent += principal;

      const pmtRes = await db.query('SELECT * FROM payments WHERE loan_id = $1', [loan.id]);
      const payments = pmtRes.rows;
      const state = calculateLoanStatus(loan, payments);
      const received = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
      totalReceived += received;

      if (state.status === 'QUITADO') {
        settledContracts++;
      } else {
        totalLentActive += state.capitalRestante;
        totalReceivable += state.totalDue;
        activeContracts++;
        if (state.status === 'ATRASADO') lateContracts++;
        if (state.status === 'CRÍTICO' || state.status === 'CRITICO') criticalContracts++;
        if (state.daysSinceLastPayment >= 25) {
          alerts.push({
            id: loan.id,
            client_name: loan.client_name,
            principal,
            remainingCapital: state.capitalRestante,
            currentDebt: state.totalDue,
            daysSinceLastPayment: state.daysSinceLastPayment,
            status: state.status,
          });
        }
      }

      const loanMonth = (loan.loan_date || '').slice(0, 7);
      if (loanMonth) {
        if (!monthlyLentMap[loanMonth]) monthlyLentMap[loanMonth] = 0;
        monthlyLentMap[loanMonth] += principal;
      }
      for (const pmt of payments) {
        const pmtMonth = (pmt.payment_date || '').slice(0, 7);
        if (pmtMonth) {
          if (!monthlyReceivedMap[pmtMonth]) monthlyReceivedMap[pmtMonth] = 0;
          monthlyReceivedMap[pmtMonth] += parseFloat(pmt.amount || 0);
        }
      }
    }

    const estimatedProfit = totalReceived - totalLent;

    res.json({
      stats: {
        totalLent,
        totalLentActive,
        totalReceivable,
        totalReceived,
        estimatedProfit,
        activeContracts,
        lateContracts,
        criticalContracts,
        settledContracts,
      },
      alerts: alerts.sort((a,b) => b.daysSinceLastPayment - a.daysSinceLastPayment).slice(0,10),
      monthlyLent: Object.entries(monthlyLentMap).map(([month, lent]) => ({ month, lent })),
      monthlyReceived: Object.entries(monthlyReceivedMap).map(([month, received]) => ({ month, received })),
    });
  } catch (err) {
    console.error('getDashboard:', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};

module.exports = { getDashboard };
