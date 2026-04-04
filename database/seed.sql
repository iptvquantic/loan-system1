-- ============================================================
-- SEED — admin padrão: admin@loan.com / admin123
-- ============================================================

INSERT INTO admins (name, email, password_hash) VALUES (
  'Administrador',
  'admin@loan.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
) ON CONFLICT (email) DO NOTHING;

-- Clientes de exemplo
INSERT INTO clients (name, cpf, phone, address, income_source, salary_day, risk_score) VALUES
  ('João Carlos Silva',    '111.222.333-44', '(22) 99111-0001', 'Rua das Acácias, 10 - Campos/RJ',      'Autônomo',    5,  'BAIXO'),
  ('Maria Fernanda Lima',  '222.333.444-55', '(22) 99222-0002', 'Av. Pelinca, 500 - Campos/RJ',         'CLT',         10, 'BAIXO'),
  ('Pedro Augusto Souza',  '333.444.555-66', '(22) 99333-0003', 'Rua 28 de Março, 99 - Campos/RJ',      'Aposentado',  25, 'MEDIO'),
  ('Ana Paula Rodrigues',  '444.555.666-77', '(22) 99444-0004', 'Bairro Goytacaz, 200 - Campos/RJ',     'Autônomo',    15, 'ALTO')
ON CONFLICT (cpf) DO NOTHING;
