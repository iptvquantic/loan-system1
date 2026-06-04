const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const authMulti = require('../controllers/authMulti')
const clients = require('../controllers/clients')
const loans = require('../controllers/loans')
const payments = require('../controllers/payments')
const dashboard = require('../controllers/dashboard')

// Publico
router.post('/auth/register', authMulti.register)
router.post('/auth/login', authMulti.login)
router.get('/auth/me', authenticateToken, authMulti.getMe)
router.get('/plans', authMulti.getPlans)

// Protegido
router.use(authenticateToken)

router.get('/dashboard', dashboard.getDashboard)

router.get('/clients', clients.getClients)
router.get('/clients/:id', clients.getClientById)
router.post('/clients', clients.createClient)
router.put('/clients/:id', clients.updateClient)
router.delete('/clients/:id', clients.deleteClient)

router.get('/loans', loans.getLoans)
router.get('/loans/:id', loans.getLoanById)
router.post('/loans', loans.createLoan)
router.put('/loans/:id', loans.updateLoan)
router.delete('/loans/:id', loans.deleteLoan)
router.get('/loans/:id/charge', loans.generateCharge)

router.get('/payments', payments.getAllPayments)
router.get('/payments/loan/:loanId', payments.getPaymentsByLoan)
router.post('/payments', payments.createPayment)
router.delete('/payments/:id', payments.deletePayment)

module.exports = router
