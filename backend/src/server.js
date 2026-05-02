require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 300 }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));
app.use('/api', require('./routes'));

app.get('/health', async (_, res) => {
  try {
    const { query } = require('./models/db');
    const { calculateLoanStatus } = require('./utils/loanCalculator');
    const loans    = (await query(`SELECT * FROM loans WHERE status != 'QUITADO'`)).rows;
    const payments = (await query('SELECT * FROM payments')).rows;
    const byLoan   = {};
    payments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });
    let updated = 0;
    for (const loan of loans) {
      const calc = calculateLoanStatus(loan, byLoan[loan.id] || []);
      if (calc.status !== loan.status) {
        await query('UPDATE loans SET status=$1 WHERE id=$2', [calc.status, loan.id]);
        updated++;
      }
    }
    if (updated > 0) console.log(`[SYNC] ${updated} status atualizados`);
    res.json({ status: 'ok', synced: updated, ts: new Date().toISOString() });
  } catch(e) {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  }
});

app.use('*', (_, res) => res.status(404).json({ error: 'Rota não encontrada' }));
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀  API rodando em http://localhost:${PORT}`);
  console.log(`🌍  Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
