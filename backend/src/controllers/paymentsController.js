const { query } = require('../models/db');
const { calculateLoanStatus } = require('../utils/loanCalculator');

const getByLoan = async (req, res) => {
  try {
    const r = await query('SELECT * FROM payments WHERE loan_id=$1 ORDER BY payment_date DESC', [req.params.loanId]);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: 'Erro' }); }
};

const create = async (req, res) => {
  try {
    const { loan_id, amount, payment_date, payment_type, notes } = req.body;
    if (!loan_id || !amount || !payment_type)
      return res.status(400).json({ error: 'loan_id, amount e payment_type obrigatórios' });
    if (!['JUROS','PARCIAL','QUITACAO'].includes(payment_type))
      return res.status(400).json({ error: 'Tipo inválido' });
    if (parseFloat(amount) <= 0)
      return res.status(400).json({ error: 'Valor inválido' });

    const loan = (await query('SELECT * FROM loans WHERE id=$1', [loan_id])).rows[0];
    if (!loan) return res.status(404).json({ error: 'Empréstimo não encontrado' });
    if (loan.status === 'QUITADO') return res.status(400).json({ error: 'Empréstimo já quitado' });

    const pDate = payment_date || new Date().toISOString().split('T')[0];

    // Inserir pagamento
    const p = (await query(`
      INSERT INTO payments(loan_id,amount,payment_date,payment_type,notes)
      VALUES($1,$2,$3,$4,$5) RETURNING *
    `, [loan_id, amount, pDate, payment_type, notes])).rows[0];

    // Registrar no caixa
    await query(`
      INSERT INTO cash_flow(type,category,amount,description,reference_id,flow_date)
      VALUES('ENTRADA',$1,$2,$3,$4,$5)
    `, [payment_type, amount, `Pagamento ${payment_type}`, p.id, pDate]);

    // Recalcular status
    const allPayments = (await query('SELECT * FROM payments WHERE loan_id=$1', [loan_id])).rows;
    const calc        = calculateLoanStatus(loan, allPayments);
    await query('UPDATE loans SET status=$1 WHERE id=$2', [calc.status, loan_id]);
    if (calc.status === 'QUITADO')
      await query('UPDATE loans SET settled_at=NOW() WHERE id=$1', [loan_id]);

    res.status(201).json({ payment: p, updatedCalc: calc });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao registrar pagamento' }); }
};

const remove = async (req, res) => {
  try {
    const p = (await query('SELECT * FROM payments WHERE id=$1', [req.params.id])).rows[0];
    if (!p) return res.status(404).json({ error: 'Não encontrado' });
    await query('DELETE FROM payments WHERE id=$1', [req.params.id]);

    // Recalcular
    const loan = (await query('SELECT * FROM loans WHERE id=$1', [p.loan_id])).rows[0];
    if (loan) {
      const ps   = (await query('SELECT * FROM payments WHERE loan_id=$1', [p.loan_id])).rows;
      const calc = calculateLoanStatus(loan, ps);
      await query('UPDATE loans SET status=$1 WHERE id=$2', [calc.status, p.loan_id]);
    }
    res.json({ message: 'Removido' });
  } catch (e) { res.status(500).json({ error: 'Erro ao remover' }); }
};

module.exports = { getByLoan, create, remove };
