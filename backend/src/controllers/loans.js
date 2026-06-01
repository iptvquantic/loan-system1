const db = require('../models/db');
const { calculateLoanState } = require('../utils/loanCalculator');

const getLoans = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT l.*, c.name as client_name, c.phone as client_phone
      FROM loans l
      JOIN clients c ON l.client_id = c.id
      ORDER BY l.created_at DESC
    `);

    const loans = await Promise.all(result.rows.map(async (loan) => {
      const pmtRes = await db.query('SELECT * FROM payments WHERE loan_id = $1', [loan.id]);
      const state = calculateLoanState(loan, pmtRes.rows);
      return { ...loan, ...state };
    }));

    res.json(loans);
  } catch (err) {
    console.error('getLoans:', err);
    res.status(500).json({ error: 'Erro ao buscar empréstimos' });
  }
};

const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const loanRes = await db.query(
      'SELECT l.*, c.name as client_name, c.phone as client_phone FROM loans l JOIN clients c ON l.client_id = c.id WHERE l.id = $1',
      [id]
    );
    if (loanRes.rows.length === 0) return res.status(404).json({ error: 'Empréstimo não encontrado' });

    const loan = loanRes.rows[0];
    const pmtRes = await db.query('SELECT * FROM payments WHERE loan_id = $1 ORDER BY payment_date DESC', [id]);
    const state = calculateLoanState(loan, pmtRes.rows);

    res.json({ ...loan, ...state, payments: pmtRes.rows });
  } catch (err) {
    console.error('getLoanById:', err);
    res.status(500).json({ error: 'Erro ao buscar empréstimo' });
  }
};

const createLoan = async (req, res) => {
  try {
    const { client_id, amount, loan_date, notes } = req.body;
    if (!client_id || !amount || !loan_date) {
      return res.status(400).json({ error: 'client_id, amount e loan_date são obrigatórios' });
    }
    const result = await db.query(
      `INSERT INTO loans (client_id, amount, loan_date, status, notes)
       VALUES ($1, $2, $3, 'ATIVO', $4) RETURNING *`,
      [client_id, amount, loan_date, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createLoan:', err);
    res.status(500).json({ error: 'Erro ao criar empréstimo' });
  }
};

const updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, status } = req.body;
    const result = await db.query(
      'UPDATE loans SET notes = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [notes, status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateLoan:', err);
    res.status(500).json({ error: 'Erro ao atualizar empréstimo' });
  }
};

const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM payments WHERE loan_id = $1', [id]);
    await db.query('DELETE FROM loans WHERE id = $1', [id]);
    res.json({ message: 'Empréstimo removido com sucesso' });
  } catch (err) {
    console.error('deleteLoan:', err);
    res.status(500).json({ error: 'Erro ao remover empréstimo' });
  }
};

// CORRIGIDO: Gerar cobrança
const generateCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const loanRes = await db.query(
      'SELECT l.*, c.name as client_name, c.phone as client_phone FROM loans l JOIN clients c ON l.client_id = c.id WHERE l.id = $1',
      [id]
    );
    if (loanRes.rows.length === 0) return res.status(404).json({ error: 'Empréstimo não encontrado' });

    const loan = loanRes.rows[0];
    const pmtRes = await db.query('SELECT * FROM payments WHERE loan_id = $1', [id]);
    const state = calculateLoanState(loan, pmtRes.rows);

    const msg = `Olá ${loan.client_name}! Seu empréstimo de R$ ${parseFloat(loan.amount).toFixed(2)} tem saldo devedor de R$ ${state.totalDue.toFixed(2)} (capital: R$ ${state.remainingCapital.toFixed(2)} + juros: R$ ${state.accruedInterest.toFixed(2)}${state.fine > 0 ? ` + multa: R$ ${state.fine.toFixed(2)}` : ''}). Entre em contato para regularizar. CREDIX.`;

    res.json({
      message: msg,
      whatsappUrl: `https://wa.me/55${(loan.client_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`,
      state,
    });
  } catch (err) {
    console.error('generateCharge:', err);
    res.status(500).json({ error: 'Erro ao gerar cobrança' });
  }
};

module.exports = { getLoans, getLoanById, createLoan, updateLoan, deleteLoan, generateCharge };
