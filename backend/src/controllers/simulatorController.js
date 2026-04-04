const { DAILY_RATE, FINE_PER_DAY, MAX_FINE_DAYS, CYCLE_DAYS } = require('../utils/loanCalculator');

const simulate = (req, res) => {
  try {
    const { amount, days } = req.query;
    const principal = parseFloat(amount);
    const numDays   = parseInt(days);

    if (!principal || principal <= 0) return res.status(400).json({ error: 'Valor inválido' });
    if (!numDays   || numDays   <= 0) return res.status(400).json({ error: 'Dias inválido' });

    const interest = principal * DAILY_RATE * numDays;

    let fine = 0, fineDays = 0;
    if (numDays > CYCLE_DAYS) {
      fineDays = Math.min(numDays - CYCLE_DAYS, MAX_FINE_DAYS);
      fine     = fineDays * FINE_PER_DAY;
    }

    const total          = principal + interest + fine;
    const cyclePayment   = principal * 0.30;

    // Projeção mês a mês
    const projection = [];
    for (let d = 30; d <= Math.max(numDays, 120); d += 30) {
      const i = principal * DAILY_RATE * d;
      let f = 0;
      if (d > CYCLE_DAYS) f = Math.min(d - CYCLE_DAYS, MAX_FINE_DAYS) * FINE_PER_DAY;
      projection.push({ day: d, interest: Math.round(i*100)/100, fine: f, total: Math.round((principal+i+f)*100)/100 });
    }

    res.json({ principal, days: numDays, interest: Math.round(interest*100)/100, fine, fineDays, total: Math.round(total*100)/100, cyclePayment, projection });
  } catch (e) { res.status(500).json({ error: 'Erro na simulação' }); }
};

module.exports = { simulate };
