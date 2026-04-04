-- ============================================================
-- LOAN SYSTEM — SCHEMA COMPLETO
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  income_source VARCHAR(255),
  salary_day INTEGER CHECK (salary_day BETWEEN 1 AND 31),
  doc_residence VARCHAR(500),
  doc_id_front VARCHAR(500),
  doc_id_back VARCHAR(500),
  notes TEXT,
  risk_score VARCHAR(20) DEFAULT 'BAIXO' CHECK (risk_score IN ('BAIXO','MEDIO','ALTO')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LOANS
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  principal DECIMAL(12,2) NOT NULL CHECK (principal > 0),
  daily_rate DECIMAL(6,4) DEFAULT 0.0100,
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO','ATRASADO','CRITICO','QUITADO')),
  observations TEXT,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('JUROS','PARCIAL','QUITACAO')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CASH FLOW (CAIXA)
CREATE TABLE IF NOT EXISTS cash_flow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(10) NOT NULL CHECK (type IN ('ENTRADA','SAIDA')),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  reference_id UUID,
  flow_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans(client_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(flow_date);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf);

-- AUTO updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_loans_updated   BEFORE UPDATE ON loans   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_admins_updated  BEFORE UPDATE ON admins  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
