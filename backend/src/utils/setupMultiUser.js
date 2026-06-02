const db = require('../models/db')

async function setupMultiUser() {
  try {
    // Tabela de usuários multi-tenant
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        plan VARCHAR(20) DEFAULT 'trial',
        trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 days',
        plan_expires_at TIMESTAMPTZ,
        is_active BOOLEAN DEFAULT true,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    // Tabela de pagamentos de planos
    await db.query(`
      CREATE TABLE IF NOT EXISTS plan_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        plan VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_link VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    console.log('✅ Tabelas multi-usuário criadas')
  } catch (err) {
    console.error('Erro setupMultiUser:', err.message)
  }
}

module.exports = setupMultiUser
