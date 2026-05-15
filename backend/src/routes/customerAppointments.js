const router = require('express').Router();
const customerAuth = require('../middleware/customerAuth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/customerAppointmentController');

router.get('/artists', ctrl.getArtists);
router.get('/artists/:id/portfolio', ctrl.getArtistPortfolio);
router.get('/services', ctrl.getServices);
router.post('/book', customerAuth, upload.single('customer_photo'), ctrl.book);
router.get('/my', customerAuth, ctrl.getMyAppointments);
router.post('/feedback', customerAuth, ctrl.submitFeedback);
router.get('/my-feedback', customerAuth, ctrl.getMyFeedback);

module.exports = router;
