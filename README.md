# 💰 LoanSystem — Sistema de Gestão de Empréstimos

Sistema web privado para controle profissional de empréstimos pessoais.
Interface estilo banco digital. Responsivo para celular.

---

## ✨ Funcionalidades

| Módulo         | Descrição |
|----------------|-----------|
| 🔐 Login       | JWT + bcrypt, sessão protegida |
| 📊 Dashboard   | Métricas em tempo real, gráficos mensais |
| 👥 Clientes    | Cadastro completo, upload de documentos, score de risco |
| 📄 Empréstimos | Criação, cálculo dinâmico de juros e multas |
| 💳 Pagamentos  | Registro por tipo: juros, parcial, quitação |
| 📋 Cobrança    | Texto gerado automaticamente para copiar/PDF |
| 💼 Caixa       | Entradas, saídas, gráfico de fluxo |
| 🧮 Simulador   | Preview antes de emprestar, projeção mensal |
| 📈 Relatórios  | Análise completa + exportação CSV |
| 🏆 Ranking     | Clientes que mais pagaram, maior volume, risco |
| ⚙️ Configs     | Troca de senha, sincronização de status |

---

## 📐 Regras de Negócio

```
Juros:          1% ao dia sobre o capital
Ciclo:          30 dias
Renovação:      Pagar 30% do capital (ou quitar capital + 30%)
Multa:          R$50/dia após 30 dias sem pagamento (máx 7 dias = R$350)
Status ATIVO:   Dentro do prazo
Status ATRASADO: Mais de 30 dias sem pagamento
Status CRÍTICO:  Mais de 37 dias sem pagamento
Status QUITADO: Dívida liquidada
Cálculo:        100% dinâmico — juros NÃO ficam salvos no banco
```

---

## 🚀 Setup Local no Ubuntu

### 1. Pré-requisitos

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 14+
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Clone o repositório

```bash
git clone https://github.com/seu-usuario/loan-system.git
cd loan-system
```

### 3. Configure o banco de dados

```bash
sudo -u postgres psql -c "CREATE DATABASE loansystem;"
sudo -u postgres psql -c "CREATE USER loanuser WITH PASSWORD 'suasenha';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE loansystem TO loanuser;"
sudo -u postgres psql -d loansystem -f database/schema.sql
sudo -u postgres psql -d loansystem -f database/seed.sql
```

### 4. Configure o backend

```bash
cd backend
cp .env.example .env
# Edite o .env com suas credenciais:
nano .env
```

Conteúdo do `.env`:
```env
DATABASE_URL=postgresql://loanuser:suasenha@localhost:5432/loansystem
JWT_SECRET=coloque-uma-chave-muito-longa-e-aleatoria-aqui
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

```bash
npm install
npm run dev   # inicia backend na porta 3001
```

### 5. Configure o frontend

```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev   # inicia frontend na porta 5173
```

### 6. Acesse

```
http://localhost:5173
Email: admin@loan.com
Senha: admin123
```

---

## 🐳 Docker (forma mais fácil)

```bash
# Clone e entre na pasta
git clone https://github.com/seu-usuario/loan-system.git
cd loan-system

# Configure as variáveis
cp .env.example .env
nano .env   # coloque JWT_SECRET seguro

# Suba tudo com um comando
docker-compose up -d

# Acesse em http://localhost
```

Para parar:
```bash
docker-compose down
```

Para ver logs:
```bash
docker-compose logs -f backend
docker-compose logs -f db
```

---

## 🌐 Deploy no Render.com

### Banco de dados (PostgreSQL)

1. Acesse [render.com](https://render.com) → **New → PostgreSQL**
2. Copie a **Internal Database URL**

### Backend

1. **New → Web Service** → conecte seu repositório GitHub
2. Configurações:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
3. Environment Variables:
   ```
   DATABASE_URL   = (URL interna do PostgreSQL)
   JWT_SECRET     = (gere uma chave aleatória longa)
   NODE_ENV       = production
   FRONTEND_URL   = https://seu-frontend.onrender.com
   ```
4. Após deploy, acesse `https://sua-api.onrender.com/health` para testar

### Inicializar banco no Render

No painel do Web Service → **Shell:**
```bash
node src/utils/setupDb.js
```

### Frontend

1. **New → Static Site** → mesmo repositório
2. Configurações:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. Environment Variables:
   ```
   VITE_API_URL = https://sua-api.onrender.com
   ```

---

## 🚂 Deploy no Railway.app

```bash
# Instale o CLI
npm install -g @railway/cli

# Login
railway login

# Na pasta raiz do projeto
railway init

# Adicione PostgreSQL
railway add --plugin postgresql

# Configure variáveis
railway variables set JWT_SECRET="sua-chave-secreta-longa"
railway variables set NODE_ENV="production"

# Deploy
railway up
```

---

## 📁 Estrutura do Projeto

```
loan-system/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js      # Login, JWT
│   │   │   ├── clientsController.js   # CRUD clientes + risco
│   │   │   ├── loansController.js     # CRUD empréstimos + cobrança
│   │   │   ├── paymentsController.js  # Registrar pagamentos
│   │   │   ├── dashboardController.js # Métricas dashboard
│   │   │   ├── cashController.js      # Módulo caixa
│   │   │   ├── reportsController.js   # Relatórios + CSV
│   │   │   └── simulatorController.js # Simulador
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT middleware
│   │   │   └── upload.js              # Multer
│   │   ├── models/
│   │   │   └── db.js                  # PostgreSQL pool
│   │   ├── routes/
│   │   │   └── index.js               # Todas as rotas
│   │   ├── utils/
│   │   │   ├── loanCalculator.js      # MOTOR DE CÁLCULO
│   │   │   └── setupDb.js             # Inicializar banco
│   │   └── server.js                  # Express app
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ClientsPage.jsx
│   │   │   ├── ClientDetailPage.jsx
│   │   │   ├── LoansPage.jsx
│   │   │   ├── LoanDetailPage.jsx     # + Gerar Cobrança
│   │   │   ├── PaymentsPage.jsx
│   │   │   ├── CashPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   ├── SimulatorPage.jsx
│   │   │   ├── RankingPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── components/shared/
│   │   │   ├── Layout.jsx             # Sidebar + mobile menu
│   │   │   ├── Modal.jsx
│   │   │   └── UI.jsx                 # StatCard, Loading, etc.
│   │   ├── store/
│   │   │   └── authStore.js           # Zustand
│   │   └── utils/
│   │       ├── api.js                 # Axios + interceptors
│   │       └── formatters.js          # Moeda, CPF, datas
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── database/
│   ├── schema.sql                     # Tabelas PostgreSQL
│   └── seed.sql                       # Admin padrão
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔐 Segurança

- Senhas com `bcrypt` (salt rounds 10)
- Autenticação via `JWT` (expira em 7 dias)
- `helmet.js` — headers de segurança HTTP
- `cors` configurado para origens permitidas
- Rate limiting: 300 req/15min geral, 10 logins/15min
- Sanitização de inputs via `express-validator`
- SQL parametrizado (proteção contra SQL Injection)

---

## 📱 Acesso Mobile

O sistema é 100% responsivo:
- Menu lateral vira drawer em mobile
- Tabelas com scroll horizontal
- Cards se reorganizam em grid menor
- Botões de ação acessíveis por toque

---

## 🧪 Primeiro Uso

1. Faça login com `admin@loan.com` / `admin123`
2. **Imediatamente troque a senha** em Configurações
3. Cadastre seus primeiros clientes
4. Crie empréstimos para os clientes
5. Registre pagamentos conforme receber
6. Use o Simulador antes de novos empréstimos
7. Monitore o Dashboard diariamente

---

## 📞 Suporte

Problemas? Verifique:
1. PostgreSQL está rodando: `sudo systemctl status postgresql`
2. Banco criado: `psql -U postgres -c "\l"`
3. Backend respondendo: `curl http://localhost:3001/health`
4. Variáveis de ambiente configuradas corretamente
