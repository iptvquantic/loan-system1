const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query } = require('../models/db');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email e senha obrigatórios' });

    const r = await query('SELECT * FROM admins WHERE email=$1', [email.toLowerCase().trim()]);
    if (!r.rows.length) return res.status(401).json({ error: 'Credenciais inválidas' });

    const admin = r.rows[0];
    if (!(await bcrypt.compare(password, admin.password_hash)))
      return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro interno' });
  }
};

const me = async (req, res) => {
  const r = await query('SELECT id,name,email,created_at FROM admins WHERE id=$1', [req.admin.id]);
  r.rows.length ? res.json(r.rows[0]) : res.status(404).json({ error: 'Não encontrado' });
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6)
      return res.status(400).json({ error: 'Senhas inválidas (mínimo 6 chars)' });

    const r = await query('SELECT * FROM admins WHERE id=$1', [req.admin.id]);
    if (!(await bcrypt.compare(currentPassword, r.rows[0].password_hash)))
      return res.status(401).json({ error: 'Senha atual incorreta' });

    await query('UPDATE admins SET password_hash=$1 WHERE id=$2',
      [await bcrypt.hash(newPassword, 10), req.admin.id]);
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (e) { res.status(500).json({ error: 'Erro interno' }); }
};

module.exports = { login, me, changePassword };
