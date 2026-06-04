const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const authMulti = require('../controllers/authMulti')
const clients = require('../controllers/clientsController')
const loans = require('../controllers/loansController')
const payments = require('../controllers/paymentsController')
const dashboard = require('../controllers/dashboardController')
const loansFull = require('../controllers/loans')
const paymentsFull = require('../controllers/payments')

router.post('/auth/register', authMulti.register)
router.post('/auth/login', authMulti.login)
router.get('/auth/me', authenticateToken, authMulti.getMe)
router.get('/plans', authMulti.getPlans)

router.use(authenticateToken)

router.get('/dashboard', dashboard.getDashboard)

router.get('/clients', clients.getAll)
router.get('/clients/:id', clients.getById)
router.post('/clients', clients.create)
router.put('/clients/:id', clients.update)
router.delete('/clients/:id', clients.remove)

router.get('/loans', loans.getAll)
router.get('/loans/:id', loans.getById)
router.post('/loans', loans.create)
router.put('/loans/:id', loansFull.updateLoan)
router.delete('/loans/:id', loans.remove)
router.get('/loans/:id/charge', loans.getCharge)
router.post('/loans/:id/sync', loans.syncStatus)

router.get('/payments', paymentsFull.getAllPayments)
router.get('/payments/loan/:loanId', payments.getByLoan)
router.post('/payments', paymentsFull.createPayment)
router.delete('/payments/:id', payments.remove)

module.exports = router
