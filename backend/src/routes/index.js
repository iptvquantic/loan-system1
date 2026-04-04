const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/auth');
const upload   = require('../middleware/upload');

const authCtrl      = require('../controllers/authController');
const dashCtrl      = require('../controllers/dashboardController');
const clientsCtrl   = require('../controllers/clientsController');
const loansCtrl     = require('../controllers/loansController');
const paymentsCtrl  = require('../controllers/paymentsController');
const cashCtrl      = require('../controllers/cashController');
const reportsCtrl   = require('../controllers/reportsController');
const simCtrl       = require('../controllers/simulatorController');

// AUTH
router.post('/auth/login',         authCtrl.login);
router.get ('/auth/me',       auth, authCtrl.me);
router.put ('/auth/password', auth, authCtrl.changePassword);

// DASHBOARD
router.get('/dashboard', auth, dashCtrl.getDashboard);

// CLIENTS
router.get   ('/clients',              auth, clientsCtrl.getAll);
router.get   ('/clients/ranking',      auth, clientsCtrl.getRanking);
router.get   ('/clients/:id',          auth, clientsCtrl.getById);
router.post  ('/clients',              auth, clientsCtrl.create);
router.put   ('/clients/:id',          auth, clientsCtrl.update);
router.delete('/clients/:id',          auth, clientsCtrl.remove);
router.post  ('/clients/:id/documents',auth,
  upload.fields([
    { name:'doc_residence',maxCount:1 },
    { name:'doc_id_front', maxCount:1 },
    { name:'doc_id_back',  maxCount:1 },
  ]), clientsCtrl.uploadDocs);

// LOANS
router.get   ('/loans',              auth, loansCtrl.getAll);
router.get   ('/loans/:id',          auth, loansCtrl.getById);
router.post  ('/loans',              auth, loansCtrl.create);
router.get   ('/loans/:id/charge',   auth, loansCtrl.getCharge);
router.post  ('/loans/sync-statuses',auth, loansCtrl.syncStatus);
router.delete('/loans/:id',          auth, loansCtrl.remove);

// PAYMENTS
router.get   ('/loans/:loanId/payments', auth, paymentsCtrl.getByLoan);
router.post  ('/payments',               auth, paymentsCtrl.create);
router.delete('/payments/:id',           auth, paymentsCtrl.remove);

// CAIXA
router.get   ('/cash',     auth, cashCtrl.getSummary);
router.post  ('/cash',     auth, cashCtrl.addEntry);
router.delete('/cash/:id', auth, cashCtrl.remove);

// RELATÓRIOS
router.get('/reports',          auth, reportsCtrl.getReports);
router.get('/reports/export',   auth, reportsCtrl.exportCSV);

// SIMULADOR
router.get('/simulator', auth, simCtrl.simulate);

module.exports = router;
