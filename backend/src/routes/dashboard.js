const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

router.use(auth);
router.get('/stats', ctrl.getStats);

module.exports = router;
