const { query } = require('../models/db');
const { calculateLoanStatus, generateChargeText } = require('../utils/loanCalculator');

const attachCalc = async (loans) => {
  if (!loans.length) return [];
  const ids = loans.map(l => l.id);
  const payments = (await query(`SELECT * FROM payments WHERE loan_id=ANY($1)`, [ids])).rows;
  const byLoan = {};
  payments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });
  return loans.map(l => ({ ...l, ...calculateLoanStatus(l, byLoan[l.id] || []) }));
};

const getAll = async (req, res) => {
  try {
    const { status, client_id } = req.query;
    let sql = `SELECT l.*,c.name client_name,c.phone client_phone,c.cpf client_cpf
               FROM loans l JOIN clients c ON c.id=l.client_id`;
    const params = [], conds = [];
    if (status)    { conds.push(`l.status=$${params.length+1}`);    params.push(status); }
    if (client_id) { conds.push(`l.client_id=$${params.length+1}`); params.push(client_id); }
    if (conds.length) sql += ' WHERE '+conds.join(' AND ');
    sql += ' ORDER BY l.created_at DESC';
    const loans = (await query(sql, params)).rows;
    res.json(await attachCalc(loans));
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao buscar empréstimos' }); }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = (await query(`
      SELECT l.*,c.name client_name,c.phone client_phone,c.cpf client_cpf,
             c.address client_address,c.income_source,c.salary_day
      FROM loans l JOIN clients c ON c.id=l.client_id WHERE l.id=$1
    `, [id])).rows[0];
    if (!loan) return res.status(404).json({ error: 'Não encontrado' });

    const payments = (await query('SELECT * FROM payments WHERE loan_id=$1 ORDER BY payment_date DESC', [id])).rows;
    const calc     = calculateLoanStatus(loan, payments);
    res.json({ ...loan, ...calc, payments });
  } catch (e) { res.status(500).json({ error: 'Erro ao buscar empréstimo' }); }
};

const create = async (req, res) => {
  try {
    const { client_id, principal, loan_date, observations } = req.body;
    if (!client_id || !principal || parseFloat(principal) <= 0)
      return res.status(400).json({ error: 'Cliente e valor válido obrigatórios' });

    if (!(await query('SELECT id FROM clients WHERE id=$1', [client_id])).rows.length)
      return res.status(404).json({ error: 'Cliente não encontrado' });

    const r = await query(`
      INSERT INTO loans(client_id,principal,loan_date,observations)
      VALUES($1,$2,$3,$4) RETURNING *
    `, [client_id, principal, loan_date || new Date().toISOString().split('T')[0], observations]);

    // Registra saída no caixa
    await query(`
      INSERT INTO cash_flow(type,category,amount,description,reference_id,flow_date)
      VALUES('SAIDA','EMPRESTIMO',$1,$2,$3,$4)
    `, [principal, `Empréstimo para cliente`, r.rows[0].id, loan_date || new Date().toISOString().split('T')[0]]);

    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro ao criar empréstimo' }); }
};

const getCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = (await query(`
      SELECT l.*,c.name client_name FROM loans l JOIN clients c ON c.id=l.client_id WHERE l.id=$1
    `, [id])).rows[0];
    if (!loan) return res.status(404).json({ error: 'Não encontrado' });
    const payments = (await query('SELECT * FROM payments WHERE loan_id=$1', [id])).rows;
    const calc     = calculateLoanStatus(loan, payments);
    const text     = generateChargeText(loan, calc, loan.client_name);
    res.json({ text, calc });
  } catch (e) { res.status(500).json({ error: 'Erro ao gerar cobrança' }); }
};

const syncStatus = async (req, res) => {
  try {
    const loans    = (await query(`SELECT * FROM loans WHERE status!='QUITADO'`)).rows;
    const payments = (await query('SELECT * FROM payments')).rows;
    const byLoan = {};
    payments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });
    let updated = 0;
    for (const l of loans) {
      const { status } = calculateLoanStatus(l, byLoan[l.id] || []);
      if (status !== l.status) {
        await query('UPDATE loans SET status=$1 WHERE id=$2', [status, l.id]);
        updated++;
      }
    }
    res.json({ message: `${updated} contratos atualizados`, total: loans.length });
  } catch (e) { res.status(500).json({ error: 'Erro ao sincronizar' }); }
};

const remove = async (req, res) => {
  try {
    await query('DELETE FROM loans WHERE id=$1', [req.params.id]);
    res.json({ message: 'Removido' });
  } catch (e) { res.status(500).json({ error: 'Erro ao remover' }); }
};

module.exports = { getAll, getById, create, getCharge, syncStatus, remove };
