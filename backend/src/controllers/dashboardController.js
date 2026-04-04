const { query } = require('../models/db');
const { calculateLoanStatus, calculateDashboardStats } = require('../utils/loanCalculator');

const getDashboard = async (req, res) => {
  try {
    const loans    = (await query(`SELECT l.*,c.name client_name FROM loans l JOIN clients c ON c.id=l.client_id ORDER BY l.created_at DESC`)).rows;
    const payments = (await query('SELECT * FROM payments')).rows;

    const stats = calculateDashboardStats(loans, payments);

    // Agrupar pagamentos por empréstimo
    const byLoan = {};
    payments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });

    // Contratos em atraso/crítico para alerta
    const alerts = loans
      .map(l => ({ ...l, ...calculateLoanStatus(l, byLoan[l.id] || []) }))
      .filter(l => l.status !== 'QUITADO' && (l.status !== 'ATIVO' || l.isNearDue))
      .sort((a,b) => b.daysSinceLastPayment - a.daysSinceLastPayment)
      .slice(0, 10);

    // Gráfico mensal (últimos 6 meses)
    const monthly = await query(`
      SELECT
        TO_CHAR(payment_date,'YYYY-MM') AS month,
        SUM(amount) AS received
      FROM payments
      WHERE payment_date >= NOW() - INTERVAL '6 months'
      GROUP BY month ORDER BY month
    `);

    const lentMonthly = await query(`
      SELECT
        TO_CHAR(loan_date,'YYYY-MM') AS month,
        SUM(principal) AS lent
      FROM loans
      WHERE loan_date >= NOW() - INTERVAL '6 months'
      GROUP BY month ORDER BY month
    `);

    res.json({ stats, alerts, monthlyReceived: monthly.rows, monthlyLent: lentMonthly.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
};

module.exports = { getDashboard };
