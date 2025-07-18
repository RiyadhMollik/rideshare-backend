const express = require('express');
const { sendOtp, verifyOtp, googleLogin, adminLogin ,createAdminUser, getAdminUsers, updateAdminUser, deleteAdminUser} = require('../controllers/authController');
const router = express.Router();

// Authentication routes
router.post('/send_otp', sendOtp);
router.post('/verify_otp', verifyOtp);
router.post('/google_login', googleLogin);
router.post('/login', adminLogin);

// Admin user management routes
router.post('/users/admin', createAdminUser);
router.get('/users/admin', getAdminUsers);
router.put('/users/admin/:user_id', updateAdminUser);
router.delete('/users/admin/:user_id', deleteAdminUser);

module.exports = router;