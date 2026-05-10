const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');

router.use(auth);
router.get('/', ctrl.getAll);
router.get('/summary', ctrl.getSummary);
router.post('/', ctrl.create);

module.exports = router;
