require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Segurança ─────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(rateLimit({ windowMs: 15*60*1000, max: 300,
  message: { error: 'Muitas requisições. Aguarde 15 min.' } }));

app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 10,
  message: { error: 'Muitas tentativas de login.' } }));

// ── CORS ─────────────────────────────────────────────────
const origins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173','http://localhost:3000','http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (o, cb) => (!o || origins.includes(o)) ? cb(null,true) : cb(new Error('CORS bloqueado')),
  credentials: true,
}));

// ── Body ─────────────────────────────────────────────────
app.use(express.json({ limit:'10mb' }));
app.use(express.urlencoded({ extended:true, limit:'10mb' }));

// ── Arquivos estáticos (uploads) ──────────────────────────
const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// ── Rotas da API ─────────────────────────────────────────
app.use('/api', require('./routes'));

// ── Health check ──────────────────────────────────────────
app.get('/health', (_,res) => res.json({ status:'ok', ts: new Date() }));

// ── 404 ───────────────────────────────────────────────────
app.use((_,res) => res.status(404).json({ error:'Rota não encontrada' }));

// ── Erro global ───────────────────────────────────────────
app.use((err,_,res,__) => {
  console.error(err.stack);
  res.status(err.status||500).json({
    error: process.env.NODE_ENV==='production' ? 'Erro interno' : err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀  API rodando em http://localhost:${PORT}`);
  console.log(`🌍  Ambiente: ${process.env.NODE_ENV||'development'}\n`);
});

module.exports = app;
