const router = require('express').Router();
const customerAuth = require('../middleware/customerAuth');
const ctrl = require('../controllers/customerAppointmentController');

router.get('/services', ctrl.getServices);          // public — list services
router.post('/book', customerAuth, ctrl.book);
router.get('/my', customerAuth, ctrl.getMyAppointments);

module.exports = router;
