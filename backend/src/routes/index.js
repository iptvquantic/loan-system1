const express = require('express')
const router = express.Router()

const authMulti = require('../controllers/authMulti')
const clientsController = require('../controllers/clients')
const loansController = require('../controllers/loans')
const paymentsController = require('../controllers/payments')
const dashboardController = require('../controllers/dashboard')
const { authenticateToken } = require('../middleware/auth')

// Auth publico
router.post('/auth/register', authMulti.register)
router.post('/auth/login', authMulti.login)
router.get('/auth/me', authenticateToken, authMulti.getMe)
router.get('/plans', authMulti.getPlans)

// Protegidas
router.use(authenticateToken)

router.get('/dashboard', dashboardController.getDashboard)

router.get('/clients', clientsController.getClients)
router.get('/clients/:id', clientsController.getClientById)
router.post('/clients', clientsController.createClient)
router.put('/clients/:id', clientsController.updateClient)
router.delete('/clients/:id', clientsController.deleteClient)

router.get('/loans', loansController.getLoans)
router.get('/loans/:id', loansController.getLoanById)
router.post('/loans', loansController.createLoan)
router.put('/loans/:id', loansController.updateLoan)
router.delete('/loans/:id', loansController.deleteLoan)
router.get('/loans/:id/charge', loansController.generateCharge)

router.get('/payments', paymentsController.getAllPayments)
router.get('/payments/loan/:loanId', paymentsController.getPaymentsByLoan)
router.post('/payments', paymentsController.createPayment)
router.delete('/payments/:id', paymentsController.deletePayment)

module.exports = router
