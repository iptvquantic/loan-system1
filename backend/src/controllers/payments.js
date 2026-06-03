const db = require('../models/db');
const { calculateLoanState, processPayment } = require('../utils/loanCalculator');

const VALID_TYPES = ['JUROS', 'CAPITAL', 'PARCIAL', 'QUITACAO'];

const getPaymentsByLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const result = await db.query(
      'SELECT * FROM payments WHERE loan_id = $1 ORDER BY payment_date DESC',
      [loanId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getPaymentsByLoan:', err);
    res.status(500).json({ error: 'Erro ao buscar pagamentos' });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        p.*,
        l.amount as loan_amount,
        l.loan_date,
        c.name as client_name
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN clients c ON l.client_id = c.id
      ORDER BY p.payment_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getAllPayments:', err);
    res.status(500).json({ error: 'Erro ao buscar pagamentos' });
  }
};

const createPayment = async (req, res) => {
  try {
    const { loan_id, amount, payment_type, payment_date, notes } = req.body;

    if (!loan_id || !amount || !payment_type || !payment_date) {
      return res.status(400).json({ error: 'Campos obrigatórios: loan_id, amount, payment_type, payment_date' });
    }

    const typeUpper = (payment_type || '').toString().toUpperCase().trim();

    if (!VALID_TYPES.includes(typeUpper)) {
      return res.status(400).json({
        error: `Tipo de pagamento inválido: "${payment_type}". Use: ${VALID_TYPES.join(', ')}`
      });
    }

    const loanRes = await db.query('SELECT * FROM loans WHERE id = $1', [loan_id]);
    if (loanRes.rows.length === 0) {
      return res.status(404).json({ error: 'Empréstimo não encontrado' });
    }
    const loan = loanRes.rows[0];

    const pmtRes = await db.query('SELECT * FROM payments WHERE loan_id = $1', [loan_id]);
    const payments = pmtRes.rows;

    const validation = processPayment(loan, payments, typeUpper, amount);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }

    const insertRes = await db.query(
      `INSERT INTO payments (loan_id, amount, payment_type, payment_date, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [loan_id, parseFloat(amount), typeUpper, payment_date, notes || null]
    );

    await db.query(
      'UPDATE loans SET status = $1, updated_at = NOW() WHERE id = $2',
      [validation.newStatus, loan_id]
    );

    res.status(201).json({
      payment: insertRes.rows[0],
      message: validation.message,
      newStatus: validation.newStatus,
      pendingInterest: validation.pendingInterest || 0,
    });
  } catch (err) {
    console.error('createPayment:', err);
    res.status(500).json({ error: 'Erro ao registrar pagamento' });
  }
};

const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const pmtRes = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (pmtRes.rows.length === 0) return res.status(404).json({ error: 'Pagamento não encontrado' });

    await db.query('DELETE FROM payments WHERE id = $1', [id]);
    res.json({ message: 'Pagamento removido com sucesso' });
  } catch (err) {
    console.error('deletePayment:', err);
    res.status(500).json({ error: 'Erro ao remover pagamento' });
  }
};

module.exports = { getPaymentsByLoan, getAllPayments, createPayment, deletePayment };
