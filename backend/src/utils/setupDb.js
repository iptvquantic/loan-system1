require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  try {
    console.log('📦 Conectando ao banco...');
    await pool.query('SELECT 1');
    console.log('✅ Conectado!');

    const schemaPath = path.join(__dirname, '../../../../database/schema.sql');
    const seedPath   = path.join(__dirname, '../../../../database/seed.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('📝 Criando tabelas...');
      await pool.query(fs.readFileSync(schemaPath, 'utf8'));
      console.log('✅ Tabelas criadas!');
    }
    if (fs.existsSync(seedPath)) {
      console.log('🌱 Inserindo seed...');
      await pool.query(fs.readFileSync(seedPath, 'utf8'));
      console.log('✅ Seed inserido!');
    }

    console.log('\n🎉 Banco configurado!');
    console.log('📧  Email: admin@loan.com');
    console.log('🔑  Senha: admin123\n');
  } catch (e) {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
run();
