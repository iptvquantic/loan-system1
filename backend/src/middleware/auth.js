const jwt = require('jsonwebtoken')

const authenticateToken = (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token não fornecido' })
  try {
    req.user = jwt.verify(auth.substring(7), process.env.JWT_SECRET || 'credix_secret_2026')
    req.admin = req.user
    next()
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido'
    res.status(401).json({ error: msg })
  }
}

module.exports = { authenticateToken }
