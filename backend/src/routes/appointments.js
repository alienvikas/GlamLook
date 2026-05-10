const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/appointmentController');

router.use(auth);
router.get('/', ctrl.getAll);
router.get('/today', ctrl.getToday);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
