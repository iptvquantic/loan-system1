const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth');
const clientsController = require('../controllers/clients');
const loansController = require('../controllers/loans');
const paymentsController = require('../controllers/payments');
const dashboardController = require('../controllers/dashboard');

const { authenticateToken } = require('../middleware/auth');

// Auth
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

// Protegidas
router.use(authenticateToken);

// Dashboard
router.get('/dashboard', dashboardController.getDashboard);

// Clientes
router.get('/clients', clientsController.getClients);
router.get('/clients/:id', clientsController.getClientById);
router.post('/clients', clientsController.createClient);
router.put('/clients/:id', clientsController.updateClient);
router.delete('/clients/:id', clientsController.deleteClient);

// Empréstimos
router.get('/loans', loansController.getLoans);
router.get('/loans/:id', loansController.getLoanById);
router.post('/loans', loansController.createLoan);
router.put('/loans/:id', loansController.updateLoan);
router.delete('/loans/:id', loansController.deleteLoan);
router.get('/loans/:id/charge', loansController.generateCharge);

// Pagamentos
router.get('/payments', paymentsController.getAllPayments);
router.get('/payments/loan/:loanId', paymentsController.getPaymentsByLoan);
router.post('/payments', paymentsController.createPayment);
router.delete('/payments/:id', paymentsController.deletePayment);

module.exports = router;
