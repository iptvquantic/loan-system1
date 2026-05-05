require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function restore() {
  const schema = fs.readFileSync(path.join(__dirname,'../database/schema.sql'),'utf8');
  const backup = JSON.parse(fs.readFileSync(path.join(__dirname,'../database/backup.json'),'utf8'));

  await pool.query(schema);
  console.log('Tabelas criadas!');

  for (const c of backup.clients) {
    await pool.query('INSERT INTO clients (id,name,cpf,phone,address,income_source,salary_day,doc_residence,doc_id_front,doc_id_back,notes,risk_score,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO NOTHING',
      [c.id,c.name,c.cpf,c.phone,c.address,c.income_source,c.salary_day,c.doc_residence,c.doc_id_front,c.doc_id_back,c.notes,c.risk_score||'BAIXO',c.created_at,c.updated_at]);
  }
  console.log('Clientes:', backup.clients.length);

  for (const l of backup.loans) {
    await pool.query('INSERT INTO loans (id,client_id,principal,daily_rate,loan_date,status,observations,settled_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING',
      [l.id,l.client_id,l.principal,l.daily_rate,l.loan_date,l.status,l.observations,l.settled_at,l.created_at,l.updated_at]);
  }
  console.log('Emprestimos:', backup.loans.length);

  for (const p of backup.payments) {
    await pool.query('INSERT INTO payments (id,loan_id,amount,payment_date,payment_type,notes,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING',
      [p.id,p.loan_id,p.amount,p.payment_date,p.payment_type,p.notes,p.created_at]);
  }
  console.log('Pagamentos:', backup.payments.length);

  const hash = await bcrypt.hash('admin123',10);
  await pool.query('INSERT INTO admins (name,email,password_hash) VALUES ($1,$2,$3) ON CONFLICT (email) DO UPDATE SET password_hash=$3',
    ['Administrador','admin@loan.com',hash]);

  console.log('RESTAURACAO COMPLETA!');
  pool.end();
}

restore().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
