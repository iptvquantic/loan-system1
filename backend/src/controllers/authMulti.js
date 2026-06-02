const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../models/db')

const JWT_SECRET = process.env.JWT_SECRET || 'credix_secret_2026'

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, plan: user.plan },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function getPlanStatus(user) {
  const now = new Date()
  if (user.plan === 'trial') {
    const trialEnd = new Date(user.trial_ends_at)
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
    if (trialEnd < now) return { active: false, reason: 'trial_expired', daysLeft: 0 }
    return { active: true, plan: 'trial', daysLeft, trialEnd }
  }
  if (user.plan_expires_at) {
    const expires = new Date(user.plan_expires_at)
    if (expires < now) return { active: false, reason: 'plan_expired' }
    const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24))
    return { active: true, plan: user.plan, daysLeft }
  }
  return { active: false, reason: 'no_plan' }
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' })
    if (password.length < 6) return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' })

    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (exists.rows.length > 0) return res.status(400).json({ error: 'Email já cadastrado' })

    const hash = await bcrypt.hash(password, 10)
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, plan, trial_ends_at)
       VALUES ($1, $2, $3, 'trial', NOW() + INTERVAL '15 days')
       RETURNING id, name, email, plan, trial_ends_at`,
      [name.trim(), email.toLowerCase().trim(), hash]
    )
    const user = result.rows[0]
    const token = generateToken(user)
    const planStatus = getPlanStatus(user)

    res.status(201).json({ token, user: { ...user, planStatus } })
  } catch (err) {
    console.error('register:', err)
    res.status(500).json({ error: 'Erro ao criar conta' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' })

    // Tenta admin legado primeiro
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@loan.com'
    const adminPass  = process.env.ADMIN_PASS  || 'admin123'
    if (email === adminEmail && password === adminPass) {
      const token = jwt.sign({ id: 'admin', email, name: 'Administrador', plan: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
      return res.json({ token, user: { id: 'admin', name: 'Administrador', email, plan: 'admin', planStatus: { active: true, plan: 'admin' } } })
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    if (result.rows.length === 0) return res.status(401).json({ error: 'Email ou senha inválidos' })

    const user = result.rows[0]
    if (!user.is_active) return res.status(403).json({ error: 'Conta desativada' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Email ou senha inválidos' })

    const token = generateToken(user)
    const planStatus = getPlanStatus(user)
    const { password_hash, reset_token, ...safeUser } = user

    res.json({ token, user: { ...safeUser, planStatus } })
  } catch (err) {
    console.error('login:', err)
    res.status(500).json({ error: 'Erro no login' })
  }
}

const getMe = async (req, res) => {
  try {
    if (req.user.id === 'admin') return res.json({ id: 'admin', name: 'Administrador', email: req.user.email, plan: 'admin', planStatus: { active: true, plan: 'admin' } })
    const result = await db.query('SELECT id,name,email,plan,trial_ends_at,plan_expires_at,created_at FROM users WHERE id = $1', [req.user.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' })
    const user = result.rows[0]
    res.json({ ...user, planStatus: getPlanStatus(user) })
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar perfil' })
  }
}

const getPlans = async (req, res) => {
  res.json({
    plans: [
      {
        id: 'monthly',
        name: 'Mensal',
        price: 14.90,
        period: 'mês',
        days: 30,
        savings: null,
        highlight: false,
        link: 'https://pag.ae/81RuUMgB6',
        features: ['Contratos ilimitados','Clientes ilimitados','Dashboard completo','Suporte por WhatsApp']
      },
      {
        id: 'quarterly',
        name: 'Trimestral',
        price: 39.90,
        period: '3 meses',
        days: 90,
        savings: '11% de economia',
        highlight: true,
        link: 'https://pag.ae/81RuVe3jn',
        features: ['Tudo do Mensal','Relatórios avançados','Exportação de dados','Prioridade no suporte']
      },
      {
        id: 'annual',
        name: 'Anual',
        price: 149.90,
        period: 'ano',
        days: 365,
        savings: '37% de economia',
        highlight: false,
        link: 'https://pag.ae/81RuVvkg6',
        features: ['Tudo do Trimestral','Backup automático','API de integração','Suporte dedicado']
      }
    ]
  })
}

module.exports = { register, login, getMe, getPlans }
