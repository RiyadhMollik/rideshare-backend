const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const multer = require('multer');
const { getCountAllDriverAndUser, addDriver, getUserProfile, deleteUser, updateUserProfile, getAllUsers, getUserById, adminUpdateUserProfile, getUserWalletBalance, updateUserWalletBalance, getUserTransactions } = require('../controllers/userController');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// Route for adding a driver with multiple file uploads
const router = express.Router();
router.get('/profile', authenticateToken, getUserProfile);
router.post('/profile', authenticateToken, updateUserProfile);
router.post(
    '/add-driver',
    upload.fields([
        { name: 'nid_photo', maxCount: 1 },
        { name: 'profile_picture', maxCount: 1 },
        { name: 'drivingLicense', maxCount: 1 },
        { name: 'vehiclePicFront', maxCount: 1 },
    ]),
    authenticateToken,
    adminOnly,
    addDriver
);
router.get('/walletbalance', authenticateToken, getUserWalletBalance);
router.put('/walletbalance', adminOnly, updateUserWalletBalance);
router.get('/wallet-transactions', authenticateToken, getUserTransactions);
router.get('/all', getAllUsers);
router.get('/:id', authenticateToken, adminOnly, getUserById);
router.delete("/users/:userId", deleteUser);
router.get('/count/drivers-and-users', getCountAllDriverAndUser);
router.put('/:id', authenticateToken, adminOnly, adminUpdateUserProfile);

module.exports = router;
