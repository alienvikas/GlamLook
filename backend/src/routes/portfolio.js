const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/portfolioController');

router.use(auth);
router.get('/', ctrl.getAll);
router.post('/', upload.fields([{ name: 'after', maxCount: 1 }, { name: 'before', maxCount: 1 }]), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
