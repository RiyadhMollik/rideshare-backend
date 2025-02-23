const express = require('express');
const { sendOtp, verifyOtp, googleLogin ,adminLogin } = require('../controllers/authController');
const router = express.Router();

router.post('/send_otp', sendOtp);
router.post('/verify_otp', verifyOtp);
router.post('/google_login', googleLogin);
router.post('/login', adminLogin);
module.exports = router;
