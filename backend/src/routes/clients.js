const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/clientController');

router.use(auth);
router.get('/', ctrl.getAll);
router.post('/', upload.single('avatar'), ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', upload.single('avatar'), ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/history', ctrl.getHistory);

module.exports = router;
