const router = require('express').Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', auth, ctrl.getMe);
router.put('/profile', auth, upload.single('avatar'), ctrl.updateProfile);
router.put('/push-token', auth, ctrl.savePushToken);
router.put('/change-password', auth, ctrl.changePassword);

module.exports = router;
