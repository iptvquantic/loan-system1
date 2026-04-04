const { query } = require('../models/db');
const { calculateLoanStatus } = require('../utils/loanCalculator');

const getReports = async (req, res) => {
  try {
    const loans    = (await query(`SELECT l.*,c.name client_name,c.cpf client_cpf FROM loans l JOIN clients c ON c.id=l.client_id ORDER BY l.created_at DESC`)).rows;
    const payments = (await query('SELECT * FROM payments')).rows;
    const byLoan   = {};
    payments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });

    const data = loans.map(l => {
      const calc = calculateLoanStatus(l, byLoan[l.id] || []);
      return { ...l, ...calc };
    });

    const summary = {
      totalLent:       data.reduce((s,l) => s + l.principal, 0),
      totalReceivable: data.filter(l => l.status!=='QUITADO').reduce((s,l) => s + l.currentDebt, 0),
      totalCollected:  data.reduce((s,l) => s + l.totalPaid, 0),
      profit:          data.reduce((s,l) => s + l.totalPaid, 0) - data.reduce((s,l) => s + l.principal, 0),
      settled:         data.filter(l => l.status==='QUITADO').length,
      active:          data.filter(l => l.status==='ATIVO').length,
      late:            data.filter(l => l.status==='ATRASADO').length,
      critical:        data.filter(l => l.status==='CRITICO').length,
    };

    res.json({ summary, loans: data });
  } catch (e) { res.status(500).json({ error: 'Erro nos relatórios' }); }
};

const exportCSV = async (req, res) => {
  try {
    const loans    = (await query(`SELECT l.*,c.name client_name,c.cpf client_cpf,c.phone client_phone FROM loans l JOIN clients c ON c.id=l.client_id`)).rows;
    const payments = (await query('SELECT * FROM payments')).rows;
    const byLoan   = {};
    payments.forEach(p => { (byLoan[p.loan_id] = byLoan[p.loan_id] || []).push(p); });

    const rows = loans.map(l => {
      const calc = calculateLoanStatus(l, byLoan[l.id] || []);
      return [
        l.client_name, l.client_cpf, l.client_phone,
        calc.principal, l.loan_date, calc.totalDays,
        calc.interest, calc.fine, calc.totalPaid,
        calc.currentDebt, calc.status
      ].map(v => `"${v}"`).join(',');
    });

    const header = '"Cliente","CPF","Telefone","Capital","Data Empréstimo","Dias","Juros","Multa","Pago","Dívida Atual","Status"';
    const csv    = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csv); // BOM para Excel
  } catch (e) { res.status(500).json({ error: 'Erro ao exportar' }); }
};

module.exports = { getReports, exportCSV };
