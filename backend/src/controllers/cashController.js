const { query } = require('../models/db');

const getSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    let dateFilter = '';
    const params = [];
    if (from) { params.push(from); dateFilter += ` AND flow_date>=$${params.length}`; }
    if (to)   { params.push(to);   dateFilter += ` AND flow_date<=$${params.length}`; }

    const totals = (await query(`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type='ENTRADA'),0) AS total_in,
        COALESCE(SUM(amount) FILTER (WHERE type='SAIDA'),0)   AS total_out
      FROM cash_flow WHERE 1=1 ${dateFilter}
    `, params)).rows[0];

    const history = (await query(`
      SELECT * FROM cash_flow WHERE 1=1 ${dateFilter}
      ORDER BY flow_date DESC, created_at DESC LIMIT 100
    `, params)).rows;

    const monthly = (await query(`
      SELECT
        TO_CHAR(flow_date,'YYYY-MM') AS month,
        SUM(amount) FILTER (WHERE type='ENTRADA') AS entrada,
        SUM(amount) FILTER (WHERE type='SAIDA')   AS saida
      FROM cash_flow
      WHERE flow_date >= NOW() - INTERVAL '6 months'
      GROUP BY month ORDER BY month
    `)).rows;

    const balance = parseFloat(totals.total_in) - parseFloat(totals.total_out);
    res.json({ balance, totalIn: totals.total_in, totalOut: totals.total_out, history, monthly });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Erro no caixa' }); }
};

const addEntry = async (req, res) => {
  try {
    const { type, category, amount, description, flow_date } = req.body;
    if (!type || !amount || !category)
      return res.status(400).json({ error: 'type, category e amount obrigatórios' });
    if (!['ENTRADA','SAIDA'].includes(type))
      return res.status(400).json({ error: 'type deve ser ENTRADA ou SAIDA' });

    const r = await query(`
      INSERT INTO cash_flow(type,category,amount,description,flow_date)
      VALUES($1,$2,$3,$4,$5) RETURNING *
    `, [type, category, amount, description, flow_date || new Date().toISOString().split('T')[0]]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: 'Erro ao adicionar' }); }
};

const remove = async (req, res) => {
  try {
    await query('DELETE FROM cash_flow WHERE id=$1', [req.params.id]);
    res.json({ message: 'Removido' });
  } catch (e) { res.status(500).json({ error: 'Erro ao remover' }); }
};

module.exports = { getSummary, addEntry, remove };
