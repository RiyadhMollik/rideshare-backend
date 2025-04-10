const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {getCountAllDriverAndUser, getUserProfile, deleteUser ,updateUserProfile, getAllUsers, getUserById, adminUpdateUserProfile , getUserWalletBalance, updateUserWalletBalance, getUserTransactions} = require('../controllers/userController');

const router = express.Router();
router.get('/profile', authenticateToken, getUserProfile);
router.post('/profile', authenticateToken, updateUserProfile);
router.get('/walletbalance', authenticateToken, getUserWalletBalance);
router.put('/walletbalance', adminOnly, updateUserWalletBalance);
router.get('/wallet-transactions', authenticateToken, getUserTransactions);
router.get('/all',  getAllUsers);
router.get('/:id', authenticateToken, adminOnly, getUserById);
router.delete("/users/:userId", deleteUser);
router.get('/count/drivers-and-users', getCountAllDriverAndUser);
router.put('/:id', authenticateToken, adminOnly, adminUpdateUserProfile);

module.exports = router;
