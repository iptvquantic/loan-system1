const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token não fornecido' });

  try {
    req.admin = jwt.verify(auth.substring(7), process.env.JWT_SECRET);
    next();
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
    res.status(401).json({ error: msg });
  }
};
