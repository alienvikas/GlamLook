const router = require('express').Router();
const customerAuth = require('../middleware/customerAuth');
const ctrl = require('../controllers/customerAuthController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', customerAuth, ctrl.getMe);

module.exports = router;
