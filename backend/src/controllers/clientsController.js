const { query } = require('../models/db');
const { calculateRiskScore, calculateLoanStatus } = require('../utils/loanCalculator');

const getAll = async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT c.*,
        COUNT(l.id)::int                                         AS total_loans,
        COUNT(l.id) FILTER (WHERE l.status!='QUITADO')::int      AS active_loans,
        COALESCE(SUM(l.principal) FILTER (WHERE l.status!='QUITADO'),0) AS active_debt
      FROM clients c
      LEFT JOIN loans l ON l.client_id=c.id
    `;
    const params = [];
    if (search) { sql += ` WHERE c.name ILIKE $1 OR c.cpf ILIKE $1 OR c.phone ILIKE $1`; params.push(`%${search}%`); }
    sql += ' GROUP BY c.id ORDER BY c.name';
    res.json((await query(sql, params)).rows);
  } catch (e) { res.status(500).json({ error: 'Erro ao buscar clientes' }); }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = (await query('SELECT * FROM clients WHERE id=$1', [id])).rows[0];
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

    const loans = (await query(`
      SELECT l.* FROM loans l WHERE l.client_id=$1 ORDER BY l.created_at DESC
    `, [id])).rows;

    const payments = (await query(`
      SELECT p.* FROM payments p
      JOIN loans l ON l.id=p.loan_id
      WHERE l.client_id=$1 ORDER BY p.payment_date DESC
    `, [id])).rows;

    const byLoan = {};
    payments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });

    const loansCalc = loans.map(l => ({ ...l, ...calculateLoanStatus(l, byLoan[l.id] || []) }));
    const risk      = calculateRiskScore(loans, payments);

    res.json({ client, loans: loansCalc, payments, risk });
  } catch (e) { res.status(500).json({ error: 'Erro ao buscar cliente' }); }
};

const create = async (req, res) => {
  try {
    const { name, cpf, phone, address, income_source, salary_day, notes } = req.body;
    if (!name || !cpf) return res.status(400).json({ error: 'Nome e CPF obrigatórios' });

    if ((await query('SELECT id FROM clients WHERE cpf=$1', [cpf])).rows.length)
      return res.status(409).json({ error: 'CPF já cadastrado' });

    const r = await query(`
      INSERT INTO clients(name,cpf,phone,address,income_source,salary_day,notes)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [name, cpf, phone, address, income_source, salary_day || null, notes]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erro ao criar cliente' }); }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cpf, phone, address, income_source, salary_day, notes } = req.body;
    const r = await query(`
      UPDATE clients SET
        name=COALESCE($1,name), cpf=COALESCE($2,cpf), phone=COALESCE($3,phone),
        address=COALESCE($4,address), income_source=COALESCE($5,income_source),
        salary_day=COALESCE($6,salary_day), notes=COALESCE($7,notes)
      WHERE id=$8 RETURNING *
    `, [name,cpf,phone,address,income_source,salary_day,notes,id]);
    r.rows.length ? res.json(r.rows[0]) : res.status(404).json({ error: 'Não encontrado' });
  } catch (e) { res.status(500).json({ error: 'Erro ao atualizar' }); }
};

const uploadDocs = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.files || !Object.keys(req.files).length)
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const fields = ['doc_residence','doc_id_front','doc_id_back'];
    const updates = {};
    fields.forEach(f => { if (req.files[f]) updates[f] = req.files[f][0].path; });

    const keys = Object.keys(updates);
    if (!keys.length) return res.status(400).json({ error: 'Campos inválidos' });

    const set    = keys.map((k,i) => `${k}=$${i+1}`).join(',');
    const values = [...Object.values(updates), id];
    const r = await query(`UPDATE clients SET ${set} WHERE id=$${values.length} RETURNING *`, values);
    res.json({ message: 'Documentos enviados', client: r.rows[0] });
  } catch (e) { res.status(500).json({ error: 'Erro no upload' }); }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const active = (await query(`SELECT id FROM loans WHERE client_id=$1 AND status!='QUITADO'`, [id])).rows;
    if (active.length) return res.status(400).json({ error: 'Cliente tem empréstimos ativos' });
    await query('DELETE FROM clients WHERE id=$1', [id]);
    res.json({ message: 'Cliente removido' });
  } catch (e) { res.status(500).json({ error: 'Erro ao remover' }); }
};

const getRanking = async (req, res) => {
  try {
    const rows = (await query(`
      SELECT c.id, c.name, c.cpf, c.risk_score,
        COUNT(l.id)::int                                                  AS total_loans,
        COUNT(l.id) FILTER (WHERE l.status='QUITADO')::int                AS settled_loans,
        COALESCE(SUM(p.amount),0)                                         AS total_paid,
        COALESCE(SUM(l.principal),0)                                      AS total_lent,
        COALESCE(SUM(p.amount),0) - COALESCE(SUM(l.principal),0)         AS interest_paid
      FROM clients c
      LEFT JOIN loans l    ON l.client_id=c.id
      LEFT JOIN payments p ON p.loan_id=l.id
      GROUP BY c.id ORDER BY total_paid DESC
    `)).rows;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: 'Erro no ranking' }); }
};

module.exports = { getAll, getById, create, update, uploadDocs, remove, getRanking };
