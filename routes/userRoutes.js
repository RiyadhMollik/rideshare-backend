const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { getUserProfile, updateUserProfile, getAllUsers, getUserById, adminUpdateUserProfile , getUserWalletBalance, updateUserWalletBalance, getUserTransactions} = require('../controllers/userController');

const router = express.Router();
router.get('/profile', authenticateToken, getUserProfile);
router.post('/profile', authenticateToken, updateUserProfile);
router.get('/walletbalance', authenticateToken, getUserWalletBalance);
router.put('/walletbalance', adminOnly, updateUserWalletBalance);
router.get('/wallet-transactions', authenticateToken, getUserTransactions);
router.get('/all', authenticateToken, adminOnly, getAllUsers);
router.get('/:id', authenticateToken, adminOnly, getUserById);

router.put('/:id', authenticateToken, adminOnly, adminUpdateUserProfile);

module.exports = router;
